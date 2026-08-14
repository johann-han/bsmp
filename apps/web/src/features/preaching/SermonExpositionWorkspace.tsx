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
};
function emptyDraft(): Draft { return { text: "", explanation: "", illustration: "", application: "", transition: "", textObservationIds: [], meaningInterpretationIds: [] }; }
function workspaceHref(studyId: string, target: string): string {
    const params = new URLSearchParams({ studyId, returnTo: `/preaching/exposition?studyId=${encodeURIComponent(studyId)}` });
    return `/workspace?${params.toString()}#${encodeURIComponent(target)}`;
}
const linkStyle = { color: "#1d4ed8", textDecoration: "none" };
function WorkspaceLink({ study, href, children }: { study: StudySession; href: string; children: React.ReactNode }) {
    return <Link href={href} prefetch style={linkStyle} onMouseEnter={() => prefetchStudyWorkspace(study)} onFocus={() => prefetchStudyWorkspace(study)} onClick={() => cacheStudyForWorkspace(study)}>{children}</Link>;
}
function toggleId(values: string[], id: string): string[] { return values.includes(id) ? values.filter((value) => value !== id) : [...values, id]; }

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
                    text: point.text, explanation: point.explanation, illustration: point.illustration, application: point.application, transition: point.transition,
                    textObservationIds: [...point.textObservationIds], meaningInterpretationIds: [...point.meaningInterpretationIds],
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

    return <AppShell title="Sermon Exposition"><div style={{ display: "grid", gap: 20 }}>
        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Expository Sermon Preparation</div>
            <h2 style={{ margin: "4px 0 8px" }}>{sermon.title.value}</h2>
            <p style={{ margin: "4px 0" }}><strong>Study:</strong> {study.title.value}</p>
            <p style={{ margin: "4px 0" }}><strong>Passage:</strong> {sermon.passage.toString()}</p>
            {sermon.bigIdea && <p style={{ margin: "12px 0 4px" }}><strong>Big Idea:</strong> {sermon.bigIdea.value}</p>}
            <p style={{ margin: "12px 0 0", color: "#6b7280" }}>Map the exact observations to the Text and interpretations to the Meaning of each sermon point.</p>
        </section>

        {sermon.outline.length === 0 ? <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}><strong>No outline points yet.</strong><p>Create at least one outline point before developing the exposition.</p><button type="button" onClick={() => router.push(`/preaching?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>Back to Sermon Preparation</button></section> : sermon.outline.map((point, index) => {
            const observations = point.supportingObservationIds.map((id) => study.observations.find((item) => item.id.value === id)).filter(Boolean);
            const interpretations = point.supportingInterpretationIds.map((id) => study.interpretations.find((item) => item.id.value === id)).filter(Boolean);
            const evidence = point.supportingEvidenceIds.map((id) => studyEvidence.find((item) => item.id.value === id)).filter(Boolean);
            const applications = point.supportingApplicationIds.map((id) => study.applications.find((item) => item.id.value === id)).filter(Boolean);
            const draft = drafts[point.id] ?? emptyDraft();
            return <section key={point.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div><div style={{ fontSize: 13, color: "#6b7280" }}>Outline Point {index + 1}</div><h2 style={{ margin: "4px 0" }}>{point.heading}</h2><p style={{ marginTop: 0 }}><strong>Truth:</strong> {point.truth}</p></div>
                    <WorkspaceLink study={study} href={workspaceHref(studyId, `observation-${point.textObservationIds[0] ?? point.supportingObservationIds[0] ?? ""}`)}>Study Workspace</WorkspaceLink>
                </div>

                <details open={index === 0} style={{ marginTop: 16, border: "1px solid #e5e7eb", borderRadius: 10, background: "#f8fafc" }}>
                    <summary style={{ cursor: "pointer", padding: "14px 16px", fontWeight: 700, listStylePosition: "inside" }}>Study Support</summary>
                    <div style={{ padding: "0 16px 16px", display: "grid", gap: 16 }}>
                        <div style={{ borderLeft: "3px solid #93c5fd", paddingLeft: 12 }}>
                            <strong>Text foundation</strong>
                            <div style={{ color: "#6b7280", fontSize: 13, margin: "3px 0 7px" }}>Choose the observations that directly establish what the Text section says.</div>
                            {study.observations.length === 0 ? <p style={{ color: "#6b7280", marginBottom: 0 }}>No observations are available.</p> : study.observations.map((observation) => <label key={observation.id.value} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 7 }}><input type="checkbox" checked={draft.textObservationIds.includes(observation.id.value)} onChange={() => updateDraft(point.id, "textObservationIds", toggleId(draft.textObservationIds, observation.id.value))} /><span><WorkspaceLink study={study} href={workspaceHref(studyId, `observation-${observation.id.value}`)}>{observation.verseReference.value.toString()}</WorkspaceLink> — {observation.statement.value}</span></label>)}
                        </div>
                        <div style={{ borderLeft: "3px solid #a78bfa", paddingLeft: 12 }}>
                            <strong>Meaning foundation</strong>
                            <div style={{ color: "#6b7280", fontSize: 13, margin: "3px 0 7px" }}>Choose the interpretations that directly support the Meaning section.</div>
                            {study.interpretations.length === 0 ? <p style={{ color: "#6b7280", marginBottom: 0 }}>No interpretations are available.</p> : study.interpretations.map((interpretation) => <label key={interpretation.id.value} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 7 }}><input type="checkbox" checked={draft.meaningInterpretationIds.includes(interpretation.id.value)} onChange={() => updateDraft(point.id, "meaningInterpretationIds", toggleId(draft.meaningInterpretationIds, interpretation.id.value))} /><span><WorkspaceLink study={study} href={workspaceHref(studyId, `interpretation-${interpretation.id.value}`)}>{interpretation.statement.value}</WorkspaceLink></span></label>)}
                        </div>
                        {evidence.length > 0 && <div style={{ borderLeft: "3px solid #c4b5fd", paddingLeft: 12 }}><strong>Exegetical support</strong><div style={{ color: "#6b7280", fontSize: 13, margin: "3px 0 7px" }}>Evidence already attached to the point remains available here.</div>{evidence.map((item) => <div key={item!.id.value} style={{ marginTop: 6 }}><WorkspaceLink study={study} href={workspaceHref(studyId, `evidence-${item!.id.value}`)}>{item!.type.value}</WorkspaceLink> — {item!.description.value}</div>)}</div>}
                        {applications.length > 0 && <div style={{ borderLeft: "3px solid #86efac", paddingLeft: 12 }}><strong>Response implications</strong><div style={{ color: "#6b7280", fontSize: 13, margin: "3px 0 7px" }}>Existing applications remain available to shape the Response section.</div>{applications.map((application) => <div key={application!.id.value} style={{ marginTop: 6 }}><WorkspaceLink study={study} href={workspaceHref(studyId, `application-${application!.id.value}`)}><strong>Principle:</strong> {application!.principle.value}</WorkspaceLink><div><strong>Personal:</strong> {application!.personal.value}</div><div><strong>Ministry:</strong> {application!.ministry.value}</div><div><strong>Action:</strong> {application!.action.value}</div></div>)}</div>}
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
