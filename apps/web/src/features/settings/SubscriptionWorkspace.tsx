"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

interface Plan {
    id: string;
    code: string;
    name: string;
    description: string;
    active: boolean;
}

interface Entitlement {
    id: string;
    plan_id: string;
    entitlement_key: string;
    enabled: boolean;
    limit_value: number | null;
    limit_unit: string;
}

interface Subscription {
    id: string;
    plan_id: string;
    status: string;
    provider: string;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
}

function client() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase environment configuration.");
    return createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true },
    });
}

function entitlementLabel(value: string): string {
    return value
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatLimit(value: number | null, unit: string): string {
    if (value === null) return "Unlimited / provider-defined";
    return `${value.toLocaleString()} ${unit}`;
}

export function SubscriptionWorkspace() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const supabase = client();
                const { data: userData, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;
                if (!userData.user) throw new Error("A signed-in account is required.");

                const session = (await supabase.auth.getSession()).data.session;
                const adminCheck = session
                    ? await fetch("/api/settings/subscription/admin", {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                        cache: "no-store",
                    })
                    : null;
                if (active) setIsAdmin(adminCheck?.ok === true);

                const [plansResult, entitlementsResult, subscriptionResult] = await Promise.all([
                    supabase
                        .from("subscription_plans")
                        .select("id, code, name, description, active")
                        .eq("active", true)
                        .order("display_order", { ascending: true }),
                    supabase
                        .from("subscription_plan_entitlements")
                        .select("id, plan_id, entitlement_key, enabled, limit_value, limit_unit")
                        .eq("enabled", true),
                    supabase
                        .from("user_subscriptions")
                        .select("id, plan_id, status, provider, current_period_start, current_period_end, cancel_at_period_end")
                        .in("status", ["trialing", "active", "past_due", "paused", "incomplete"])
                        .order("created_at", { ascending: false })
                        .limit(1),
                ]);

                if (plansResult.error) throw plansResult.error;
                if (entitlementsResult.error) throw entitlementsResult.error;
                if (subscriptionResult.error) throw subscriptionResult.error;

                if (!active) return;
                setPlans((plansResult.data ?? []) as Plan[]);
                setEntitlements((entitlementsResult.data ?? []) as Entitlement[]);
                setSubscription(((subscriptionResult.data ?? [])[0] ?? null) as Subscription | null);
            } catch (reason) {
                if (!active) return;
                setError(reason instanceof Error ? reason.message : "Unable to load subscription information.");
            } finally {
                if (active) setLoading(false);
            }
        }

        void load();
        return () => { active = false; };
    }, []);

    if (loading) {
        return <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}><p>Loading Subscription...</p></main>;
    }

    const currentPlan = subscription ? plans.find((plan) => plan.id === subscription.plan_id) ?? null : null;

    return (
        <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, display: "grid", gap: 18 }}>
            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>BSMP → Settings → Subscription</div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                    <h1 style={{ margin: "4px 0 8px" }}>Subscription</h1>
                    {isAdmin && <Link href="/settings/subscription/admin" style={{ color: "#334155", fontWeight: 700, textDecoration: "none" }}>Administration</Link>}
                </div>
                <p style={{ margin: 0, color: "#6b7280" }}>
                    Subscription and entitlement information for your BSMP account. AI usage is metered separately so future quotas can be enforced without mixing billing data into Study content.
                </p>
                {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
            </section>

            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                <h2 style={{ marginTop: 0 }}>Current Subscription</h2>
                {subscription && currentPlan ? (
                    <div style={{ display: "grid", gap: 8 }}>
                        <strong>{currentPlan.name}</strong>
                        <span style={{ color: "#6b7280" }}>{subscription.status} · provider: {subscription.provider}</span>
                        {subscription.current_period_start && subscription.current_period_end && (
                            <span style={{ color: "#6b7280" }}>
                                Current period: {new Date(subscription.current_period_start).toLocaleDateString()} to {new Date(subscription.current_period_end).toLocaleDateString()}
                            </span>
                        )}
                        {subscription.cancel_at_period_end && <span style={{ color: "#92400e" }}>Cancellation is scheduled for the end of the current period.</span>}
                    </div>
                ) : (
                    <p style={{ margin: 0, color: "#6b7280" }}>
                        No active subscription is assigned to this account yet. The billing provider and checkout flow will be connected in a later phase.
                    </p>
                )}
            </section>

            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                <h2 style={{ marginTop: 0 }}>Available Plans</h2>
                {plans.length ? (
                    <div style={{ display: "grid", gap: 12 }}>
                        {plans.map((plan) => {
                            const planEntitlements = entitlements.filter((item) => item.plan_id === plan.id);
                            return (
                                <article key={plan.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
                                    <strong>{plan.name}</strong>
                                    <p style={{ margin: "6px 0 10px", color: "#6b7280" }}>{plan.description || "No description published."}</p>
                                    {planEntitlements.length ? (
                                        <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
                                            {planEntitlements.map((item) => (
                                                <div key={item.id}>{entitlementLabel(item.entitlement_key)}: {formatLimit(item.limit_value, item.limit_unit)}</div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: 13, color: "#6b7280" }}>No entitlements published yet.</span>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p style={{ margin: 0, color: "#6b7280" }}>
                        No public subscription plans have been published yet. This foundation is ready for plan definitions, AI quotas, feature entitlements, and payment-provider integration.
                    </p>
                )}
            </section>
        </main>
    );
}
