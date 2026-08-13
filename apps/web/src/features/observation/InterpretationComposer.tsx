"use client";

import { useState } from "react";

import type { InterpretationViewModel, ObservationWorkspaceService, ObservationViewModel } from "@bsmp/study";

export interface InterpretationComposerProps {
    readonly workspace: ObservationWorkspaceService;
    readonly observations: readonly ObservationViewModel[];
    readonly onSaved: () => Promise<void> | void;
    readonly onOptimisticCreate?: (interpretation: InterpretationViewModel) => void;
    readonly onRollbackCreate?: (id: string) => void;
}

export function InterpretationComposer({
    workspace,
    observations,
    onSaved,
    onOptimisticCreate,
    onRollbackCreate,
}: InterpretationComposerProps) {
    const [statement, setStatement] = useState("");
    const [selectedObservationIds, setSelectedObservationIds] = useState<string[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    function toggleObservation(id: string) {
        setSelectedObservationIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        );
    }

    async function saveInterpretation() {
        const trimmed = statement.trim();
        if (!trimmed) {
            setError("Enter an interpretation before saving.");
            return;
        }

        setError(null);
        setMessage(null);
        setSaving(true);

        const optimisticId = crypto.randomUUID();
        onOptimisticCreate?.({
            id: optimisticId,
            statement: trimmed,
            observationIds: [...selectedObservationIds],
            evidence: [],
            createdAt: new Date().toISOString(),
        });

        try {
            await workspace.addInterpretation(trimmed, selectedObservationIds);
            setStatement("");
            setSelectedObservationIds([]);
            setMessage("Interpretation saved.");
            await onSaved();
        } catch (saveError) {
            onRollbackCreate?.(optimisticId);
            setError(saveError instanceof Error ? saveError.message : "Unable to save interpretation.");
        } finally {
            setSaving(false);
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
                Interpretation
            </p>
            <h2 style={{ margin: "4px 0 12px", fontSize: 20 }}>
                What does the text mean?
            </h2>

            {observations.length > 0 ? (
                <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>
                        Support this interpretation with observations:
                    </p>
                    {observations.map((observation) => (
                        <label key={observation.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <input type="checkbox" checked={selectedObservationIds.includes(observation.id)} onChange={() => toggleObservation(observation.id)} disabled={saving} />
                            <span><strong>{observation.verseReference}</strong>{" "}{observation.statement}</span>
                        </label>
                    ))}
                </div>
            ) : (
                <p style={{ color: "#6b7280" }}>Record observations first so they can support this interpretation.</p>
            )}

            <textarea value={statement} onChange={(event) => setStatement(event.target.value)} placeholder="State what you believe the passage means..." rows={5} disabled={saving} style={{ width: "100%", resize: "vertical", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 8, padding: 12, font: "inherit" }} />

            <button type="button" onClick={saveInterpretation} disabled={saving} style={{ marginTop: 12, border: 0, borderRadius: 8, background: saving ? "#9ca3af" : "#111827", color: "#ffffff", padding: "10px 14px", fontWeight: 600 }}>
                {saving ? "Saving..." : "Save Interpretation"}
            </button>

            {error && <p style={{ margin: "10px 0 0", color: "#b91c1c" }}>{error}</p>}
            {message && <p style={{ margin: "10px 0 0", color: "#166534" }}>{message}</p>}
        </section>
    );
}
