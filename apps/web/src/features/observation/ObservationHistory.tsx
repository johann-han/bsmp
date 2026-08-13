"use client";

import type { ObservationViewModel } from "@bsmp/study";
import { useState } from "react";

import { createSupabaseObservationWorkspace } from "../../lib/createSupabaseObservationWorkspace";
import { supabase } from "../../lib/supabase";

export interface ObservationHistoryProps {
    readonly observations: readonly ObservationViewModel[];
    readonly selectedVerseReference?: string | null;
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
}: ObservationHistoryProps) {
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const visibleObservations = selectedVerseReference
        ? observations.filter((observation) => observation.verseReference === selectedVerseReference)
        : observations;

    async function editObservation(observation: ObservationViewModel) {
        const statement = window.prompt("Edit observation", observation.statement);
        if (statement === null) return;

        setBusyId(observation.id);
        setError(null);

        try {
            const studyId = new URLSearchParams(window.location.search).get("studyId") ?? undefined;
            const { workspace, passageService } = await createSupabaseObservationWorkspace(studyId);
            const verseNumber = verseNumberOf(observation.target.verseReference);
            if (verseNumber === null) throw new Error("Unable to determine the observation verse.");

            await workspace.updateObservation(
                observation.id,
                passageService.getVerseReference(verseNumber),
                statement,
                observation.target.wordIndex !== null && observation.target.translation && observation.target.wordText && observation.target.markupSymbol
                    ? {
                        translation: observation.target.translation,
                        wordIndex: observation.target.wordIndex,
                        wordText: observation.target.wordText,
                        markupSymbol: observation.target.markupSymbol,
                    }
                    : undefined,
            );

            window.location.reload();
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to update observation.");
        } finally {
            setBusyId(null);
        }
    }

    async function deleteObservation(observation: ObservationViewModel) {
        if (!window.confirm("Delete this observation? This cannot be undone.")) return;

        setBusyId(observation.id);
        setError(null);

        try {
            const studyId = new URLSearchParams(window.location.search).get("studyId") ?? undefined;
            const { workspace } = await createSupabaseObservationWorkspace(studyId);
            await workspace.removeObservation(observation.id);

            const { error: deleteError } = await supabase
                .from("study_observations")
                .delete()
                .eq("id", observation.id);
            if (deleteError) throw deleteError;

            window.location.reload();
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to delete observation.");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <section
            style={{
                marginTop: 20,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                background: "#ffffff",
                padding: 20,
            }}
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
                        const isWordTarget = observation.target.wordText !== null;
                        const markupLabel = observation.target.markupSymbol
                            ? MARKUP_LABELS[observation.target.markupSymbol] ?? observation.target.markupSymbol
                            : null;
                        const busy = busyId === observation.id;

                        return (
                            <article key={observation.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
                                        {observation.verseReference}
                                        {isWordTarget && (
                                            <span style={{ marginLeft: 8, color: "#1e3a8a" }}>
                                                · {observation.target.wordText}
                                                {observation.target.markupSymbol && markupLabel
                                                    ? ` · ${observation.target.markupSymbol} ${markupLabel}`
                                                    : ""}
                                            </span>
                                        )}
                                    </p>

                                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                        <button
                                            type="button"
                                            onClick={() => void editObservation(observation)}
                                            disabled={busy}
                                            style={{ border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", padding: "4px 8px", cursor: busy ? "not-allowed" : "pointer", fontSize: 12 }}
                                        >
                                            {busy ? "Working..." : "Edit"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void deleteObservation(observation)}
                                            disabled={busy}
                                            style={{ border: "1px solid #fecaca", borderRadius: 6, background: "#fff", color: "#b91c1c", padding: "4px 8px", cursor: busy ? "not-allowed" : "pointer", fontSize: 12 }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <p style={{ margin: "6px 0 0", lineHeight: 1.6 }}>
                                    {observation.statement}
                                </p>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
