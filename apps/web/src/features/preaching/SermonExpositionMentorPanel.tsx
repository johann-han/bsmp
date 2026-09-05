"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@repo/ui";
import { StudyId, type StudySession } from "@bsmp/study";
import type { ExpositorySermon } from "@bsmp/preaching";
import type { Database } from "../../lib/database.types";
import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";
import { supabase } from "../../lib/supabase";

type TheologyEntry = Database["public"]["Tables"]["biblical_theology_entries"]["Row"];
type Result = { assessment: "grounded" | "mixed" | "unclear" | "overstated"; coaching: string; focuses: string[]; model: string; provider: "openai" | "gemini" };

const labels: Record<Result["assessment"], string> = { grounded: "Grounded", mixed: "Mixed", unclear: "Unclear", overstated: "Overstated" };

export function SermonExpositionMentorPanel({ studyId }: { studyId: string }) {
  const [study, setStudy] = useState<StudySession | null>(null);
  const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
  const [theology, setTheology] = useState<TheologyEntry[]>([]);
  const [pointId, setPointId] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const repository = new SupabaseStudyRepository();
        const [{ nextStudy, nextSermon }, { data, error: theologyError }] = await Promise.all([
          Promise.all([repository.find(StudyId.from(studyId)), new SupabaseExpositorySermonRepository().findByStudyId(studyId)]).then(([nextStudy, nextSermon]) => ({ nextStudy, nextSermon })),
          supabase.from("biblical_theology_entries").select("*").eq("study_id", studyId).order("created_at", { ascending: true }),
        ]);
        if (cancelled) return;
        if (!nextStudy) throw new Error("The selected Study could not be found.");
        if (theologyError) throw theologyError;
        setStudy(nextStudy); setSermon(nextSermon); setTheology((data ?? []) as TheologyEntry[]);
        setPointId(nextSermon?.outline[0]?.id ?? "");
      } catch (reason) { if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load exposition mentor context."); }
      finally { if (!cancelled) setLoading(false); }
    }
    if (studyId) void load(); else { setError("A study is required for the exposition mentor."); setLoading(false); }
    return () => { cancelled = true; };
  }, [studyId]);

  async function review() {
    if (!study || !sermon) return;
    const point = sermon.outline.find((item) => item.id === pointId);
    if (!point) return;
    setRunning(true); setResult(null); setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("A signed-in Supabase session is required for the exposition mentor.");
      const response = await fetch("/api/ai/sermon-exposition-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studyId,
          truth: point.truth,
          text: point.text,
          meaning: point.explanation,
          preaching: point.illustration,
          response: point.application,
          transition: point.transition,
          observationIds: point.textObservationIds,
          interpretationIds: point.meaningInterpretationIds,
          evidenceIds: point.meaningEvidenceIds,
          applicationIds: point.responseApplicationIds,
          biblicalTheologyIds: point.supportingBiblicalTheologyIds,
        }),
      });
      const payload = await response.json() as Result & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The exposition mentor could not respond.");
      setResult(payload);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to run the exposition mentor."); }
    finally { setRunning(false); }
  }

  if (loading) return <AppShell title="Sermon Exposition Mentor"><p>Loading mentor context...</p></AppShell>;
  if (error || !study || !sermon) return <AppShell title="Sermon Exposition Mentor"><p style={{ color: "#b91c1c" }}>{error ?? "Create Sermon Preparation and at least one outline point first."}</p></AppShell>;
  if (sermon.outline.length === 0) return <AppShell title="Sermon Exposition Mentor"><p>Create at least one outline point before running the mentor.</p></AppShell>;

  const point = sermon.outline.find((item) => item.id === pointId) ?? sermon.outline[0];
  const ready = Boolean(point.text.trim() && point.explanation.trim() && point.illustration.trim() && point.application.trim() && point.textObservationIds.length && point.meaningInterpretationIds.length);
  const linkedTheology = theology.filter((entry) => point.supportingBiblicalTheologyIds.includes(entry.id));

  return <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
    <div style={{ fontSize: 13, color: "#6b7280" }}>Mentor review · Sermon Exposition</div>
    <h2 style={{ margin: "4px 0 8px" }}>Test the exposition</h2>
    <p style={{ color: "#6b7280", marginTop: 0 }}>The mentor checks whether the saved exposition faithfully develops the outline truth and remains traceable to the Study. It does not rewrite the sermon.</p>
    <label style={{ display: "grid", gap: 6 }}><strong>Outline point</strong><select value={point.id} onChange={(event) => { setPointId(event.target.value); setResult(null); }} style={{ padding: 10 }}>{sermon.outline.map((item, index) => <option key={item.id} value={item.id}>{index + 1}. {item.heading}</option>)}</select></label>
    <div style={{ marginTop: 12, fontSize: 13, color: ready ? "#166534" : "#92400e" }}>{ready ? "Ready for mentor review." : "Complete Text, Meaning, Preaching, Response, and their core study links in Sermon Exposition first."}</div>
    <button type="button" onClick={() => void review()} disabled={!ready || running} style={{ marginTop: 12, padding: "10px 16px" }}>{running ? "Reviewing..." : "Review with Exposition Mentor"}</button>
    {linkedTheology.length > 0 && <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>This point also cites {linkedTheology.length} Biblical Theology {linkedTheology.length === 1 ? "synthesis" : "syntheses"}.</div>}
    {result && <div style={{ marginTop: 16, border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, background: "#f8fafc" }}><strong>Assessment: {labels[result.assessment]}</strong><p style={{ whiteSpace: "pre-wrap" }}>{result.coaching}</p>{result.focuses.length > 0 && <div style={{ fontSize: 13, color: "#6b7280" }}>Focus: {result.focuses.join(", ")}</div>}<div style={{ marginTop: 8, fontSize: 12, color: "#9ca3af" }}>{result.provider} · {result.model}</div></div>}
    {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
  </section>;
}
