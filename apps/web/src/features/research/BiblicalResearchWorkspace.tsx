"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StudyId } from "@bsmp/study";
import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { supabase } from "../../lib/supabase";

interface Props { studyId: string; }
interface ResearchSource { url: string; title: string; }
interface ResearchResult { answer: string; textualBasis: string[]; furtherQuestions: string[]; cautions: string[]; sources?: ResearchSource[]; model: string; provider: string; }
const linkStyle = { color: "#1d4ed8", textDecoration: "none", fontWeight: 600 } as const;

export function BiblicalResearchWorkspace({ studyId }: Props) {
    const [title, setTitle] = useState("");
    const [passage, setPassage] = useState("");
    const [observations, setObservations] = useState(0);
    const [interpretations, setInterpretations] = useState(0);
    const [theology, setTheology] = useState(0);
    const [question, setQuestion] = useState("");
    const [external, setExternal] = useState(false);
    const [sourceText, setSourceText] = useState("");
    const [result, setResult] = useState<ResearchResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!studyId) { setLoading(false); return; }
        setLoading(true); setError(null);
        try {
            const study = await new SupabaseStudyRepository().find(StudyId.from(studyId));
            if (!study) throw new Error("Study not found.");
            setTitle(study.title.value);
            setPassage(study.passage.toString());
            const [obs, ints, bt] = await Promise.all([
                supabase.from("study_observations").select("id", { count: "exact", head: true }).eq("study_id", studyId),
                supabase.from("study_interpretations").select("id", { count: "exact", head: true }).eq("study_id", studyId),
                supabase.from("biblical_theology_entries").select("id", { count: "exact", head: true }).eq("study_id", studyId),
            ]);
            if (obs.error) throw obs.error;
            if (ints.error) throw ints.error;
            if (bt.error) throw bt.error;
            setObservations(obs.count ?? 0); setInterpretations(ints.count ?? 0); setTheology(bt.count ?? 0);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to load Biblical Research.");
        } finally { setLoading(false); }
    }, [studyId]);

    useEffect(() => { void load(); }, [load]);

    async function runResearch() {
        setError(null); setResult(null);
        if (!studyId) { setError("Open Biblical Research from a Study."); return; }
        if (question.trim().length < 8) { setError("Enter a specific research question before running the assistant."); return; }
        const urls = sourceText.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 10);
        if (external && urls.some((url) => !/^https:\/\//i.test(url))) { setError("External research sources must use complete HTTPS URLs."); return; }
        setRunning(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (!token) throw new Error("A signed-in user is required.");
            const response = await fetch("/api/ai/biblical-research", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ studyId, question: question.trim(), external, sourceUrls: urls }) });
            const payload = await response.json() as Partial<ResearchResult> & { error?: unknown };
            if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "The Biblical Research assistant request failed.");
            setResult({ answer: payload.answer ?? "", textualBasis: payload.textualBasis ?? [], furtherQuestions: payload.furtherQuestions ?? [], cautions: payload.cautions ?? [], sources: payload.sources ?? [], model: payload.model ?? "", provider: payload.provider ?? "" });
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to run Biblical Research.");
        } finally { setRunning(false); }
    }

    if (loading) return <p>Loading Biblical Research...</p>;
    if (!studyId) return <section style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}><h1>Biblical Research</h1><p>Open this workspace from a Study so research remains grounded in the selected study context.</p><Link href="/studies" style={linkStyle}>← Back to Study Library</Link></section>;

    return <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px", display: "grid", gap: 18 }}>
        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Study → Biblical Research</div>
            <h1 style={{ margin: "4px 0 8px" }}>Biblical Research Assistant</h1>
            <p style={{ margin: 4 }}><strong>Study:</strong> {title}</p>
            <p style={{ margin: 4 }}><strong>Passage:</strong> {passage}</p>
            <p style={{ margin: "12px 0", color: "#6b7280" }}>Use the assistant to investigate a focused question from the material already recorded in this Study. It is a research aid, not an authoritative interpreter.</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "#4b5563" }}><span>{observations} observations</span><span>{interpretations} interpretations</span><span>{theology} theological syntheses</span></div>
            <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap" }}><Link href={`/workspace?studyId=${encodeURIComponent(studyId)}`} style={linkStyle}>Study Workspace</Link><Link href={`/biblical-theology?studyId=${encodeURIComponent(studyId)}`} style={linkStyle}>Biblical Theology</Link><Link href={`/teaching?studyId=${encodeURIComponent(studyId)}`} style={linkStyle}>Teaching</Link></div>
        </section>

        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <h2 style={{ marginTop: 0 }}>Research Question</h2>
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={5} placeholder="Example: What does this Study's recorded evidence show about the relationship between the command and the response?" style={{ width: "100%", padding: 12, boxSizing: "border-box", resize: "vertical" }} />
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, fontWeight: 600 }}><input type="checkbox" checked={external} onChange={(event) => setExternal(event.target.checked)} /> Include external research</label>
            {external && <div style={{ marginTop: 10 }}><label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Optional public source URLs (one per line; up to 10)</label><textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} rows={4} placeholder="https://example.org/article" style={{ width: "100%", padding: 12, boxSizing: "border-box", resize: "vertical" }} /><p style={{ fontSize: 12, color: "#6b7280" }}>External research uses Gemini's public web-search and URL-context tools. Retrieved sources are shown separately from your Study evidence.</p></div>}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}><button type="button" onClick={() => void runResearch()} disabled={running}>{running ? "Researching..." : external ? "Research with Sources" : "Investigate Question"}</button>{error && <span style={{ color: "#b91c1c" }}>{error}</span>}</div>
        </section>

        {result && <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff", display: "grid", gap: 18 }}>
            <div><h2 style={{ marginTop: 0 }}>Research Guidance</h2><p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{result.answer}</p></div>
            <div><h3>Textual Basis</h3>{result.textualBasis.length ? <ul>{result.textualBasis.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No specific textual basis was returned from the supplied Study context.</p>}</div>
            {external && <div><h3>Retrieved Sources</h3>{result.sources?.length ? <ul>{result.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" style={linkStyle}>{source.title}</a> <span style={{ color: "#6b7280" }}>({source.url})</span></li>)}</ul> : <p>No source citations were returned by the external research tools.</p>}</div>}
            <div><h3>Questions for Further Study</h3>{result.furtherQuestions.length ? <ul>{result.furtherQuestions.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No additional questions were suggested.</p>}</div>
            <div><h3>Cautions</h3>{result.cautions.length ? <ul>{result.cautions.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No additional cautions were returned.</p>}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>AI provider: {result.provider} · model: {result.model}</div>
        </section>}
    </main>;
}
