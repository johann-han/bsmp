"use client";

import type { ObservationViewModel } from "@bsmp/study";
import { useEffect, useState } from "react";

import { createSupabaseObservationWorkspace } from "../../lib/createSupabaseObservationWorkspace";

export interface ObservationHistoryProps {
    readonly observations: readonly ObservationViewModel[];
    readonly selectedVerseReference?: string | null;
    readonly onChanged?: () => Promise<void> | void;
}

const MARKUP_LABELS: Record<string, string> = {
    N: "Note",
    "?": "Question",
    "!": "Important",
    "→": "Action / Result",
};

function verseNumberOf(reference: string): number | null {
    const value = Number.parseInt(reference.split(":").at(-1) ?? "", 10);
    return Number.isInteger(value) ? value : null;
}

export function ObservationHistory({
    observations,
    selectedVerseReference = null,
    onChanged,
}: ObservationHistoryProps) {
    const [localObservations, setLocalObservations] = useState<readonly ObservationViewModel[]>(observations);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLocalObservations(observations);
    }, [observations]);

    const visibleObservations = selectedVerseReference
        ? localObservations.filter((observation) => observation.verseReference === selectedVerseReference)
        : localObservations;

    async function editObservation(observation: ObservationViewModel) {
        const statement = window.prompt("Edit observation", observation.statement);
        if (statement === null) return;

        setBusyId(observation.id);
        setError(null);

        const optimisticObservation: ObservationViewModel = {
            ...observation,
            statement,
        };

        setLocalObservations((current) => current.map((item) =>
            item.id === observation.id ? optimisticObservation : item,
        ));

        try {
            const studyId = new URLSearchParams(window.location.search).get("studyId") ?? undefined;
            const { workspace, passageService } = await createSupabaseObservationWorkspace(studyId);
            const verseNumber = verseNumberOf(observation.target.verseReference);
            if (verseNumber === null) throw new Error("Unable to determine the observation verse.");

            const wordTarget = observation.target.wordIndex !== null && observation.target.translation && observation.target.wordText
                ? {
                    translation: observation.target.translation,
                    wordIndex: observation.target.wordIndex,
                    wordText: observation.target.wordText,
                    markupSymbol: observation.target.markupSymbol,
                }
                : undefined;
            const textTarget = observation.target.wordIndex === null && observation.target.translation && observation.target.wordText
                ? {
                    translation: observation.target.translation,
                    textCue: observation.target.wordText,
                }
                : undefined;

            await workspace.updateObservation(
                observation.id,
                passageService.getVerseReference(verseNumber),
                statement,
                wordTarget,
                textTarget,
            );

            void onChanged?.();
        } catch (reason: unknown) {
            setLocalObservations((current) => current.map((item) =>
                item.id === observation.id ? observation : item,
            ));
            setError(reason instanceof Error ? reason.message : "Unable to update observation.");
        } finally {
            setBusyId(null);
        }
    }

    async function deleteObservation(observation: ObservationViewModel) {
        if (!window.confirm("Delete this observation? This cannot be undone.")) return;

        setBusyId(observation.id);
        setError(null);

        setLocalObservations((current) => current.filter((item) => item.id !== observation.id));

        try {
            const studyId = new URLSearchParams(window.location.search).get("studyId") ?? undefined;
            const { workspace } = await createSupabaseObservationWorkspace(studyId);
            await workspace.removeObservation(observation.id);
            void onChanged?.();
        } catch (reason: unknown) {
            setLocalObservations((current) => {
                if (current.some((item) => item.id === observation.id)) return current;
                return [...current, observation];
            });
            setError(reason instanceof Error ? reason.message : "Unable to delete observation.");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <section
            style={{ marginTop: 20, border: "1px solid #e5e7eb", borderRadius: 12, background: "#ffffff", padding: 20 }}
        >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280" }}>
                Observation History
            </p>

            <h2 style={{ margin: "4px 0 12px", fontSize: 20 }}>
                {selectedVerseReference ? `Observations for ${selectedVerseReference}` : "All observations"}
            </h2>

            {error && <p style={{ margin: "0 0 12px", color: "#b91c1c" }}>{error}</p>}

            {visibleObservations.length === 0 ? (
                <p style={{ margin: 0, color: "#6b7280" }}>No observations recorded yet.</p>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {visibleObservations.map((observation) => {
                        const isWordTarget = observation.target.wordIndex !== null;
                        const isTextTarget = observation.target.wordIndex === null && observation.target.wordText !== null;
                        const markupLabel = observation.target.markupSymbol
                            ? MARKUP_LABELS[observation.target.markupSymbol] ?? observation.target.markupSymbol
                            : null;
                        const busy = busyId === observation.id;

                        return (
                            <article
                                id={`observation-${observation.id}`}
                                key={observation.id}
                                style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, scrollMarginTop: 24 }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
                                        {observation.verseReference}
                                        {isWordTarget && (
                                            <span style={{ marginLeft: 8, color: "#1e3a8a" }}>
                                                · word: {observation.target.wordText}
                                                {observation.target.markupSymbol && markupLabel
                                                    ? ` · ${observation.target.markupSymbol} ${markupLabel}`
                                                    : ""}
                                            </span>
                                        )}
                                        {isTextTarget && !isWordTarget && (
                                            <span style={{ marginLeft: 8, color: "#1e3a8a" }}>
                                                · text target: “{observation.target.wordText}”
                                            </span>
                                        )}
                                    </p>

                                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                        <button type="button" onClick={() => void editObservation(observation)} disabled={busy} style={{ border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", padding: "4px 8px", cursor: busy ? "not-allowed" : "pointer", fontSize: 12 }}>
                                            {busy ? "Saving..." : "Edit"}
                                        </button>
                                        <button type="button" onClick={() => void deleteObservation(observation)} disabled={busy} style={{ border: "1px solid #fecaca", borderRadius: 6, background: "#fff", color: "#b91c1c", padding: "4px 8px", cursor: busy ? "not-allowed" : "pointer", fontSize: 12 }}>
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <p style={{ margin: "6px 0 0", lineHeight: 1.6 }}>{observation.statement}</p>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
