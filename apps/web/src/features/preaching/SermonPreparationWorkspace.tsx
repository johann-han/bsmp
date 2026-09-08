"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { StudySession } from "@bsmp/study";
import { StudyId } from "@bsmp/study";
import { AppShell } from "@repo/ui";
import {
    CreateAndSaveExpositorySermonFromStudy,
    ExpositorySermon,
    SermonBigIdea,
    SermonPurpose,
    SermonTitle,
} from "@bsmp/preaching";

import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";
import { supabase } from "../../lib/supabase";
import { cacheStudyForWorkspace } from "../../lib/studyWorkspaceNavigationCache";
import { SermonStudySourcePanel } from "./SermonStudySourcePanel";

function verseReferenceText(reference: StudySession["observations"][number]["target"]["verseReference"]): string {
    return reference.toString();
}

function workspaceHref(studyId: string, target: string): string {
    const params = new URLSearchParams({
        studyId,
        returnTo: `/preaching?studyId=${encodeURIComponent(studyId)}`,
    });
    return `/workspace?${params.toString()}#${encodeURIComponent(target)}`;
}

const studySupportLinkStyle = { color: "#1d4ed8", textDecoration: "none" } as const;

function formatPersistenceError(reason: unknown): string {
    if (reason instanceof Error) return reason.message;
    if (typeof reason === "string") return reason;
    if (reason && typeof reason === "object") {
        const value = reason as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
        const parts = [value.message, value.details, value.hint, value.code].filter((item): item is string => typeof item === "string" && item.trim().length > 0);
        if (parts.length > 0) return parts.join(" — ");
        try { return JSON.stringify(reason); } catch { return "An unknown persistence error occurred."; }
    }
    return String(reason);
}

const studyRepository = new SupabaseStudyRepository();
const sermonRepository = new SupabaseExpositorySermonRepository();

export function SermonPreparationWorkspace() {
    const router = useRouter();
    const [studies, setStudies] = useState<readonly StudySession[]>([]);
    const [selectedStudyId, setSelectedStudyId] = useState("");
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
    const [title, setTitle] = useState("");
    const [bigIdea, setBigIdea] = useState("");
    const [purpose, setPurpose] = useState("");
    const [heading, setHeading] = useState("");
    const [truth, setTruth] = useState("");
    const [editingOutlinePointId, setEditingOutlinePointId] = useState<string | null>(null);
    const [supportingObservationIds, setSupportingObservationIds] = useState<string[]>([]);
    const [supportingInterpretationIds, setSupportingInterpretationIds] = useState<string[]>([]);
    const [supportingEvidenceIds, setSupportingEvidenceIds] = useState<string[]>([]);
    const [supportingApplicationIds, setSupportingApplicationIds] = useState<string[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    function resetOutlineSupport() { setSupportingObservationIds([]); setSupportingInterpretationIds([]); setSupportingEvidenceIds([]); setSupportingApplicationIds([]); }
    function resetOutlineEditor() { setEditingOutlinePointId(null); setHeading(""); setTruth(""); resetOutlineSupport(); }

    const loadStudy = useCallback(async (studyId: string, availableStudies: readonly StudySession[]) => {
        setSelectedStudyId(studyId); setMessage(null); setError(null); setEditingOutlinePointId(null); setHeading(""); setTruth(""); resetOutlineSupport();
        if (typeof window !== "undefined") {
            if (studyId) window.localStorage.setItem("bsmp:last-study-id", studyId); else window.localStorage.removeItem("bsmp:last-study-id");
        }
        if (!studyId) { setSermon(null); setTitle(""); setBigIdea(""); setPurpose(""); return; }
        try {
            const study = availableStudies.find((item) => item.id.value === studyId);
            const existing = await sermonRepository.findByStudyId(studyId);
            setSermon(existing ?? null);
            if (existing) { setTitle(existing.title.value); setBigIdea(existing.bigIdea?.value ?? ""); setPurpose(existing.purpose?.value ?? ""); }
            else { setTitle(study?.title.value ?? ""); setBigIdea(""); setPurpose(""); }
        } catch (reason: unknown) { setError(formatPersistenceError(reason)); }
    }, []);

    useEffect(() => {
        let cancelled = false;
        async function initialize() {
            const { data, error: authError } = await supabase.auth.getUser();
            if (authError || !data.user) { router.replace(`/login?next=${encodeURIComponent("/preaching")}`); return; }
            try {
                const nextStudies = await studyRepository.findAll();
                if (cancelled) return;
                setStudies(nextStudies);
                const requestedStudyId = new URLSearchParams(window.location.search).get("studyId") ?? window.localStorage.getItem("bsmp:last-study-id") ?? "";
                if (requestedStudyId && nextStudies.some((study) => study.id.value === requestedStudyId)) await loadStudy(requestedStudyId, nextStudies);
                else setSelectedStudyId("");
            } catch (reason: unknown) { if (!cancelled) setError(formatPersistenceError(reason) || "Unable to load studies."); }
        }
        void initialize();
        return () => { cancelled = true; };
    }, [router, loadStudy]);

    function selectStudy(studyId: string) { void loadStudy(studyId, studies); }

    async function createSermon() {
        if (!selectedStudyId) return; setMessage(null); setError(null);
        try { const creator = new CreateAndSaveExpositorySermonFromStudy(studyRepository, sermonRepository); const created = await creator.execute(StudyId.from(selectedStudyId), title); setSermon(created); setMessage("Sermon preparation created."); }
        catch (reason: unknown) { setError(`Unable to create sermon preparation: ${formatPersistenceError(reason)}`); }
    }
    async function saveSermon() {
        if (!sermon) return; setMessage(null); setError(null);
        try { sermon.reviseTitle(SermonTitle.from(title)); sermon.defineBigIdea(SermonBigIdea.from(bigIdea)); sermon.definePurpose(SermonPurpose.from(purpose)); await sermonRepository.save(sermon); setMessage("Sermon preparation saved."); }
        catch (reason: unknown) { setError(`Unable to save sermon preparation: ${formatPersistenceError(reason)}`); }
    }
    async function reloadSermon() { if (!selectedStudyId) return; const persisted = await sermonRepository.findByStudyId(selectedStudyId); if (persisted) setSermon(persisted); }
    async function addOutlinePoint() {
        if (!sermon || !selectedStudyId) return; setMessage(null); setError(null);
        try { sermon.addOutlinePoint(heading, truth, { supportingObservationIds, supportingInterpretationIds, supportingEvidenceIds, supportingApplicationIds }); await sermonRepository.save(sermon); await reloadSermon(); resetOutlineEditor(); setMessage("Outline point saved."); }
        catch (reason: unknown) { try { await reloadSermon(); } catch { /* preserve original error */ } setError(`Unable to save outline point: ${formatPersistenceError(reason)}`); }
    }
    function editOutlinePoint(id: string) {
        if (!sermon) return; const point = sermon.outline.find((item) => item.id === id); if (!point) return;
        setEditingOutlinePointId(point.id); setHeading(point.heading); setTruth(point.truth); setSupportingObservationIds([...point.supportingObservationIds]); setSupportingInterpretationIds([...point.supportingInterpretationIds]); setSupportingEvidenceIds([...point.supportingEvidenceIds]); setSupportingApplicationIds([...point.supportingApplicationIds]); setMessage(null); setError(null); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
    async function saveEditedOutlinePoint() {
        if (!sermon || !selectedStudyId || !editingOutlinePointId) return; setMessage(null); setError(null);
        try { sermon.updateOutlinePoint(editingOutlinePointId, heading, truth, { supportingObservationIds, supportingInterpretationIds, supportingEvidenceIds, supportingApplicationIds }); await sermonRepository.save(sermon); await reloadSermon(); resetOutlineEditor(); setMessage("Outline point updated."); }
        catch (reason: unknown) { try { await reloadSermon(); } catch { /* preserve original error */ } setError(`Unable to update outline point: ${formatPersistenceError(reason)}`); }
    }
    async function deleteOutlinePoint(id: string) {
        if (!sermon || !selectedStudyId || !window.confirm("Delete this outline point?")) return; setMessage(null); setError(null);
        try { sermon.removeOutlinePoint(id); await sermonRepository.save(sermon); await reloadSermon(); if (editingOutlinePointId === id) resetOutlineEditor(); setMessage("Outline point deleted."); }
        catch (reason: unknown) { try { await reloadSermon(); } catch { /* preserve original error */ } setError(`Unable to delete outline point: ${formatPersistenceError(reason)}`); }
    }
    async function moveOutlinePoint(id: string, direction: "up" | "down") {
        if (!sermon || !selectedStudyId) return; setMessage(null); setError(null);
        try { sermon.moveOutlinePoint(id, direction); await sermonRepository.save(sermon); await reloadSermon(); setMessage("Outline order saved."); }
        catch (reason: unknown) { try { await reloadSermon(); } catch { /* preserve original error */ } setError(`Unable to move outline point: ${formatPersistenceError(reason)}`); }
    }
    function toggleValue(current: string[], value: string, setter: (values: string[]) => void) { setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }

    const selectedStudy = studies.find((study) => study.id.value === selectedStudyId) ?? null;
    const studyEvidence = selectedStudy?.interpretations.flatMap((interpretation) => interpretation.evidence) ?? [];
    const mobileStyles = `
      @media (max-width: 700px) {
        .bsmp-sermon-prep-workspace { gap: 14px !important; min-width: 0; }
        .bsmp-sermon-prep-workspace .bsmp-sermon-prep-card { width: 100% !important; max-width: 100% !important; min-width: 0 !important; box-sizing: border-box; padding: 16px !important; overflow: hidden; }
        .bsmp-sermon-prep-editor { grid-template-columns: minmax(0, 1fr) !important; gap: 14px !important; min-width: 0; }
        .bsmp-sermon-prep-source { min-width: 0; width: 100%; }
        .bsmp-sermon-prep-authoring { min-width: 0; }
        .bsmp-sermon-prep-workspace input, .bsmp-sermon-prep-workspace textarea, .bsmp-sermon-prep-workspace select { max-width: 100%; min-width: 0; box-sizing: border-box; }
        .bsmp-sermon-prep-authoring input, .bsmp-sermon-prep-authoring textarea { width: 100% !important; }
        .bsmp-sermon-outline-header { flex-direction: column !important; align-items: stretch !important; }
        .bsmp-sermon-outline-actions { width: 100%; justify-content: stretch !important; }
        .bsmp-sermon-outline-actions button { flex: 1 1 70px; min-height: 42px; }
        .bsmp-sermon-outline-point { overflow: hidden; }
        .bsmp-sermon-outline-point a { overflow-wrap: anywhere; word-break: break-word; }
        .bsmp-sermon-support { overflow: hidden; }
        .bsmp-sermon-support label { display: flex !important; gap: 8px; align-items: flex-start !important; line-height: 1.45; min-width: 0; }
        .bsmp-sermon-support label input[type="checkbox"] { width: 20px !important; height: 20px; flex: 0 0 20px; margin-top: 2px; }
        .bsmp-sermon-support label:not(:has(input)) { display: block !important; }
        .bsmp-sermon-prep-authoring > div[style*="display: flex"] { flex-wrap: wrap !important; min-width: 0; }
        .bsmp-sermon-prep-authoring button { min-height: 42px; white-space: normal; max-width: 100%; }
      }
    `;

    return (
        <AppShell title="Sermon Preparation">
            <style>{mobileStyles}</style>
            <div className="bsmp-sermon-prep-workspace" style={{ display: "grid", gap: 20 }}>
                <section className="bsmp-sermon-prep-card" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
                    <h2>Study Source</h2>
                    <select value={selectedStudyId} onChange={(event) => selectStudy(event.target.value)} style={{ width: "100%", padding: 10 }}>
                        <option value="">Select a study</option>
                        {studies.map((study) => <option key={study.id.value} value={study.id.value}>{study.title.value} — {study.passage.toString()}</option>)}
                    </select>
                </section>

                {selectedStudyId && !sermon && <section className="bsmp-sermon-prep-card" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20 }}><h2>Create Sermon Preparation</h2><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sermon title" style={{ width: "100%", padding: 10, marginBottom: 10 }} /><button onClick={() => void createSermon()} disabled={!title.trim()} style={{ padding: "10px 16px" }}>Create</button></section>}

                {sermon && selectedStudy && (
                    <div className="bsmp-sermon-prep-editor" style={{ display: "grid", gridTemplateColumns: "minmax(320px, 0.9fr) minmax(0, 1.1fr)", gap: 20, alignItems: "start" }}>
                        <div className="bsmp-sermon-prep-source"><SermonStudySourcePanel study={selectedStudy} /></div>
                        <section className="bsmp-sermon-prep-card bsmp-sermon-prep-authoring" style={{ display: "grid", gap: 16, border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
                            <div><strong>Source passage:</strong> {sermon.passage.toString()}</div>
                            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sermon title" style={{ width: "100%", padding: 10 }} />
                            <textarea value={bigIdea} onChange={(event) => setBigIdea(event.target.value)} placeholder="Big Idea" rows={3} style={{ width: "100%", padding: 10 }} />
                            <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Sermon Purpose" rows={3} style={{ width: "100%", padding: 10 }} />
                            <button onClick={() => void saveSermon()} style={{ padding: "10px 16px" }}>Save Sermon Preparation</button>
                            <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><h3>Outline</h3>{editingOutlinePointId && <button type="button" onClick={resetOutlineEditor}>Cancel Edit</button>}</div>
                                {sermon.outline.map((point, index) => {
                                    const observations = point.supportingObservationIds.map((id) => selectedStudy.observations.find((item) => item.id.value === id)).filter((item): item is StudySession["observations"][number] => Boolean(item));
                                    const interpretations = point.supportingInterpretationIds.map((id) => selectedStudy.interpretations.find((item) => item.id.value === id)).filter((item): item is StudySession["interpretations"][number] => Boolean(item));
                                    const evidence = point.supportingEvidenceIds.map((id) => studyEvidence.find((item) => item.id.value === id)).filter((item): item is NonNullable<typeof studyEvidence[number]> => Boolean(item));
                                    const applications = point.supportingApplicationIds.map((id) => selectedStudy.applications.find((item) => item.id.value === id)).filter((item): item is StudySession["applications"][number] => Boolean(item));
                                    const hasStudySupport = observations.length + interpretations.length + evidence.length + applications.length > 0;
                                    return <div key={point.id} className="bsmp-sermon-outline-point" style={{ marginBottom: 16, border: editingOutlinePointId === point.id ? "2px solid #333" : "1px solid #eee", borderRadius: 8, padding: 12 }}><div className="bsmp-sermon-outline-header" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}><div style={{ flex: 1, minWidth: 0 }}><strong>{index + 1}. {point.heading}</strong><div>{point.truth}</div></div><div className="bsmp-sermon-outline-actions" style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}><button type="button" onClick={() => editOutlinePoint(point.id)}>Edit</button><button type="button" onClick={() => void deleteOutlinePoint(point.id)}>Delete</button><button type="button" onClick={() => void moveOutlinePoint(point.id, "up")} disabled={index === 0}>↑</button><button type="button" onClick={() => void moveOutlinePoint(point.id, "down")} disabled={index === sermon.outline.length - 1}>↓</button></div></div>{hasStudySupport && <div style={{ marginTop: 10, fontSize: 13, color: "#4b5563" }}><strong>Study support</strong>{observations.length > 0 && <div style={{ marginTop: 4 }}><span>Observations: </span>{observations.map((observation, itemIndex) => <span key={observation.id.value}>{itemIndex > 0 && " • "}<a href={workspaceHref(selectedStudy.id.value, `observation-${observation.id.value}`)} style={studySupportLinkStyle} onClick={() => cacheStudyForWorkspace(selectedStudy)}>{verseReferenceText(observation.target.verseReference)} — {observation.statement.value}</a></span>)}</div>}{interpretations.length > 0 && <div style={{ marginTop: 4 }}><span>Interpretations: </span>{interpretations.map((interpretation, itemIndex) => <span key={interpretation.id.value}>{itemIndex > 0 && " • "}<a href={workspaceHref(selectedStudy.id.value, `interpretation-${interpretation.id.value}`)} style={studySupportLinkStyle} onClick={() => cacheStudyForWorkspace(selectedStudy)}>{interpretation.statement.value}</a></span>)}</div>}{evidence.length > 0 && <div style={{ marginTop: 4 }}><span>Evidence: </span>{evidence.map((item, itemIndex) => <span key={item.id.value}>{itemIndex > 0 && " • "}<a href={workspaceHref(selectedStudy.id.value, `evidence-${item.id.value}`)} style={studySupportLinkStyle} onClick={() => cacheStudyForWorkspace(selectedStudy)}>{item.type.value}: {item.description.value}</a></span>)}</div>}{applications.length > 0 && <div style={{ marginTop: 4 }}><span>Applications: </span>{applications.map((application, itemIndex) => <span key={application.id.value}>{itemIndex > 0 && " • "}<a href={workspaceHref(selectedStudy.id.value, `application-${application.id.value}`)} style={studySupportLinkStyle} onClick={() => cacheStudyForWorkspace(selectedStudy)}>{application.principle.value}</a></span>)}</div>}</div>}</div>;
                                })}
                                <input value={heading} onChange={(event) => setHeading(event.target.value)} placeholder="Outline heading" style={{ width: "100%", padding: 10, marginBottom: 8 }} />
                                <textarea value={truth} onChange={(event) => setTruth(event.target.value)} placeholder="Truth statement" rows={2} style={{ width: "100%", padding: 10, marginBottom: 12 }} />
                                <div className="bsmp-sermon-support" style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 12 }}><strong>Supporting Study Material</strong>{selectedStudy.observations.length > 0 && <div style={{ marginTop: 10 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Observations</div>{selectedStudy.observations.map((observation) => <label key={observation.id.value}><input type="checkbox" checked={supportingObservationIds.includes(observation.id.value)} onChange={() => toggleValue(supportingObservationIds, observation.id.value, setSupportingObservationIds)} /> {verseReferenceText(observation.target.verseReference)} — {observation.statement.value}</label>)}</div>}{selectedStudy.interpretations.length > 0 && <div style={{ marginTop: 10 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Interpretations</div>{selectedStudy.interpretations.map((interpretation) => <label key={interpretation.id.value}><input type="checkbox" checked={supportingInterpretationIds.includes(interpretation.id.value)} onChange={() => toggleValue(supportingInterpretationIds, interpretation.id.value, setSupportingInterpretationIds)} /> {interpretation.statement.value}</label>)}</div>}{studyEvidence.length > 0 && <div style={{ marginTop: 10 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Evidence</div>{studyEvidence.map((evidence) => <label key={evidence.id.value}><input type="checkbox" checked={supportingEvidenceIds.includes(evidence.id.value)} onChange={() => toggleValue(supportingEvidenceIds, evidence.id.value, setSupportingEvidenceIds)} /> {evidence.type.value}: {evidence.description.value}</label>)}</div>}{selectedStudy.applications.length > 0 && <div style={{ marginTop: 10 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Applications</div>{selectedStudy.applications.map((application) => <label key={application.id.value}><input type="checkbox" checked={supportingApplicationIds.includes(application.id.value)} onChange={() => toggleValue(supportingApplicationIds, application.id.value, setSupportingApplicationIds)} /> {application.principle.value}</label>)}</div>}</div>
                                {editingOutlinePointId ? <button type="button" onClick={() => void saveEditedOutlinePoint()} disabled={!heading.trim() || !truth.trim()} style={{ padding: "10px 16px" }}>Save Outline Changes</button> : <button type="button" onClick={() => void addOutlinePoint()} disabled={!heading.trim() || !truth.trim()} style={{ padding: "10px 16px" }}>Add Outline Point</button>}
                            </div>
                        </section>
                    </div>
                )}
                {message && <p style={{ color: "green" }}>{message}</p>}
                {error && <p role="alert" style={{ color: "red" }}>{error}</p>}
            </div>
        </AppShell>
    );
}