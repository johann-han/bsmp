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

type Draft = {
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

type Readiness = {
    complete: boolean;
    completed: number;
    total: number;
    missing: string[];
};

function emptyDraft(): Draft {
    return { text: "", explanation: "", illustration: "", application: "", transition: "", textObservationIds: [], meaningInterpretationIds: [], meaningEvidenceIds: [], responseApplicationIds: [] };
}

function workspaceHref(studyId: string, target: string): string {
    const params = new URLSearchParams({ studyId, returnTo: `/preaching/exposition?studyId=${encodeURIComponent(studyId)}` });
    return `/workspace?${params.toString()}#${encodeURIComponent(target)}`;
}

const linkStyle = { color: "#1d4ed8", textDecoration: "none" };

function WorkspaceLink({ study, href, children }: { study: StudySession; href: string; children: React.ReactNode }) {
    return <Link href={href} prefetch style={linkStyle} onMouseEnter={() => prefetchStudyWorkspace(study)} onFocus={() => prefetchStudyWorkspace(study)} onClick={() => cacheStudyForWorkspace(study)}>{children}</Link>;
}

function toggleId(values: string[], id: string): string[] {
    return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}

function getReadiness(draft: Draft, isLastPoint: boolean): Readiness {
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
                setStudy(nextStudy); setSermon(nextSermon);
                setDrafts(Object.fromEntries(nextSermon.outline.map((point) => [point.id, {
                    text: point.text,
                    explanation: point.explanation,
                    illustration: point.illustration,
                    application: point.application,
                    transition: point.transition,
                    textObservationIds: [...point.textObservationIds],
                    meaningInterpretationIds: [...point.meaningInterpretationIds],
                    meaningEvidenceIds: [...point.meaningEvidenceIds],
                    responseApplicationIds: [...point.responseApplicationIds],
                }])));
            } catch (reason: unknown) {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load sermon exposition.");
            } finally { if (!cancelled) setLoading(false); }
        }
        void load(); return () => { cancelled = true; };
    }, [studyId]);

    function updateDraft(pointId: string, key: keyof Draft, value: string | string[]) {
        setDrafts((current) => ({ ...current, [pointId]: { ...(current[pointId] ?? emptyDraft()), [key]: value } as Draft }));
    }

    async function save() {
        if (!sermon) return;
        setSaving(true); setMessage(null); setError(null);
        try {
            for (const point of sermon.outline) sermon.defineOutlinePointExposition(point.id, drafts[point.id] ?? emptyDraft());
            await new SupabaseExpositorySermonRepository().save(sermon);
            setMessage("Sermon exposition saved.");
        } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to save sermon exposition."); }
        finally { setSaving(false); }
    }

    if (loading) return <AppShell title="Sermon Exposition"><div style={{ display: "grid", gap: 16 }}>{[1, 2, 3].map((item) => <section key={item} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fff" }}><div style={{ width: 240, height: 18, background: "#e5e7eb", borderRadius: 6, marginBottom: 14 }} /><div style={{ width: "100%", height: 90, background: "#f3f4f6", borderRadius: 8 }} /></section>)}</div></AppShell>;
    if (error || !sermon || !study) return <AppShell title="Sermon Exposition"><p style={{ color: "#b91c1c" }}>{error ?? "Sermon exposition could not be loaded."}</p><button type="button" onClick={() => router.push(`/preaching?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>← Back to Sermon Preparation</button></AppShell>;

    const studyEvidence = study.interpretations.flatMap((interpretation) => interpretation.evidence);
    const readinessByPoint = Object.fromEntries(sermon.outline.map((point, index) => [point.id, getReadiness(drafts[point.id] ?? emptyDraft(), index === sermon.outline.length - 1)]));
    const readyCount = sermon.outline.filter((point) => readinessByPoint[point.id]?.complete).length;

    return <AppShell title="Sermon Exposition"><div style={{ display: "grid", gap: 20 }}>
        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Expository Sermon Preparation</div>
            <h2 style={{ margin: "4px 0 8px" }}>{sermon.title.value}</h2>
            <p style={{ margin: "4px 0" }}><strong>Study:</strong> {study.title.value}</p>
            <p style={{ margin: "4px 0" }}><strong>Passage:</strong> {sermon.passage.toString()}</p>
            {sermon.bigIdea && <p style={{ margin: "12px 0 4px" }}><strong>Big Idea:</strong> {sermon.bigIdea.value}</p>}
            <p style={{ margin: "12px 0 0", color: "#6b7280" }}>Complete the traceable chain from the inductive study into Text, Meaning, Preaching, and Response.</p>
            {sermon.outline.length > 0 && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, border: "1px solid #e5e7eb", background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <strong>Exposition readiness</strong>
                    <span style={{ color: readyCount === sermon.outline.length ? "#047857" : "#6b7280" }}>{readyCount} of {sermon.outline.length} outline points ready</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "#e5e7eb", overflow: "hidden", marginTop: 10 }}>
                    <div style={{ width: `${(readyCount / sermon.outline.length) * 100}%`, height: "100%", background: readyCount === sermon.outline.length ? "#10b981" : "#93c5fd" }} />
                </div>
            </div>}
        </section>

        {sermon.outline.length === 0 ? <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}><strong>No outline points yet.</strong><p>Create at least one outline point before developing the exposition.</p><button type="button" onClick={() => router.push(`/preaching?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>Back to Sermon Preparation</button></section> : sermon.outline.map((point, index) => {
            const observations = point.supportingObservationIds.map((id) => study.observations.find((item) => item.id.value === id)).filter(Boolean);
            const interpretations = point.supportingInterpretationIds.map((id) => study.interpretations.find((item) => item.id.value === id)).filter(Boolean);
            const evidence = point.supportingEvidenceIds.map((id) => studyEvidence.find((item) => item.id.value === id)).filter(Boolean);
            const applications = point.supportingApplicationIds.map((id) => study.applications.find((item) => item.id.value === id)).filter(Boolean);
            const draft = drafts[point.id] ?? emptyDraft();
            const readiness = readinessByPoint[point.id] ?? getReadiness(draft, index === sermon.outline.length - 1);
            return <section key={point.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div><div style={{ fontSize: 13, color: "#6b7280" }}>Outline Point {index + 1}</div><h2 style={{ margin: "4px 0" }}>{point.heading}</h2><p style={{ marginTop: 0 }}><strong>Truth:</strong> {point.truth}</p></div>
                    <WorkspaceLink study={study} href={workspaceHref(studyId, `observation-${point.textObservationIds[0] ?? point.supportingObservationIds[0] ?? ""}`)}>Study Workspace</WorkspaceLink>
                </div>

                <div style={{ marginTop: 16, padding: 14, borderRadius: 10, border: `1px solid ${readiness.complete ? "#a7f3d0" : "#e5e7eb"}`, background: readiness.complete ? "#ecfdf5" : "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <strong>{readiness.complete ? "Ready to preach this point" : "Point preparation in progress"}</strong>
                        <span style={{ color: readiness.complete ? "#047857" : "#6b7280" }}>{readiness.completed}/{readiness.total} complete</span>
                    </div>
                    {!readiness.complete && <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}><strong>Still needed:</strong> {readiness.missing.join(", ")}</div>}
                </div>

                <details open={index === 0} style={{ marginTop: 16, border: "1px solid #e5e7eb", borderRadius: 10, background: "#f8fafc" }}>
                    <summary style={{ cursor: "pointer", padding: "14px 16px", fontWeight: 700, listStylePosition: "inside" }}>Study Support</summary>
                    <div style={{ padding: "0 16px 16px", display: "grid", gap: 16 }}>
                        <div style={{ borderLeft: "3px solid #93c5fd", paddingLeft: 12 }}>
                            <strong>Text foundation</strong>
                            <div style={{ color: "#6b7280", fontSize: 13, margin: "3px 0 7px" }}>Choose the observations that directly establish what the Text section says.</div>
                            {study.observations.map((observation) => <label key={observation.id.value} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 7 }}><input type="checkbox" checked={draft.textObservationIds.includes(observation.id.value)} onChange={() => updateDraft(point.id, "textObservationIds", toggleId(draft.textObservationIds, observation.id.value))} /><span><WorkspaceLink study={study} href={workspaceHref(studyId, `observation-${observation.id.value}`)}>{observation.verseReference.value.toString()}</WorkspaceLink> — {observation.statement.value}</span></label>)}
                        </div>
                        <div style={{ borderLeft: "3px solid #a78bfa", paddingLeft: 12 }}>
                            <strong>Meaning foundation</strong>
                            <div style={{ color: "#6b7280", fontSize: 13, margin: "3px 0 7px" }}>Choose the interpretations that directly support the Meaning section.</div>
                            {study.interpretations.map((interpretation) => <label key={interpretation.id.value} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 7 }}><input type="checkbox" checked={draft.meaningInterpretationIds.includes(interpretation.id.value)} onChange={() => updateDraft(point.id, "meaningInterpretationIds", toggleId(draft.meaningInterpretationIds, interpretation.id.value))} /><span><WorkspaceLink study={study} href={workspaceHref(studyId, `interpretation-${interpretation.id.value}`)}>{interpretation.statement.value}</WorkspaceLink></span></label>)}
                        </div>
                        <div style={{ borderLeft: "3px solid #c4b5fd", paddingLeft: 12 }}>
                            <strong>Meaning support</strong>
                            <div style={{ color: "#6b7280", fontSize: 13, margin: "3px 0 7px" }}>Choose the evidence that directly strengthens the Meaning section.</div>
                            {studyEvidence.length === 0 ? <p style={{ color: "#6b7280" }}>No evidence is available.</p> : studyEvidence.map((item) => <label key={item.id.value} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 7 }}><input type="checkbox" checked={draft.meaningEvidenceIds.includes(item.id.value)} onChange={() => updateDraft(point.id, "meaningEvidenceIds", toggleId(draft.meaningEvidenceIds, item.id.value))} /><span><WorkspaceLink study={study} href={workspaceHref(studyId, `evidence-${item.id.value}`)}>{item.type.value}</WorkspaceLink> — {item.description.value}</span></label>)}
                        </div>
                        <div style={{ borderLeft: "3px solid #86efac", paddingLeft: 12 }}>
                            <strong>Response foundation</strong>
                            <div style={{ color: "#6b7280", fontSize: 13, margin: "3px 0 7px" }}>Choose the applications that directly shape the Response section.</div>
                            {study.applications.length === 0 ? <p style={{ color: "#6b7280" }}>No applications are available.</p> : study.applications.map((application) => <label key={application.id.value} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 7 }}><input type="checkbox" checked={draft.responseApplicationIds.includes(application.id.value)} onChange={() => updateDraft(point.id, "responseApplicationIds", toggleId(draft.responseApplicationIds, application.id.value))} /><span><WorkspaceLink study={study} href={workspaceHref(studyId, `application-${application.id.value}`)}><strong>Principle:</strong> {application.principle.value}</WorkspaceLink> — {application.action.value}</span></label>)}
                        </div>
                        {(evidence.length > 0 || applications.length > 0) && <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 10, color: "#6b7280", fontSize: 13 }}>Existing outline support remains preserved separately; these mappings identify the specific evidence and applications used in the exposition.</div>}
                    </div>
                </details>

                <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
                    <label><strong>Text</strong><div style={{ color: "#6b7280", margin: "4px 0 6px" }}>What does the passage actually say?</div><textarea value={draft.text} onChange={(event) => updateDraft(point.id, "text", event.target.value)} rows={6} placeholder="Record what the text says..." style={{ width: "100%", padding: 12, resize: "vertical" }} /></label>
                    <label><strong>Meaning</strong><div style={{ color: "#6b7280", margin: "4px 0 6px" }}>What does this part of the passage mean, and how does it support the truth of the outline point?</div><textarea value={draft.explanation} onChange={(event) => updateDraft(point.id, "explanation", event.target.value)} rows={6} placeholder="Explain the meaning of the text..." style={{ width: "100%", padding: 12, resize: "vertical" }} /></label>
                    <label><strong>Preaching</strong><div style={{ color: "#6b7280", margin: "4px 0 6px" }}>How will you communicate this truth clearly?</div><textarea value={draft.illustration} onChange={(event) => updateDraft(point.id, "illustration", event.target.value)} rows={5} placeholder="Develop how you will preach this truth..." style={{ width: "100%", padding: 12, resize: "vertical" }} /></label>
                    <label><strong>Response</strong><div style={{ color: "#6b7280", margin: "4px 0 6px" }}>How should the hearer respond to this truth?</div><textarea value={draft.application} onChange={(event) => updateDraft(point.id, "application", event.target.value)} rows={5} placeholder="Develop the appropriate response..." style={{ width: "100%", padding: 12, resize: "vertical" }} /></label>
                    <label><strong>Transition</strong><div style={{ color: "#6b7280", margin: "4px 0 6px" }}>How will you move naturally from this point to the next?</div><textarea value={draft.transition} onChange={(event) => updateDraft(point.id, "transition", event.target.value)} rows={4} placeholder="Write the transition..." style={{ width: "100%", padding: 12, resize: "vertical" }} /></label>
                </div>
            </section>;
        })}

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}><button type="button" onClick={() => void save()} disabled={saving || sermon.outline.length === 0} style={{ padding: "10px 16px", fontWeight: 600 }}>{saving ? "Saving..." : "Save Sermon Exposition"}</button><button type="button" onClick={() => router.push(`/preaching?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>← Back to Sermon Preparation</button>{message && <span style={{ color: "#047857" }}>{message}</span>}{error && <span style={{ color: "#b91c1c" }}>{error}</span>}</div>
    </div></AppShell>;
}