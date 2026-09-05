"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExpositorySermon } from "@bsmp/preaching";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";
import { supabase } from "../../lib/supabase";

type Result = { assessment: "grounded" | "mixed" | "unclear" | "overstated"; coaching: string; focuses: string[]; model: string; provider: "openai" | "gemini" };
const labels: Record<Result["assessment"], string> = { grounded: "Grounded", mixed: "Mixed", unclear: "Unclear", overstated: "Overstated" };
const focusLabels: Record<string, string> = { framework: "Framework", coverage: "Coverage", faithfulness: "Faithfulness", exposition: "Exposition", application: "Application", manuscript: "Manuscript" };

export function FinalSermonDraftMentorPanel({ studyId }: { studyId: string }) {
  const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!studyId) { setError("A study is required for the final sermon draft mentor."); setLoading(false); return; }
      try { const next = await new SupabaseExpositorySermonRepository().findByStudyId(studyId); if (active) setSermon(next ?? null); if (!next && active) setError("Create Sermon Preparation before reviewing the final sermon draft."); }
      catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Unable to load final sermon mentor context."); }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [studyId]);

  const wordCount = useMemo(() => { const value = sermon?.manuscript?.value ?? ""; return value.trim() ? value.trim().split(/\s+/).length : 0; }, [sermon]);

  async function review() {
    if (!sermon?.manuscript?.value?.trim()) { setError("Save a completed manuscript before asking the mentor to review it."); return; }
    setRunning(true); setResult(null); setError(null);
    try {
      const session = await supabase.auth.getSession(); const token = session.data.session?.access_token; if (!token) throw new Error("A signed-in Supabase session is required for the final sermon draft mentor.");
      const response = await fetch("/api/ai/final-sermon-draft-mentor", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ studyId }) });
      const payload = await response.json() as Result & { error?: string }; if (!response.ok) throw new Error(payload.error ?? "The final sermon draft mentor could not respond."); setResult(payload);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to run the final sermon draft mentor."); }
    finally { setRunning(false); }
  }

  async function reload() { setError(null); setResult(null); setLoading(true); try { setSermon((await new SupabaseExpositorySermonRepository().findByStudyId(studyId)) ?? null); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to reload the final sermon draft."); } finally { setLoading(false); } }

  if (loading) return <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}><strong>Final Sermon Draft Mentor</strong><p>Loading saved manuscript...</p></section>;
  if (!sermon) return <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}><h2 style={{ marginTop: 0 }}>Final Sermon Draft Mentor</h2><p style={{ color: "#6b7280" }}>{error ?? "No sermon preparation is available."}</p></section>;

  return <section className="bsmp-print-hide" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff", marginTop: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "end" }}>
      <div><div style={{ fontSize: 13, color: "#6b7280" }}>AI coaching · final manuscript</div><h2 style={{ margin: "4px 0 8px" }}>Final Sermon Draft Mentor</h2><p style={{ margin: 0, color: "#6b7280" }}>Checks the saved manuscript against the completed Big Idea, Purpose, Teaching Plan, and sermon exposition. The mentor coaches; it does not rewrite or save your sermon.</p></div>
      <button type="button" onClick={review} disabled={running || !sermon.manuscript?.value?.trim()} style={{ padding: "10px 14px", fontWeight: 600 }}>{running ? "Reviewing..." : "Review Saved Manuscript"}</button>
    </div>
    <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "#6b7280" }}><span><strong>{wordCount}</strong> words saved</span><span>{sermon.outline.length} prepared outline point{sermon.outline.length === 1 ? "" : "s"}</span><span>{sermon.bigIdea ? "Big Idea defined" : "Big Idea missing"}</span><span>{sermon.purpose ? "Purpose defined" : "Purpose missing"}</span></div>
    {sermon.manuscript?.value?.trim() && !result && <p style={{ marginTop: 14, fontSize: 13, color: "#6b7280" }}>The review reads the manuscript saved to this Study at the time you start the review. Save recent edits in the Final Sermon Draft workspace, then review again.</p>}
    {error && <p style={{ color: "#b91c1c", marginTop: 14 }}>{error}</p>}
    {result && <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: "#f8fafc", border: "1px solid #e5e7eb" }}><div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}><strong>Assessment: {labels[result.assessment]}</strong>{result.focuses.map((focus) => <span key={focus} style={{ padding: "3px 8px", borderRadius: 999, background: "#e5e7eb", fontSize: 12 }}>{focusLabels[focus] ?? focus}</span>)}</div><p style={{ margin: "12px 0" }}>{result.coaching}</p><div style={{ fontSize: 12, color: "#6b7280" }}>Provider: {result.provider} · Model: {result.model}</div><button type="button" onClick={reload} style={{ marginTop: 12, padding: "8px 12px" }}>Reload Saved Manuscript</button></div>}
  </section>;
}
