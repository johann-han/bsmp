import { NextResponse } from "next/server";

import { SubscriptionAdminError, requireSubscriptionAdmin } from "../../../../../src/lib/subscriptionAdmin";

function text(value: unknown, field: string, max = 200): string {
    if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required.`);
    const result = value.trim();
    if (result.length > max) throw new Error(`${field} is too long.`);
    return result;
}

function optionalText(value: unknown, field: string, max = 500): string {
    if (value === undefined || value === null || value === "") return "";
    if (typeof value !== "string") throw new Error(`${field} must be text.`);
    const result = value.trim();
    if (result.length > max) throw new Error(`${field} is too long.`);
    return result;
}

function optionalNonNegativeNumber(value: unknown, field: string): number | null {
    if (value === undefined || value === null || value === "") return null;
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${field} must be a non-negative number or blank.`);
    return parsed;
}

function bool(value: unknown, fallback: boolean): boolean {
    if (value === undefined) return fallback;
    if (typeof value !== "boolean") throw new Error("Boolean value expected.");
    return value;
}

function status(reason: unknown): number {
    if (reason instanceof SubscriptionAdminError) return reason.status;
    return 400;
}

export async function GET(request: Request) {
    try {
        const { adminClient } = await requireSubscriptionAdmin(request);
        const [{ data: plans, error: plansError }, { data: entitlements, error: entitlementsError }] = await Promise.all([
            adminClient.from("subscription_plans").select("id, code, name, description, active, display_order, created_at, updated_at").order("display_order", { ascending: true }),
            adminClient.from("subscription_plan_entitlements").select("id, plan_id, entitlement_key, enabled, limit_value, limit_unit, created_at, updated_at"),
        ]);
        if (plansError) throw plansError;
        if (entitlementsError) throw entitlementsError;
        return NextResponse.json({ plans: plans ?? [], entitlements: entitlements ?? [] });
    } catch (reason) {
        return NextResponse.json({ error: reason instanceof Error ? reason.message : "Unable to load subscription administration." }, { status: status(reason) });
    }
}

export async function POST(request: Request) {
    try {
        const { adminClient } = await requireSubscriptionAdmin(request);
        const body = await request.json() as Record<string, unknown>;
        const action = text(body.action, "Action", 40);

        if (action === "create_plan") {
            const displayOrder = Number(body.displayOrder ?? 0);
            if (!Number.isInteger(displayOrder)) throw new Error("Display order must be an integer.");
            const { data, error } = await adminClient
                .from("subscription_plans")
                .insert({ code: text(body.code, "Plan code", 80).toLowerCase(), name: text(body.name, "Plan name", 120), description: optionalText(body.description, "Description"), active: bool(body.active, false), display_order: displayOrder })
                .select("id, code, name, description, active, display_order")
                .single();
            if (error) throw error;
            return NextResponse.json({ plan: data });
        }

        if (action === "update_plan") {
            const id = text(body.id, "Plan ID", 80);
            const displayOrder = Number(body.displayOrder ?? 0);
            if (!Number.isInteger(displayOrder)) throw new Error("Display order must be an integer.");
            const { data, error } = await adminClient
                .from("subscription_plans")
                .update({ code: text(body.code, "Plan code", 80).toLowerCase(), name: text(body.name, "Plan name", 120), description: optionalText(body.description, "Description"), active: bool(body.active, false), display_order: displayOrder, updated_at: new Date().toISOString() })
                .eq("id", id)
                .select("id, code, name, description, active, display_order")
                .single();
            if (error) throw error;
            return NextResponse.json({ plan: data });
        }

        if (action === "upsert_entitlement") {
            const planId = text(body.planId, "Plan ID", 80);
            const entitlementKey = text(body.entitlementKey, "Entitlement key", 120).toLowerCase();
            const limitUnit = text(body.limitUnit, "Limit unit", 40).toLowerCase();
            const limitValue = optionalNonNegativeNumber(body.limitValue, "Limit value");
            const { data, error } = await adminClient
                .from("subscription_plan_entitlements")
                .upsert({ plan_id: planId, entitlement_key: entitlementKey, enabled: bool(body.enabled, true), limit_value: limitValue, limit_unit: limitUnit, updated_at: new Date().toISOString() }, { onConflict: "plan_id,entitlement_key" })
                .select("id, plan_id, entitlement_key, enabled, limit_value, limit_unit")
                .single();
            if (error) throw error;
            return NextResponse.json({ entitlement: data });
        }

        throw new Error("Unsupported subscription administration action.");
    } catch (reason) {
        return NextResponse.json({ error: reason instanceof Error ? reason.message : "Unable to update subscription configuration." }, { status: status(reason) });
    }
}
