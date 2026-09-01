"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpositorySermon } from "@bsmp/preaching";
import { buildSermonManuscript, SermonDeliveryNotes as SermonDeliveryNotesValue, SermonManuscript as SermonManuscriptValue } from "@bsmp/preaching";
import { StudyId } from "@bsmp/study";
import type { StudySession } from "@bsmp/study";
import { AppShell } from "@repo/ui";
import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";

interface Props { studyId: string; }

export function SermonFinalDraftWorkspace({ studyId }: Props) {
    const router = useRouter();
    const [study, setStudy] = useState<StudySession | null>(null);
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
    const [manuscript, setManuscript] = useState("");
    const [deliveryNotes, setDeliveryNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!studyId) { setError("A study is required to open the final sermon draft."); setLoading(false); return; }
            try {
                const studyRepository = new SupabaseStudyRepository();
                const sermonRepository = new SupabaseExpositorySermonRepository();
                const [nextStudy, nextSermon] = await Promise.all([
                    studyRepository.find(StudyId.from(studyId)),
                    sermonRepository.findByStudyId(studyId),
                ]);
                if (cancelled) return;
                if (!nextStudy) throw new Error("The selected study could not be found.");
                if (!nextSermon) throw new Error("Create Sermon Preparation before drafting the final sermon.");
                setStudy(nextStudy);
                setSermon(nextSermon);
                setManuscript(nextSermon.manuscript?.value ?? "");
                setDeliveryNotes(nextSermon.deliveryNotes?.value ?? "");
            } catch (reason: unknown) {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load the final sermon draft.");
            } finally { if (!cancelled) setLoading(false); }
        }
        void load();
        return () => { cancelled = true; };
    }, [studyId]);

    const wordCount = useMemo(() => manuscript.trim() ? manuscript.trim().split(/\s+/).length : 0, [manuscript]);
    const estimatedMinutes = Math.max(0, Math.round((wordCount / 130) * 10) / 10);
    const hasOutlineMaterial = Boolean(sermon?.outline.some((point) => point.text || point.explanation || point.illustration || point.application));

    function insertStructuredDraft() {
        if (!sermon) return;
        if (manuscript.trim() && !window.confirm("Replace the current manuscript with a structured draft from the sermon preparation?")) return;
        setManuscript(buildSermonManuscript(sermon));
        setMessage("Structured draft inserted. Revise it into your final preaching manuscript.");
        setError(null);
    }

    async function save() {
        if (!sermon) return;
        setSaving(true); setMessage(null); setError(null);
        try {
            sermon.defineManuscript(SermonManuscriptValue.from(manuscript));
            sermon.defineDeliveryNotes(SermonDeliveryNotesValue.from(deliveryNotes));
            await new SupabaseExpositorySermonRepository().save(sermon);
            setMessage("Final sermon draft saved.");
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to save the final sermon draft.");
        } finally { setSaving(false); }
    }

    if (loading) return <AppShell title="Final Sermon Draft"><p>Loading final sermon drafting...</p></AppShell>;
    if (error || !sermon || !study) return <AppShell title="Final Sermon Draft"><p style={{ color: "#b91c1c" }}>{error ?? "The final sermon draft could not be loaded."}</p><button type="button" onClick={() => router.push(`/preaching/overview?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>← Back to Sermon Overview</button></AppShell>;

    return (
        <AppShell title="Final Sermon Draft">
            <style>{`@media print { .bsmp-print-hide { display: none !important; } .bsmp-print-page { display: block !important; max-width: none !important; margin: 0 !important; padding: 0 !important; } .bsmp-print-section { border: 0 !important; box-shadow: none !important; padding: 0 !important; background: transparent !important; break-inside: auto; } .bsmp-print-manuscript, .bsmp-print-notes { display: block !important; white-space: pre-wrap; line-height: 1.6 !important; font-size: 14pt !important; } .bsmp-print-meta { font-size: 10pt !important; color: #444 !important; } }`}</style>
            <div className="bsmp-print-page" style={{ display: "grid", gap: 20 }}>
                <section className="bsmp-print-section" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Final Manuscript & Delivery Preparation</div>
                    <h2 style={{ margin: "4px 0 8px" }}>{sermon.title.value}</h2>
                    <p style={{ margin: "4px 0" }}><strong>Study:</strong> {study.title.value}</p>
                    <p style={{ margin: "4px 0" }}><strong>Passage:</strong> {sermon.passage.toString()}</p>
                    {sermon.bigIdea && <p style={{ margin: "12px 0 4px" }}><strong>Big Idea:</strong> {sermon.bigIdea.value}</p>}
                    {sermon.purpose && <p style={{ margin: "4px 0" }}><strong>Purpose:</strong> {sermon.purpose.value}</p>}
                </section>

                <section className="bsmp-print-section" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <div className="bsmp-print-hide" style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "end" }}>
                        <div>
                            <h2 style={{ marginBottom: 6 }}>Final Manuscript</h2>
                            <p style={{ color: "#6b7280", marginTop: 0 }}>Bring the completed framework and exposition together into the sermon manuscript you intend to preach. The Study remains the source of biblical observations, interpretations, evidence, and applications; this field is the preacher's final composed message.</p>
                        </div>
                        <button type="button" onClick={insertStructuredDraft} disabled={!hasOutlineMaterial} style={{ padding: "10px 14px", fontWeight: 600 }}>
                            Build Draft from Outline
                        </button>
                    </div>
                    <div className="bsmp-print-hide" style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
                        <span><strong>{wordCount}</strong> words</span>
                        <span>≈ <strong>{estimatedMinutes}</strong> min at 130 wpm</span>
                    </div>
                    <h2 style={{ display: "none" }} className="bsmp-print-hide">Final Manuscript</h2>
                    <textarea className="bsmp-print-hide" value={manuscript} onChange={(event) => setManuscript(event.target.value)} rows={24} placeholder="Write the final sermon manuscript..." style={{ width: "100%", boxSizing: "border-box", padding: 12, resize: "vertical" }} />
                    <div className="bsmp-print-manuscript" style={{ display: "none", whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.8 }}>{manuscript}</div>
                    <div className="bsmp-print-meta" style={{ display: "none", marginTop: 14 }}>{wordCount} words · approximately {estimatedMinutes} minutes at 130 words per minute</div>
                </section>

                <section className="bsmp-print-section" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <div className="bsmp-print-hide">
                        <h2>Delivery Notes</h2>
                        <p style={{ color: "#6b7280", marginTop: 0 }}>Record preaching cues such as emphasis, pauses, movement, timing, vocal changes, congregational interaction, and the final appeal.</p>
                        <textarea value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} rows={12} placeholder="Write delivery notes..." style={{ width: "100%", boxSizing: "border-box", padding: 12, resize: "vertical" }} />
                    </div>
                    <h2 className="bsmp-print-notes" style={{ display: "none", marginBottom: 12 }}>Delivery Notes</h2>
                    <div className="bsmp-print-notes" style={{ display: "none" }}>{deliveryNotes}</div>
                </section>

                <div className="bsmp-print-hide" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" onClick={() => void save()} disabled={saving} style={{ padding: "10px 16px", fontWeight: 600 }}>{saving ? "Saving..." : "Save Final Draft"}</button>
                    <button type="button" onClick={() => window.print()} style={{ padding: "10px 16px", fontWeight: 600 }}>Print / Save PDF</button>
                    <button type="button" onClick={() => router.push(`/preaching/delivery?studyId=${encodeURIComponent(studyId)}`)} disabled={!manuscript.trim()} style={{ padding: "10px 16px", fontWeight: 600 }}>Open Delivery Mode</button>
                    <button type="button" onClick={() => router.push(`/preaching/overview?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>← Sermon Overview</button>
                    <button type="button" onClick={() => router.push(`/preaching/exposition?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>Review Exposition</button>
                    {message && <span style={{ color: "#047857" }}>{message}</span>}
                    {error && <span style={{ color: "#b91c1c" }}>{error}</span>}
                </div>
            </div>
        </AppShell>
    );
}
