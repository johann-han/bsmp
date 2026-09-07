"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ExpositorySermon } from "@bsmp/preaching";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";

interface Props {
    studyId: string;
}

const linkStyle = { color: "#1d4ed8", textDecoration: "none", fontWeight: 600 } as const;

type Check = {
    label: string;
    description: string;
    complete: boolean;
    href: string;
};

export function FinalSermonDraftReadiness({ studyId }: Props) {
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        async function load() {
            if (!studyId) {
                setError("A study is required to check final sermon readiness.");
                setLoading(false);
                return;
            }
            try {
                const next = await new SupabaseExpositorySermonRepository().findByStudyId(studyId);
                if (active) setSermon(next ?? null);
            } catch (reason: unknown) {
                if (active) setError(reason instanceof Error ? reason.message : "Unable to load final sermon readiness.");
            } finally {
                if (active) setLoading(false);
            }
        }
        void load();
        return () => {
            active = false;
        };
    }, [studyId]);

    const checks = useMemo<Check[]>(() => {
        if (!sermon) return [];
        const manuscript = sermon.manuscript?.value?.trim() ?? "";
        const hasExposition = sermon.outline.some((point) => Boolean(point.text || point.explanation || point.illustration || point.application));
        return [
            {
                label: "Big Idea",
                description: "The governing truth of the sermon is defined.",
                complete: Boolean(sermon.bigIdea?.value.trim()),
                href: `/preaching/overview?studyId=${encodeURIComponent(studyId)}`,
            },
            {
                label: "Purpose",
                description: "The intended response of the congregation is defined.",
                complete: Boolean(sermon.purpose?.value.trim()),
                href: `/preaching/overview?studyId=${encodeURIComponent(studyId)}`,
            },
            {
                label: "Outline",
                description: "The sermon has at least one prepared outline point.",
                complete: sermon.outline.length > 0,
                href: `/preaching/exposition?studyId=${encodeURIComponent(studyId)}`,
            },
            {
                label: "Exposition",
                description: "At least one outline point has developed exposition material.",
                complete: hasExposition,
                href: `/preaching/exposition?studyId=${encodeURIComponent(studyId)}`,
            },
            {
                label: "Final Manuscript",
                description: "A saved manuscript is ready for preaching review.",
                complete: manuscript.length > 0,
                href: `/preaching/final?studyId=${encodeURIComponent(studyId)}`,
            },
            {
                label: "Delivery Preparation",
                description: "Delivery notes are prepared for the preaching setting.",
                complete: Boolean(sermon.deliveryNotes?.value.trim()),
                href: `/preaching/final?studyId=${encodeURIComponent(studyId)}`,
            },
        ];
    }, [sermon, studyId]);

    if (loading) {
        return (
            <section className="bsmp-print-hide" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff", marginBottom: 20 }}>
                <strong>Final Sermon Readiness</strong>
                <p style={{ marginBottom: 0, color: "#6b7280" }}>Checking the saved sermon preparation...</p>
            </section>
        );
    }

    if (!sermon) {
        return (
            <section className="bsmp-print-hide" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff", marginBottom: 20 }}>
                <h2 style={{ marginTop: 0 }}>Final Sermon Readiness</h2>
                <p style={{ color: "#6b7280", marginBottom: 0 }}>{error ?? "Create Sermon Preparation before checking final sermon readiness."}</p>
            </section>
        );
    }

    const completed = checks.filter((check) => check.complete).length;
    const ready = completed === checks.length;

    return (
        <section className="bsmp-print-hide" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "end" }}>
                <div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Preaching workflow · saved-state check</div>
                    <h2 style={{ margin: "4px 0 8px" }}>Final Sermon Readiness</h2>
                    <p style={{ margin: 0, color: "#6b7280" }}>
                        {ready
                            ? "The saved sermon has all core preparation elements. Review the manuscript carefully before preaching."
                            : `${completed} of ${checks.length} core preparation checks are complete. Complete the missing items before treating the manuscript as preaching-ready.`}
                    </p>
                </div>
                <Link href={`/preaching/final?studyId=${encodeURIComponent(studyId)}`} style={linkStyle}>Open Final Draft</Link>
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                {checks.map((check) => (
                    <div key={check.label} style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 10, alignItems: "center", padding: 10, border: "1px solid #eef2f7", borderRadius: 8 }}>
                        <span aria-hidden="true" style={{ fontSize: 18 }}>{check.complete ? "✓" : "○"}</span>
                        <div>
                            <strong>{check.label}</strong>
                            <div style={{ color: "#6b7280", fontSize: 13 }}>{check.description}</div>
                        </div>
                        <Link href={check.href} style={linkStyle}>{check.complete ? "Review" : "Complete"}</Link>
                    </div>
                ))}
            </div>

            <p style={{ margin: "14px 0 0", color: "#6b7280", fontSize: 12 }}>
                This checklist reads the saved sermon only. Save recent changes in the Final Sermon Draft workspace before relying on the readiness state.
            </p>
        </section>
    );
}
