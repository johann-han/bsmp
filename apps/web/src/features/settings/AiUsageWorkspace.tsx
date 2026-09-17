"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

interface UsageEvent {
    id: string;
    feature: string;
    operation: string;
    provider: string;
    model: string;
    status: "success" | "error";
    duration_ms: number | null;
    input_tokens: number | null;
    output_tokens: number | null;
    total_tokens: number | null;
    estimated_cost_usd: number | null;
    created_at: string;
}

function client() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase environment configuration.");
    return createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true },
    });
}

function labelFeature(value: string): string {
    return value
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AiUsageWorkspace() {
    const [events, setEvents] = useState<UsageEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const supabase = client();
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                const { data, error: queryError } = await supabase
                    .from("ai_usage_events")
                    .select("id, feature, operation, provider, model, status, duration_ms, input_tokens, output_tokens, total_tokens, estimated_cost_usd, created_at")
                    .gte("created_at", startOfMonth.toISOString())
                    .order("created_at", { ascending: false })
                    .limit(500);

                if (!active) return;
                if (queryError) throw queryError;
                setEvents((data ?? []) as UsageEvent[]);
            } catch (reason) {
                if (!active) return;
                setError(reason instanceof Error ? reason.message : "Unable to load AI usage.");
            } finally {
                if (active) setLoading(false);
            }
        }

        void load();
        return () => { active = false; };
    }, []);

    const successes = events.filter((event) => event.status === "success").length;
    const failures = events.length - successes;
    const totalTokens = events.reduce((sum, event) => sum + (event.total_tokens ?? 0), 0);
    const estimatedCost = events.reduce((sum, event) => sum + (event.estimated_cost_usd ?? 0), 0);

    const byFeature = useMemo(() => {
        const counts = new Map<string, number>();
        for (const event of events) counts.set(event.feature, (counts.get(event.feature) ?? 0) + 1);
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    }, [events]);

    const byProvider = useMemo(() => {
        const counts = new Map<string, number>();
        for (const event of events) counts.set(event.provider, (counts.get(event.provider) ?? 0) + 1);
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    }, [events]);

    if (loading) return <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}><p>Loading AI Usage...</p></main>;

    return (
        <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, display: "grid", gap: 18 }}>
            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>BSMP → Settings → AI Usage</div>
                <h1 style={{ margin: "4px 0 8px" }}>AI Usage</h1>
                <p style={{ margin: 0, color: "#6b7280" }}>
                    Server-recorded AI operations for the current calendar month. This view records usage metadata, not your prompts or generated Study content.
                </p>
                {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                {[
                    ["AI operations", events.length],
                    ["Successful", successes],
                    ["Failed", failures],
                    ["Recorded tokens", totalTokens || "—"],
                    ["Recorded cost", estimatedCost ? `$${estimatedCost.toFixed(6)}` : "—"],
                ].map(([label, value]) => (
                    <div key={String(label)} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, background: "#fff" }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
                        <div style={{ marginTop: 6, fontSize: 26, fontWeight: 800 }}>{value}</div>
                    </div>
                ))}
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
                <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <h2 style={{ marginTop: 0 }}>By Feature</h2>
                    {byFeature.length ? <ul>{byFeature.map(([feature, count]) => <li key={feature}>{labelFeature(feature)} — {count}</li>)}</ul> : <p style={{ color: "#6b7280" }}>No metered AI operations yet.</p>}
                </div>
                <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <h2 style={{ marginTop: 0 }}>By Provider</h2>
                    {byProvider.length ? <ul>{byProvider.map(([provider, count]) => <li key={provider}>{provider} — {count}</li>)}</ul> : <p style={{ color: "#6b7280" }}>No metered AI operations yet.</p>}
                </div>
            </section>

            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                <h2 style={{ marginTop: 0 }}>Recent Operations</h2>
                {events.length ? (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr>
                                    {['Time', 'Feature', 'Operation', 'Provider', 'Model', 'Status', 'Duration'].map((heading) => <th key={heading} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>{heading}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {events.slice(0, 100).map((event) => (
                                    <tr key={event.id}>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{new Date(event.created_at).toLocaleString()}</td>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{labelFeature(event.feature)}</td>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{event.operation}</td>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{event.provider}</td>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{event.model}</td>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{event.status}</td>
                                        <td style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{event.duration_ms === null ? "—" : `${event.duration_ms} ms`}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p style={{ color: "#6b7280" }}>No AI usage has been recorded for the current month. The server meter requires SUPABASE_SERVICE_ROLE_KEY.</p>}
            </section>
        </main>
    );
}
