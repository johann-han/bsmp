"use client";

import { useState } from "react";

import type {
    EvidenceViewModel,
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

type EvidenceType = (typeof TYPES)[number];

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

    return (
        <section style={{ marginTop: 20, border: "1px solid #e5e7eb", borderRadius: 12, background: "#ffffff", padding: 20 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280" }}>
                Refine Interpretation
            </p>

            {interpretations.map((interpretation) => (
                <article
                    key={interpretation.id}
                    id={`interpretation-tools-${interpretation.id}`}
                    style={{ marginTop: 12, borderTop: "1px solid #f3f4f6", paddingTop: 12, scrollMarginTop: 24 }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <strong>{interpretation.statement}</strong>
                        <button type="button" onClick={() => startEdit(interpretation)}>Edit</button>
                    </div>

                    {interpretation.evidence.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                                Saved Evidence
                            </div>
                            <ul style={{ display: "grid", gap: 8, paddingLeft: 20, margin: 0, fontSize: 13, color: "#4b5563" }}>
                                {interpretation.evidence.map((evidence) => (
                                    <EvidenceItem
                                        key={evidence.id}
                                        interpretationId={interpretation.id}
                                        evidence={evidence}
                                        workspace={workspace}
                                        onSaved={onSaved}
                                    />
                                ))}
                            </ul>
                        </div>
                    )}

                    <EvidenceComposer
                        interpretationId={interpretation.id}
                        workspace={workspace}
                        onSaved={onSaved}
                        onEvidenceChanged={onEvidenceChanged}
                        onEvidenceRollback={onEvidenceRollback}
                    />
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

function EvidenceComposer({
    interpretationId,
    workspace,
    onSaved,
    onEvidenceChanged,
    onEvidenceRollback,
}: {
    readonly interpretationId: string;
    readonly workspace: ObservationWorkspaceService;
    readonly onSaved: () => Promise<void> | void;
    readonly onEvidenceChanged?: (
        interpretationId: string,
        evidence: InterpretationViewModel["evidence"][number],
    ) => void;
    readonly onEvidenceRollback?: (
        interpretationId: string,
        evidenceId: string,
    ) => void;
}) {
    const [evidenceType, setEvidenceType] = useState<EvidenceType>("Scripture");
    const [evidenceDescription, setEvidenceDescription] = useState("");
    const [busy, setBusy] = useState(false);

    async function addEvidence() {
        const description = evidenceDescription.trim();
        if (!description || busy) return;

        const optimisticEvidence: InterpretationViewModel["evidence"][number] = {
            id: crypto.randomUUID(),
            type: evidenceType,
            description,
            createdAt: new Date().toISOString(),
        };

        setBusy(true);
        onEvidenceChanged?.(interpretationId, optimisticEvidence);
        setEvidenceDescription("");

        try {
            await workspace.addEvidence(interpretationId, evidenceType, description);
            void onSaved();
        } catch (reason) {
            onEvidenceRollback?.(interpretationId, optimisticEvidence.id);
            setEvidenceDescription(description);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ display: "grid", gap: 8, marginTop: 14, padding: 12, border: "1px dashed #d1d5db", borderRadius: 10, background: "#fafafa" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Add Evidence
            </div>
            <select
                value={evidenceType}
                onChange={(event) => setEvidenceType(event.target.value as EvidenceType)}
                disabled={busy}
            >
                {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <textarea
                value={evidenceDescription}
                onChange={(event) => setEvidenceDescription(event.target.value)}
                placeholder="Add evidence supporting this interpretation..."
                rows={3}
                disabled={busy}
                style={{ width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 8, padding: 10, font: "inherit" }}
            />
            <button type="button" onClick={() => void addEvidence()} disabled={busy || !evidenceDescription.trim()}>
                {busy ? "Saving Evidence..." : "Add Evidence"}
            </button>
        </div>
    );
}

function EvidenceItem({
    interpretationId,
    evidence,
    workspace,
    onSaved,
}: {
    readonly interpretationId: string;
    readonly evidence: EvidenceViewModel;
    readonly workspace: ObservationWorkspaceService;
    readonly onSaved: () => Promise<void> | void;
}) {
    const [editing, setEditing] = useState(false);
    const [draftType, setDraftType] = useState<EvidenceType>(toEvidenceType(evidence.type));
    const [draftDescription, setDraftDescription] = useState(evidence.description);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function startEdit() {
        setDraftType(toEvidenceType(evidence.type));
        setDraftDescription(evidence.description);
        setError(null);
        setEditing(true);
    }

    function cancelEdit() {
        setDraftType(toEvidenceType(evidence.type));
        setDraftDescription(evidence.description);
        setError(null);
        setEditing(false);
    }

    async function saveEdit() {
        const description = draftDescription.trim();
        if (!description) {
            setError("Enter an evidence description before saving.");
            return;
        }

        setBusy(true);
        setError(null);
        try {
            await workspace.updateEvidence(
                interpretationId,
                evidence.id,
                draftType,
                description,
            );
            setEditing(false);
            await onSaved();
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to update evidence.");
        } finally {
            setBusy(false);
        }
    }

    if (!editing) {
        return (
            <li id={`evidence-${evidence.id}`} style={{ scrollMarginTop: 24 }}>
                <strong>{evidence.type}:</strong> {evidence.description}{" "}
                <button type="button" onClick={startEdit} style={{ marginLeft: 6 }}>Edit</button>
                {error && <span style={{ marginLeft: 8, color: "#b91c1c" }}>{error}</span>}
            </li>
        );
    }

    return (
        <li id={`evidence-${evidence.id}`} style={{ display: "grid", gap: 8, scrollMarginTop: 24, listStyle: "none", marginLeft: -20 }}>
            <select value={draftType} onChange={(event) => setDraftType(event.target.value as EvidenceType)} disabled={busy}>
                {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} disabled={busy} rows={3} style={{ width: "100%", boxSizing: "border-box", resize: "vertical", border: "1px solid #d1d5db", borderRadius: 8, padding: 10, font: "inherit" }} />
            <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => void saveEdit()} disabled={busy}>{busy ? "Saving..." : "Save Changes"}</button>
                <button type="button" onClick={cancelEdit} disabled={busy}>Cancel</button>
            </div>
            {error && <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p>}
        </li>
    );
}

function toEvidenceType(value: string): EvidenceType {
    return TYPES.includes(value as EvidenceType) ? value as EvidenceType : "Other";
}
