"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpositorySermon, SermonDeliveryNotes, SermonManuscript } from "@bsmp/preaching";
import { SermonBigIdea, SermonPurpose, SermonTitle } from "@bsmp/preaching";
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

    async function save() {
        if (!sermon) return;
        setSaving(true); setMessage(null); setError(null);
        try {
            sermon.reviseTitle(SermonTitle.from(sermon.title.value));
            if (sermon.bigIdea) sermon.defineBigIdea(SermonBigIdea.from(sermon.bigIdea.value));
            if (sermon.purpose) sermon.definePurpose(SermonPurpose.from(sermon.purpose.value));
            sermon.defineManuscript(SermonManuscript.from(manuscript));
            sermon.defineDeliveryNotes(SermonDeliveryNotes.from(deliveryNotes));
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
            <div style={{ display: "grid", gap: 20 }}>
                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Final Manuscript & Delivery Preparation</div>
                    <h2 style={{ margin: "4px 0 8px" }}>{sermon.title.value}</h2>
                    <p style={{ margin: "4px 0" }}><strong>Study:</strong> {study.title.value}</p>
                    <p style={{ margin: "4px 0" }}><strong>Passage:</strong> {sermon.passage.toString()}</p>
                    {sermon.bigIdea && <p style={{ margin: "12px 0 4px" }}><strong>Big Idea:</strong> {sermon.bigIdea.value}</p>}
                    {sermon.purpose && <p style={{ margin: "4px 0" }}><strong>Purpose:</strong> {sermon.purpose.value}</p>}
                </section>

                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <h2>Final Manuscript</h2>
                    <p style={{ color: "#6b7280", marginTop: 0 }}>Bring the completed framework and exposition together into the sermon manuscript you intend to preach. The Study remains the source of biblical observations, interpretations, evidence, and applications; this field is the preacher's final composed message.</p>
                    <textarea value={manuscript} onChange={(event) => setManuscript(event.target.value)} rows={24} placeholder="Write the final sermon manuscript..." style={{ width: "100%", boxSizing: "border-box", padding: 12, resize: "vertical" }} />
                </section>

                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <h2>Delivery Notes</h2>
                    <p style={{ color: "#6b7280", marginTop: 0 }}>Record preaching cues such as emphasis, pauses, movement, timing, vocal changes, congregational interaction, and the final appeal.</p>
                    <textarea value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} rows={12} placeholder="Write delivery notes..." style={{ width: "100%", boxSizing: "border-box", padding: 12, resize: "vertical" }} />
                </section>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" onClick={() => void save()} disabled={saving} style={{ padding: "10px 16px", fontWeight: 600 }}>{saving ? "Saving..." : "Save Final Draft"}</button>
                    <button type="button" onClick={() => router.push(`/preaching/overview?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>← Sermon Overview</button>
                    <button type="button" onClick={() => router.push(`/preaching/exposition?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>Review Exposition</button>
                    {message && <span style={{ color: "#047857" }}>{message}</span>}
                    {error && <span style={{ color: "#b91c1c" }}>{error}</span>}
                </div>
            </div>
        </AppShell>
    );
}
