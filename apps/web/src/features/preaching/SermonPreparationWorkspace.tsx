"use client";

import { useEffect, useState } from "react";
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
import { SermonStudySourcePanel } from "./SermonStudySourcePanel";

export function SermonPreparationWorkspace() {
    const router = useRouter();
    const [studies, setStudies] = useState<readonly StudySession[]>([]);
    const [selectedStudyId, setSelectedStudyId] = useState<string>("");
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

    const studyRepository = new SupabaseStudyRepository();
    const sermonRepository = new SupabaseExpositorySermonRepository();

    useEffect(() => {
        let cancelled = false;

        async function initialize() {
            const { data, error: authError } = await supabase.auth.getUser();

            if (authError || !data.user) {
                router.replace(`/login?next=${encodeURIComponent("/preaching")}`);
                return;
            }

            try {
                const nextStudies = await studyRepository.findAll();
                if (!cancelled) setStudies(nextStudies);
            } catch (reason: unknown) {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load studies.");
            }
        }

        void initialize();

        return () => {
            cancelled = true;
        };
    }, [router]);

    async function selectStudy(studyId: string) {
        setSelectedStudyId(studyId);
        setMessage(null);
        setError(null);
        resetOutlineEditor();
        if (!studyId) {
            setSermon(null);
            setTitle("");
            setBigIdea("");
            setPurpose("");
            return;
        }

        try {
            const existing = await sermonRepository.findByStudyId(studyId);
            setSermon(existing ?? null);
            if (existing) {
                setTitle(existing.title.value);
                setBigIdea(existing.bigIdea?.value ?? "");
                setPurpose(existing.purpose?.value ?? "");
            } else {
                const study = studies.find((item) => item.id.value === studyId);
                setTitle(study ? study.title.value : "");
                setBigIdea("");
                setPurpose("");
            }
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to load sermon preparation.");
        }
    }

    async function createSermon() {
        if (!selectedStudyId) return;
        setMessage(null);
        setError(null);
        try {
            const creator = new CreateAndSaveExpositorySermonFromStudy(studyRepository, sermonRepository);
            const created = await creator.execute(StudyId.from(selectedStudyId), title);
            setSermon(created);
            setMessage("Sermon preparation created.");
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to create sermon preparation.");
        }
    }

    async function saveSermon() {
        if (!sermon) return;
        setMessage(null);
        setError(null);
        try {
            sermon.reviseTitle(SermonTitle.from(title));
            sermon.defineBigIdea(SermonBigIdea.from(bigIdea));
            sermon.definePurpose(SermonPurpose.from(purpose));
            await sermonRepository.save(sermon);
            setMessage("Sermon preparation saved.");
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to save sermon preparation.");
        }
    }

    async function reloadSermon() {
        if (!selectedStudyId) return;
        const persisted = await sermonRepository.findByStudyId(selectedStudyId);
        if (persisted) setSermon(persisted);
    }

    async function addOutlinePoint() {
        if (!sermon || !selectedStudyId) return;
        setMessage(null);
        setError(null);

        try {
            sermon.addOutlinePoint(heading, truth, {
                supportingObservationIds,
                supportingInterpretationIds,
                supportingEvidenceIds,
                supportingApplicationIds,
            });

            await sermonRepository.save(sermon);
            await reloadSermon();
            resetOutlineEditor();
            setMessage("Outline point saved.");
        } catch (reason: unknown) {
            try {
                await reloadSermon();
            } catch {
                // Preserve the original save error when recovery also fails.
            }

            const details = reason instanceof Error ? reason.message : String(reason);
            setError(`Unable to save outline point: ${details}`);
        }
    }

    function editOutlinePoint(id: string) {
        if (!sermon) return;
        const point = sermon.outline.find((item) => item.id === id);
        if (!point) return;

        setEditingOutlinePointId(point.id);
        setHeading(point.heading);
        setTruth(point.truth);
        setSupportingObservationIds([...point.supportingObservationIds]);
        setSupportingInterpretationIds([...point.supportingInterpretationIds]);
        setSupportingEvidenceIds([...point.supportingEvidenceIds]);
        setSupportingApplicationIds([...point.supportingApplicationIds]);
        setMessage(null);
        setError(null);
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }

    async function saveEditedOutlinePoint() {
        if (!sermon || !selectedStudyId || !editingOutlinePointId) return;
        setMessage(null);
        setError(null);

        try {
            sermon.updateOutlinePoint(editingOutlinePointId, heading, truth, {
                supportingObservationIds,
                supportingInterpretationIds,
                supportingEvidenceIds,
                supportingApplicationIds,
            });
            await sermonRepository.save(sermon);
            await reloadSermon();
            resetOutlineEditor();
            setMessage("Outline point updated.");
        } catch (reason: unknown) {
            try {
                await reloadSermon();
            } catch {
                // Preserve the original save error when recovery also fails.
            }
            const details = reason instanceof Error ? reason.message : String(reason);
            setError(`Unable to update outline point: ${details}`);
        }
    }

    async function deleteOutlinePoint(id: string) {
        if (!sermon || !selectedStudyId) return;
        setMessage(null);
        setError(null);

        if (!window.confirm("Delete this outline point?")) return;

        try {
            sermon.removeOutlinePoint(id);
            await sermonRepository.save(sermon);
            await reloadSermon();
            if (editingOutlinePointId === id) resetOutlineEditor();
            setMessage("Outline point deleted.");
        } catch (reason: unknown) {
            try {
                await reloadSermon();
            } catch {
                // Preserve the original save error when recovery also fails.
            }
            const details = reason instanceof Error ? reason.message : String(reason);
            setError(`Unable to delete outline point: ${details}`);
        }
    }

    async function moveOutlinePoint(id: string, direction: "up" | "down") {
        if (!sermon || !selectedStudyId) return;
        setMessage(null);
        setError(null);

        try {
            sermon.moveOutlinePoint(id, direction);
            await sermonRepository.save(sermon);
            await reloadSermon();
            setMessage("Outline order saved.");
        } catch (reason: unknown) {
            try {
                await reloadSermon();
            } catch {
                // Preserve the original save error when recovery also fails.
            }
            const details = reason instanceof Error ? reason.message : String(reason);
            setError(`Unable to move outline point: ${details}`);
        }
    }

    function resetOutlineEditor() {
        setEditingOutlinePointId(null);
        setHeading("");
        setTruth("");
        resetOutlineSupport();
    }

    function resetOutlineSupport() {
        setSupportingObservationIds([]);
        setSupportingInterpretationIds([]);
        setSupportingEvidenceIds([]);
        setSupportingApplicationIds([]);
    }

    function toggleValue(current: string[], value: string, setter: (values: string[]) => void) {
        setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
    }

    const selectedStudy = studies.find((study) => study.id.value === selectedStudyId) ?? null;
    const studyEvidence = selectedStudy?.interpretations.flatMap((interpretation) => interpretation.evidence) ?? [];

    return (
        <AppShell title="Sermon Preparation">
            <div style={{ display: "grid", gap: 20 }}>
                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
                    <h2>Study Source</h2>
                    <select value={selectedStudyId} onChange={(event) => void selectStudy(event.target.value)} style={{ width: "100%", padding: 10 }}>
                        <option value="">Select a study</option>
                        {studies.map((study) => (
                            <option key={study.id.value} value={study.id.value}>
                                {study.title.value} — {study.passage.toString()}
                            </option>
                        ))}
                    </select>
                </section>

                {selectedStudyId && !sermon && (
                    <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
                        <h2>Create Sermon Preparation</h2>
                        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sermon title" style={{ width: "100%", padding: 10, marginBottom: 10 }} />
                        <button onClick={() => void createSermon()} disabled={!title.trim()} style={{ padding: "10px 16px" }}>Create</button>
                    </section>
                )}

                {sermon && selectedStudy && (
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 0.9fr) minmax(0, 1.1fr)", gap: 20, alignItems: "start" }}>
                        <SermonStudySourcePanel study={selectedStudy} />

                        <section style={{ display: "grid", gap: 16, border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
                            <div><strong>Source passage:</strong> {sermon.passage.toString()}</div>
                            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sermon title" style={{ width: "100%", padding: 10 }} />
                            <textarea value={bigIdea} onChange={(event) => setBigIdea(event.target.value)} placeholder="Big Idea" rows={3} style={{ width: "100%", padding: 10 }} />
                            <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Sermon Purpose" rows={3} style={{ width: "100%", padding: 10 }} />
                            <button onClick={() => void saveSermon()} style={{ padding: "10px 16px" }}>Save Sermon Preparation</button>

                            <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                    <h3>Outline</h3>
                                    {editingOutlinePointId && <button type="button" onClick={resetOutlineEditor}>Cancel Edit</button>}
                                </div>

                                {sermon.outline.map((point, index) => {
                                    const observationTexts = point.supportingObservationIds.map((id) => selectedStudy.observations.find((item) => item.id.value === id)?.statement.value).filter(Boolean);
                                    const interpretationTexts = point.supportingInterpretationIds.map((id) => selectedStudy.interpretations.find((item) => item.id.value === id)?.statement.value).filter(Boolean);
                                    const evidenceTexts = point.supportingEvidenceIds.map((id) => studyEvidence.find((item) => item.id.value === id)).filter(Boolean);
                                    const applicationTexts = point.supportingApplicationIds.map((id) => selectedStudy.applications.find((item) => item.id.value === id)?.principle.value).filter(Boolean);
                                    return (
                                        <div key={point.id} style={{ marginBottom: 16, border: editingOutlinePointId === point.id ? "2px solid #333" : "1px solid #eee", borderRadius: 8, padding: 12 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                                                <div style={{ flex: 1 }}>
                                                    <strong>{index + 1}. {point.heading}</strong>
                                                    <div>{point.truth}</div>
                                                </div>
                                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                    <button type="button" onClick={() => editOutlinePoint(point.id)}>Edit</button>
                                                    <button type="button" onClick={() => void deleteOutlinePoint(point.id)}>Delete</button>
                                                    <button type="button" onClick={() => void moveOutlinePoint(point.id, "up")} disabled={index === 0}>↑</button>
                                                    <button type="button" onClick={() => void moveOutlinePoint(point.id, "down")} disabled={index === sermon.outline.length - 1}>↓</button>
                                                </div>
                                            </div>
                                            {(observationTexts.length + interpretationTexts.length + evidenceTexts.length + applicationTexts.length) > 0 && (
                                                <div style={{ marginTop: 10, fontSize: 13, color: "#4b5563" }}>
                                                    <strong>Study support</strong>
                                                    {observationTexts.length > 0 && <div>Observations: {observationTexts.join(" • ")}</div>}
                                                    {interpretationTexts.length > 0 && <div>Interpretations: {interpretationTexts.join(" • ")}</div>}
                                                    {evidenceTexts.length > 0 && <div>Evidence: {evidenceTexts.map((item) => `${item?.type.value}: ${item?.description.value}`).join(" • ")}</div>}
                                                    {applicationTexts.length > 0 && <div>Applications: {applicationTexts.join(" • ")}</div>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <input value={heading} onChange={(event) => setHeading(event.target.value)} placeholder="Outline heading" style={{ width: "100%", padding: 10, marginBottom: 8 }} />
                                <textarea value={truth} onChange={(event) => setTruth(event.target.value)} placeholder="Truth statement" rows={2} style={{ width: "100%", padding: 10, marginBottom: 12 }} />

                                <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                    <strong>Supporting Study Material</strong>

                                    {selectedStudy.observations.length > 0 && (
                                        <div style={{ marginTop: 10 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>Observations</div>
                                            {selectedStudy.observations.map((observation) => (
                                                <label key={observation.id.value} style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                                    <input type="checkbox" checked={supportingObservationIds.includes(observation.id.value)} onChange={() => toggleValue(supportingObservationIds, observation.id.value, setSupportingObservationIds)} />
                                                    <span>{observation.verseReference.value.toString()} — {observation.statement.value}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {selectedStudy.interpretations.length > 0 && (
                                        <div style={{ marginTop: 10 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>Interpretations</div>
                                            {selectedStudy.interpretations.map((interpretation) => (
                                                <label key={interpretation.id.value} style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                                    <input type="checkbox" checked={supportingInterpretationIds.includes(interpretation.id.value)} onChange={() => toggleValue(supportingInterpretationIds, interpretation.id.value, setSupportingInterpretationIds)} />
                                                    <span>{interpretation.statement.value}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {studyEvidence.length > 0 && (
                                        <div style={{ marginTop: 10 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>Evidence</div>
                                            {studyEvidence.map((evidence) => (
                                                <label key={evidence.id.value} style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                                    <input type="checkbox" checked={supportingEvidenceIds.includes(evidence.id.value)} onChange={() => toggleValue(supportingEvidenceIds, evidence.id.value, setSupportingEvidenceIds)} />
                                                    <span>{evidence.type.value}: {evidence.description.value}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {selectedStudy.applications.length > 0 && (
                                        <div style={{ marginTop: 10 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>Applications</div>
                                            {selectedStudy.applications.map((application) => (
                                                <label key={application.id.value} style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                                    <input type="checkbox" checked={supportingApplicationIds.includes(application.id.value)} onChange={() => toggleValue(supportingApplicationIds, application.id.value, setSupportingApplicationIds)} />
                                                    <span>{application.principle.value}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => void (editingOutlinePointId ? saveEditedOutlinePoint() : addOutlinePoint())} disabled={!heading.trim() || !truth.trim()} style={{ padding: "10px 16px" }}>
                                    {editingOutlinePointId ? "Save Outline Point" : "Add Outline Point"}
                                </button>
                            </div>
                        </section>
                    </div>
                )}

                {message && <p>{message}</p>}
                {error && <p>{error}</p>}
            </div>
        </AppShell>
    );
}
