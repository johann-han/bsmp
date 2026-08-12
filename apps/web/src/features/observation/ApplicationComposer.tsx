"use client";

import { useState } from "react";
import type { InterpretationViewModel, ObservationWorkspaceService } from "@bsmp/study";

export interface ApplicationComposerProps {
    readonly workspace: ObservationWorkspaceService;
    readonly interpretations: readonly InterpretationViewModel[];
    readonly onSaved: () => Promise<void> | void;
}

export function ApplicationComposer({ workspace, interpretations, onSaved }: ApplicationComposerProps) {
    const [interpretationId, setInterpretationId] = useState(interpretations[0]?.id ?? "");
    const [principle, setPrinciple] = useState("");
    const [personal, setPersonal] = useState("");
    const [ministry, setMinistry] = useState("");
    const [action, setAction] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function save() {
        if (!interpretationId || !principle.trim() || !personal.trim() || !ministry.trim() || !action.trim()) {
            setError("Complete all four application fields and select an interpretation.");
            return;
        }
        setError(null);
        setMessage(null);
        try {
            await workspace.addApplication(interpretationId, principle, personal, ministry, action);
            await onSaved();
            setPrinciple(""); setPersonal(""); setMinistry(""); setAction("");
            setMessage("Application saved.");
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to save application.");
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
                        <select value={interpretationId} onChange={(event) => setInterpretationId(event.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: 10 }}>
                            {interpretations.map((interpretation) => <option key={interpretation.id} value={interpretation.id}>{interpretation.statement}</option>)}
                        </select>
                    </label>
                    <Field label="Principle" value={principle} onChange={setPrinciple} placeholder="What enduring truth should govern this response?" />
                    <Field label="Personal Application" value={personal} onChange={setPersonal} placeholder="How should this change me?" />
                    <Field label="Ministry Application" value={ministry} onChange={setMinistry} placeholder="How should this shape my ministry toward others?" />
                    <Field label="Action" value={action} onChange={setAction} placeholder="What concrete step will I take?" />
                    <button type="button" onClick={save} style={{ marginTop: 4, border: 0, borderRadius: 8, background: "#111827", color: "#fff", padding: "10px 14px", fontWeight: 600 }}>Save Application</button>
                </>
            )}

            {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
            {message && <p style={{ color: "#166534" }}>{message}</p>}
        </section>
    );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
    return (
        <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
            <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} style={{ width: "100%", boxSizing: "border-box", resize: "vertical", border: "1px solid #d1d5db", borderRadius: 8, padding: 10, font: "inherit" }} />
        </label>
    );
}
