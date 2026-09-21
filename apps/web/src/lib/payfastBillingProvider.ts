import { createHash, timingSafeEqual } from "node:crypto";

import type {
    BillingCancelSubscriptionInput,
    BillingCheckoutInput,
    BillingCheckoutSession,
    BillingProvider,
    BillingWebhookInput,
    NormalizedBillingEvent,
} from "./billingProvider";

const LIVE_PROCESS_URL = "https://www.payfast.co.za/eng/process";
const SANDBOX_PROCESS_URL = "https://sandbox.payfast.co.za/eng/process";
const LIVE_VALIDATE_URL = "https://www.payfast.co.za/eng/query/validate";
const SANDBOX_VALIDATE_URL = "https://sandbox.payfast.co.za/eng/query/validate";
const API_BASE_URL = "https://api.payfast.co.za";
const API_VERSION = "v1";

type PayFastPlanConfig = {
    amount: number;
    recurringAmount: number;
    frequency: 1 | 2 | 3 | 4 | 5 | 6;
    cycles: number;
    billingDate?: string;
};

function env(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} is not configured.`);
    return value;
}

function sandbox(): boolean {
    return /^(1|true|yes)$/i.test(process.env.PAYFAST_SANDBOX?.trim() ?? "");
}

function payfastEncode(value: string): string {
    return encodeURIComponent(value.trim()).replace(/%20/g, "+");
}

function md5(value: string): string {
    return createHash("md5").update(value, "utf8").digest("hex");
}

function generateSignature(fields: Array<[string, string]>, passphrase: string): string {
    const parts = fields
        .filter(([, value]) => value !== "")
        .map(([key, value]) => `${key}=${payfastEncode(value)}`);
    if (passphrase.trim()) parts.push(`passphrase=${payfastEncode(passphrase)}`);
    return md5(parts.join("&"));
}

function generateItnSignature(rawBody: string, passphrase: string): string {
    const encodedParts = rawBody.split("&").filter((part) => {
        const rawKey = part.split("=", 1)[0] ?? "";
        try { return decodeURIComponent(rawKey) !== "signature"; } catch { return rawKey !== "signature"; }
    });
    if (passphrase.trim()) encodedParts.push(`passphrase=${payfastEncode(passphrase)}`);
    return md5(encodedParts.join("&"));
}

function safeEqual(left: string, right: string): boolean {
    const a = Buffer.from(left.toLowerCase(), "utf8");
    const b = Buffer.from(right.toLowerCase(), "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
}

function parsePlanConfig(): Record<string, PayFastPlanConfig> {
    const raw = env("PAYFAST_PLAN_CONFIG");
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw new Error("PAYFAST_PLAN_CONFIG must contain valid JSON."); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("PAYFAST_PLAN_CONFIG must be a JSON object.");

    const result: Record<string, PayFastPlanConfig> = {};
    for (const [rawCode, rawConfig] of Object.entries(parsed as Record<string, unknown>)) {
        if (!rawConfig || typeof rawConfig !== "object" || Array.isArray(rawConfig)) throw new Error(`Invalid PayFast configuration for plan ${rawCode}.`);
        const config = rawConfig as Record<string, unknown>;
        const amount = Number(config.amount);
        const recurringAmount = Number(config.recurringAmount ?? config.amount);
        const frequency = Number(config.frequency);
        const cycles = Number(config.cycles);
        const billingDate = typeof config.billingDate === "string" && config.billingDate.trim() ? config.billingDate.trim() : undefined;
        if (!Number.isFinite(amount) || amount < 0) throw new Error(`Invalid PayFast initial amount for plan ${rawCode}.`);
        if (!Number.isFinite(recurringAmount) || recurringAmount < 5) throw new Error(`PayFast recurring amount for plan ${rawCode} must be at least R5.00.`);
        if (![1, 2, 3, 4, 5, 6].includes(frequency)) throw new Error(`Invalid PayFast frequency for plan ${rawCode}.`);
        if (!Number.isInteger(cycles) || cycles < 0 || cycles > 9) throw new Error(`PayFast cycles for plan ${rawCode} must be an integer from 0 to 9.`);
        if (billingDate && !/^\d{4}-\d{2}-\d{2}$/.test(billingDate)) throw new Error(`Invalid PayFast billingDate for plan ${rawCode}.`);
        result[rawCode.trim().toLowerCase()] = {
            amount: Number(amount.toFixed(2)),
            recurringAmount: Number(recurringAmount.toFixed(2)),
            frequency: frequency as PayFastPlanConfig["frequency"],
            cycles,
            ...(billingDate ? { billingDate } : {}),
        };
    }
    return result;
}

function planConfig(planCode: string): PayFastPlanConfig {
    const normalized = planCode.trim().toLowerCase();
    const result = parsePlanConfig()[normalized];
    if (!result) throw new Error(`No PayFast payment configuration exists for BSMP plan ${normalized}.`);
    return result;
}

function processUrl(): string {
    return sandbox() ? SANDBOX_PROCESS_URL : LIVE_PROCESS_URL;
}

function validateUrl(): string {
    return sandbox() ? SANDBOX_VALIDATE_URL : LIVE_VALIDATE_URL;
}

function apiUrl(): string {
    return `${API_BASE_URL}/subscriptions`;
}

function normalizeStatus(paymentStatus: string): { eventType: NormalizedBillingEvent["eventType"]; status: NonNullable<NormalizedBillingEvent["status"]> } {
    if (paymentStatus === "COMPLETE") return { eventType: "activated", status: "active" };
    if (paymentStatus === "CANCELLED") return { eventType: "canceled", status: "canceled" };
    throw new Error(`Unsupported PayFast payment status: ${paymentStatus}`);
}

function sourceIp(headers: Record<string, string | null>): string | null {
    return headers["x-real-ip"]?.trim()
        || headers["cf-connecting-ip"]?.trim()
        || headers["x-forwarded-for"]?.split(",")[0]?.trim()
        || null;
}

function ipv4ToNumber(value: string): number | null {
    const parts = value.trim().split(".");
    if (parts.length !== 4) return null;
    let result = 0;
    for (const part of parts) {
        if (!/^\d+$/.test(part)) return null;
        const n = Number(part);
        if (n < 0 || n > 255) return null;
        result = ((result << 8) | n) >>> 0;
    }
    return result;
}

function ipAllowed(ip: string, allowList: string): boolean {
    const ipValue = ipv4ToNumber(ip);
    return allowList.split(",").map((item) => item.trim()).filter(Boolean).some((entry) => {
        if (!entry.includes("/")) return entry === ip || (ipValue !== null && ipv4ToNumber(entry) === ipValue);
        const [base, bitsText] = entry.split("/");
        const baseValue = ipv4ToNumber(base ?? "");
        const bits = Number(bitsText);
        if (baseValue === null || ipValue === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
        const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
        return (ipValue & mask) === (baseValue & mask);
    });
}

async function serverValidate(rawBody: string): Promise<boolean> {
    const response = await fetch(validateUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: rawBody,
        cache: "no-store",
    });
    const text = (await response.text()).trim();
    return response.ok && /^VALID(?:\s|$)/.test(text);
}

async function apiRequest(path: string, method: "PUT" | "PATCH", body: Record<string, string> = {}): Promise<unknown> {
    const merchantId = env("PAYFAST_MERCHANT_ID");
    const passphrase = env("PAYFAST_PASSPHRASE");
    const timestamp = new Date().toISOString().replace(".000Z", "+00:00");
    const headerFields: Array<[string, string]> = [["merchant-id", merchantId], ["timestamp", timestamp], ["version", API_VERSION]];
    const bodyFields = Object.entries(body);
    const signature = generateSignature([...headerFields, ...bodyFields].sort(([a], [b]) => a.localeCompare(b)), passphrase);
    const headers = new Headers({
        "merchant-id": merchantId,
        version: API_VERSION,
        timestamp,
        signature,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    });
    const query = sandbox() ? "?testing=true" : "";
    const response = await fetch(`${apiUrl()}${path}${query}`, {
        method,
        headers,
        body: Object.keys(body).length ? new URLSearchParams(body).toString() : undefined,
        cache: "no-store",
    });
    const payload = await response.text();
    if (!response.ok) throw new Error(`PayFast recurring API returned HTTP ${response.status}: ${payload.slice(0, 300)}`);
}

export class PayFastBillingProvider implements BillingProvider {
    readonly id = "payfast";

    async createCheckoutSession(input: BillingCheckoutInput): Promise<BillingCheckoutSession> {
        const merchantId = env("PAYFAST_MERCHANT_ID");
        const merchantKey = env("PAYFAST_MERCHANT_KEY");
        const passphrase = env("PAYFAST_PASSPHRASE");
        const publicUrl = env("PUBLIC_APP_URL").replace(/\/$/, "");
        const config = planConfig(input.planCode);
        const fields: Array<[string, string]> = [
            ["merchant_id", merchantId],
            ["merchant_key", merchantKey],
            ["return_url", input.successUrl],
            ["cancel_url", input.cancelUrl],
            ["notify_url", `${publicUrl}/api/billing/webhooks/payfast`],
            ["email_address", input.customerEmail ?? ""],
            ["m_payment_id", input.merchantPaymentId],
            ["amount", config.amount.toFixed(2)],
            ["item_name", `BSMP ${input.planCode}`],
            ["item_description", `BSMP subscription ${input.planCode}`],
            ["subscription_type", "1"],
            ...(config.billingDate ? [["billing_date", config.billingDate] as [string, string]] : []),
            ["recurring_amount", config.recurringAmount.toFixed(2)],
            ["frequency", String(config.frequency)],
            ["cycles", String(config.cycles)],
            ["subscription_notify_email", "true"],
            ["subscription_notify_webhook", "true"],
            ["subscription_notify_buyer", "true"],
            ["custom_str1", input.userId],
            ["custom_str2", input.planCode],
        ];
        const formFields = Object.fromEntries(fields);
        formFields.signature = generateSignature(fields, passphrase);
        return {
            provider: "payfast",
            checkoutUrl: processUrl(),
            formAction: processUrl(),
            formFields,
            amountZar: config.amount,
            recurringAmountZar: config.recurringAmount,
        };
    }

    async cancelSubscription(input: BillingCancelSubscriptionInput): Promise<void> {
        if (input.cancelAtPeriodEnd) throw new Error("PayFast cancellation ends the subscription; end-of-period cancellation is not represented by the PayFast cancel endpoint.");
        await apiRequest(`/${encodeURIComponent(input.externalSubscriptionId)}/cancel`, "PUT");
    }

    async verifyWebhook(input: BillingWebhookInput): Promise<NormalizedBillingEvent[]> {
        const merchantId = env("PAYFAST_MERCHANT_ID");
        const passphrase = env("PAYFAST_PASSPHRASE");
        const allowList = env("PAYFAST_ITN_ALLOWED_IPS");
        const requestIp = sourceIp(input.headers);
        if (!requestIp || !ipAllowed(requestIp, allowList)) throw new Error("PayFast ITN source IP is not allowed.");

        const params = new URLSearchParams(input.rawBody);
        if ((params.get("merchant_id") ?? "") !== merchantId) throw new Error("PayFast merchant_id does not match the configured merchant.");
        const receivedSignature = params.get("signature") ?? "";
        const expectedSignature = generateItnSignature(input.rawBody, passphrase);
        if (!receivedSignature || !safeEqual(receivedSignature, expectedSignature)) throw new Error("PayFast ITN signature verification failed.");
        if (!(await serverValidate(input.rawBody))) throw new Error("PayFast server-side ITN validation failed.");

        const pfPaymentId = params.get("pf_payment_id")?.trim();
        const paymentStatus = params.get("payment_status")?.trim();
        const token = params.get("token")?.trim();
        if (!pfPaymentId || !paymentStatus || !token) throw new Error("PayFast ITN is missing required transaction or subscription fields.");

        const normalized = normalizeStatus(paymentStatus);
        return [{
            provider: "payfast",
            externalEventId: pfPaymentId,
            eventType: normalized.eventType,
            userId: params.get("custom_str1")?.trim() || null,
            planCode: params.get("custom_str2")?.trim() || null,
            externalCustomerId: null,
            externalSubscriptionId: token,
            status: normalized.status,
            cancelAtPeriodEnd: false,
            effectiveAt: new Date().toISOString(),
            metadata: {
                source: "payfast_itn",
                m_payment_id: params.get("m_payment_id")?.trim() || null,
                pf_payment_id: pfPaymentId,
                amount_gross: params.get("amount_gross")?.trim() || null,
                amount_fee: params.get("amount_fee")?.trim() || null,
                amount_net: params.get("amount_net")?.trim() || null,
                recurring_amount_zar: plan?.recurringAmount ?? null,
                payment_status: paymentStatus,
            },
        }];
    }
}

export const __test__ = { generateSignature, generateItnSignature, ipAllowed, parsePlanConfig, normalizeStatus };
