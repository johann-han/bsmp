"use client";

import { useEffect, useMemo, useState } from "react";

import type { ObservationViewModel } from "@bsmp/study";
import { InMemoryObservationQuestionRepository, classifyObservationEntry } from "@bsmp/inductive";
import type { ObservationEntryType } from "@bsmp/inductive";
import type { ObservationQuestion } from "@bsmp/inductive";

import { supabase } from "../../lib/supabase";

const questionRepository = new InMemoryObservationQuestionRepository();

interface ObservationMentorPanelProps {
    readonly studyId: string;
    readonly passageReference: string;
    readonly passageText: string;
    readonly observations: readonly ObservationViewModel[];
    readonly onFocusPassage?: (focus: MentorFocus) => void;
}

interface MentorFocus {
    readonly verseReference: string;
    readonly textCue: string;
    readonly question: string;
}

interface MentorResponse {
    readonly coaching?: unknown;
    readonly focuses?: unknown;
    readonly error?: unknown;
}

interface QuestionResponseState {
    observation: string;
    coaching: string;
    focuses: MentorFocus[];
}

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

const ENTRY_TYPE_LABELS: Record<ObservationEntryType, string> = {
    question: "Question",
    observation: "Observation",
    inference: "Inference",
    interpretation: "Interpretation",
    empty: "Empty",
};

export function ObservationMentorPanel({ studyId, passageReference, passageText, observations, onFocusPassage }: ObservationMentorPanelProps) {
    const [questions, setQuestions] = useState<readonly ObservationQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [completed, setCompleted] = useState<string[]>([]);
    const [responses, setResponses] = useState<Record<string, QuestionResponseState>>({});
    const [open, setOpen] = useState(true);
    const [studentObservation, setStudentObservation] = useState("");
    const [coaching, setCoaching] = useState("");
    const [focuses, setFocuses] = useState<MentorFocus[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function initialize() {
            const [allQuestions, storedCompleted] = await Promise.all([
                questionRepository.findAll(),
                Promise.resolve(loadCompleted(studyId)),
            ]);
            if (!active) return;

            setQuestions(allQuestions);
            setCompleted(storedCompleted);
            setResponses({});
            setCurrentQuestionIndex(0);
            setOpen(true);
            setStudentObservation("");
            setCoaching("");
            setFocuses([]);
            setError(null);
        }

        void initialize();
        return () => {
            active = false;
        };
    }, [studyId]);

    const currentQuestion = questions[currentQuestionIndex] ?? null;
    const currentQuestionId = currentQuestion?.id.toString() ?? "";
    const isFirstQuestion = currentQuestionIndex === 0;
    const isLastQuestion = questions.length === 0 || currentQuestionIndex === questions.length - 1;

    const passageTextForMentor = useMemo(() => passageText.trim(), [passageText]);
    const observationContext = useMemo(() => observations.map((observation) => ({
        verseReference: observation.verseReference,
        statement: observation.statement,
        wordText: observation.target.wordText,
        markupSymbol: observation.target.markupSymbol,
    })), [observations]);
    const entryType = classifyObservationEntry(studentObservation);

    function persistCurrentResponse(next: Partial<QuestionResponseState>) {
        if (!currentQuestionId) return;
        setResponses((current) => ({
            ...current,
            [currentQuestionId]: {
                observation: current[currentQuestionId]?.observation ?? "",
                coaching: current[currentQuestionId]?.coaching ?? "",
                focuses: current[currentQuestionId]?.focuses ?? [],
                ...next,
            },
        }));
    }

    function navigateToQuestion(index: number) {
        if (index < 0 || index >= questions.length) return;
        const target = questions[index];
        if (!target) return;
        const saved = responses[target.id.toString()] ?? { observation: "", coaching: "", focuses: [] };
        setCurrentQuestionIndex(index);
        setStudentObservation(saved.observation);
        setCoaching(saved.coaching);
        setFocuses(saved.focuses);
        setError(null);
    }

    function goToPreviousQuestion() {
        navigateToQuestion(currentQuestionIndex - 1);
    }

    function goToNextQuestion() {
        navigateToQuestion(currentQuestionIndex + 1);
    }

    function findNextUnconsideredIndex(fromIndex: number): number | null {
        for (let index = fromIndex; index < questions.length; index += 1) {
            const question = questions[index];
            if (question && !completed.includes(question.id.toString())) return index;
        }
        return null;
    }

    function considerQuestion() {
        if (!currentQuestion) return;

        const id = currentQuestion.id.toString();
        const nextCompleted = completed.includes(id) ? completed : [...completed, id];
        window.localStorage.setItem(storageKey(studyId), JSON.stringify(nextCompleted));
        setCompleted(nextCompleted);

        const nextIndex = findNextUnconsideredIndex(currentQuestionIndex + 1);
        if (nextIndex !== null) {
            navigateToQuestion(nextIndex);
            return;
        }

        const earlierIndex = findNextUnconsideredIndex(0);
        if (earlierIndex !== null) {
            navigateToQuestion(earlierIndex);
            return;
        }

        setCoaching("");
        setFocuses([]);
        setError(null);
    }

    async function coachObservation() {
        if (!currentQuestion || !studentObservation.trim()) {
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
                    question: currentQuestion.question.value,
                    purpose: currentQuestion.purpose.value,
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

            const nextFocuses = Array.isArray(payload.focuses)
                ? payload.focuses.flatMap((item) => {
                    if (!item || typeof item !== "object") return [];
                    const candidate = item as Record<string, unknown>;
                    if (
                        typeof candidate.verseReference !== "string" ||
                        typeof candidate.textCue !== "string" ||
                        typeof candidate.question !== "string"
                    ) return [];
                    return [{
                        verseReference: candidate.verseReference,
                        textCue: candidate.textCue,
                        question: candidate.question,
                    }];
                }).slice(0, 3)
                : [];

            setCoaching(nextCoaching);
            setFocuses(nextFocuses);
            persistCurrentResponse({ coaching: nextCoaching, focuses: nextFocuses });
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to reach the AI mentor.");
        } finally {
            setLoading(false);
        }
    }

    function resetMentor() {
        window.localStorage.removeItem(storageKey(studyId));
        setCompleted([]);
        setResponses({});
        setCurrentQuestionIndex(0);
        setStudentObservation("");
        setCoaching("");
        setFocuses([]);
        setError(null);
    }

    return (
        <section className="bsmp-print-hide" style={{ marginBottom: 16, border: "1px solid #dbeafe", borderRadius: 12, background: "#f8fbff", padding: 16 }} aria-label="Observation Mentor">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div>
                    <p style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>Inductive Mentor</p>
                    <h2 style={{ margin: "4px 0 6px", fontSize: 20 }}>Observation before interpretation</h2>
                    <p style={{ margin: 0, color: "#475569", fontSize: 13 }}>The mentor sees the passage, your current observation, and your existing study observations. It helps you inspect the text without taking over the study.</p>
                </div>
                <button type="button" onClick={() => setOpen((value) => !value)}>{open ? "Hide" : "Show"}</button>
            </div>

            {open && (
                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 12, color: "#64748b" }}>
                        <span>{completed.length} of {questions.length || 6} questions considered</span>
                        <span>·</span>
                        <span>{questions.length > 0 ? `Question ${currentQuestionIndex + 1} of ${questions.length}` : "Loading questions…"}</span>
                        <span>·</span>
                        <span>{observations.length} study observations available to the mentor</span>
                        {entryType !== "empty" && <span style={{ marginLeft: "auto", padding: "4px 8px", borderRadius: 999, background: "#e0f2fe", color: "#075985", fontWeight: 700 }}>Entry type: {ENTRY_TYPE_LABELS[entryType]}</span>}
                    </div>

                    {!currentQuestion ? (
                        <div style={{ display: "grid", gap: 8 }}><strong>Observation questions are loading.</strong></div>
                    ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                                <div>
                                    <strong style={{ fontSize: 18 }}>{currentQuestion.question.value}</strong>
                                    <p style={{ margin: "6px 0 0", fontSize: 13, color: "#475569" }}>{currentQuestion.purpose.value}</p>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button type="button" onClick={goToPreviousQuestion} disabled={isFirstQuestion}>← Previous</button>
                                    <button type="button" onClick={goToNextQuestion} disabled={isLastQuestion}>Next →</button>
                                </div>
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
                                                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{observation.verseReference}{observation.target.wordText ? ` · ${observation.target.wordText}` : ""}</div>
                                                <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5 }}>{observation.statement}</div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}

                            <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 600 }}>
                                Your observation
                                <textarea value={studentObservation} onChange={(event) => { const nextValue = event.target.value; setStudentObservation(nextValue); persistCurrentResponse({ observation: nextValue }); }} placeholder="Record only what you can observe in the text..." rows={4} style={{ width: "100%", boxSizing: "border-box", resize: "vertical", border: "1px solid #cbd5e1", borderRadius: 8, padding: 10, font: "inherit", fontWeight: 400 }} />
                            </label>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                <button type="button" onClick={() => void coachObservation()} disabled={loading || !studentObservation.trim()}>{loading ? "Mentor is reviewing..." : "Ask the mentor to coach me"}</button>
                                <button type="button" onClick={considerQuestion}>I have considered this question</button>
                            </div>

                            {coaching && <div style={{ padding: 12, borderRadius: 8, background: "#ffffff", border: "1px solid #bfdbfe" }}><strong style={{ fontSize: 13 }}>Mentor coaching</strong><p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6 }}>{coaching}</p></div>}

                            {focuses.length > 0 && (
                                <div style={{ padding: 12, borderRadius: 8, background: "#ffffff", border: "1px solid #dbeafe" }}>
                                    <strong style={{ fontSize: 13 }}>Look again at the text</strong>
                                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                                        {focuses.map((focus, index) => <div key={`${focus.verseReference}-${index}`} style={{ padding: 10, borderRadius: 8, background: "#f8fbff" }}><div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>{focus.verseReference} · “{focus.textCue}”</div><div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5 }}>{focus.question}</div>{onFocusPassage && <button type="button" onClick={() => onFocusPassage(focus)} style={{ marginTop: 8 }}>View in passage</button>}</div>)}
                                    </div>
                                    <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>These are observation prompts, not conclusions. Verify each one in the passage yourself.</p>
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", paddingTop: 4 }}>
                                <div style={{ display: "flex", gap: 8 }}><button type="button" onClick={goToPreviousQuestion} disabled={isFirstQuestion}>← Previous question</button><button type="button" onClick={goToNextQuestion} disabled={isLastQuestion}>Next question →</button></div>
                                <button type="button" onClick={resetMentor} style={{ width: "fit-content" }}>Reset question progress</button>
                            </div>
                        </div>
                    )}

                    {completed.length === questions.length && questions.length > 0 && <div style={{ padding: 12, borderRadius: 8, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46" }}><strong>All six observation questions have been considered.</strong><span style={{ marginLeft: 6 }}>You can still move backward and forward to review them.</span></div>}
                    {error && <p style={{ margin: 0, color: "#b91c1c", fontSize: 13 }}>{error}</p>}
                </div>
            )}
        </section>
    );
}
