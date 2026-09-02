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

function observationTargetLabel(observation: ObservationViewModel): string {
    if (observation.target.wordIndex !== null && observation.target.wordText) {
        return `${observation.verseReference} · word: “${observation.target.wordText}”`;
    }
    if (observation.target.wordText) {
        return `${observation.verseReference} · text: “${observation.target.wordText}”`;
    }
    return observation.verseReference;
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
        if (selectedObservationIds.length === 0) {
            setError("Select at least one supporting observation before saving an interpretation.");
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
            setMessage(
                `Interpretation saved with ${selectedObservationIds.length} supporting observation${selectedObservationIds.length === 1 ? "" : "s"}.`,
            );
            await onSaved();
        } catch (saveError) {
            onRollbackCreate?.(optimisticId);
            setError(saveError instanceof Error ? saveError.message : "Unable to save interpretation.");
        } finally {
            setSaving(false);
        }
    }

    const canSave = !saving && Boolean(statement.trim()) && selectedObservationIds.length > 0;

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
                        Select the observations that provide the textual basis for this interpretation.
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                        {selectedObservationIds.length} supporting observation{selectedObservationIds.length === 1 ? "" : "s"} selected.
                    </p>
                    {observations.map((observation) => {
                        const selected = selectedObservationIds.includes(observation.id);
                        return (
                            <label
                                key={observation.id}
                                style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, background: selected ? "#eff6ff" : "#ffffff" }}
                            >
                                <input type="checkbox" checked={selected} onChange={() => toggleObservation(observation.id)} disabled={saving} />
                                <span>
                                    <strong>{observationTargetLabel(observation)}</strong>
                                    <span style={{ display: "block", marginTop: 2, color: "#4b5563" }}>{observation.statement}</span>
                                </span>
                            </label>
                        );
                    })}
                </div>
            ) : (
                <p style={{ color: "#6b7280" }}>Record observations first so they can support this interpretation.</p>
            )}

            <textarea value={statement} onChange={(event) => setStatement(event.target.value)} placeholder="State what you believe the passage means..." rows={5} disabled={saving} style={{ width: "100%", resize: "vertical", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 8, padding: 12, font: "inherit" }} />

            <button type="button" onClick={() => void saveInterpretation()} disabled={!canSave} style={{ marginTop: 12, border: 0, borderRadius: 8, background: canSave ? "#111827" : "#9ca3af", color: "#ffffff", padding: "10px 14px", fontWeight: 600, cursor: canSave ? "pointer" : "not-allowed" }}>
                {saving ? "Saving..." : "Save Interpretation"}
            </button>

            {error && <p style={{ margin: "10px 0 0", color: "#b91c1c" }}>{error}</p>}
            {message && <p style={{ margin: "10px 0 0", color: "#166534" }}>{message}</p>}
        </section>
    );
}
