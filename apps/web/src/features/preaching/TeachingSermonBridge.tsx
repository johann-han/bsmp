"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ExpositorySermon } from "@bsmp/preaching";
import type { TeachingPlan } from "../../lib/teachingPlanRepository";
import { findTeachingPlans } from "../../lib/teachingPlanRepository";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";

const linkStyle = { color: "#1d4ed8", textDecoration: "none", fontWeight: 600 } as const;

function isComplete(plan: TeachingPlan): boolean {
    return Boolean(
        plan.audience.trim()
        && plan.central_truth.trim()
        && plan.teaching_aim.trim()
        && plan.explanation.trim()
        && plan.key_points.length > 0
        && plan.response_prompt.trim()
        && plan.supporting_interpretation_ids.length > 0
        && plan.supporting_biblical_theology_ids.length > 0,
    );
}

export function TeachingSermonBridge({ studyId, sermon, onLinked }: { studyId: string; sermon: ExpositorySermon; onLinked?: () => void }) {
    const [plans, setPlans] = useState<readonly TeachingPlan[]>([]);
    const [selectedId, setSelectedId] = useState(sermon.teachingPlanId ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        void findTeachingPlans(studyId).then((loaded) => {
            if (!active) return;
            setPlans(loaded);
            if (sermon.teachingPlanId && loaded.some((plan) => plan.id === sermon.teachingPlanId)) setSelectedId(sermon.teachingPlanId);
        }).catch((reason: unknown) => {
            if (active) setError(reason instanceof Error ? reason.message : "Unable to load Teaching Plans.");
        });
        return () => { active = false; };
    }, [studyId, sermon.teachingPlanId]);

    async function saveLink() {
        setSaving(true); setError(null); setMessage(null);
        try {
            if (selectedId) {
                const selected = plans.find((plan) => plan.id === selectedId);
                if (!selected || !isComplete(selected)) throw new Error("Only a completed Teaching Plan can be linked to a sermon.");
            }
            sermon.defineTeachingPlan(selectedId || undefined);
            await new SupabaseExpositorySermonRepository().save(sermon);
            setMessage(selectedId ? "Teaching Plan linked to this sermon." : "Teaching Plan link removed.");
            onLinked?.();
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to save the Teaching Plan link.");
        } finally { setSaving(false); }
    }

    const selected = plans.find((plan) => plan.id === selectedId);
    return (
        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Teaching → Sermon Preparation</div>
            <h2 style={{ margin: "4px 0 8px" }}>Teaching Foundation</h2>
            <p style={{ marginTop: 0, color: "#6b7280" }}>Link one completed Teaching Plan so the sermon records the teaching foundation that preceded its preparation.</p>
            {plans.length === 0 ? (
                <p>No Teaching Plans have been recorded for this study. <Link href={`/teaching?studyId=${encodeURIComponent(studyId)}`} style={linkStyle}>Prepare a Teaching Plan →</Link></p>
            ) : (
                <>
                    <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} style={{ width: "100%", padding: 10 }}>
                        <option value="">No Teaching Plan linked</option>
                        {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}{isComplete(plan) ? " — Complete" : " — In progress"}</option>)}
                    </select>
                    {selected && (
                        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                            <strong>{selected.title}</strong>
                            <p style={{ margin: "6px 0" }}><strong>Central truth:</strong> {selected.central_truth || "Not yet recorded."}</p>
                            <p style={{ margin: "6px 0" }}><strong>Teaching aim:</strong> {selected.teaching_aim || "Not yet recorded."}</p>
                            <p style={{ margin: "6px 0", color: isComplete(selected) ? "#047857" : "#92400e" }}>{isComplete(selected) ? "Ready to serve as a sermon teaching foundation." : "Complete the Teaching Plan before linking it to the sermon."}</p>
                            <Link href={`/teaching?studyId=${encodeURIComponent(studyId)}`} style={linkStyle}>Review Teaching Plan →</Link>
                        </div>
                    )}
                    <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <button type="button" onClick={() => void saveLink()} disabled={saving}>{saving ? "Saving..." : "Save Teaching Link"}</button>
                        {message && <span style={{ color: "#047857" }}>{message}</span>}
                        {error && <span style={{ color: "#b91c1c" }}>{error}</span>}
                    </div>
                </>
            )}
        </section>
    );
}
