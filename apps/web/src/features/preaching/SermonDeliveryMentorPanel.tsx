"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExpositorySermon } from "@bsmp/preaching";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";
import { supabase } from "../../lib/supabase";

type Result = { assessment: "grounded" | "mixed" | "unclear" | "overstated"; coaching: string; focuses: string[]; model: string; provider: "openai" | "gemini" };
const labels: Record<Result["assessment"], string> = { grounded: "Grounded", mixed: "Mixed", unclear: "Unclear", overstated: "Overstated" };
const focusLabels: Record<string, string> = { message: "Message", deliveryNotes: "Delivery Notes", clarity: "Clarity", emphasis: "Emphasis", application: "Application" };

export function SermonDeliveryMentorPanel({ studyId }: { studyId: string }) {
  const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!studyId) { setError("A study is required for the sermon delivery mentor."); setLoading(false); return; }
      try { const next = await new SupabaseExpositorySermonRepository().findByStudyId(studyId); if (active) setSermon(next ?? null); if (!next && active) setError("Complete Sermon Preparation before using the delivery mentor."); }
      catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Unable to load delivery mentor context."); }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [studyId]);

  const wordCount = useMemo(() => { const value = sermon?.manuscript?.value ?? ""; return value.trim() ? value.trim().split(/\s+/).length : 0; }, [sermon]);

  async function review() {
    if (!sermon?.manuscript?.value?.trim()) { setError("Save the final manuscript before reviewing delivery readiness."); return; }
    setRunning(true); setResult(null); setError(null);
    try {
      const session = await supabase.auth.getSession(); const token = session.data.session?.access_token; if (!token) throw new Error("A signed-in Supabase session is required for the sermon delivery mentor.");
      const response = await fetch("/api/ai/sermon-delivery-mentor", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ studyId }) });
      const payload = await response.json() as Result & { error?: string }; if (!response.ok) throw new Error(payload.error ?? "The sermon delivery mentor could not respond."); setResult(payload);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to run the sermon delivery mentor."); }
    finally { setRunning(false); }
  }

  if (loading) return <section className="bsmp-print-hide" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff", marginTop: 20 }}><strong>Sermon Delivery Mentor</strong><p>Loading saved sermon...</p></section>;
  if (!sermon) return <section className="bsmp-print-hide" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff", marginTop: 20 }}><h2 style={{ marginTop: 0 }}>Sermon Delivery Mentor</h2><p style={{ color: "#6b7280" }}>{error ?? "No sermon preparation is available."}</p></section>;

  return <section className="bsmp-print-hide" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff", marginTop: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "end" }}>
      <div><div style={{ fontSize: 13, color: "#6b7280" }}>AI coaching · delivery</div><h2 style={{ margin: "4px 0 8px" }}>Sermon Delivery Mentor</h2><p style={{ margin: 0, color: "#6b7280" }}>Checks whether delivery notes and delivery emphasis remain faithful to the saved manuscript, Big Idea, Purpose, and prepared outline. The mentor coaches; it does not rewrite the sermon.</p></div>
      <button type="button" onClick={review} disabled={running || !sermon.manuscript?.value?.trim()} style={{ padding: "10px 14px", fontWeight: 600 }}>{running ? "Reviewing..." : "Review Delivery Readiness"}</button>
    </div>
    <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "#6b7280" }}><span><strong>{wordCount}</strong> manuscript words</span><span>{sermon.outline.length} prepared outline point{sermon.outline.length === 1 ? "" : "s"}</span><span>{sermon.deliveryNotes?.value.trim() ? "Delivery notes recorded" : "No delivery notes"}</span></div>
    {sermon.manuscript?.value.trim() && !result && <p style={{ marginTop: 14, fontSize: 13, color: "#6b7280" }}>The review reads the manuscript and delivery notes saved to this Study at the time you start the review. Save recent edits in Final Sermon Draft, then review again.</p>}
    {error && <p style={{ color: "#b91c1c", marginTop: 14 }}>{error}</p>}
    {result && <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: "#f8fafc", border: "1px solid #e5e7eb" }}><div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}><strong>Assessment: {labels[result.assessment]}</strong>{result.focuses.map((focus) => <span key={focus} style={{ padding: "3px 8px", borderRadius: 999, background: "#e5e7eb", fontSize: 12 }}>{focusLabels[focus] ?? focus}</span>)}</div><p style={{ margin: "12px 0" }}>{result.coaching}</p><div style={{ fontSize: 12, color: "#6b7280" }}>Provider: {result.provider} · Model: {result.model}</div></div>}
  </section>;
}
