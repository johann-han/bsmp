"use client";

import type { ObservationViewModel } from "@bsmp/study";

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

export function ObservationHistory({
    observations,
    selectedVerseReference = null,
}: ObservationHistoryProps) {
    const visibleObservations = selectedVerseReference
        ? observations.filter((observation) => observation.verseReference === selectedVerseReference)
        : observations;

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

            {visibleObservations.length === 0 ? (
                <p style={{ margin: 0, color: "#6b7280" }}>No observations recorded yet.</p>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {visibleObservations.map((observation) => {
                        const isWordTarget = observation.target.wordText !== null;
                        const markupLabel = observation.target.markupSymbol
                            ? MARKUP_LABELS[observation.target.markupSymbol] ?? observation.target.markupSymbol
                            : null;

                        return (
                            <article key={observation.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
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
