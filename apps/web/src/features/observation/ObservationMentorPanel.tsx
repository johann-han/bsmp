"use client";

import { useEffect, useState } from "react";

import {
    GetNextObservationQuestion,
    InMemoryObservationQuestionRepository,
} from "@bsmp/inductive";

const questionRepository = new InMemoryObservationQuestionRepository();
const nextQuestionQuery = new GetNextObservationQuestion(questionRepository);

function storageKey(studyId: string): string {
    return `bsmp:observation-mentor:${studyId}`;
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

export function ObservationMentorPanel({ studyId }: { studyId: string }) {
    const [completed, setCompleted] = useState<string[]>([]);
    const [question, setQuestion] = useState<Awaited<ReturnType<GetNextObservationQuestion["execute"]>>>(null);
    const [open, setOpen] = useState(true);

    useEffect(() => {
        const stored = loadCompleted(studyId);
        setCompleted(stored);
        void nextQuestionQuery.execute(stored).then(setQuestion);
    }, [studyId]);

    async function considerQuestion() {
        if (!question) return;

        const id = question.id.toString();
        const nextCompleted = completed.includes(id) ? completed : [...completed, id];
        window.localStorage.setItem(storageKey(studyId), JSON.stringify(nextCompleted));
        setCompleted(nextCompleted);
        setQuestion(await nextQuestionQuery.execute(nextCompleted));
    }

    function resetMentor() {
        window.localStorage.removeItem(storageKey(studyId));
        setCompleted([]);
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
                        Work through the observation questions before drawing conclusions. The mentor asks a question; you supply the observation.
                    </p>
                </div>
                <button type="button" onClick={() => setOpen((value) => !value)}>
                    {open ? "Hide" : "Show"}
                </button>
            </div>

            {open && (
                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{completed.length} of 6 questions considered</div>

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
                        <div style={{ display: "grid", gap: 8 }}>
                            <strong style={{ fontSize: 18 }}>{question.question.value}</strong>
                            <span style={{ fontSize: 13, color: "#475569" }}>{question.purpose.value}</span>
                            <span style={{ fontSize: 13, color: "#475569" }}>
                                Look at the passage and record what you can actually observe.
                            </span>
                            <button type="button" onClick={() => void considerQuestion()} style={{ width: "fit-content" }}>
                                I have considered this question
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
