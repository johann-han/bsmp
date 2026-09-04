"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ExpositorySermon } from "@bsmp/preaching";
import type { TeachingPlan } from "../../lib/teachingPlanRepository";
import { findTeachingPlans } from "../../lib/teachingPlanRepository";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";

const linkStyle = { color: "#1d4ed8", textDecoration: "none", fontWeight: 600 } as const;

export function SermonTeachingTraceability({ studyId, variant = "final" }: { studyId: string; variant?: "final" | "delivery" }) {
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
    const [plan, setPlan] = useState<TeachingPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        async function load() {
            if (!studyId) { setLoading(false); return; }
            try {
                const sermonRepository = new SupabaseExpositorySermonRepository();
                const nextSermon = await sermonRepository.findByStudyId(studyId);
                if (!active) return;
                setSermon(nextSermon);
                if (!nextSermon?.teachingPlanId) return;
                const plans = await findTeachingPlans(studyId);
                if (!active) return;
                setPlan(plans.find((candidate) => candidate.id === nextSermon.teachingPlanId) ?? null);
            } catch (reason: unknown) {
                if (active) setError(reason instanceof Error ? reason.message : "Unable to load the Teaching Plan traceability.");
            } finally {
                if (active) setLoading(false);
            }
        }
        void load();
        return () => { active = false; };
    }, [studyId]);

    if (loading || error || !sermon?.teachingPlanId || !plan) return null;

    const title = variant === "delivery" ? "Teaching Foundation" : "Teaching Plan Foundation";
    const description = variant === "delivery"
        ? "This sermon was prepared from the linked completed Teaching Plan. Use the source link to review the teaching foundation behind the delivered message."
        : "The sermon is explicitly linked to the completed Teaching Plan that preceded sermon preparation, preserving the full preparation chain.";

    return (
        <section className="bsmp-print-section bsmp-print-hide" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Study → Biblical Theology → Teaching → Sermon</div>
            <h2 style={{ margin: "4px 0 8px" }}>{title}</h2>
            <p style={{ marginTop: 0, color: "#6b7280" }}>{description}</p>
            <div style={{ padding: 14, borderRadius: 10, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                <strong>{plan.title}</strong>
                <p style={{ margin: "8px 0 4px" }}><strong>Central truth:</strong> {plan.central_truth || "Not recorded."}</p>
                <p style={{ margin: "4px 0" }}><strong>Teaching aim:</strong> {plan.teaching_aim || "Not recorded."}</p>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6b7280" }}>
                    Supporting interpretations: {plan.supporting_interpretation_ids.length} · Supporting Biblical Theology entries: {plan.supporting_biblical_theology_ids.length}
                </p>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13 }}>
                <Link href={`/teaching?studyId=${encodeURIComponent(studyId)}`} style={linkStyle}>Review Teaching Plan →</Link>
                <Link href={`/preaching?studyId=${encodeURIComponent(studyId)}`} style={linkStyle}>Review Sermon Preparation →</Link>
            </div>
        </section>
    );
}
