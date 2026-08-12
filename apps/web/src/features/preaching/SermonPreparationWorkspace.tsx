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
        resetOutlineSupport();
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

    function addOutlinePoint() {
        if (!sermon) return;
        try {
            sermon.addOutlinePoint(heading, truth, {
                supportingObservationIds,
                supportingInterpretationIds,
                supportingEvidenceIds,
                supportingApplicationIds,
            });
            setHeading("");
            setTruth("");
            resetOutlineSupport();
            setSermon(Object.assign(Object.create(Object.getPrototypeOf(sermon)), sermon));
            void sermonRepository.save(sermon).then(
                () => setMessage("Outline point saved."),
                (reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to save outline point."),
            );
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to add outline point.");
        }
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
                                <h3>Outline</h3>
                                {sermon.outline.map((point, index) => {
                                    const observationTexts = point.supportingObservationIds.map((id) => selectedStudy.observations.find((item) => item.id.value === id)?.statement.value).filter(Boolean);
                                    const interpretationTexts = point.supportingInterpretationIds.map((id) => selectedStudy.interpretations.find((item) => item.id.value === id)?.statement.value).filter(Boolean);
                                    const evidenceTexts = point.supportingEvidenceIds.map((id) => studyEvidence.find((item) => item.id.value === id)).filter(Boolean);
                                    const applicationTexts = point.supportingApplicationIds.map((id) => selectedStudy.applications.find((item) => item.id.value === id)?.principle.value).filter(Boolean);
                                    return (
                                        <div key={point.id} style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
                                            <strong>{index + 1}. {point.heading}</strong>
                                            <div>{point.truth}</div>
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

                                <button onClick={addOutlinePoint} disabled={!heading.trim() || !truth.trim()} style={{ padding: "10px 16px" }}>Add Outline Point</button>
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
