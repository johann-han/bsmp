"use client";

import { useEffect, useState } from "react";
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

export function SermonPreparationWorkspace() {
    const [studies, setStudies] = useState<readonly StudySession[]>([]);
    const [selectedStudyId, setSelectedStudyId] = useState<string>("");
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
    const [title, setTitle] = useState("");
    const [bigIdea, setBigIdea] = useState("");
    const [purpose, setPurpose] = useState("");
    const [heading, setHeading] = useState("");
    const [truth, setTruth] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const studyRepository = new SupabaseStudyRepository();
    const sermonRepository = new SupabaseExpositorySermonRepository();

    useEffect(() => {
        studyRepository.findAll().then(setStudies).catch((reason: unknown) => {
            setError(reason instanceof Error ? reason.message : "Unable to load studies.");
        });
    }, []);

    async function selectStudy(studyId: string) {
        setSelectedStudyId(studyId);
        setMessage(null);
        setError(null);
        const existing = await sermonRepository.findByStudyId(studyId);
        setSermon(existing ?? null);
        if (existing) {
            setTitle(existing.title.value);
            setBigIdea(existing.bigIdea?.value ?? "");
            setPurpose(existing.purpose?.value ?? "");
        } else {
            const study = studies.find((item) => item.id.toString() === studyId);
            setTitle(study ? study.title.value : "");
            setBigIdea("");
            setPurpose("");
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
        sermon.addOutlinePoint(heading, truth);
        setHeading("");
        setTruth("");
        setSermon(Object.assign(Object.create(Object.getPrototypeOf(sermon)), sermon));
    }

    return (
        <AppShell title="Sermon Preparation">
            <div style={{ display: "grid", gap: 20 }}>
                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
                    <h2>Study Source</h2>
                    <select value={selectedStudyId} onChange={(event) => void selectStudy(event.target.value)} style={{ width: "100%", padding: 10 }}>
                        <option value="">Select a study</option>
                        {studies.map((study) => (
                            <option key={study.id.toString()} value={study.id.toString()}>
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

                {sermon && (
                    <section style={{ display: "grid", gap: 16, border: "1px solid #ddd", borderRadius: 12, padding: 20 }}>
                        <div><strong>Source passage:</strong> {sermon.passage.toString()}</div>
                        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sermon title" style={{ width: "100%", padding: 10 }} />
                        <textarea value={bigIdea} onChange={(event) => setBigIdea(event.target.value)} placeholder="Big Idea" rows={3} style={{ width: "100%", padding: 10 }} />
                        <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Sermon Purpose" rows={3} style={{ width: "100%", padding: 10 }} />
                        <button onClick={() => void saveSermon()} style={{ padding: "10px 16px" }}>Save Sermon Preparation</button>

                        <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
                            <h3>Outline</h3>
                            {sermon.outline.map((point, index) => (
                                <div key={point.id} style={{ marginBottom: 12 }}><strong>{index + 1}. {point.heading}</strong><div>{point.truth}</div></div>
                            ))}
                            <input value={heading} onChange={(event) => setHeading(event.target.value)} placeholder="Outline heading" style={{ width: "100%", padding: 10, marginBottom: 8 }} />
                            <textarea value={truth} onChange={(event) => setTruth(event.target.value)} placeholder="Truth statement" rows={2} style={{ width: "100%", padding: 10, marginBottom: 8 }} />
                            <button onClick={addOutlinePoint} disabled={!heading.trim() || !truth.trim()} style={{ padding: "10px 16px" }}>Add Outline Point</button>
                        </div>
                    </section>
                )}

                {message && <p>{message}</p>}
                {error && <p>{error}</p>}
            </div>
        </AppShell>
    );
}
