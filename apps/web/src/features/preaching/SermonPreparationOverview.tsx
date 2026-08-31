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

interface Props { studyId: string; }

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

type PointReadiness = { complete: boolean; completed: number; total: number; missing: string[] };

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
    return { complete: missing.length === 0, completed: checks.length - missing.length, total: checks.length, missing };
}

function link(path: string, studyId: string): string {
    return `${path}?studyId=${encodeURIComponent(studyId)}`;
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
        return () => { cancelled = true; };
    }, [studyId]);

    const readiness = useMemo(() => sermon?.outline.map((point, index) => ({
        point,
        readiness: getPointReadiness(getPointDraft(point), index === sermon.outline.length - 1),
    })) ?? [], [sermon]);

    if (loading) return <AppShell title="Sermon Overview"><div style={{ display: "grid", gap: 16 }}>{[1, 2, 3, 4].map((item) => <section key={item} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fff" }}><div style={{ width: 220, height: 18, background: "#e5e7eb", borderRadius: 6, marginBottom: 14 }} /><div style={{ width: "100%", height: 70, background: "#f3f4f6", borderRadius: 8 }} /></section>)}</div></AppShell>;

    if (error || !sermon || !study) return <AppShell title="Sermon Overview"><p style={{ color: "#b91c1c" }}>{error ?? "Sermon overview could not be loaded."}</p><button type="button" onClick={() => router.push(link("/preaching", studyId))} style={{ padding: "10px 16px" }}>← Back to Sermon Preparation</button></AppShell>;

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
    const studyEvidenceCount = study.interpretations.reduce((count, interpretation) => count + interpretation.evidence.length, 0);
    const supportCount = study.observations.length + study.interpretations.length + studyEvidenceCount + study.applications.length;
    const overviewReady = frameworkComplete === frameworkChecks.length && sermon.outline.length > 0 && readyPoints === sermon.outline.length;

    const nextAction = !frameworkChecks.every((check) => check.complete)
        ? { title: "Complete the Sermon Framework", description: "Finish the framework before refining the exposition.", href: link("/preaching", studyId), label: "Open Sermon Framework" }
        : sermon.outline.length === 0
            ? { title: "Build the Sermon Outline", description: "Create at least one clear outline point from the passage.", href: link("/preaching", studyId), label: "Open Sermon Outline" }
            : readyPoints < sermon.outline.length
                ? { title: "Complete the Exposition", description: `${sermon.outline.length - readyPoints} outline point${sermon.outline.length - readyPoints === 1 ? "" : "s"} still need preparation.`, href: link("/preaching/exposition", studyId), label: "Open Sermon Exposition" }
                : { title: "Ready for Final Drafting", description: "The framework and every exposition point are complete.", href: "#final-stage", label: "Review Final Stage" };

    return (
        <AppShell title="Sermon Overview">
            <div style={{ display: "grid", gap: 20 }}>
                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Expository Sermon Preparation</div>
                    <h2 style={{ margin: "4px 0 8px" }}>{sermon.title.value}</h2>
                    <p style={{ margin: "4px 0" }}><strong>Study:</strong> {study.title.value}</p>
                    <p style={{ margin: "4px 0" }}><strong>Passage:</strong> {sermon.passage.toString()}</p>
                </section>

                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: overviewReady ? "#ecfdf5" : "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                        <div><div style={{ fontSize: 13, color: "#6b7280" }}>Next best action</div><h2 style={{ margin: "4px 0" }}>{nextAction.title}</h2><p style={{ margin: 0, color: "#6b7280" }}>{nextAction.description}</p></div>
                        <Link href={nextAction.href} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #d1d5db", textDecoration: "none", fontWeight: 600 }}>{nextAction.label}</Link>
                    </div>
                </section>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                    {[
                        ["Framework", `${frameworkComplete}/${frameworkChecks.length}`, "sections complete"],
                        ["Outline", String(sermon.outline.length), "sermon points"],
                        ["Exposition", `${readyPoints}/${sermon.outline.length || 0}`, "points ready"],
                        ["Study Support", String(supportCount), "source items available"],
                    ].map(([label, value, caption]) => <section key={label} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 18, background: "#fff" }}><div style={{ color: "#6b7280", fontSize: 13 }}>{label}</div><div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div><div style={{ color: "#6b7280" }}>{caption}</div></section>)}
                </div>

                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><div><div style={{ fontSize: 13, color: "#6b7280" }}>Sermon Framework</div><h3 style={{ margin: "4px 0" }}>{frameworkComplete}/{frameworkChecks.length} complete</h3></div><Link href={link("/preaching", studyId)}>Open Framework</Link></div>
                    <div style={{ display: "grid", gap: 7, marginTop: 12 }}>{frameworkChecks.map((check) => <div key={check.label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span>{check.label}</span><strong style={{ color: check.complete ? "#047857" : "#b91c1c" }}>{check.complete ? "Complete" : "Needed"}</strong></div>)}</div>
                </section>

                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><div><div style={{ fontSize: 13, color: "#6b7280" }}>Sermon Outline & Exposition</div><h3 style={{ margin: "4px 0" }}>{readyPoints}/{sermon.outline.length} points ready</h3></div><Link href={link("/preaching/exposition", studyId)}>Open Exposition</Link></div>
                    {sermon.outline.length === 0 ? <p style={{ color: "#6b7280" }}>No outline points have been created yet.</p> : <div style={{ display: "grid", gap: 10, marginTop: 12 }}>{readiness.map(({ point, readiness: pointReadiness }, index) => <div key={point.id} style={{ padding: 12, borderRadius: 8, background: "#f8fafc", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><div><strong>{index + 1}. {point.heading}</strong><div style={{ fontSize: 13, color: "#6b7280" }}>{point.truth}</div>{pointReadiness.missing.length > 0 && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Needs: {pointReadiness.missing.join(", ")}</div>}</div><strong style={{ color: pointReadiness.complete ? "#047857" : "#6b7280" }}>{pointReadiness.completed}/{pointReadiness.total}</strong></div>)}</div>}
                </section>

                <section id="final-stage" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Final Sermon</div>
                    <h3 style={{ margin: "4px 0 8px" }}>{overviewReady ? "Ready for final drafting" : "Final drafting comes next"}</h3>
                    <p style={{ margin: 0, color: "#6b7280" }}>{overviewReady ? "The sermon framework and exposition are complete. This is the point at which BSMP can move into manuscript and delivery preparation." : "Complete the framework and exposition before moving into the final manuscript and delivery stage."}</p>
                </section>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link href={link("/preaching", studyId)} style={{ padding: "10px 16px", border: "1px solid #d1d5db", borderRadius: 8, textDecoration: "none" }}>← Sermon Preparation</Link>
                    <Link href={link("/preaching/exposition", studyId)} style={{ padding: "10px 16px", border: "1px solid #d1d5db", borderRadius: 8, textDecoration: "none" }}>Open Exposition</Link>
                </div>
            </div>
        </AppShell>
    );
}
