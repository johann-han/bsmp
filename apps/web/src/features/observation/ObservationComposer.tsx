"use client";

import { useState } from "react";

import type { VerseReference } from "@bsmp/bible";
import type { ObservationWordTargetInput, ObservationWorkspaceService } from "@bsmp/study";

import type { StudyWordMarkup, StudyVerse } from "./StudyPassage";

export interface ObservationComposerProps {
    readonly workspace: ObservationWorkspaceService;
    readonly selectedVerse: StudyVerse | null;
    readonly targetWord?: string | null;
    readonly targetMarkup?: StudyWordMarkup | null;
    readonly getVerseReference: (verseNumber: number) => VerseReference;
    readonly onSaved: () => Promise<void> | void;
}

const MARKUP_LABELS: Record<string, string> = {
    N: "Note",
    "?": "Question",
    "!": "Important",
    "→": "Action / Result",
};

export function ObservationComposer({
    workspace,
    selectedVerse,
    targetWord,
    targetMarkup,
    getVerseReference,
    onSaved,
}: ObservationComposerProps) {
    const [statement, setStatement] = useState("");
    const [savedMessage, setSavedMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function saveObservation() {
        if (!selectedVerse) {
            setError("Select a verse first.");
            return;
        }

        if (!statement.trim()) {
            setError("Enter an observation before saving.");
            return;
        }

        setError(null);
        setSavedMessage(null);

        try {
            const wordTarget: ObservationWordTargetInput | undefined = targetWord && targetMarkup
                ? {
                    translation: targetMarkup.translation,
                    wordIndex: targetMarkup.wordIndex,
                    wordText: targetWord,
                    markupSymbol: targetMarkup.symbol,
                }
                : undefined;

            await workspace.addObservation(
                getVerseReference(selectedVerse.number),
                statement,
                wordTarget,
            );

            await onSaved();
            setStatement("");
            setSavedMessage(
                targetWord && targetMarkup
                    ? `Observation saved for ${targetWord} in verse ${selectedVerse.number}.`
                    : `Observation saved to verse ${selectedVerse.number}.`,
            );
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : "Unable to save observation.",
            );
        }
    }

    const targetLabel = targetMarkup
        ? MARKUP_LABELS[targetMarkup.symbol] ?? targetMarkup.symbol
        : null;

    return (
        <section
            id="observation-composer"
            style={{
                marginTop: 20,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                background: "#ffffff",
                padding: 20,
            }}
        >
            <p
                style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#6b7280",
                }}
            >
                Observation
            </p>

            <h2 style={{ margin: "4px 0 12px", fontSize: 20 }}>
                {selectedVerse
                    ? `Verse ${selectedVerse.number}`
                    : "Select a verse"}
            </h2>

            {targetWord && targetMarkup && targetLabel && (
                <div
                    style={{
                        marginBottom: 12,
                        padding: "10px 12px",
                        border: "1px solid #dbeafe",
                        borderRadius: 8,
                        background: "#eff6ff",
                        color: "#1e3a8a",
                        fontSize: 13,
                    }}
                >
                    Observation target: <strong>{targetWord}</strong> · {targetMarkup.symbol} {targetLabel}
                </div>
            )}

            <textarea
                value={statement}
                onChange={(event) => setStatement(event.target.value)}
                placeholder="Record what you observe in the text..."
                rows={5}
                style={{
                    width: "100%",
                    resize: "vertical",
                    boxSizing: "border-box",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    padding: 12,
                    font: "inherit",
                }}
            />

            <button
                type="button"
                onClick={saveObservation}
                disabled={!selectedVerse}
                style={{
                    marginTop: 12,
                    border: 0,
                    borderRadius: 8,
                    background: !selectedVerse ? "#d1d5db" : "#111827",
                    color: "#ffffff",
                    padding: "10px 14px",
                    fontWeight: 600,
                    cursor: !selectedVerse ? "not-allowed" : "pointer",
                }}
            >
                Save Observation
            </button>

            {error && (
                <p style={{ margin: "10px 0 0", color: "#b91c1c" }}>
                    {error}
                </p>
            )}

            {savedMessage && (
                <p style={{ margin: "10px 0 0", color: "#166534" }}>
                    {savedMessage}
                </p>
            )}
        </section>
    );
}
