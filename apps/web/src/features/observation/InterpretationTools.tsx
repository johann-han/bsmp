"use client";

import { useState } from "react";

import type {
    InterpretationViewModel,
    ObservationViewModel,
    ObservationWorkspaceService,
} from "@bsmp/study";

const TYPES = [
    "Scripture",
    "CrossReference",
    "OriginalLanguage",
    "Historical",
    "Geographical",
    "Literary",
    "PersonalNote",
    "Other",
] as const;

export interface InterpretationToolsProps {
    readonly interpretations: readonly InterpretationViewModel[];
    readonly observations: readonly ObservationViewModel[];
    readonly workspace: ObservationWorkspaceService;
    readonly onSaved: () => Promise<void> | void;
    readonly onChanged?: (interpretation: InterpretationViewModel) => void;
    readonly onEvidenceChanged?: (
        interpretationId: string,
        evidence: InterpretationViewModel["evidence"][number],
    ) => void;
    readonly onEvidenceRollback?: (
        interpretationId: string,
        evidenceId: string,
    ) => void;
}

export function InterpretationTools({
    interpretations,
    observations,
    workspace,
    onSaved,
    onChanged,
    onEvidenceChanged,
    onEvidenceRollback,
}: InterpretationToolsProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [statement, setStatement] = useState("");
    const [selectedObservationIds, setSelectedObservationIds] = useState<string[]>([]);
    const [evidenceType, setEvidenceType] = useState<(typeof TYPES)[number]>("Scripture");
    const [evidenceDescription, setEvidenceDescription] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const selected = interpretations.find((item) => item.id === editingId) ?? null;

    function startEdit(interpretation: InterpretationViewModel) {
        setEditingId(interpretation.id);
        setStatement(interpretation.statement);
        setSelectedObservationIds([...interpretation.observationIds]);
        setMessage(null);
        setError(null);
    }

    function toggleObservation(id: string) {
        setSelectedObservationIds((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
    }

    async function saveChanges() {
        if (!selected || !statement.trim()) {
            setError("Enter an interpretation before saving.");
            return;
        }

        setError(null);
        setMessage(null);

        const previous = selected;
        const next: InterpretationViewModel = {
            ...selected,
            statement: statement.trim(),
            observationIds: [...selectedObservationIds],
        };

        onChanged?.(next);
        setEditingId(null);
        setMessage("Interpretation updated.");

        try {
            await workspace.updateInterpretation(selected.id, next.statement, next.observationIds);
            void onSaved();
        } catch (reason) {
            onChanged?.(previous);
            setEditingId(selected.id);
            setError(reason instanceof Error ? reason.message : "Unable to update interpretation.");
        }
    }

    async function addEvidence(interpretationId: string) {
        if (!evidenceDescription.trim()) {
            setError("Enter an evidence description before saving.");
            return;
        }

        const description = evidenceDescription.trim();
        const optimisticEvidence: InterpretationViewModel["evidence"][number] = {
            id: crypto.randomUUID(),
            type: evidenceType,
            description,
            createdAt: new Date().toISOString(),
        };

        onEvidenceChanged?.(interpretationId, optimisticEvidence);
        setEvidenceDescription("");
        setMessage("Evidence added.");
        setError(null);

        try {
            await workspace.addEvidence(interpretationId, evidenceType, description);
            void onSaved();
        } catch (reason) {
            onEvidenceRollback?.(interpretationId, optimisticEvidence.id);
            setError(reason instanceof Error ? reason.message : "Unable to save evidence.");
        }
    }

    return (
        <section style={{ marginTop: 20, border: "1px solid #e5e7eb", borderRadius: 12, background: "#ffffff", padding: 20 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280" }}>
                Refine Interpretation
            </p>

            {interpretations.map((interpretation) => (
                <article
                    id={`interpretation-${interpretation.id}`}
                    key={interpretation.id}
                    style={{ marginTop: 12, borderTop: "1px solid #f3f4f6", paddingTop: 12, scrollMarginTop: 24 }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <strong>{interpretation.statement}</strong>
                        <button type="button" onClick={() => startEdit(interpretation)}>Edit</button>
                    </div>

                    {interpretation.evidence.length > 0 && (
                        <ul style={{ fontSize: 13, color: "#4b5563" }}>
                            {interpretation.evidence.map((evidence) => (
                                <li key={evidence.id}><strong>{evidence.type}:</strong> {evidence.description}</li>
                            ))}
                        </ul>
                    )}

                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                        <select value={evidenceType} onChange={(event) => setEvidenceType(event.target.value as (typeof TYPES)[number])}>
                            {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <textarea value={evidenceDescription} onChange={(event) => setEvidenceDescription(event.target.value)} placeholder="Add evidence supporting this interpretation..." rows={3} style={{ width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 8, padding: 10, font: "inherit" }} />
                        <button type="button" onClick={() => addEvidence(interpretation.id)}>Add Evidence</button>
                    </div>
                </article>
            ))}

            {selected && (
                <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
                    <textarea value={statement} onChange={(event) => setStatement(event.target.value)} rows={4} style={{ width: "100%", boxSizing: "border-box", resize: "vertical", border: "1px solid #d1d5db", borderRadius: 8, padding: 10, font: "inherit" }} />
                    <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
                        <strong>Supporting observations</strong>
                        {observations.map((observation) => (
                            <label key={observation.id} style={{ display: "flex", gap: 8 }}>
                                <input type="checkbox" checked={selectedObservationIds.includes(observation.id)} onChange={() => toggleObservation(observation.id)} />
                                <span>{observation.verseReference} — {observation.statement}</span>
                            </label>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button type="button" onClick={saveChanges}>Save Changes</button>
                        <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                </div>
            )}

            {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
            {message && <p style={{ color: "#166534" }}>{message}</p>}
        </section>
    );
}
