"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpositorySermon } from "@bsmp/preaching";
import type { StudySession } from "@bsmp/study";
import { StudyId } from "@bsmp/study";
import { AppShell } from "@repo/ui";

import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";
import { cacheStudyForWorkspace } from "../../lib/studyWorkspaceNavigationCache";
import { prefetchStudyWorkspace } from "../../lib/prefetchStudyWorkspace";

interface Props { studyId: string; }

type Draft = { explanation: string; illustration: string; application: string; transition: string };
function emptyDraft(): Draft { return { explanation: "", illustration: "", application: "", transition: "" }; }

function workspaceHref(studyId: string, target: string): string {
    const params = new URLSearchParams({
        studyId,
        returnTo: `/preaching/exposition?studyId=${encodeURIComponent(studyId)}`,
    });
    return `/workspace?${params.toString()}#${encodeURIComponent(target)}`;
}

const linkStyle = { color: "#1d4ed8", textDecoration: "none" };

function WorkspaceLink({ study, href, children }: { study: StudySession; href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            prefetch
            style={linkStyle}
            onMouseEnter={() => prefetchStudyWorkspace(study)}
            onFocus={() => prefetchStudyWorkspace(study)}
            onClick={() => cacheStudyForWorkspace(study)}
        >
            {children}
        </Link>
    );
}

export function SermonExpositionWorkspace({ studyId }: Props) {
    const router = useRouter();
    const [study, setStudy] = useState<StudySession | null>(null);
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
    const [drafts, setDrafts] = useState<Record<string, Draft>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!studyId) { setError("A study is required to open sermon exposition."); setLoading(false); return; }
            try {
                const studyRepository = new SupabaseStudyRepository();
                const sermonRepository = new SupabaseExpositorySermonRepository();
                const [nextStudy, nextSermon] = await Promise.all([studyRepository.find(StudyId.from(studyId)), sermonRepository.findByStudyId(studyId)]);
                if (cancelled) return;
                if (!nextStudy) throw new Error("The selected study could not be found.");
                if (!nextSermon) throw new Error("Create Sermon Preparation before developing exposition.");
                setStudy(nextStudy);
                setSermon(nextSermon);
                setDrafts(Object.fromEntries(nextSermon.outline.map((point) => [point.id, {
                    explanation: point.explanation,
                    illustration: point.illustration,
                    application: point.application,
                    transition: point.transition,
                }])));
            } catch (reason: unknown) {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load sermon exposition.");
            } finally { if (!cancelled) setLoading(false); }
        }
        void load();
        return () => { cancelled = true; };
    }, [studyId]);

    function updateDraft(pointId: string, key: keyof Draft, value: string) {
        setDrafts((current) => ({ ...current, [pointId]: { ...(current[pointId] ?? emptyDraft()), [key]: value } }));
    }

    async function save() {
        if (!sermon) return;
        setSaving(true); setMessage(null); setError(null);
        try {
            for (const point of sermon.outline) sermon.defineOutlinePointExposition(point.id, drafts[point.id] ?? emptyDraft());
            await new SupabaseExpositorySermonRepository().save(sermon);
            setMessage("Sermon exposition saved.");
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to save sermon exposition.");
        } finally { setSaving(false); }
    }

    if (loading) return <AppShell title="Sermon Exposition"><div style={{ display: "grid", gap: 16 }}>{[1, 2, 3].map((item) => <section key={item} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fff" }}><div style={{ width: 240, height: 18, background: "#e5e7eb", borderRadius: 6, marginBottom: 14 }} /><div style={{ width: "100%", height: 90, background: "#f3f4f6", borderRadius: 8 }} /></section>)}</div></AppShell>;

    if (error || !sermon || !study) return <AppShell title="Sermon Exposition"><p style={{ color: "#b91c1c" }}>{error ?? "Sermon exposition could not be loaded."}</p><button type="button" onClick={() => router.push(`/preaching?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>← Back to Sermon Preparation</button></AppShell>;

    const studyEvidence = study.interpretations.flatMap((interpretation) => interpretation.evidence);

    return (
        <AppShell title="Sermon Exposition">
            <div style={{ display: "grid", gap: 20 }}>
                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Expository Sermon Preparation</div>
                    <h2 style={{ margin: "4px 0 8px" }}>{sermon.title.value}</h2>
                    <p style={{ margin: "4px 0" }}><strong>Study:</strong> {study.title.value}</p>
                    <p style={{ margin: "4px 0" }}><strong>Passage:</strong> {sermon.passage.toString()}</p>
                    {sermon.bigIdea && <p style={{ margin: "12px 0 4px" }}><strong>Big Idea:</strong> {sermon.bigIdea.value}</p>}
                </section>

                {sermon.outline.length === 0 ? (
                    <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                        <strong>No outline points yet.</strong>
                        <p>Create at least one outline point before developing the exposition.</p>
                        <button type="button" onClick={() => router.push(`/preaching?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>Back to Sermon Preparation</button>
                    </section>
                ) : (
                    sermon.outline.map((point, index) => {
                        const observations = point.supportingObservationIds.map((id) => study.observations.find((item) => item.id.value === id)).filter(Boolean);
                        const interpretations = point.supportingInterpretationIds.map((id) => study.interpretations.find((item) => item.id.value === id)).filter(Boolean);
                        const evidence = point.supportingEvidenceIds.map((id) => studyEvidence.find((item) => item.id.value === id)).filter(Boolean);
                        const applications = point.supportingApplicationIds.map((id) => study.applications.find((item) => item.id.value === id)).filter(Boolean);
                        const hasStudySupport = observations.length + interpretations.length + evidence.length + applications.length > 0;
                        const draft = drafts[point.id] ?? emptyDraft();

                        return (
                            <section key={point.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontSize: 13, color: "#6b7280" }}>Outline Point {index + 1}</div>
                                        <h2 style={{ margin: "4px 0" }}>{point.heading}</h2>
                                        <p style={{ marginTop: 0 }}><strong>Truth:</strong> {point.truth}</p>
                                    </div>
                                    <WorkspaceLink study={study} href={workspaceHref(studyId, `observation-${point.supportingObservationIds[0] ?? ""}`)}>Study Workspace</WorkspaceLink>
                                </div>

                                <details open={index === 0} style={{ marginTop: 16, border: "1px solid #e5e7eb", borderRadius: 10, background: "#f8fafc" }}>
                                    <summary style={{ cursor: "pointer", padding: "14px 16px", fontWeight: 700, listStylePosition: "inside" }}>
                                        Study Support {hasStudySupport ? `(${observations.length + interpretations.length + evidence.length + applications.length})` : "(none attached)"}
                                    </summary>
                                    <div style={{ padding: "0 16px 16px" }}>
                                        {!hasStudySupport ? (
                                            <p style={{ color: "#6b7280", marginBottom: 0 }}>No study support has been attached to this outline point.</p>
                                        ) : (
                                            <div style={{ display: "grid", gap: 12 }}>
                                                {observations.length > 0 && <div><strong>Observations</strong>{observations.map((observation) => <div key={observation!.id.value} style={{ marginTop: 5 }}><WorkspaceLink study={study} href={workspaceHref(studyId, `observation-${observation!.id.value}`)}>{observation!.verseReference.value.toString()}</WorkspaceLink> — {observation!.statement.value}</div>)}</div>}
                                                {interpretations.length > 0 && <div><strong>Interpretations</strong>{interpretations.map((interpretation) => <div key={interpretation!.id.value} style={{ marginTop: 5 }}><WorkspaceLink study={study} href={workspaceHref(studyId, `interpretation-${interpretation!.id.value}`)}>{interpretation!.statement.value}</WorkspaceLink></div>)}</div>}
                                                {evidence.length > 0 && <div><strong>Evidence</strong>{evidence.map((item) => <div key={item!.id.value} style={{ marginTop: 5 }}><WorkspaceLink study={study} href={workspaceHref(studyId, `evidence-${item!.id.value}`)}>{item!.type.value}</WorkspaceLink> — {item!.description.value}</div>)}</div>}
                                                {applications.length > 0 && <div><strong>Applications</strong>{applications.map((application) => <div key={application!.id.value} style={{ marginTop: 5 }}><WorkspaceLink study={study} href={workspaceHref(studyId, `application-${application!.id.value}`)}><strong>Principle:</strong> {application!.principle.value}</WorkspaceLink><div><strong>Personal:</strong> {application!.personal.value}</div><div><strong>Ministry:</strong> {application!.ministry.value}</div><div><strong>Action:</strong> {application!.action.value}</div></div>)}</div>}
                                            </div>
                                        )}
                                    </div>
                                </details>

                                <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
                                    <label><strong>Explanation</strong><div style={{ color: "#6b7280", margin: "4px 0 6px" }}>What does the text say, and how does the point develop from the passage?</div><textarea value={draft.explanation} onChange={(event) => updateDraft(point.id, "explanation", event.target.value)} rows={6} placeholder="Explain the meaning and movement of the text..." style={{ width: "100%", padding: 12, resize: "vertical" }} /></label>
                                    <label><strong>Illustration</strong><div style={{ color: "#6b7280", margin: "4px 0 6px" }}>What image, example, story, or analogy will clarify this truth?</div><textarea value={draft.illustration} onChange={(event) => updateDraft(point.id, "illustration", event.target.value)} rows={5} placeholder="Develop an illustration..." style={{ width: "100%", padding: 12, resize: "vertical" }} /></label>
                                    <label><strong>Application</strong><div style={{ color: "#6b7280", margin: "4px 0 6px" }}>How should this truth change the believer's life?</div><textarea value={draft.application} onChange={(event) => updateDraft(point.id, "application", event.target.value)} rows={5} placeholder="Develop the point-specific application..." style={{ width: "100%", padding: 12, resize: "vertical" }} /></label>
                                    <label><strong>Transition</strong><div style={{ color: "#6b7280", margin: "4px 0 6px" }}>How will you move naturally from this point to the next?</div><textarea value={draft.transition} onChange={(event) => updateDraft(point.id, "transition", event.target.value)} rows={4} placeholder="Write the transition..." style={{ width: "100%", padding: 12, resize: "vertical" }} /></label>
                                </div>
                            </section>
                        );
                    })
                )}

                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}><button type="button" onClick={() => void save()} disabled={saving || sermon.outline.length === 0} style={{ padding: "10px 16px", fontWeight: 600 }}>{saving ? "Saving..." : "Save Sermon Exposition"}</button><button type="button" onClick={() => router.push(`/preaching?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>← Back to Sermon Preparation</button>{message && <span style={{ color: "#047857" }}>{message}</span>}{error && <span style={{ color: "#b91c1c" }}>{error}</span>}</div>
            </div>
        </AppShell>
    );
}
