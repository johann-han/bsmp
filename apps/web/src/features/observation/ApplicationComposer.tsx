"use client";

import { useState } from "react";
import type { ApplicationViewModel, InterpretationViewModel, ObservationWorkspaceService } from "@bsmp/study";

export interface ApplicationComposerProps {
    readonly workspace: ObservationWorkspaceService;
    readonly interpretations: readonly InterpretationViewModel[];
    readonly onSaved: () => Promise<void> | void;
    readonly onOptimisticCreate?: (application: ApplicationViewModel) => void;
    readonly onRollbackCreate?: (id: string) => void;
}

export function ApplicationComposer({ workspace, interpretations, onSaved, onOptimisticCreate, onRollbackCreate }: ApplicationComposerProps) {
    const [interpretationId, setInterpretationId] = useState(interpretations[0]?.id ?? "");
    const [principle, setPrinciple] = useState("");
    const [personal, setPersonal] = useState("");
    const [ministry, setMinistry] = useState("");
    const [action, setAction] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function save() {
        const values = [principle, personal, ministry, action].map((value) => value.trim());
        if (!interpretationId || values.some((value) => !value)) {
            setError("Complete all four application fields and select an interpretation.");
            return;
        }
        setError(null);
        setMessage(null);
        setSaving(true);
        const optimisticId = crypto.randomUUID();
        onOptimisticCreate?.({
            id: optimisticId,
            interpretationId,
            principle: values[0],
            personal: values[1],
            ministry: values[2],
            action: values[3],
            createdAt: new Date().toISOString(),
        });
        try {
            await workspace.addApplication(interpretationId, values[0], values[1], values[2], values[3]);
            setPrinciple(""); setPersonal(""); setMinistry(""); setAction("");
            setMessage("Application saved.");
            await onSaved();
        } catch (reason) {
            onRollbackCreate?.(optimisticId);
            setError(reason instanceof Error ? reason.message : "Unable to save application.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section style={{ marginTop: 20, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 20 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280" }}>Application</p>
            <h2 style={{ margin: "4px 0 16px", fontSize: 20 }}>How should this truth change life?</h2>

            {interpretations.length === 0 ? (
                <p style={{ color: "#6b7280" }}>Create an interpretation first so the application can be anchored to it.</p>
            ) : (
                <>
                    <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Interpretation</span>
                        <select value={interpretationId} onChange={(event) => setInterpretationId(event.target.value)} disabled={saving} style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: 10 }}>
                            {interpretations.map((interpretation) => <option key={interpretation.id} value={interpretation.id}>{interpretation.statement}</option>)}
                        </select>
                    </label>
                    <Field label="Principle" value={principle} onChange={setPrinciple} placeholder="What enduring truth should govern this response?" disabled={saving} />
                    <Field label="Personal Application" value={personal} onChange={setPersonal} placeholder="How should this change me?" disabled={saving} />
                    <Field label="Ministry Application" value={ministry} onChange={setMinistry} placeholder="How should this shape my ministry toward others?" disabled={saving} />
                    <Field label="Action" value={action} onChange={setAction} placeholder="What concrete step will I take?" disabled={saving} />
                    <button type="button" onClick={save} disabled={saving} style={{ marginTop: 4, border: 0, borderRadius: 8, background: saving ? "#9ca3af" : "#111827", color: "#fff", padding: "10px 14px", fontWeight: 600 }}>
                        {saving ? "Saving..." : "Save Application"}
                    </button>
                </>
            )}

            {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
            {message && <p style={{ color: "#166534" }}>{message}</p>}
        </section>
    );
}

function Field({ label, value, onChange, placeholder, disabled = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; disabled?: boolean }) {
    return (
        <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
            <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} disabled={disabled} style={{ width: "100%", boxSizing: "border-box", resize: "vertical", border: "1px solid #d1d5db", borderRadius: 8, padding: 10, font: "inherit" }} />
        </label>
    );
}
