"use client";

import { useState } from "react";

import type { ApplicationViewModel, InterpretationViewModel, ObservationWorkspaceService } from "@bsmp/study";

export interface ApplicationHistoryProps {
    readonly applications: readonly ApplicationViewModel[];
    readonly interpretations: readonly InterpretationViewModel[];
    readonly workspace: ObservationWorkspaceService;
    readonly onUpdated?: (application: ApplicationViewModel) => void;
    readonly onDeleted?: (applicationId: string) => void;
    readonly onInterpretationSelect?: (interpretationId: string) => void;
}

export function ApplicationHistory({
    applications,
    interpretations,
    workspace,
    onUpdated,
    onDeleted,
    onInterpretationSelect,
}: ApplicationHistoryProps) {
    const interpretationMap = new Map(interpretations.map((item) => [item.id, item.statement]));
    const [editingId, setEditingId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, Omit<ApplicationViewModel, "id" | "createdAt">>>({});
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    function startEdit(application: ApplicationViewModel) {
        setError(null);
        setMessage(null);
        setEditingId(application.id);
        setDrafts((current) => ({
            ...current,
            [application.id]: {
                interpretationId: application.interpretationId,
                principle: application.principle,
                personal: application.personal,
                ministry: application.ministry,
                action: application.action,
            },
        }));
    }

    async function saveEdit(application: ApplicationViewModel) {
        const draft = drafts[application.id];
        if (!draft || !draft.principle.trim() || !draft.personal.trim() || !draft.ministry.trim() || !draft.action.trim()) {
            setError("Complete all four application fields before saving.");
            return;
        }

        const next: ApplicationViewModel = {
            ...application,
            principle: draft.principle.trim(),
            personal: draft.personal.trim(),
            ministry: draft.ministry.trim(),
            action: draft.action.trim(),
        };

        setError(null);
        setMessage(null);
        setEditingId(null);
        setBusyId(application.id);
        onUpdated?.(next);

        try {
            await workspace.updateApplication(
                application.id,
                next.principle,
                next.personal,
                next.ministry,
                next.action,
            );
            setMessage("Application updated.");
        } catch (reason) {
            onUpdated?.(application);
            setEditingId(application.id);
            setError(reason instanceof Error ? reason.message : "Unable to update application.");
        } finally {
            setBusyId(null);
        }
    }

    async function deleteApplication(application: ApplicationViewModel) {
        if (!window.confirm("Delete this application?")) return;

        setError(null);
        setMessage(null);
        setBusyId(application.id);
        onDeleted?.(application.id);

        try {
            await workspace.removeApplication(application.id);
            setMessage("Application deleted.");
        } catch (reason) {
            onUpdated?.(application);
            setError(reason instanceof Error ? reason.message : "Unable to delete application.");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <section style={{ marginTop: 20 }}>
            <h2 style={{ marginBottom: 12, fontSize: 20 }}>Application History</h2>

            {applications.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No applications recorded yet.</p>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {applications.map((application) => {
                        const draft = drafts[application.id];
                        const editing = editingId === application.id;
                        const busy = busyId === application.id;

                        return (
                            <article
                                key={application.id}
                                style={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 12,
                                    background: "#fff",
                                    padding: 16,
                                }}
                            >
                                <p style={{ marginTop: 0, fontSize: 13, color: "#6b7280" }}>
                                    <strong>From interpretation:</strong>{" "}
                                    {interpretationMap.has(application.interpretationId) ? (
                                        <button
                                            type="button"
                                            onClick={() => onInterpretationSelect?.(application.interpretationId)}
                                            style={{ border: 0, background: "transparent", padding: 0, color: "#1d4ed8", textDecoration: "underline", cursor: "pointer" }}
                                        >
                                            {interpretationMap.get(application.interpretationId)}
                                        </button>
                                    ) : application.interpretationId}
                                </p>

                                {editing && draft ? (
                                    <div style={{ display: "grid", gap: 10 }}>
                                        <Field label="Principle" value={draft.principle} onChange={(value) => setDrafts((current) => ({ ...current, [application.id]: { ...draft, principle: value } }))} />
                                        <Field label="Personal" value={draft.personal} onChange={(value) => setDrafts((current) => ({ ...current, [application.id]: { ...draft, personal: value } }))} />
                                        <Field label="Ministry" value={draft.ministry} onChange={(value) => setDrafts((current) => ({ ...current, [application.id]: { ...draft, ministry: value } }))} />
                                        <Field label="Action" value={draft.action} onChange={(value) => setDrafts((current) => ({ ...current, [application.id]: { ...draft, action: value } }))} />

                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button type="button" disabled={busy} onClick={() => void saveEdit(application)}>
                                                {busy ? "Saving..." : "Save Changes"}
                                            </button>
                                            <button type="button" disabled={busy} onClick={() => setEditingId(null)}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: "grid", gap: 10 }}>
                                            <Block title="Principle" value={application.principle} />
                                            <Block title="Personal" value={application.personal} />
                                            <Block title="Ministry" value={application.ministry} />
                                            <Block title="Action" value={application.action} />
                                        </div>

                                        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                                            <button type="button" disabled={busy} onClick={() => startEdit(application)}>
                                                Edit
                                            </button>
                                            <button type="button" disabled={busy} onClick={() => void deleteApplication(application)}>
                                                {busy ? "Saving..." : "Delete"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
            {message && <p style={{ color: "#166534" }}>{message}</p>}
        </section>
    );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
            <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} style={{ width: "100%", boxSizing: "border-box", resize: "vertical", border: "1px solid #d1d5db", borderRadius: 8, padding: 10, font: "inherit" }} />
        </label>
    );
}

function Block({ title, value }: { title: string; value: string }) {
    return <div><strong>{title}</strong><p style={{ margin: "4px 0 0" }}>{value}</p></div>;
}
