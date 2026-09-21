import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SubscriptionAdminError, requireSubscriptionAdmin } from "../../../../../src/lib/subscriptionAdmin";
import { getBillingProvider } from "../../../../../src/lib/billingProviderRegistry";

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

const ACTIVE_STATUSES = ["trialing", "active"] as const;

async function recordSubscriptionEvent(
    adminClient: SupabaseClient,
    input: {
        userId: string;
        subscriptionId: string;
        actorUserId: string;
        eventType: "manual_assigned" | "canceled";
        provider: string;
        metadata?: Record<string, unknown>;
    },
) {
    const { error } = await adminClient.from("subscription_events").insert({
        user_id: input.userId,
        subscription_id: input.subscriptionId,
        actor_user_id: input.actorUserId,
        event_type: input.eventType,
        provider: input.provider,
        metadata: input.metadata ?? {},
    });

    if (error) {
        console.error("subscription_events insert failed", error);
    }
}

export async function GET(request: Request) {
    try {
        const { adminClient } = await requireSubscriptionAdmin(request);
        const [plansResult, entitlementsResult, subscriptionsResult, eventsResult, usersResult] = await Promise.all([
            adminClient
                .from("subscription_plans")
                .select("id, code, name, description, active, display_order, created_at, updated_at")
                .order("display_order", { ascending: true }),
            adminClient
                .from("subscription_plan_entitlements")
                .select("id, plan_id, entitlement_key, enabled, limit_value, limit_unit, created_at, updated_at"),
            adminClient
                .from("user_subscriptions")
                .select("id, user_id, plan_id, status, provider, external_customer_id, external_subscription_id, current_period_start, current_period_end, cancel_at_period_end, metadata, created_at, updated_at")
                .order("created_at", { ascending: false })
                .limit(200),
            adminClient
                .from("subscription_events")
                .select("id, user_id, subscription_id, actor_user_id, event_type, provider, external_event_id, effective_at, metadata, created_at")
                .order("created_at", { ascending: false })
                .limit(200),
            adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        ]);

        if (plansResult.error) throw plansResult.error;
        if (entitlementsResult.error) throw entitlementsResult.error;
        if (subscriptionsResult.error) throw subscriptionsResult.error;
        if (eventsResult.error) throw eventsResult.error;
        if (usersResult.error) throw usersResult.error;

        const users = (usersResult.data.users ?? []).map((user: { id: string; email?: string | null }) => ({
            id: user.id,
            email: user.email ?? "",
        }));

        return NextResponse.json({
            plans: plansResult.data ?? [],
            entitlements: entitlementsResult.data ?? [],
            subscriptions: subscriptionsResult.data ?? [],
            events: eventsResult.data ?? [],
            users,
        });
    } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Unable to load subscription administration.";
        return NextResponse.json({ error: message }, { status: status(reason) });
    }
}

export async function POST(request: Request) {
    try {
        const { adminClient, userId: actorUserId } = await requireSubscriptionAdmin(request);
        const body = await request.json() as Record<string, unknown>;
        const action = text(body.action, "Action", 40);

        if (action === "create_plan") {
            const displayOrder = Number(body.displayOrder ?? 0);
            if (!Number.isInteger(displayOrder)) throw new Error("Display order must be an integer.");

            const { data, error } = await adminClient
                .from("subscription_plans")
                .insert({
                    code: text(body.code, "Plan code", 80).toLowerCase(),
                    name: text(body.name, "Plan name", 120),
                    description: optionalText(body.description, "Description"),
                    active: bool(body.active, false),
                    display_order: displayOrder,
                })
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
                .update({
                    code: text(body.code, "Plan code", 80).toLowerCase(),
                    name: text(body.name, "Plan name", 120),
                    description: optionalText(body.description, "Description"),
                    active: bool(body.active, false),
                    display_order: displayOrder,
                    updated_at: new Date().toISOString(),
                })
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
                .upsert({
                    plan_id: planId,
                    entitlement_key: entitlementKey,
                    enabled: bool(body.enabled, true),
                    limit_value: limitValue,
                    limit_unit: limitUnit,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "plan_id,entitlement_key" })
                .select("id, plan_id, entitlement_key, enabled, limit_value, limit_unit")
                .single();

            if (error) throw error;
            return NextResponse.json({ entitlement: data });
        }

        if (action === "assign_manual_subscription") {
            const userId = text(body.userId, "User ID", 80);
            const planId = text(body.planId, "Plan ID", 80);
            const now = new Date().toISOString();

            const { data: plan, error: planError } = await adminClient
                .from("subscription_plans")
                .select("id, active, name")
                .eq("id", planId)
                .maybeSingle();
            if (planError) throw planError;
            if (!plan) throw new Error("The selected subscription plan could not be found.");
            if (!plan.active) throw new Error("Only active subscription plans can be assigned.");

            const { data: existing, error: existingError } = await adminClient
                .from("user_subscriptions")
                .select("id, provider, status")
                .eq("user_id", userId)
                .in("status", [...ACTIVE_STATUSES]);
            if (existingError) throw existingError;
            if ((existing ?? []).length) {
                throw new Error("This account already has an active or trialing subscription. End that subscription before assigning another plan.");
            }

            const { data: subscription, error } = await adminClient
                .from("user_subscriptions")
                .insert({
                    user_id: userId,
                    plan_id: planId,
                    status: "active",
                    provider: "manual",
                    external_customer_id: null,
                    external_subscription_id: null,
                    current_period_start: now,
                    current_period_end: null,
                    cancel_at_period_end: false,
                    metadata: {
                        assignment_source: "subscription_admin",
                        assigned_at: now,
                    },
                })
                .select("id, user_id, plan_id, status, provider, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at")
                .single();

            if (error) throw error;

            await recordSubscriptionEvent(adminClient, {
                userId,
                subscriptionId: subscription.id,
                actorUserId,
                eventType: "manual_assigned",
                provider: "manual",
                metadata: {
                    assignment_source: "subscription_admin",
                    plan_name: plan.name,
                },
            });

            return NextResponse.json({ subscription });
        }

        if (action === "cancel_subscription") {
            const subscriptionId = text(body.subscriptionId, "Subscription ID", 80);
            const { data: before, error: beforeError } = await adminClient
                .from("user_subscriptions")
                .select("id, user_id, plan_id, provider, status, external_subscription_id")
                .eq("id", subscriptionId)
                .maybeSingle();
            if (beforeError) throw beforeError;
            if (!before) throw new Error("The subscription could not be found.");
            if (![...ACTIVE_STATUSES].includes(before.status as (typeof ACTIVE_STATUSES)[number])) {
                throw new Error("Only active or trialing subscriptions can be ended.");
            }

            if (before.provider === "payfast") {
                const provider = getBillingProvider();
                if (provider.id !== before.provider) {
                    throw new Error(`Billing provider ${before.provider} is not the active provider.`);
                }
                const externalSubscriptionId = (before as { external_subscription_id?: string | null }).external_subscription_id;
                if (!externalSubscriptionId) {
                    throw new Error("The external PayFast subscription identifier is missing.");
                }
                await provider.cancelSubscription({
                    externalSubscriptionId,
                    cancelAtPeriodEnd: false,
                });
            }

            const { data: subscription, error } = await adminClient
                .from("user_subscriptions")
                .update({
                    status: "canceled",
                    cancel_at_period_end: false,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", subscriptionId)
                .select("id, user_id, plan_id, status, provider, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at")
                .single();

            if (error) throw error;

            await recordSubscriptionEvent(adminClient, {
                userId: before.user_id,
                subscriptionId: subscription.id,
                actorUserId,
                eventType: "canceled",
                provider: subscription.provider,
                metadata: {
                    cancellation_source: "subscription_admin",
                    previous_status: before.status,
                },
            });

            return NextResponse.json({ subscription });
        }

        throw new Error("Unsupported subscription administration action.");
    } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Unable to update subscription configuration.";
        return NextResponse.json({ error: message }, { status: status(reason) });
    }
}
