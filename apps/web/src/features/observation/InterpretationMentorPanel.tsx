"use client";

import { useState } from "react";

import type { ObservationViewModel } from "@bsmp/study";

interface InterpretationMentorPanelProps {
    readonly interpretation: string;
    readonly observations: readonly ObservationViewModel[];
    readonly onObservationSelect?: ((observation: ObservationViewModel) => void) | undefined;
}

type Assessment = "supported" | "mixed" | "unsupported" | "too_vague";

const assessmentLabels: Record<Assessment, string> = {
    supported: "Grounded in the selected observations",
    mixed: "Partly grounded; check the unsupported step",
    unsupported: "Not sufficiently grounded in the selected observations",
    too_vague: "Too vague to test from the selected observations",
};

function targetLabel(observation: ObservationViewModel): string {
    if (observation.target.wordIndex !== null && observation.target.wordText) {
        return `${observation.verseReference} · word: “${observation.target.wordText}”`;
    }
    if (observation.target.wordText) {
        return `${observation.verseReference} · text: “${observation.target.wordText}”`;
    }
    return observation.verseReference;
}

export function InterpretationMentorPanel({
    interpretation,
    observations,
    onObservationSelect,
}: InterpretationMentorPanelProps) {
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [coaching, setCoaching] = useState<string | null>(null);
    const [focuses, setFocuses] = useState<readonly { observationId: string; question: string }[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function askMentor() {
        const trimmed = interpretation.trim();
        if (!trimmed) {
            setError("Enter an interpretation before asking the mentor.");
            return;
        }
        if (observations.length === 0) {
            setError("Select supporting observations before asking the mentor.");
            return;
        }

        setBusy(true);
        setError(null);
        setAssessment(null);
        setCoaching(null);
        setFocuses([]);

        try {
            const { supabase } = await import("../../lib/supabase");
            const session = await supabase.auth.getSession();
            const accessToken = session.data.session?.access_token;
            if (!accessToken) throw new Error("A signed-in Supabase session is required.");

            const response = await fetch("/api/ai/interpretation-mentor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    interpretation: trimmed,
                    observations: observations.map((observation) => ({
                        id: observation.id,
                        verseReference: observation.verseReference,
                        statement: observation.statement,
                        targetLabel: targetLabel(observation),
                    })),
                }),
            });
            const payload = await response.json() as {
                assessment?: unknown;
                coaching?: unknown;
                focuses?: unknown;
                error?: unknown;
            };
            if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Unable to run the interpretation mentor.");

            const nextAssessment = payload.assessment;
            if (nextAssessment !== "supported" && nextAssessment !== "mixed" && nextAssessment !== "unsupported" && nextAssessment !== "too_vague") {
                throw new Error("The interpretation mentor returned an invalid assessment.");
            }
            if (typeof payload.coaching !== "string" || !payload.coaching.trim()) {
                throw new Error("The interpretation mentor returned no coaching response.");
            }

            const nextFocuses = Array.isArray(payload.focuses)
                ? payload.focuses.flatMap((focus) => {
                    if (!focus || typeof focus !== "object") return [];
                    const item = focus as { observationId?: unknown; question?: unknown };
                    if (typeof item.observationId !== "string" || typeof item.question !== "string") return [];
                    if (!observations.some((observation) => observation.id === item.observationId)) return [];
                    const question = item.question.trim();
                    if (!question) return [];
                    return [{ observationId: item.observationId, question }];
                })
                : [];

            setAssessment(nextAssessment);
            setCoaching(payload.coaching.trim());
            setFocuses(nextFocuses.slice(0, 3));
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to run the interpretation mentor.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <section style={{ marginTop: 12, border: "1px solid #dbeafe", borderRadius: 12, background: "#eff6ff", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#1d4ed8" }}>
                        Interpretation Mentor
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151" }}>
                        Check whether this interpretation is grounded in the observations you selected.
                    </p>
                </div>
                <button type="button" onClick={() => void askMentor()} disabled={busy || !interpretation.trim() || observations.length === 0} style={{ border: 0, borderRadius: 8, background: busy ? "#9ca3af" : "#1d4ed8", color: "#ffffff", padding: "9px 12px", fontWeight: 700 }}>
                    {busy ? "Checking..." : "Ask the mentor"}
                </button>
            </div>

            {assessment && (
                <p style={{ margin: "12px 0 0", fontWeight: 700 }}>
                    Assessment: {assessmentLabels[assessment]}
                </p>
            )}
            {coaching && <p style={{ margin: "8px 0 0", lineHeight: 1.5 }}>{coaching}</p>}

            {focuses.length > 0 && (
                <div style={{ marginTop: 12 }}>
                    <strong style={{ fontSize: 13 }}>Recheck these observations</strong>
                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                        {focuses.map((focus) => {
                            const observation = observations.find((item) => item.id === focus.observationId);
                            if (!observation) return null;
                            const selectable = Boolean(onObservationSelect);
                            return (
                                <button
                                    key={`${focus.observationId}-${focus.question}`}
                                    type="button"
                                    onClick={() => onObservationSelect?.(observation)}
                                    disabled={!selectable}
                                    style={{ display: "block", width: "100%", textAlign: "left", padding: 10, background: "#ffffff", borderRadius: 8, border: "1px solid #bfdbfe", cursor: selectable ? "pointer" : "default" }}
                                >
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>{targetLabel(observation)}</div>
                                    <div style={{ marginTop: 3 }}>{focus.question}</div>
                                    {selectable && <div style={{ marginTop: 5, fontSize: 11, color: "#6b7280" }}>Click to recheck this observation in the study.</div>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {error && <p style={{ margin: "10px 0 0", color: "#b91c1c" }}>{error}</p>}
        </section>
    );
}
