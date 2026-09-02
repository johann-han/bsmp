"use client";

import { useEffect, useMemo, useState } from "react";

import type { ObservationViewModel } from "@bsmp/study";
import {
    GetNextObservationQuestion,
    InMemoryObservationQuestionRepository,
} from "@bsmp/inductive";

import { supabase } from "../../lib/supabase";

const questionRepository = new InMemoryObservationQuestionRepository();
const nextQuestionQuery = new GetNextObservationQuestion(questionRepository);

interface ObservationMentorPanelProps {
    readonly studyId: string;
    readonly passageReference: string;
    readonly passageText: string;
    readonly observations: readonly ObservationViewModel[];
}

interface MentorResponse {
    readonly coaching?: unknown;
    readonly error?: unknown;
}

function storageKey(studyId: string): string {
    return `bsmp:observation-mentor:${studyId}`;
}

function coachingStorageKey(studyId: string): string {
    return `${storageKey(studyId)}:coaching`;
}

function loadCompleted(studyId: string): string[] {
    try {
        const raw = window.localStorage.getItem(storageKey(studyId));
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
    } catch {
        return [];
    }
}

function loadCoaching(studyId: string): string {
    try {
        return window.localStorage.getItem(coachingStorageKey(studyId)) ?? "";
    } catch {
        return "";
    }
}

export function ObservationMentorPanel({ studyId, passageReference, passageText, observations }: ObservationMentorPanelProps) {
    const [completed, setCompleted] = useState<string[]>([]);
    const [question, setQuestion] = useState<Awaited<ReturnType<GetNextObservationQuestion["execute"]>>>(null);
    const [open, setOpen] = useState(true);
    const [studentObservation, setStudentObservation] = useState("");
    const [coaching, setCoaching] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const stored = loadCompleted(studyId);
        setCompleted(stored);
        setCoaching(loadCoaching(studyId));
        void nextQuestionQuery.execute(stored).then(setQuestion);
    }, [studyId]);

    const passageTextForMentor = useMemo(() => passageText.trim(), [passageText]);
    const observationContext = useMemo(() => observations.map((observation) => ({
        verseReference: observation.verseReference,
        statement: observation.statement,
        wordText: observation.target.wordText,
        markupSymbol: observation.target.markupSymbol,
    })), [observations]);

    async function considerQuestion() {
        if (!question) return;

        const id = question.id.toString();
        const nextCompleted = completed.includes(id) ? completed : [...completed, id];
        window.localStorage.setItem(storageKey(studyId), JSON.stringify(nextCompleted));
        setCompleted(nextCompleted);
        setCoaching("");
        window.localStorage.removeItem(coachingStorageKey(studyId));
        setQuestion(await nextQuestionQuery.execute(nextCompleted));
        setStudentObservation("");
        setError(null);
    }

    async function coachObservation() {
        if (!question || !studentObservation.trim()) {
            setError("Write your observation before asking the mentor to coach you.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token;
            if (!accessToken) throw new Error("A signed-in Supabase session is required.");

            const response = await fetch("/api/ai/observation-mentor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    passageReference,
                    passageText: passageTextForMentor,
                    question: question.question.value,
                    purpose: question.purpose.value,
                    studentObservation: studentObservation.trim(),
                    existingObservations: observationContext,
                    previousMentorCoaching: coaching || null,
                }),
            });

            const payload = await response.json() as MentorResponse;
            if (!response.ok) {
                throw new Error(typeof payload.error === "string" ? payload.error : "Unable to reach the AI mentor.");
            }

            const nextCoaching = typeof payload.coaching === "string" ? payload.coaching.trim() : "";
            if (!nextCoaching) throw new Error("The AI mentor returned no coaching response.");

            setCoaching(nextCoaching);
            window.localStorage.setItem(coachingStorageKey(studyId), nextCoaching);
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to reach the AI mentor.");
        } finally {
            setLoading(false);
        }
    }

    function resetMentor() {
        window.localStorage.removeItem(storageKey(studyId));
        window.localStorage.removeItem(coachingStorageKey(studyId));
        setCompleted([]);
        setStudentObservation("");
        setCoaching("");
        setError(null);
        void nextQuestionQuery.execute([]).then(setQuestion);
    }

    return (
        <section
            className="bsmp-print-hide"
            style={{
                marginBottom: 16,
                border: "1px solid #dbeafe",
                borderRadius: 12,
                background: "#f8fbff",
                padding: 16,
            }}
            aria-label="Observation Mentor"
        >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div>
                    <p style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
                        Inductive Mentor
                    </p>
                    <h2 style={{ margin: "4px 0 6px", fontSize: 20 }}>Observation before interpretation</h2>
                    <p style={{ margin: 0, color: "#475569", fontSize: 13 }}>
                        The mentor sees the passage, your current observation, and your existing study observations. It helps you inspect the text without taking over the study.
                    </p>
                </div>
                <button type="button" onClick={() => setOpen((value) => !value)}>
                    {open ? "Hide" : "Show"}
                </button>
            </div>

            {open && (
                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                        {completed.length} of 6 questions considered · {observations.length} study observations available to the mentor
                    </div>

                    {!question ? (
                        <div style={{ display: "grid", gap: 8 }}>
                            <strong>Observation question cycle complete.</strong>
                            <span style={{ fontSize: 13, color: "#475569" }}>
                                Review your observations before moving into interpretation.
                            </span>
                            <button type="button" onClick={resetMentor} style={{ width: "fit-content" }}>
                                Start over
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                            <div>
                                <strong style={{ fontSize: 18 }}>{question.question.value}</strong>
                                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#475569" }}>{question.purpose.value}</p>
                            </div>

                            <div style={{ padding: 12, borderRadius: 8, background: "#ffffff", border: "1px solid #e2e8f0" }}>
                                <strong style={{ fontSize: 13 }}>Passage</strong>
                                <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.55 }}>{passageText}</p>
                            </div>

                            {observations.length > 0 && (
                                <details>
                                    <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Existing study observations ({observations.length})</summary>
                                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                                        {observations.map((observation) => (
                                            <div key={observation.id} style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                                                    {observation.verseReference}
                                                    {observation.target.wordText ? ` · ${observation.target.wordText}` : ""}
                                                </div>
                                                <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5 }}>{observation.statement}</div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}

                            <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 600 }}>
                                Your observation
                                <textarea
                                    value={studentObservation}
                                    onChange={(event) => setStudentObservation(event.target.value)}
                                    placeholder="Record only what you can observe in the text..."
                                    rows={4}
                                    style={{ width: "100%", boxSizing: "border-box", resize: "vertical", border: "1px solid #cbd5e1", borderRadius: 8, padding: 10, font: "inherit", fontWeight: 400 }}
                                />
                            </label>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                <button type="button" onClick={() => void coachObservation()} disabled={loading || !studentObservation.trim()}>
                                    {loading ? "Mentor is reviewing..." : "Ask the mentor to coach me"}
                                </button>
                                <button type="button" onClick={() => void considerQuestion()}>
                                    I have considered this question
                                </button>
                            </div>

                            {coaching && (
                                <div style={{ padding: 12, borderRadius: 8, background: "#ffffff", border: "1px solid #bfdbfe" }}>
                                    <strong style={{ fontSize: 13 }}>Mentor coaching</strong>
                                    <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6 }}>{coaching}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {error && <p style={{ margin: 0, color: "#b91c1c", fontSize: 13 }}>{error}</p>}
                </div>
            )}
        </section>
    );
}
