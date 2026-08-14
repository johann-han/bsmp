"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpositorySermon } from "@bsmp/preaching";
import { SermonContext, SermonConclusion, SermonIntroduction } from "@bsmp/preaching";
import { StudyId } from "@bsmp/study";
import type { StudySession } from "@bsmp/study";
import { AppShell } from "@repo/ui";

import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";

interface Props {
    studyId: string;
}

export function SermonFrameworkWorkspace({ studyId }: Props) {
    const router = useRouter();
    const [study, setStudy] = useState<StudySession | null>(null);
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
    const [introduction, setIntroduction] = useState("");
    const [context, setContext] = useState("");
    const [conclusion, setConclusion] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!studyId) {
                setLoading(false);
                setError("A study is required to open the Sermon Framework.");
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
                if (!nextSermon) throw new Error("Create the Sermon Preparation before editing its framework.");

                setStudy(nextStudy);
                setSermon(nextSermon);
                setIntroduction(nextSermon.introduction?.value ?? "");
                setContext(nextSermon.context?.value ?? "");
                setConclusion(nextSermon.conclusion?.value ?? "");
            } catch (reason: unknown) {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load the Sermon Framework.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, [studyId]);

    async function save() {
        if (!sermon) return;
        setSaving(true);
        setMessage(null);
        setError(null);

        try {
            sermon.defineIntroduction(SermonIntroduction.from(introduction));
            sermon.defineContext(SermonContext.from(context));
            sermon.defineConclusion(SermonConclusion.from(conclusion));
            await new SupabaseExpositorySermonRepository().save(sermon);
            setMessage("Sermon framework saved.");
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to save the Sermon Framework.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <AppShell title="Sermon Framework">
                <div style={{ display: "grid", gap: 16 }}>
                    {["Introduction", "Context / Setting", "Conclusion"].map((label) => (
                        <section key={label} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fff" }}>
                            <div style={{ width: 160, height: 18, background: "#e5e7eb", borderRadius: 6, marginBottom: 12 }} />
                            <div style={{ width: "100%", height: 100, background: "#f3f4f6", borderRadius: 8 }} />
                        </section>
                    ))}
                </div>
            </AppShell>
        );
    }

    if (error || !sermon || !study) {
        return (
            <AppShell title="Sermon Framework">
                <p style={{ color: "#b91c1c" }}>{error ?? "The Sermon Framework could not be loaded."}</p>
                <button type="button" onClick={() => router.push(`/preaching?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>
                    ← Back to Sermon Preparation
                </button>
            </AppShell>
        );
    }

    return (
        <AppShell title="Sermon Framework">
            <div style={{ display: "grid", gap: 20 }}>
                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Expository Sermon Preparation</div>
                    <h2 style={{ marginBottom: 8 }}>{sermon.title.value}</h2>
                    <p style={{ margin: "4px 0" }}><strong>Passage:</strong> {sermon.passage.toString()}</p>
                    <p style={{ margin: "4px 0" }}><strong>Study:</strong> {study.title.value}</p>
                    {sermon.bigIdea && <p style={{ margin: "12px 0 4px" }}><strong>Big Idea:</strong> {sermon.bigIdea.value}</p>}
                    {sermon.purpose && <p style={{ margin: "4px 0" }}><strong>Purpose:</strong> {sermon.purpose.value}</p>}
                </section>

                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <h2>Introduction</h2>
                    <p style={{ color: "#6b7280", marginTop: 0 }}>Build the opening that gains attention, introduces the need, and leads naturally into the text.</p>
                    <textarea value={introduction} onChange={(event) => setIntroduction(event.target.value)} rows={7} placeholder="Write the sermon introduction..." style={{ width: "100%", padding: 12, resize: "vertical" }} />
                </section>

                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <h2>Context / Setting</h2>
                    <p style={{ color: "#6b7280", marginTop: 0 }}>Record the historical, literary, and immediate context that the congregation needs before the main exposition.</p>
                    <textarea value={context} onChange={(event) => setContext(event.target.value)} rows={9} placeholder="Record the context and setting..." style={{ width: "100%", padding: 12, resize: "vertical" }} />
                </section>

                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <h2>Conclusion</h2>
                    <p style={{ color: "#6b7280", marginTop: 0 }}>Bring the sermon to a clear landing: restate the truth, press the purpose, and call for an appropriate response.</p>
                    <textarea value={conclusion} onChange={(event) => setConclusion(event.target.value)} rows={7} placeholder="Write the sermon conclusion and response..." style={{ width: "100%", padding: 12, resize: "vertical" }} />
                </section>

                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <button type="button" onClick={() => void save()} disabled={saving} style={{ padding: "10px 16px", fontWeight: 600 }}>
                        {saving ? "Saving..." : "Save Sermon Framework"}
                    </button>
                    <button type="button" onClick={() => router.push(`/preaching?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>
                        ← Back to Sermon Preparation
                    </button>
                    {message && <span style={{ color: "#047857" }}>{message}</span>}
                    {error && <span style={{ color: "#b91c1c" }}>{error}</span>}
                </div>
            </div>
        </AppShell>
    );
}
