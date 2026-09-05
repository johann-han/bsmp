"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Database } from "../../lib/database.types";
import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { supabase } from "../../lib/supabase";
import { StudyId } from "@bsmp/study";
import { BiblicalTheologyMentorPanel } from "./BiblicalTheologyMentorPanel";

interface Props { studyId: string; }
type Interpretation = Database["public"]["Tables"]["study_interpretations"]["Row"];
type Entry = Database["public"]["Tables"]["biblical_theology_entries"]["Row"];
const linkStyle = { color: "#1d4ed8", textDecoration: "none", fontWeight: 600 } as const;

export function BiblicalTheologyWorkspace({ studyId }: Props) {
    const [title, setTitle] = useState("");
    const [passage, setPassage] = useState("");
    const [interpretations, setInterpretations] = useState<Interpretation[]>([]);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [theme, setTheme] = useState("");
    const [synthesis, setSynthesis] = useState("");
    const [selected, setSelected] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const study = await new SupabaseStudyRepository().find(StudyId.from(studyId));
            if (!study) throw new Error("Study not found.");
            setTitle(study.title.value);
            setPassage(study.passage.toString());
            const [{ data: interpretationRows, error: interpretationError }, { data: entryRows, error: entryError }] = await Promise.all([
                supabase.from("study_interpretations").select("*").eq("study_id", studyId).order("created_at", { ascending: true }),
                supabase.from("biblical_theology_entries").select("*").eq("study_id", studyId).order("created_at", { ascending: true }),
            ]);
            if (interpretationError) throw interpretationError;
            if (entryError) throw entryError;
            setInterpretations(interpretationRows ?? []);
            setEntries(entryRows ?? []);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to load Biblical Theology.");
        } finally { setLoading(false); }
    }

    useEffect(() => { void load(); }, [studyId]);

    function resetForm() { setEditingId(null); setTheme(""); setSynthesis(""); setSelected([]); setMessage(null); }
    function toggleInterpretation(id: string) { setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); }

    async function save() {
        setError(null); setMessage(null);
        if (!theme.trim() || !synthesis.trim()) { setError("Enter a theme and synthesis before saving."); return; }
        if (selected.length === 0) { setError("Select at least one supporting interpretation before saving."); return; }
        setSaving(true);
        try {
            const userResult = await supabase.auth.getUser();
            if (userResult.error || !userResult.data.user) throw new Error("A signed-in user is required.");
            if (editingId) {
                const { error: updateError } = await supabase.from("biblical_theology_entries").update({ theme: theme.trim(), synthesis: synthesis.trim(), interpretation_ids: selected }).eq("id", editingId).eq("study_id", studyId);
                if (updateError) throw updateError;
                setMessage("Biblical Theology entry updated.");
            } else {
                const { error: insertError } = await supabase.from("biblical_theology_entries").insert({ id: crypto.randomUUID(), study_id: studyId, user_id: userResult.data.user.id, theme: theme.trim(), synthesis: synthesis.trim(), interpretation_ids: selected });
                if (insertError) throw insertError;
                setMessage("Biblical Theology entry saved.");
            }
            await load();
            resetForm();
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to save Biblical Theology entry.");
        } finally { setSaving(false); }
    }

    async function remove(id: string) {
        if (!window.confirm("Delete this Biblical Theology entry?")) return;
        setError(null);
        try {
            const { error: deleteError } = await supabase.from("biblical_theology_entries").delete().eq("id", id).eq("study_id", studyId);
            if (deleteError) throw deleteError;
            await load();
            setMessage("Biblical Theology entry deleted.");
        } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete Biblical Theology entry."); }
    }

    function edit(entry: Entry) { setEditingId(entry.id); setTheme(entry.theme); setSynthesis(entry.synthesis); setSelected([...entry.interpretation_ids]); setMessage(null); }

    if (loading) return <p>Loading Biblical Theology...</p>;

    return <div style={{ display: "grid", gap: 18 }}>
        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Study → Biblical Theology → Teaching</div>
            <h1 style={{ margin: "4px 0 8px" }}>Biblical Theology</h1>
            <p style={{ margin: 4 }}><strong>Study:</strong> {title}</p><p style={{ margin: 4 }}><strong>Passage:</strong> {passage}</p>
            <p style={{ margin: "12px 0 0", color: "#6b7280" }}>Synthesize the biblical truth emerging from your interpretations. Every synthesis must remain traceable to at least one study interpretation.</p>
            <div style={{ marginTop: 12 }}><Link href={`/teaching?studyId=${encodeURIComponent(studyId)}`} style={linkStyle}>Prepare a Teaching Plan →</Link></div>
        </section>
        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <h2 style={{ marginTop: 0 }}>{editingId ? "Edit synthesis" : "Add synthesis"}</h2>
            <div style={{ display: "grid", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}><strong>Theme</strong><input value={theme} onChange={(event) => setTheme(event.target.value)} placeholder="e.g. The believer's response to God's mercy" style={{ padding: 10 }} /></label>
                <label style={{ display: "grid", gap: 6 }}><strong>Biblical synthesis</strong><textarea value={synthesis} onChange={(event) => setSynthesis(event.target.value)} rows={6} placeholder="What broader biblical truth emerges from the selected interpretations?" style={{ width: "100%", padding: 10, resize: "vertical" }} /></label>
                <div><strong>Supporting interpretations</strong><p style={{ margin: "4px 0 8px", color: "#6b7280", fontSize: 13 }}>Select the interpretations that establish this synthesis.</p>{interpretations.length === 0 ? <p style={{ color: "#6b7280" }}>No interpretations are available yet. Complete the Interpretation stage first.</p> : <div style={{ display: "grid", gap: 8 }}>{interpretations.map((interpretation) => <label key={interpretation.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><input type="checkbox" checked={selected.includes(interpretation.id)} onChange={() => toggleInterpretation(interpretation.id)} /><span>{interpretation.statement}</span></label>)}</div>}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><button type="button" onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : editingId ? "Update Synthesis" : "Save Synthesis"}</button>{editingId && <button type="button" disabled={saving} onClick={resetForm}>Cancel</button>}{message && <span style={{ color: "#166534" }}>{message}</span>}{error && <span style={{ color: "#b91c1c" }}>{error}</span>}</div>
            </div>
        </section>
        <BiblicalTheologyMentorPanel studyId={studyId} />
        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <h2 style={{ marginTop: 0 }}>Saved Biblical Theology</h2>
            {entries.length === 0 ? <p style={{ color: "#6b7280" }}>No Biblical Theology syntheses recorded yet.</p> : <div style={{ display: "grid", gap: 12 }}>{entries.map((entry) => <article key={entry.id} id={`biblical-theology-${entry.id}`} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, scrollMarginTop: 80 }}><strong>{entry.theme}</strong><p style={{ whiteSpace: "pre-wrap" }}>{entry.synthesis}</p><div style={{ fontSize: 13, color: "#6b7280" }}>Traceable to {entry.interpretation_ids.length} interpretation{entry.interpretation_ids.length === 1 ? "" : "s"}.</div><div style={{ marginTop: 10, display: "flex", gap: 8 }}><button type="button" onClick={() => edit(entry)}>Edit</button><button type="button" onClick={() => void remove(entry.id)}>Delete</button></div></article>)}</div>}
        </section>
    </div>;
}
