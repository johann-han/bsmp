"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpositorySermon } from "@bsmp/preaching";
import type { StudySession } from "@bsmp/study";
import { StudyId } from "@bsmp/study";
import { AppShell } from "@repo/ui";

import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";

interface Props {
    studyId: string;
}

type PointDraft = {
    text: string;
    explanation: string;
    illustration: string;
    application: string;
    transition: string;
    textObservationIds: string[];
    meaningInterpretationIds: string[];
    meaningEvidenceIds: string[];
    responseApplicationIds: string[];
};

type PointReadiness = {
    complete: boolean;
    completed: number;
    total: number;
    missing: string[];
};

function getPointDraft(point: ExpositorySermon["outline"][number]): PointDraft {
    return {
        text: point.text,
        explanation: point.explanation,
        illustration: point.illustration,
        application: point.application,
        transition: point.transition,
        textObservationIds: [...point.textObservationIds],
        meaningInterpretationIds: [...point.meaningInterpretationIds],
        meaningEvidenceIds: [...point.meaningEvidenceIds],
        responseApplicationIds: [...point.responseApplicationIds],
    };
}

function getPointReadiness(draft: PointDraft, isLastPoint: boolean): PointReadiness {
    const checks = [
        { label: "Text", ready: Boolean(draft.text.trim()) },
        { label: "Text foundation", ready: draft.textObservationIds.length > 0 },
        { label: "Meaning", ready: Boolean(draft.explanation.trim()) },
        { label: "Meaning foundation", ready: draft.meaningInterpretationIds.length > 0 },
        { label: "Meaning evidence", ready: draft.meaningEvidenceIds.length > 0 },
        { label: "Preaching", ready: Boolean(draft.illustration.trim()) },
        { label: "Response", ready: Boolean(draft.application.trim()) },
        { label: "Response foundation", ready: draft.responseApplicationIds.length > 0 },
        ...(!isLastPoint ? [{ label: "Transition", ready: Boolean(draft.transition.trim()) }] : []),
    ];
    const missing = checks.filter((check) => !check.ready).map((check) => check.label);
    return {
        complete: missing.length === 0,
        completed: checks.length - missing.length,
        total: checks.length,
        missing,
    };
}

function sectionLink(studyId: string, section: string): string {
    return `/preaching/exposition?studyId=${encodeURIComponent(studyId)}#${encodeURIComponent(section)}`;
}

export function SermonPreparationOverview({ studyId }: Props) {
    const router = useRouter();
    const [study, setStudy] = useState<StudySession | null>(null);
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!studyId) {
                setError("A study is required to open the sermon overview.");
                setLoading(false);
                return;
            }

            try {
                const studyRepository = new SupabaseStudyRepository();
                const sermonRepository = new SupabaseExpositorySermonRepository();
                const [nextStudy, nextSermon] = await Promise.all([
                    studyRepository.find(StudyId.from(studyId)),
                    sermonRepository.findByStudyId(studyId),
                ]);
                if (cancelled) return;
                if (!nextStudy) throw new Error("The selected study could not be found.");
                if (!nextSermon) throw new Error("Create Sermon Preparation before opening the overview.");
                setStudy(nextStudy);
                setSermon(nextSermon);
            } catch (reason: unknown) {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load sermon overview.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, [studyId]);

    const readiness = useMemo(() => {
        if (!sermon) return [];
        return sermon.outline.map((point, index) => ({
            point,
            readiness: getPointReadiness(getPointDraft(point), index === sermon.outline.length - 1),
        }));
    }, [sermon]);

    if (loading) {
        return (
            <AppShell title="Sermon Overview">
                <div style={{ display: "grid", gap: 16 }}>
                    {[1, 2, 3, 4].map((item) => (
                        <section key={item} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fff" }}>
                            <div style={{ width: 220, height: 18, background: "#e5e7eb", borderRadius: 6, marginBottom: 14 }} />
                            <div style={{ width: "100%", height: 70, background: "#f3f4f6", borderRadius: 8 }} />
                        </section>
                    ))}
                </div>
            </AppShell>
        );
    }

    if (error || !sermon || !study) {
        return (
            <AppShell title="Sermon Overview">
                <p style={{ color: "#b91c1c" }}>{error ?? "Sermon overview could not be loaded."}</p>
                <button type="button" onClick={() => router.push(`/preaching?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>
                    ← Back to Sermon Preparation
                </button>
            </AppShell>
        );
    }

    const frameworkChecks = [
        { label: "Sermon title", complete: Boolean(sermon.title.value.trim()) },
        { label: "Big Idea", complete: Boolean(sermon.bigIdea?.value.trim()) },
        { label: "Purpose", complete: Boolean(sermon.purpose?.value.trim()) },
        { label: "Introduction", complete: Boolean(sermon.introduction?.value.trim()) },
        { label: "Context / Setting", complete: Boolean(sermon.context?.value.trim()) },
        { label: "Conclusion", complete: Boolean(sermon.conclusion?.value.trim()) },
    ];
    const frameworkComplete = frameworkChecks.filter((check) => check.complete).length;
    const readyPoints = readiness.filter((item) => item.readiness.complete).length;
    const outlineComplete = sermon.outline.length > 0;
    const overviewReady = frameworkComplete === frameworkChecks.length && outlineComplete && readyPoints === sermon.outline.length;

    return (
        <AppShell title="Sermon Overview">
            <div style={{ display: "grid", gap: 20 }}>
                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Expository Sermon Preparation</div>
                    <h2 style={{ margin: "4px 0 8px" }}>{sermon.title.value}</h2>
                    <p style={{ margin: "4px 0" }}><strong>Study:</strong> {study.title.value}</p>
                    <p style={{ margin: "4px 0" }}><strong>Passage:</strong> {sermon.passage.toString()}</p>
                    <p style={{ margin: "12px 0 0", color: "#6b7280" }}>Use this overview to move from the sermon framework through the outline and exposition without losing sight of the whole sermon.</p>
                </section>

                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: overviewReady ? "#ecfdf5" : "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                        <div>
                            <div style={{ fontSize: 13, color: "#6b7280" }}>Overall readiness</div>
                            <h2 style={{ margin: "4px 0" }}>{overviewReady ? "Ready for final sermon drafting" : "Preparation still in progress"}</h2>
                        </div>
                        <strong style={{ color: overviewReady ? "#047857" : "#6b7280" }}>{readyPoints}/{sermon.outline.length} points ready</strong>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: "#e5e7eb", overflow: "hidden", marginTop: 12 }}>
                        <div style={{ width: `${sermon.outline.length === 0 ? 0 : (readyPoints / sermon.outline.length) * 100}%`, height: "100%", background: overviewReady ? "#10b981" : "#93c5fd" }} />
                    </div>
                </section>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                    <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                        <div style={{ fontSize: 13, color: "#6b7280" }}>1. Sermon Framework</div>
                        <h3 style={{ margin: "4px 0 10px" }}>{frameworkComplete}/{frameworkChecks.length} complete</h3>
                        <div style={{ display: "grid", gap: 7 }}>
                            {frameworkChecks.map((check) => (
                                <div key={check.label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <span>{check.label}</span>
                                    <strong style={{ color: check.complete ? "#047857" : "#b91c1c" }}>{check.complete ? "Complete" : "Needed"}</strong>
                                </div>
                            ))}
                        </div>
                        <Link href={`/preaching?studyId=${encodeURIComponent(studyId)}`} style={{ display: "inline-block", marginTop: 14 }}>Open Sermon Preparation</Link>
                    </section>

                    <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                        <div style={{ fontSize: 13, color: "#6b7280" }}>2. Sermon Outline</div>
                        <h3 style={{ margin: "4px 0 10px" }}>{sermon.outline.length} outline points</h3>
                        {sermon.outline.length === 0 ? (
                            <p style={{ color: "#6b7280" }}>Create at least one outline point before developing the exposition.</p>
                        ) : (
                            <div style={{ display: "grid", gap: 8 }}>
                                {sermon.outline.map((point, index) => <div key={point.id} style={{ display: "flex", gap: 10 }}><strong>{index + 1}.</strong><span>{point.heading}</span></div>)}
                            </div>
                        )}
                        <Link href={`/preaching?studyId=${encodeURIComponent(studyId)}`} style={{ display: "inline-block", marginTop: 14 }}>Edit Outline</Link>
                    </section>

                    <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                        <div style={{ fontSize: 13, color: "#6b7280" }}>3. Exposition</div>
                        <h3 style={{ margin: "4px 0 10px" }}>{readyPoints}/{sermon.outline.length} points ready</h3>
                        {readiness.length === 0 ? (
                            <p style={{ color: "#6b7280" }}>No exposition points are available yet.</p>
                        ) : (
                            <div style={{ display: "grid", gap: 8 }}>
                                {readiness.map(({ point, readiness: pointReadiness }) => (
                                    <Link key={point.id} href={`${sectionLink(studyId, `point-${point.id}`)}`} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                        <span>{point.heading}</span>
                                        <strong style={{ color: pointReadiness.complete ? "#047857" : "#6b7280" }}>{pointReadiness.completed}/{pointReadiness.total}</strong>
                                    </Link>
                                ))}
                            </div>
                        )}
                        <Link href={`/preaching/exposition?studyId=${encodeURIComponent(studyId)}`} style={{ display: "inline-block", marginTop: 14 }}>Open Sermon Exposition</Link>
                    </section>

                    <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                        <div style={{ fontSize: 13, color: "#6b7280" }}>4. Final Sermon</div>
                        <h3 style={{ margin: "4px 0 10px" }}>Next stage</h3>
                        <p style={{ color: "#6b7280" }}>The final sermon manuscript and delivery workspace will build on the completed framework and exposition.</p>
                        <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: overviewReady ? "#ecfdf5" : "#f8fafc", color: overviewReady ? "#047857" : "#6b7280" }}>
                            {overviewReady ? "The sermon is ready to move into final drafting." : "Complete the framework and exposition first."}
                        </div>
                    </section>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link href={`/preaching?studyId=${encodeURIComponent(studyId)}`} style={{ padding: "10px 16px", border: "1px solid #d1d5db", borderRadius: 8, textDecoration: "none" }}>← Sermon Preparation</Link>
                    <Link href={`/preaching/exposition?studyId=${encodeURIComponent(studyId)}`} style={{ padding: "10px 16px", border: "1px solid #d1d5db", borderRadius: 8, textDecoration: "none" }}>Open Exposition</Link>
                </div>
            </div>
        </AppShell>
    );
}
