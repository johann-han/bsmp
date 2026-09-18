"use client";

import { useEffect, useMemo, useState } from "react";

interface Plan { id: string; code: string; name: string; description: string; active: boolean; display_order: number; }
interface Entitlement { id: string; plan_id: string; entitlement_key: string; enabled: boolean; limit_value: number | null; limit_unit: string; }

const emptyPlan = { code: "", name: "", description: "", displayOrder: 0, active: false };

export function SubscriptionAdminWorkspace() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [plan, setPlan] = useState(emptyPlan);
    const [newPlan, setNewPlan] = useState(emptyPlan);
    const [entitlementKey, setEntitlementKey] = useState("");
    const [limitValue, setLimitValue] = useState("");
    const [limitUnit, setLimitUnit] = useState("count");
    const [enabled, setEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    async function load() {
        setLoading(true); setError(null);
        try {
            const response = await fetch("/api/settings/subscription/admin", { cache: "no-store" });
            const payload = await response.json() as { plans?: Plan[]; entitlements?: Entitlement[]; error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Unable to load subscription administration.");
            setPlans(payload.plans ?? []); setEntitlements(payload.entitlements ?? []);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to load subscription administration.");
        } finally { setLoading(false); }
    }

    useEffect(() => { void load(); }, []);

    const selectedPlan = useMemo(() => plans.find((item) => item.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
    const selectedEntitlements = useMemo(() => entitlements.filter((item) => item.plan_id === selectedPlanId), [entitlements, selectedPlanId]);

    useEffect(() => {
        if (!selectedPlan) return;
        setPlan({ code: selectedPlan.code, name: selectedPlan.name, description: selectedPlan.description, displayOrder: selectedPlan.display_order, active: selectedPlan.active });
    }, [selectedPlan]);

    async function post(body: Record<string, unknown>) {
        setSaving(true); setError(null); setMessage(null);
        try {
            const response = await fetch("/api/settings/subscription/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const payload = await response.json() as { error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Subscription update failed.");
            setMessage("Saved.");
            await load();
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Subscription update failed.");
            throw reason;
        } finally { setSaving(false); }
    }

    if (loading) return <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}><p>Loading Subscription Administration...</p></main>;

    if (error && !plans.length) {
        return <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}><section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}><h1>Subscription Administration</h1><p style={{ color: "#b91c1c" }}>{error}</p><p style={{ color: "#6b7280" }}>Administration requires an authenticated platform administrator role.</p></section></main>;
    }

    return (
        <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, display: "grid", gap: 18 }}>
            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>BSMP → Settings → Subscription Administration</div>
                <h1 style={{ margin: "4px 0 8px" }}>Subscription Administration</h1>
                <p style={{ margin: 0, color: "#6b7280" }}>Manage provider-neutral plans and entitlements. Pricing, checkout, and payment-provider state remain outside this screen.</p>
                {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
                {message && <p style={{ color: "#166534" }}>{message}</p>}
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "minmax(220px, 0.8fr) minmax(320px, 1.2fr)", gap: 18 }}>
                <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <h2 style={{ marginTop: 0 }}>Plans</h2>
                    {plans.length ? plans.map((item) => (
                        <button key={item.id} type="button" onClick={() => setSelectedPlanId(item.id)} style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 8, padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, background: selectedPlanId === item.id ? "#f1f5f9" : "#fff" }}>
                            <strong>{item.name}</strong><br /><span style={{ color: "#64748b", fontSize: 12 }}>{item.code} · {item.active ? "active" : "draft"}</span>
                        </button>
                    )) : <p style={{ color: "#6b7280" }}>No plans have been created.</p>}

                    <hr style={{ margin: "18px 0" }} />
                    <h3>Create Plan</h3>
                    <div style={{ display: "grid", gap: 8 }}>
                        <input value={newPlan.code} onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value })} placeholder="plan code" />
                        <input value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} placeholder="Plan name" />
                        <textarea value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} placeholder="Description" rows={3} />
                        <label><input type="checkbox" checked={newPlan.active} onChange={(e) => setNewPlan({ ...newPlan, active: e.target.checked })} /> Publish as active</label>
                        <button type="button" disabled={saving} onClick={() => void post({ action: "create_plan", code: newPlan.code, name: newPlan.name, description: newPlan.description, active: newPlan.active, displayOrder: plans.length })}>Create Plan</button>
                    </div>
                </div>

                <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <h2 style={{ marginTop: 0 }}>Plan Details</h2>
                    {!selectedPlan ? <p style={{ color: "#6b7280" }}>Select a plan to edit it and manage its entitlements.</p> : (
                        <div style={{ display: "grid", gap: 10 }}>
                            <input value={plan.code} onChange={(e) => setPlan({ ...plan, code: e.target.value })} placeholder="Plan code" />
                            <input value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} placeholder="Plan name" />
                            <textarea value={plan.description} onChange={(e) => setPlan({ ...plan, description: e.target.value })} rows={3} placeholder="Description" />
                            <input type="number" value={plan.displayOrder} onChange={(e) => setPlan({ ...plan, displayOrder: Number(e.target.value) })} placeholder="Display order" />
                            <label><input type="checkbox" checked={plan.active} onChange={(e) => setPlan({ ...plan, active: e.target.checked })} /> Active / published</label>
                            <button type="button" disabled={saving} onClick={() => void post({ action: "update_plan", id: selectedPlan.id, ...plan })}>Save Plan</button>

                            <hr style={{ margin: "10px 0" }} />
                            <h3>Entitlements</h3>
                            {selectedEntitlements.length ? selectedEntitlements.map((item) => <div key={item.id} style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 }}><strong>{item.entitlement_key}</strong><div style={{ fontSize: 13, color: "#64748b" }}>{item.limit_value === null ? "unlimited" : item.limit_value} {item.limit_unit} · {item.enabled ? "enabled" : "disabled"}</div></div>) : <p style={{ color: "#6b7280" }}>No entitlements yet.</p>}
                            <input value={entitlementKey} onChange={(e) => setEntitlementKey(e.target.value)} placeholder="Entitlement key, e.g. ai_monthly_operations" />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <input value={limitValue} onChange={(e) => setLimitValue(e.target.value)} placeholder="Limit (blank = unlimited)" inputMode="decimal" />
                                <input value={limitUnit} onChange={(e) => setLimitUnit(e.target.value)} placeholder="Unit" />
                            </div>
                            <label><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enabled</label>
                            <button type="button" disabled={saving} onClick={() => void post({ action: "upsert_entitlement", planId: selectedPlan.id, entitlementKey, limitValue, limitUnit, enabled })}>Save Entitlement</button>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
