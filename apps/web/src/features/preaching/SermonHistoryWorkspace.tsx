"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpositorySermon } from "@bsmp/preaching";
import { ExpositorySermonId, SermonOccurrence, SermonOccurrenceId } from "@bsmp/preaching";
import { StudyId } from "@bsmp/study";
import { AppShell } from "@repo/ui";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";
import { SupabaseSermonOccurrenceRepository } from "../../lib/SupabaseSermonOccurrenceRepository";

interface Props { studyId: string; }

function toInputValue(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function SermonHistoryWorkspace({ studyId }: Props) {
    const router = useRouter();
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
    const [occurrences, setOccurrences] = useState<readonly SermonOccurrence[]>([]);
    const [scheduledAt, setScheduledAt] = useState("");
    const [venue, setVenue] = useState("");
    const [serviceName, setServiceName] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    async function load() {
        if (!studyId) { setError("A study is required to open preaching history."); setLoading(false); return; }
        try {
            const sermonRepository = new SupabaseExpositorySermonRepository();
            const nextSermon = await sermonRepository.findByStudyId(studyId);
            if (!nextSermon) throw new Error("Complete Sermon Preparation before scheduling a preaching occurrence.");
            const nextOccurrences = await new SupabaseSermonOccurrenceRepository().findBySermonId(nextSermon.id);
            setSermon(nextSermon);
            setOccurrences(nextOccurrences);
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to load preaching history.");
        } finally { setLoading(false); }
    }

    useEffect(() => { void load(); }, [studyId]);

    const upcoming = useMemo(() => occurrences.filter((item) => item.status === "scheduled" && item.scheduledAt.getTime() >= Date.now()), [occurrences]);
    const completed = useMemo(() => occurrences.filter((item) => item.status === "completed"), [occurrences]);

    async function createOccurrence() {
        if (!sermon || !scheduledAt) { setError("Choose a date and time before scheduling the sermon."); return; }
        setSaving(true); setError(null); setMessage(null);
        try {
            const occurrence = SermonOccurrence.create(
                SermonOccurrenceId.create(),
                ExpositorySermonId.create(sermon.id.value),
                new Date(scheduledAt),
                venue,
                serviceName,
                notes,
            );
            await new SupabaseSermonOccurrenceRepository().save(occurrence);
            setOccurrences(await new SupabaseSermonOccurrenceRepository().findBySermonId(sermon.id));
            setScheduledAt(""); setVenue(""); setServiceName(""); setNotes("");
            setMessage("Sermon occurrence scheduled.");
        } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to schedule the sermon."); }
        finally { setSaving(false); }
    }

    async function completeOccurrence(occurrence: SermonOccurrence) {
        setError(null); setMessage(null);
        try {
            occurrence.markCompleted();
            await new SupabaseSermonOccurrenceRepository().save(occurrence);
            if (sermon) setOccurrences(await new SupabaseSermonOccurrenceRepository().findBySermonId(sermon.id));
            setMessage("Preaching occurrence recorded as completed.");
        } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to record preaching occurrence."); }
    }

    async function cancelOccurrence(occurrence: SermonOccurrence) {
        setError(null); setMessage(null);
        try {
            occurrence.cancel();
            await new SupabaseSermonOccurrenceRepository().save(occurrence);
            if (sermon) setOccurrences(await new SupabaseSermonOccurrenceRepository().findBySermonId(sermon.id));
            setMessage("Preaching occurrence cancelled.");
        } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to cancel preaching occurrence."); }
    }

    if (loading) return <AppShell title="Preaching History"><p>Loading preaching history...</p></AppShell>;
    if (error && !sermon) return <AppShell title="Preaching History"><p style={{ color: "#b91c1c" }}>{error}</p><button type="button" onClick={() => router.push(`/preaching/overview?studyId=${encodeURIComponent(studyId)}`)}>← Sermon Overview</button></AppShell>;
    if (!sermon) return null;

    return (
        <AppShell title="Preaching History">
            <div style={{ display: "grid", gap: 20 }}>
                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>Preaching History</div>
                    <h2 style={{ margin: "4px 0 8px" }}>{sermon.title.value}</h2>
                    <p><strong>Passage:</strong> {sermon.passage.toString()}</p>
                    <p style={{ color: "#6b7280" }}>Schedule preaching occasions independently so one sermon can be preached at multiple services, venues, or dates.</p>
                </section>

                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <h2>Schedule Preaching</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                        <label>Date and time<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: 10, marginTop: 4 }} /></label>
                        <label>Service<input value={serviceName} onChange={(event) => setServiceName(event.target.value)} placeholder="Sunday morning" style={{ width: "100%", boxSizing: "border-box", padding: 10, marginTop: 4 }} /></label>
                        <label>Venue<input value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="Church / venue" style={{ width: "100%", boxSizing: "border-box", padding: 10, marginTop: 4 }} /></label>
                    </div>
                    <label style={{ display: "block", marginTop: 12 }}>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Special notes for this preaching occasion..." style={{ width: "100%", boxSizing: "border-box", padding: 10, marginTop: 4, resize: "vertical" }} /></label>
                    <button type="button" onClick={() => void createOccurrence()} disabled={saving} style={{ marginTop: 12, padding: "10px 16px", fontWeight: 600 }}>{saving ? "Saving..." : "Schedule Sermon"}</button>
                </section>

                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <h2>Upcoming</h2>
                    {upcoming.length === 0 ? <p style={{ color: "#6b7280" }}>No upcoming preaching occasions are scheduled.</p> : <div style={{ display: "grid", gap: 10 }}>{upcoming.map((occurrence) => <article key={occurrence.id.value} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}><strong>{formatDate(occurrence.scheduledAt)}</strong>{occurrence.serviceName && <div>{occurrence.serviceName}</div>}{occurrence.venue && <div>{occurrence.venue}</div>}{occurrence.notes && <p style={{ whiteSpace: "pre-wrap", color: "#6b7280" }}>{occurrence.notes}</p>}<div style={{ display: "flex", gap: 8, marginTop: 10 }}><button type="button" onClick={() => void completeOccurrence(occurrence)}>Mark Preached</button><button type="button" onClick={() => void cancelOccurrence(occurrence)}>Cancel</button></div></article>)}</div>}
                </section>

                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <h2>Completed</h2>
                    {completed.length === 0 ? <p style={{ color: "#6b7280" }}>No completed preaching occasions yet.</p> : <div style={{ display: "grid", gap: 10 }}>{completed.map((occurrence) => <article key={occurrence.id.value} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}><strong>{formatDate(occurrence.preachedAt ?? occurrence.scheduledAt)}</strong><div style={{ color: "#047857", marginTop: 2 }}>Completed</div>{occurrence.serviceName && <div>{occurrence.serviceName}</div>}{occurrence.venue && <div>{occurrence.venue}</div>}{occurrence.notes && <p style={{ whiteSpace: "pre-wrap", color: "#6b7280" }}>{occurrence.notes}</p>}</article>)}</div>}
                </section>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}><button type="button" onClick={() => router.push(`/preaching/final?studyId=${encodeURIComponent(studyId)}`)}>Final Draft</button><button type="button" onClick={() => router.push(`/preaching/delivery?studyId=${encodeURIComponent(studyId)}`)}>Delivery Mode</button><button type="button" onClick={() => router.push(`/preaching/overview?studyId=${encodeURIComponent(studyId)}`)}>← Sermon Overview</button>{message && <span style={{ color: "#047857" }}>{message}</span>}{error && <span style={{ color: "#b91c1c" }}>{error}</span>}</div>
            </div>
        </AppShell>
    );
}
