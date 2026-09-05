"use client";

import { useEffect, useState } from "react";
import type { Database } from "../../lib/database.types";
import { supabase } from "../../lib/supabase";

interface Props { studyId: string; }
type Interpretation = Database["public"]["Tables"]["study_interpretations"]["Row"];
type Entry = Database["public"]["Tables"]["biblical_theology_entries"]["Row"];
type MentorResult = {
    assessment: "grounded" | "mixed" | "unclear" | "overstated";
    coaching: string;
    focuses: readonly string[];
    model: string;
    provider: "openai" | "gemini";
};

const assessmentLabel: Record<MentorResult["assessment"], string> = {
    grounded: "Grounded",
    mixed: "Mixed",
    unclear: "Unclear",
    overstated: "Overstated",
};

export function BiblicalTheologyMentorPanel({ studyId }: Props) {
    const [interpretations, setInterpretations] = useState<Interpretation[]>([]);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [entryId, setEntryId] = useState("");
    const [result, setResult] = useState<MentorResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            const [{ data: interpretationRows, error: interpretationError }, { data: entryRows, error: entryError }] = await Promise.all([
                supabase.from("study_interpretations").select("*").eq("study_id", studyId).order("created_at", { ascending: true }),
                supabase.from("biblical_theology_entries").select("*").eq("study_id", studyId).order("created_at", { ascending: true }),
            ]);
            if (cancelled) return;
            if (interpretationError) { setError(interpretationError.message); setLoading(false); return; }
            if (entryError) { setError(entryError.message); setLoading(false); return; }
            setInterpretations(interpretationRows ?? []);
            const nextEntries = entryRows ?? [];
            setEntries(nextEntries);
            setEntryId((current) => current && nextEntries.some((entry) => entry.id === current) ? current : nextEntries[0]?.id ?? "");
            setLoading(false);
        }
        void load();
        return () => { cancelled = true; };
    }, [studyId]);

    async function runMentor() {
        const entry = entries.find((item) => item.id === entryId);
        if (!entry) return;
        setRunning(true);
        setError(null);
        setResult(null);
        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) throw new Error("A signed-in user is required.");
            const response = await fetch("/api/ai/biblical-theology-mentor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionData.session.access_token}`,
                },
                body: JSON.stringify({
                    studyId,
                    interpretationIds: entry.interpretation_ids,
                    theme: entry.theme,
                    synthesis: entry.synthesis,
                }),
            });
            const payload = await response.json() as MentorResult & { error?: string };
            if (!response.ok) throw new Error(payload.error ?? "Unable to run the Biblical Theology mentor.");
            setResult(payload);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to run the Biblical Theology mentor.");
        } finally { setRunning(false); }
    }

    return (
        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Mentor review · Biblical Theology</div>
            <h2 style={{ margin: "4px 0 8px" }}>Test your synthesis</h2>
            <p style={{ margin: "0 0 12px", color: "#6b7280" }}>
                The mentor checks whether your theme and synthesis are grounded in the interpretations you selected. It does not write a replacement synthesis or invent doctrine.
            </p>
            {loading ? <p>Loading mentor context...</p> : entries.length === 0 ? <p style={{ color: "#6b7280" }}>Save a Biblical Theology synthesis first.</p> : (
                <div style={{ display: "grid", gap: 10 }}>
                    <label style={{ display: "grid", gap: 6 }}>
                        <strong>Synthesis to review</strong>
                        <select value={entryId} onChange={(event) => { setEntryId(event.target.value); setResult(null); }} style={{ padding: 10 }}>
                            {entries.map((entry) => <option key={entry.id} value={entry.id}>{entry.theme}</option>)}
                        </select>
                    </label>
                    <button type="button" onClick={() => void runMentor()} disabled={running || interpretations.length === 0}>
                        {running ? "Reviewing..." : "Review with Mentor"}
                    </button>
                    {result && (
                        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
                            <div><strong>Assessment:</strong> {assessmentLabel[result.assessment]}</div>
                            <p style={{ whiteSpace: "pre-wrap", marginBottom: 8 }}>{result.coaching}</p>
                            {result.focuses.length > 0 && <div style={{ fontSize: 13, color: "#6b7280" }}>Focus: {result.focuses.join(", ")}</div>}
                            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>{result.provider} · {result.model}</div>
                        </div>
                    )}
                </div>
            )}
            {error && <p style={{ color: "#b91c1c", marginBottom: 0 }}>{error}</p>}
        </section>
    );
}
