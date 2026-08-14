import type { InterpretationViewModel, ObservationViewModel } from "@bsmp/study";

export interface InterpretationHistoryProps {
    readonly interpretations: readonly InterpretationViewModel[];
    readonly observations: readonly ObservationViewModel[];
    readonly onObservationSelect?: (observation: ObservationViewModel) => void;
}

export function InterpretationHistory({
    interpretations,
    observations,
    onObservationSelect,
}: InterpretationHistoryProps) {
    const observationMap = new Map(
        observations.map((observation) => [observation.id, observation]),
    );

    return (
        <section style={{ marginTop: 20 }}>
            <h2 style={{ marginBottom: 12, fontSize: 20 }}>Interpretation History</h2>

            {interpretations.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No interpretations recorded yet.</p>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {interpretations.map((interpretation) => (
                        <article
                            key={interpretation.id}
                            id={`interpretation-${interpretation.id}`}
                            style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#ffffff", padding: 16 }}
                        >
                            <p style={{ marginTop: 0 }}>{interpretation.statement}</p>
                            {interpretation.observationIds.length > 0 ? (
                                <div style={{ fontSize: 13, color: "#4b5563" }}>
                                    <strong>Supported by:</strong>
                                    <ul>
                                        {interpretation.observationIds.map((id) => {
                                            const observation = observationMap.get(id);
                                            return (
                                                <li key={id}>
                                                    {observation ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => onObservationSelect?.(observation)}
                                                            style={{ border: 0, padding: 0, background: "transparent", color: "#1d4ed8", cursor: "pointer", textAlign: "left" }}
                                                        >
                                                            {observation.verseReference} — {observation.statement}
                                                        </button>
                                                    ) : id}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ) : (
                                <p style={{ marginBottom: 0, fontSize: 13, color: "#6b7280" }}>
                                    No supporting observations selected.
                                </p>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
