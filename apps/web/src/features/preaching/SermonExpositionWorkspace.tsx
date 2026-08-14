"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpositorySermon } from "@bsmp/preaching";
import type { StudySession } from "@bsmp/study";
import { StudyId } from "@bsmp/study";
import { AppShell } from "@repo/ui";

import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";

interface Props {
    studyId: string;
}

type Draft = {
    explanation: string;
    illustration: string;
    application: string;
    transition: string;
};

function emptyDraft(): Draft {
    return { explanation: "", illustration: "", application: "", transition: "" };
}

export function SermonExpositionWorkspace({ studyId }: Props) {
    const router = useRouter();
    const [study, setStudy] = useState<StudySession | null>(null);
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
    const [drafts, setDrafts] = useState<Record<string, Draft>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!studyId) {
                setError("A study is required to open sermon exposition.");
                setLoading(false);
                return;
            }

            try {
                const studyRepository = new SupabaseStudyRepository();
                const sermonRepository = new SupabaseExpositorySermonRepository();
                const [nextStudy, nextSermon] = await Promise.all([
                    studyRepository.find(StudyId.from(studyId)),
                    sermonRepository.findByStudyId(studyId),
                ]);

                if (cancelled) return;
                if (!nextStudy) throw new Error("The selected study could not be found.");
                if (!nextSermon) throw new Error("Create Sermon Preparation before developing exposition.");

                setStudy(nextStudy);
                setSermon(nextSermon);
                setDrafts(Object.fromEntries(nextSermon.outline.map((point) => [point.id, {
                    explanation: point.explanation,
                    illustration: point.illustration,
                    application: point.application,
                    transition: point.transition,
                }])));
            } catch (reason: unknown) {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load sermon exposition.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, [studyId]);

    function updateDraft(pointId: string, key: keyof Draft, value: string) {
        setDrafts((current) => ({
            ...current,
            [pointId]: { ...(current[pointId] ?? emptyDraft()), [key]: value },
        }));
    }

    async function save() {
        if (!sermon) return;
        setSaving(true);
        setMessage(null);
        setError(null);

        try {
            for (const point of sermon.outline) {
                const draft = drafts[point.id] ?? emptyDraft();
                sermon.defineOutlinePointExposition(point.id, draft);
            }

            await new SupabaseExpositorySermonRepository().save(sermon);
            setMessage("Sermon exposition saved.");
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to save sermon exposition.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <AppShell title="Sermon Exposition">
                <div style={{ display: "grid", gap: 16 }}>
                    {[1, 2, 3].map((item) => (
                        <section key={item} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fff" }}>
                            <div style={{ width: 240, height: 18, background: "#e5e7eb", borderRadius: 6, marginBottom: 14 }} />
                            <div style={{ width: "100%", height: 90, background: "#f3f4f6", borderRadius: 8 }} />
                        </section>
                    ))}
                </div>
            </AppShell>
        );
    }

    if (error || !sermon || !study) {
        return (
            <AppShell title="Sermon Exposition">
                <p style={{ color: "#b91c1c" }}>{error ?? "Sermon exposition could not be loaded."}</p>
                <button type="button" onClick={() => router.push(`/preaching?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>
                    ← Back to Sermon Preparation
                </button>
            </AppShell>
        );
    }

    return (
        <AppShell title="Sermon Exposition">
            <div style={{ display: "grid", gap: 20 }}>
                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Expository Sermon Preparation</div>
                    <h2 style={{ margin: "4px 0 8px" }}>{sermon.title.value}</h2>
                    <p style={{ margin: "4px 0" }}><strong>Study:</strong> {study.title.value}</p>
                    <p style={{ margin: "4px 0" }}><strong>Passage:</strong> {sermon.passage.toString()}</p>
                    {sermon.bigIdea && <p style={{ margin: "12px 0 4px" }}><strong>Big Idea:</strong> {sermon.bigIdea.value}</p>}
                </section>

                {sermon.outline.length === 0 ? (
                    <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                        <strong>No outline points yet.</strong>
                        <p>Create at least one outline point before developing the exposition.</p>
                        <button type="button" onClick={() => router.push(`/preaching?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>Back to Sermon Preparation</button>
                    </section>
                ) : (
                    sermon.outline.map((point, index) => {
                        const draft = drafts[point.id] ?? emptyDraft();
                        return (
                            <section key={point.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontSize: 13, color: "#6b7280" }}>Outline Point {index + 1}</div>
                                        <h2 style={{ margin: "4px 0" }}>{point.heading}</h2>
                                        <p style={{ marginTop: 0 }}><strong>Truth:</strong> {point.truth}</p>
                                    </div>
                                    <a href={`/workspace?studyId=${encodeURIComponent(studyId)}#application-${encodeURIComponent(point.id)}`} style={{ fontSize: 13, color: "#1d4ed8" }}>Study Workspace</a>
                                </div>

                                <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
                                    <label>
                                        <strong>Explanation</strong>
                                        <div style={{ color: "#6b7280", margin: "4px 0 6px" }}>What does the text say, and how does the point develop from the passage?</div>
                                        <textarea value={draft.explanation} onChange={(event) => updateDraft(point.id, "explanation", event.target.value)} rows={6} placeholder="Explain the meaning and movement of the text..." style={{ width: "100%", padding: 12, resize: "vertical" }} />
                                    </label>
                                    <label>
                                        <strong>Illustration</strong>
                                        <div style={{ color: "#6b7280", margin: "4px 0 6px" }}>What image, example, story, or analogy will clarify this truth?</div>
                                        <textarea value={draft.illustration} onChange={(event) => updateDraft(point.id, "illustration", event.target.value)} rows={5} placeholder="Develop an illustration..." style={{ width: "100%", padding: 12, resize: "vertical" }} />
                                    </label>
                                    <label>
                                        <strong>Application</strong>
                                        <div style={{ color: "#6b7280", margin: "4px 0 6px" }}>How should this truth change the believer's life?</div>
                                        <textarea value={draft.application} onChange={(event) => updateDraft(point.id, "application", event.target.value)} rows={5} placeholder="Develop the point-specific application..." style={{ width: "100%", padding: 12, resize: "vertical" }} />
                                    </label>
                                    <label>
                                        <strong>Transition</strong>
                                        <div style={{ color: "#6b7280", margin: "4px 0 6px" }}>How will you move naturally from this point to the next?</div>
                                        <textarea value={draft.transition} onChange={(event) => updateDraft(point.id, "transition", event.target.value)} rows={4} placeholder="Write the transition..." style={{ width: "100%", padding: 12, resize: "vertical" }} />
                                    </label>
                                </div>
                            </section>
                        );
                    })
                )}

                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <button type="button" onClick={() => void save()} disabled={saving || sermon.outline.length === 0} style={{ padding: "10px 16px", fontWeight: 600 }}>
                        {saving ? "Saving..." : "Save Sermon Exposition"}
                    </button>
                    <button type="button" onClick={() => router.push(`/preaching?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>← Back to Sermon Preparation</button>
                    {message && <span style={{ color: "#047857" }}>{message}</span>}
                    {error && <span style={{ color: "#b91c1c" }}>{error}</span>}
                </div>
            </div>
        </AppShell>
    );
}
