import { createHash } from "node:crypto";

import type {
    BillingCancelSubscriptionInput,
    BillingCheckoutInput,
    BillingCheckoutSession,
    BillingProvider,
    BillingWebhookInput,
    NormalizedBillingEvent,
} from "./billingProvider";

const LIVE_CHECKOUT_URL = "https://www.payfast.co.za/eng/process";
const SANDBOX_CHECKOUT_URL = "https://sandbox.payfast.co.za/eng/process";
const LIVE_API_URL = "https://api.payfast.co.za";
const SANDBOX_API_URL = "https://api.payfast.co.za";

interface PayFastPlanConfig {
    amount: string;
    recurringAmount?: string;
    frequency: 3 | 4 | 5 | 6;
    cycles?: number;
    billingDate?: string;
    itemName?: string;
    itemDescription?: string;
}

function requiredEnvironment(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} is not configured.`);
    return value;
}

function sandboxEnabled(): boolean {
    return /^(1|true|yes)$/i.test(process.env.PAYFAST_SANDBOX?.trim() ?? "");
}

function parsePlanMap(): Record<string, PayFastPlanConfig> {
    const raw = requiredEnvironment("PAYFAST_PLAN_MAP");
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw new Error("PAYFAST_PLAN_MAP must contain valid JSON."); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("PAYFAST_PLAN_MAP must be a JSON object.");
    }
    return parsed as Record<string, PayFastPlanConfig>;
}

function planFor(code: string): PayFastPlanConfig {
    const normalized = code.trim().toLowerCase();
    const plan = parsePlanMap()[normalized];
    if (!plan) throw new Error(`No PayFast billing configuration exists for BSMP plan ${normalized}.`);
    const amount = Number(plan.amount);
    const recurringAmount = Number(plan.recurringAmount ?? plan.amount);
    const cycles = plan.cycles ?? 0;
    if (!Number.isFinite(amount) || amount < 0) throw new Error(`Invalid PayFast amount for BSMP plan ${normalized}.`);
    if (!Number.isFinite(recurringAmount) || recurringAmount < 5) throw new Error(`PayFast recurring amount for BSMP plan ${normalized} must be at least R5.00.`);
    if (!Number.isInteger(cycles) || cycles < 0) throw new Error(`Invalid PayFast cycles for BSMP plan ${normalized}.`);
    if (![3, 4, 5, 6].includes(plan.frequency)) throw new Error(`Invalid PayFast frequency for BSMP plan ${normalized}.`);
    if (plan.billingDate && !/^\\d{4}-\\d{2}-\\d{2}$/.test(plan.billingDate)) throw new Error(`Invalid PayFast billing date for BSMP plan ${normalized}.`);
    return { ...plan, amount: amount.toFixed(2), recurringAmount: recurringAmount.toFixed(2), cycles };
}

function phpUrlEncode(value: string): string {
    return encodeURIComponent(value)
        .replace(/%20/g, "+")
        .replace(/!/g, "%21")
        .replace(/'/g, "%27")
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29")
        .replace(/\*/g, "%2A");
}

function parameterString(values: Record<string, string>, orderedKeys?: readonly string[]): string {
    const keys = orderedKeys ?? Object.keys(values).sort((a, b) => a.localeCompare(b));
    return keys
        .filter((key) => values[key] !== undefined && values[key] !== "")
        .map((key) => `${key}=${phpUrlEncode(values[key]!.trim())}`)
        .join("&");
}

function generateSignature(values: Record<string, string>, passphrase: string, orderedKeys?: readonly string[]): string {
    const base = parameterString(values, orderedKeys);
    const salted = passphrase.trim() ? `${base}&passphrase=${phpUrlEncode(passphrase.trim())}` : base;
    return createHash("md5").update(salted, "utf8").digest("hex");
}

function verifySignature(values: Record<string, string>): void {
    const supplied = values.signature?.trim().toLowerCase();
    if (!supplied) throw new Error("PayFast ITN signature is missing.");
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) if (key !== "signature") data[key] = value;
    const expected = generateSignature(data, requiredEnvironment("PAYFAST_PASSPHRASE"), Object.keys(data));
    if (supplied !== expected) throw new Error("PayFast ITN signature verification failed.");
}

function amountMatches(expected: string, received: string): boolean {
    const left = Number(expected);
    const right = Number(received);
    return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= 0.01;
}

function endpoint(path: string): string {
    const base = sandboxEnabled() ? SANDBOX_API_URL : LIVE_API_URL;
    return `${base}${path}${sandboxEnabled() ? "?testing=true" : ""}`;
}

function apiSignature(values: Record<string, string>): string {
    return generateSignature(values, requiredEnvironment("PAYFAST_PASSPHRASE"));
}

async function apiRequest<T>(path: string, method: "GET" | "PUT" | "PATCH", body: Record<string, string> = {}): Promise<T> {
    const merchantId = requiredEnvironment("PAYFAST_MERCHANT_ID");
    const version = "v1";
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const headersForSignature: Record<string, string> = {
        "merchant-id": merchantId,
        version,
        timestamp,
    };
    const signingValues = { ...headersForSignature, ...body };
    const signature = apiSignature(signingValues);
    const headers = new Headers({
        "merchant-id": merchantId,
        version,
        timestamp,
        signature,
    });
    const init: RequestInit = { method, headers, cache: "no-store" };
    if (method !== "GET") {
        headers.set("Content-Type", "application/x-www-form-urlencoded");
        init.body = new URLSearchParams(body).toString();
    }
    const response = await fetch(endpoint(path), init);
    const text = await response.text();
    let payload: unknown;
    try { payload = JSON.parse(text); } catch { payload = text; }
    if (!response.ok) throw new Error(`PayFast API request failed with HTTP ${response.status}.`);
    return payload as T;
}

function splitName(email: string | null | undefined): { first: string; last: string } {
    const local = email?.split("@")[0]?.replace(/[^A-Za-z0-9]+/g, " ").trim() ?? "";
    const [first = "BSMP", ...rest] = local.split(/\\s+/).filter(Boolean);
    return { first, last: rest.join(" ") || "User" };
}

function formFields(input: BillingCheckoutInput, plan: PayFastPlanConfig, notifyUrl: string): Record<string, string> {
    const name = splitName(input.customerEmail);
    const data: Record<string, string> = {
        merchant_id: requiredEnvironment("PAYFAST_MERCHANT_ID"),
        merchant_key: requiredEnvironment("PAYFAST_MERCHANT_KEY"),
        return_url: input.successUrl,
        cancel_url: input.cancelUrl,
        notify_url: notifyUrl,
        name_first: name.first,
        name_last: name.last,
        email_address: input.customerEmail ?? "",
        m_payment_id: input.paymentReference,
        amount: plan.amount,
        item_name: plan.itemName ?? input.planCode,
        item_description: plan.itemDescription ?? `BSMP ${input.planCode} subscription`,
        subscription_type: "1",
        billing_date: plan.billingDate ?? new Date().toISOString().slice(0, 10),
        recurring_amount: plan.recurringAmount ?? plan.amount,
        frequency: String(plan.frequency),
        cycles: String(plan.cycles ?? 0),
        subscription_notify_email: "true",
        subscription_notify_webhook: "true",
        subscription_notify_buyer: "true",
        payment_method: "cc",
    };
    data.signature = generateSignature(data, requiredEnvironment("PAYFAST_PASSPHRASE"));
    return data;
}

export class PayFastBillingProvider implements BillingProvider {
    readonly id = "payfast";

    async createCheckoutSession(input: BillingCheckoutInput): Promise<BillingCheckoutSession> {
        const plan = planFor(input.planCode);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(input.successUrl).origin;
        const notifyUrl = `${baseUrl}/api/billing/webhooks/payfast`;
        return {
            provider: "payfast",
            checkoutUrl: sandboxEnabled() ? SANDBOX_CHECKOUT_URL : LIVE_CHECKOUT_URL,
            checkoutMethod: "POST",
            formFields: formFields(input, plan, notifyUrl),
            amount: plan.amount,
            currency: "ZAR",
        };
    }

    async cancelSubscription(input: BillingCancelSubscriptionInput): Promise<void> {
        if (input.cancelAtPeriodEnd) throw new Error("PayFast cancellation is immediate; end-of-period cancellation is not supported by this adapter.");
        const response = await apiRequest<{
            code?: number;
            status?: string;
            data?: { response?: boolean };
        }>(`/subscriptions/${encodeURIComponent(input.externalSubscriptionId)}/cancel`, "PUT");
        if (response.code !== 200 || response.status !== "success" || response.data?.response !== true) {
            throw new Error("PayFast subscription cancellation was not confirmed by the provider.");
        }
    }

    async verifyWebhook(input: BillingWebhookInput): Promise<NormalizedBillingEvent[]> {
        const values: Record<string, string> = {};
        const raw = new URLSearchParams(input.rawBody);
        for (const [key, value] of raw.entries()) values[key] = value;
        verifySignature(values);
        if (values.merchant_id !== requiredEnvironment("PAYFAST_MERCHANT_ID")) throw new Error("PayFast merchant id verification failed.");
        if (values.payment_status !== "COMPLETE" && values.payment_status !== "CANCELLED") return [];
        if (!values.pf_payment_id || !values.token) throw new Error("PayFast recurring ITN is missing payment or subscription identifiers.");
        return [{
            provider: "payfast",
            externalEventId: values.pf_payment_id,
            eventType: values.payment_status === "CANCELLED" ? "canceled" : "activated",
            externalSubscriptionId: values.token,
            status: values.payment_status === "CANCELLED" ? "canceled" : "active",
            effectiveAt: new Date().toISOString(),
            metadata: {
                source: "payfast_itn",
                m_payment_id: values.m_payment_id ?? null,
                amount_gross: values.amount_gross ?? null,
                email_address: values.email_address ?? null,
            },
        }];
    }
}

export function payFastExpectedAmount(planCode: string): string {
    return planFor(planCode).amount;
}

export function payFastVerifyWebhookSignature(values: Record<string, string>): void {
    verifySignature(values);
}

export function payFastValidateServerConfirmation(rawValues: Record<string, string>): Promise<boolean> {
    const payload: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawValues)) if (key !== "signature") payload[key] = value;
    const body = parameterString(payload, Object.keys(payload));
    return fetch(`${sandboxEnabled() ? "https://sandbox.payfast.co.za" : "https://www.payfast.co.za"}/eng/query/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
    }).then(async (response) => response.ok && (await response.text()).trim() === "VALID");
}

export const __test__ = { phpUrlEncode, parameterString, generateSignature, amountMatches, planFor, signature: generateSignature };
