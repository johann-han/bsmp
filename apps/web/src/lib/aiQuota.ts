import { createClient } from "@supabase/supabase-js";

export const AI_MONTHLY_OPERATIONS_ENTITLEMENT = "ai_monthly_operations";

export interface AiQuotaStatus {
    readonly enforced: boolean;
    readonly allowed: boolean;
    readonly planCode: string | null;
    readonly planName: string | null;
    readonly limit: number | null;
    readonly used: number;
    readonly remaining: number | null;
    readonly periodStart: string;
    readonly periodEnd: string;
    readonly reason: "no_metering" | "no_subscription" | "no_quota" | "quota_available" | "quota_exceeded";
}

export class AiQuotaExceededError extends Error {
    public readonly code = "AI_QUOTA_EXCEEDED";

    public constructor(message = "Your current AI usage allowance has been reached.") {
        super(message);
        this.name = "AiQuotaExceededError";
    }
}

function serverClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) return null;

    return createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

function currentPeriod(now = new Date()): { start: string; end: string } {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return { start: start.toISOString(), end: end.toISOString() };
}

function normalizeLimit(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.floor(parsed));
}

export function createQuotaStatus(input: {
    readonly planCode?: string | null;
    readonly planName?: string | null;
    readonly limit?: number | string | null;
    readonly used: number;
    readonly periodStart: string;
    readonly periodEnd: string;
}): AiQuotaStatus {
    const limit = normalizeLimit(input.limit);
    if (limit === null) {
        return {
            enforced: false,
            allowed: true,
            planCode: input.planCode ?? null,
            planName: input.planName ?? null,
            limit: null,
            used: input.used,
            remaining: null,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            reason: "no_quota",
        };
    }

    const remaining = Math.max(0, limit - input.used);
    return {
        enforced: true,
        allowed: input.used < limit,
        planCode: input.planCode ?? null,
        planName: input.planName ?? null,
        limit,
        used: input.used,
        remaining,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        reason: input.used < limit ? "quota_available" : "quota_exceeded",
    };
}

/**
 * Check the configured monthly AI-operation entitlement before a provider call.
 *
 * This is intentionally fail-open while metering is not configured, so the
 * entitlement foundation can ship without disrupting existing users. Once a
 * subscription has a finite `ai_monthly_operations` entitlement, the server
 * blocks new AI operations after the current month's recorded event count reaches
 * the plan limit. This count is a lightweight preflight guard, not a billing-grade
 * reservation system; concurrent requests can still race and future production
 * billing should add atomic reservation/allowance accounting.
 */
export async function getAiQuotaStatus(userId: string, now = new Date()): Promise<AiQuotaStatus> {
    const period = currentPeriod(now);
    const client = serverClient();
    if (!client) {
        return {
            enforced: false,
            allowed: true,
            planCode: null,
            planName: null,
            limit: null,
            used: 0,
            remaining: null,
            periodStart: period.start,
            periodEnd: period.end,
            reason: "no_metering",
        };
    }

    const { data: subscription, error: subscriptionError } = await client
        .from("user_subscriptions")
        .select("id, plan_id, status")
        .eq("user_id", userId)
        .in("status", ["trialing", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (subscriptionError) throw subscriptionError;
    if (!subscription) {
        return {
            enforced: false,
            allowed: true,
            planCode: null,
            planName: null,
            limit: null,
            used: 0,
            remaining: null,
            periodStart: period.start,
            periodEnd: period.end,
            reason: "no_subscription",
        };
    }

    const [{ data: plan, error: planError }, { data: entitlement, error: entitlementError }, { count, error: usageError }] = await Promise.all([
        client.from("subscription_plans").select("code, name").eq("id", subscription.plan_id).maybeSingle(),
        client
            .from("subscription_plan_entitlements")
            .select("limit_value, limit_unit, enabled")
            .eq("plan_id", subscription.plan_id)
            .eq("entitlement_key", AI_MONTHLY_OPERATIONS_ENTITLEMENT)
            .eq("enabled", true)
            .maybeSingle(),
        client
            .from("ai_usage_events")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", period.start)
            .lt("created_at", period.end),
    ]);

    if (planError) throw planError;
    if (entitlementError) throw entitlementError;
    if (usageError) throw usageError;

    return createQuotaStatus({
        planCode: plan?.code ?? null,
        planName: plan?.name ?? null,
        limit: entitlement?.limit_unit === "count" ? entitlement.limit_value : null,
        used: count ?? 0,
        periodStart: period.start,
        periodEnd: period.end,
    });
}

export async function assertAiQuotaAvailable(userId: string): Promise<AiQuotaStatus> {
    const status = await getAiQuotaStatus(userId);
    if (!status.allowed) {
        throw new AiQuotaExceededError();
    }
    return status;
}
