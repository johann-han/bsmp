"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StudyId } from "@bsmp/study";
import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { supabase } from "../../lib/supabase";
import { RESEARCH_QUESTION_SUGGESTIONS } from "./researchQuestionBank";
import type { BiblicalResearchFocus } from "../../lib/biblicalResearchProvider";

interface Props { studyId: string; }
interface ResearchSource { url: string; title: string; }
interface SavedResearchSource { id: string; study_id: string | null; url: string; title: string; source_type: string; last_used_at: string | null; }
interface ResearchRun { id: string; study_id: string; question: string; focus: string; answer: string; textual_basis: unknown; further_questions: unknown; cautions: unknown; sources: unknown; source_urls: unknown; provider: string; model: string; created_at: string; }
interface ResearchResult { researchRunId?: string; answer: string; textualBasis: string[]; furtherQuestions: string[]; cautions: string[]; sources: ResearchSource[]; sourceUrls: string[]; sourceCitationsReturned: boolean; model: string; provider: string; }
interface ResearchResponse extends Partial<ResearchResult> { error?: unknown; persistence?: { researchRunId: string; sourcesSaved: number }; }

const RESEARCH_FOCUSES: readonly { value: BiblicalResearchFocus; label: string; description: string }[] = [
    { value: "general", label: "General Biblical Research", description: "Investigate a focused question without limiting the research to one context category." },
    { value: "geography", label: "Geographical Setting", description: "Places, routes, terrain, regions, climate, distances, borders, and location-related context." },
    { value: "customs_culture", label: "Customs & Culture", description: "Social customs, family life, hospitality, honor and shame, food, clothing, marriage, burial, festivals, and daily life." },
    { value: "historical_period", label: "Historical / Time Period", description: "Dating, rulers, empires, major events, conflicts, and the historical circumstances surrounding the passage." },
    { value: "social_political", label: "Social & Political Setting", description: "Authorities, institutions, citizenship, taxation, patronage, social classes, ethnic relations, and power structures." },
    { value: "religious_context", label: "Religious Context", description: "Worship, temple or synagogue life, festivals, purity, priesthood, and surrounding religious practices and beliefs." },
    { value: "literary_setting", label: "Literary & Historical Setting", description: "Genre, audience, occasion, rhetorical situation, authorship, provenance, and the passage's place within the book." },
    { value: "archaeology_material", label: "Archaeology & Material Context", description: "Sites, inscriptions, artifacts, architecture, roads, household structures, tools, coins, and other material evidence." },
    { value: "language_terminology", label: "Language & Terminology", description: "Important Hebrew, Aramaic, or Greek terms, idioms, semantic range, translation issues, and ancient usage." },
];

const linkStyle = { color: "#1d4ed8", textDecoration: "none", fontWeight: 600 } as const;

function isFocus(value: unknown): value is BiblicalResearchFocus {
    return typeof value === "string" && RESEARCH_FOCUSES.some((item) => item.value === value);
}

function stringList(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [];
}

function sourceList(value: unknown): ResearchSource[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const url = (item as { url?: unknown }).url;
        const title = (item as { title?: unknown }).title;
        if (typeof url !== "string" || !url.trim()) return [];
        return [{ url: url.trim(), title: typeof title === "string" && title.trim() ? title.trim() : fallbackTitle(url) }];
    }).slice(0, 10);
}

function fallbackTitle(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function resultFromRun(run: ResearchRun): ResearchResult {
    const sources = sourceList(run.sources);
    return {
        researchRunId: run.id,
        answer: run.answer,
        textualBasis: stringList(run.textual_basis),
        furtherQuestions: stringList(run.further_questions),
        cautions: stringList(run.cautions),
        sources,
        sourceUrls: stringList(run.source_urls),
        sourceCitationsReturned: sources.length > 0,
        model: run.model,
        provider: run.provider,
    };
}

export function BiblicalResearchWorkspace({ studyId }: Props) {
    const [title, setTitle] = useState("");
    const [passage, setPassage] = useState("");
    const [observations, setObservations] = useState(0);
    const [interpretations, setInterpretations] = useState(0);
    const [theology, setTheology] = useState(0);
    const [focus, setFocus] = useState<BiblicalResearchFocus>("general");
    const [question, setQuestion] = useState("");
    const [external, setExternal] = useState(false);
    const [sourceText, setSourceText] = useState("");
    const [savedSources, setSavedSources] = useState<SavedResearchSource[]>([]);
    const [selectedSavedSourceIds, setSelectedSavedSourceIds] = useState<string[]>([]);
    const [researchRuns, setResearchRuns] = useState<ResearchRun[]>([]);
    const [result, setResult] = useState<ResearchResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sourceMessage, setSourceMessage] = useState<string | null>(null);

    const selectedFocus = RESEARCH_FOCUSES.find((item) => item.value === focus) ?? RESEARCH_FOCUSES[0]!;
    const selectedFocusDescription = selectedFocus.description;
    const questionSuggestions = RESEARCH_QUESTION_SUGGESTIONS[focus];
    const contextualResearch = focus !== "general";
    const effectiveExternal = external || contextualResearch;

    const load = useCallback(async (showLoading = true) => {
        if (!studyId) { setLoading(false); return; }
        if (showLoading) setLoading(true);
        setError(null);
        try {
            const study = await new SupabaseStudyRepository().find(StudyId.from(studyId));
            if (!study) throw new Error("Study not found.");
            setTitle(study.title.value);
            setPassage(study.passage.toString());
            const [obs, ints, bt, sources, runs] = await Promise.all([
                supabase.from("study_observations").select("id", { count: "exact", head: true }).eq("study_id", studyId),
                supabase.from("study_interpretations").select("id", { count: "exact", head: true }).eq("study_id", studyId),
                supabase.from("biblical_theology_entries").select("id", { count: "exact", head: true }).eq("study_id", studyId),
                supabase.from("research_sources").select("id, study_id, url, title, source_type, last_used_at").order("updated_at", { ascending: false }),
                supabase.from("research_runs").select("id, study_id, question, focus, answer, textual_basis, further_questions, cautions, sources, source_urls, provider, model, created_at").eq("study_id", studyId).order("created_at", { ascending: false }).limit(20),
            ]);
            if (obs.error) throw obs.error;
            if (ints.error) throw ints.error;
            if (bt.error) throw bt.error;
            if (sources.error) throw sources.error;
            if (runs.error) throw runs.error;
            const nextRuns = (runs.data ?? []) as ResearchRun[];
            setObservations(obs.count ?? 0);
            setInterpretations(ints.count ?? 0);
            setTheology(bt.count ?? 0);
            setSavedSources(sources.data ?? []);
            setResearchRuns(nextRuns);
            if (!result && nextRuns[0]) {
                const latest = nextRuns[0];
                const latestFocus = isFocus(latest.focus) ? latest.focus : "general";
                const latestSourceUrls = stringList(latest.source_urls);
                setFocus(latestFocus);
                setQuestion(latest.question);
                setExternal(latestFocus !== "general" || latestSourceUrls.length > 0);
                setSourceText(latestSourceUrls.join("\n"));
                setResult(resultFromRun(latest));
            }
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to load Biblical Research.");
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [studyId, result]);

    useEffect(() => { void load(true); }, [load]);

    function openRun(run: ResearchRun) {
        const runFocus = isFocus(run.focus) ? run.focus : "general";
        const runSources = stringList(run.source_urls);
        setFocus(runFocus);
        setQuestion(run.question);
        setExternal(runFocus !== "general" || runSources.length > 0);
        setSourceText(runSources.join("\n"));
        setResult(resultFromRun(run));
        setSelectedSavedSourceIds([]);
        setError(null);
        setSourceMessage("Research run reopened from History.");
    }

    async function deleteRun(id: string) {
        setError(null); setSourceMessage(null);
        const { error: deleteError } = await supabase.from("research_runs").delete().eq("id", id);
        if (deleteError) { setError(deleteError.message); return; }
        const remaining = researchRuns.filter((run) => run.id !== id);
        setResearchRuns(remaining);
        if (result?.researchRunId === id) {
            if (remaining[0]) openRun(remaining[0]);
            else { setResult(null); setQuestion(""); setSourceText(""); setExternal(false); }
        }
        setSourceMessage("Research run deleted.");
    }

    function addSavedSourcesToQuestion() {
        const selected = savedSources.filter((source) => selectedSavedSourceIds.includes(source.id)).map((source) => source.url);
        if (!selected.length) { setSourceMessage("Select at least one saved source first."); return; }
        const existing = sourceText.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
        setSourceText(Array.from(new Set([...existing, ...selected])).join("\n"));
        setExternal(true);
        setSourceMessage(`${selected.length} saved source${selected.length === 1 ? "" : "s"} added to this research request.`);
    }

    async function removeSavedSource(id: string) {
        setSourceMessage(null); setError(null);
        const { error: deleteError } = await supabase.from("research_sources").delete().eq("id", id);
        if (deleteError) { setError(deleteError.message); return; }
        setSavedSources((current) => current.filter((source) => source.id !== id));
        setSelectedSavedSourceIds((current) => current.filter((sourceId) => sourceId !== id));
        setSourceMessage("Source removed from your Research Source Library.");
    }

    async function runResearch() {
        setError(null); setSourceMessage(null); setResult(null);
        if (!studyId) { setError("Open Biblical Research from a Study."); return; }
        if (question.trim().length < 8) { setError("Enter a specific research question before running the assistant."); return; }
        const urls = sourceText.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 10);
        if (effectiveExternal && urls.some((url) => !/^https:\/\//i.test(url))) { setError("External research sources must use complete HTTPS URLs."); return; }
        setRunning(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (!token) throw new Error("A signed-in user is required.");
            const response = await fetch("/api/ai/biblical-research", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ studyId, question: question.trim(), external: effectiveExternal, sourceUrls: urls, focus }) });
            const payload = await response.json() as ResearchResponse;
            if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "The Biblical Research assistant request failed.");
            const formalSources = sourceList(payload.sources);
            const requestSources = stringList(payload.sourceUrls);
            const persisted = payload.persistence;
            const nextResult: ResearchResult = {
                researchRunId: persisted?.researchRunId,
                answer: typeof payload.answer === "string" ? payload.answer : "",
                textualBasis: stringList(payload.textualBasis),
                furtherQuestions: stringList(payload.furtherQuestions),
                cautions: stringList(payload.cautions),
                sources: formalSources,
                sourceUrls: requestSources,
                sourceCitationsReturned: formalSources.length > 0,
                model: typeof payload.model === "string" ? payload.model : "",
                provider: typeof payload.provider === "string" ? payload.provider : "",
            };
            setResult(nextResult);
            setSourceMessage(persisted ? `Research saved to History${persisted.sourcesSaved ? ` and ${persisted.sourcesSaved} external source${persisted.sourcesSaved === 1 ? "" : "s"} saved to the Research Source Library.` : "."}` : "Research completed.");
            await load(false);
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
            <p style={{ margin: "12px 0", color: "#6b7280" }}>Use the assistant to investigate context around the passage. Choose a research area for a focused investigation. External research adds source-backed context; it does not become part of your Study evidence automatically.</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "#4b5563" }}><span>{observations} observations</span><span>{interpretations} interpretations</span><span>{theology} theological syntheses</span><span>{savedSources.length} saved research sources</span><span>{researchRuns.length} saved research runs</span></div>
            <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap" }}><Link href={`/workspace?studyId=${encodeURIComponent(studyId)}`} style={linkStyle}>Study Workspace</Link><Link href={`/biblical-theology?studyId=${encodeURIComponent(studyId)}`} style={linkStyle}>Biblical Theology</Link><Link href={`/teaching?studyId=${encodeURIComponent(studyId)}`} style={linkStyle}>Teaching</Link></div>
        </section>

        {researchRuns.length > 0 && <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <h2 style={{ marginTop: 0 }}>Research History</h2>
            <p style={{ color: "#6b7280", marginTop: 0 }}>Previous research runs are saved to this Study and remain available after refresh or when you return later.</p>
            <div style={{ display: "grid", gap: 8, maxHeight: 360, overflowY: "auto" }}>
                {researchRuns.map((run) => <div key={run.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
                    <div><strong>{run.question}</strong><div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{RESEARCH_FOCUSES.find((item) => item.value === run.focus)?.label ?? "General Biblical Research"} · {new Date(run.created_at).toLocaleString()} · {run.provider} / {run.model}</div></div>
                    <div style={{ display: "flex", gap: 6 }}><button type="button" onClick={() => openRun(run)}>Open</button><button type="button" onClick={() => void deleteRun(run.id)}>Delete</button></div>
                </div>)}
            </div>
        </section>}

        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <h2 style={{ marginTop: 0 }}>Research Focus</h2>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }} htmlFor="research-focus">Research area</label>
            <select id="research-focus" value={focus} onChange={(event) => { setFocus(event.target.value as BiblicalResearchFocus); setResult(null); }} style={{ width: "100%", padding: 12, boxSizing: "border-box" }}>
                {RESEARCH_FOCUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>{selectedFocusDescription}</p>

            <div style={{ marginTop: 16, padding: 14, border: "1px solid #e5e7eb", borderRadius: 10, background: "#f9fafb" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0 }}>Research Questions</h3>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>Select one to use it as a starting point</span>
                </div>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    {questionSuggestions.map((suggestion) => <button key={suggestion.id} type="button" onClick={() => { setQuestion(suggestion.question); setError(null); }} style={{ textAlign: "left", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", cursor: "pointer", lineHeight: 1.45 }}>{suggestion.question}</button>)}
                </div>
            </div>

            <h2 style={{ marginTop: 20 }}>Research Question</h2>
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={5} placeholder="Choose a suggested question above or write your own focused research question." style={{ width: "100%", padding: 12, boxSizing: "border-box", resize: "vertical" }} />
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, fontWeight: 600 }}><input type="checkbox" checked={effectiveExternal} disabled={contextualResearch} onChange={(event) => setExternal(event.target.checked)} /> Include external research</label>
            {contextualResearch && <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>Contextual research modes automatically use external sources so geographical, cultural, historical, archaeological, and language claims can be checked against retrieved evidence. The option is required for this research focus.</p>}

            {effectiveExternal && <div style={{ marginTop: 12, padding: 14, border: "1px solid #e5e7eb", borderRadius: 10 }}>
                <h3 style={{ marginTop: 0 }}>Saved Research Sources</h3>
                <p style={{ fontSize: 12, color: "#6b7280" }}>Sources are reusable across future Studies. Select saved sources to add them to this research request.</p>
                {savedSources.length ? <div style={{ display: "grid", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                    {savedSources.map((source) => <div key={source.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13 }}><input aria-label={`Select ${source.title}`} type="checkbox" checked={selectedSavedSourceIds.includes(source.id)} onChange={(event) => setSelectedSavedSourceIds((current) => event.target.checked ? [...current, source.id] : current.filter((id) => id !== source.id))} /><span style={{ flex: 1 }}><strong>{source.title}</strong><br /><span style={{ color: "#6b7280" }}>{source.url}{source.study_id === studyId ? " · First saved in this Study" : " · Research Library"}</span></span><button type="button" onClick={() => void removeSavedSource(source.id)} style={{ padding: "2px 7px" }}>Remove</button></div>)}
                </div> : <p style={{ fontSize: 13, color: "#6b7280" }}>No saved research sources yet. Sources will be saved automatically after successful external research.</p>}
                <button type="button" onClick={addSavedSourcesToQuestion} disabled={!selectedSavedSourceIds.length} style={{ marginTop: 10 }}>Add selected sources to research</button>
            </div>}

            {effectiveExternal && <div style={{ marginTop: 10 }}><label style={{ display: "block", fontSize: 13, marginBottom: 6 }} htmlFor="research-source-urls">Optional public source URLs (one per line; up to 10)</label><textarea id="research-source-urls" value={sourceText} onChange={(event) => setSourceText(event.target.value)} rows={4} placeholder="https://example.org/article" style={{ width: "100%", padding: 12, boxSizing: "border-box", resize: "vertical" }} /><p style={{ fontSize: 12, color: "#6b7280" }}>External research uses Gemini&apos;s public web-search and URL-context tools when available. The OpenRouter fallback can use supplied URLs. Research sources are shown with their provenance status and saved for later reuse.</p></div>}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}><button type="button" onClick={() => void runResearch()} disabled={running}>{running ? "Researching..." : effectiveExternal ? "Research with Sources" : "Investigate Question"}</button>{error && <span style={{ color: "#b91c1c" }}>{error}</span>}{sourceMessage && <span style={{ color: "#166534" }}>{sourceMessage}</span>}</div>
        </section>

        {result && <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff", display: "grid", gap: 18 }}>
            <div><h2 style={{ marginTop: 0 }}>Research Guidance</h2><p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{result.answer}</p></div>
            <div><h3>Textual Basis</h3>{result.textualBasis.length ? <ul>{result.textualBasis.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No specific textual basis was returned from the supplied Study context.</p>}</div>
            {effectiveExternal && <>
                <div><h3>Retrieved Sources</h3>{result.sources.length ? <ul>{result.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" style={linkStyle}>{source.title}</a> <span style={{ color: "#6b7280" }}>({source.url})</span></li>)}</ul> : <p>No formal citation annotations were returned by the provider.</p>}</div>
                <div><h3>Sources Supplied to Research</h3>{result.sourceUrls.length ? <ul>{result.sourceUrls.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer" style={linkStyle}>{fallbackTitle(url)}</a> <span style={{ color: "#6b7280" }}>({url})</span></li>)}</ul> : <p>No source URLs were supplied to this research run.</p>}{result.sourceUrls.length && !result.sourceCitationsReturned ? <p style={{ fontSize: 12, color: "#92400e" }}>These URLs were supplied to the research request. The provider did not return formal citation annotations, so important claims should be checked directly against those sources.</p> : null}</div>
            </>}
            <div><h3>Questions for Further Study</h3>{result.furtherQuestions.length ? <ul>{result.furtherQuestions.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No additional questions were suggested.</p>}</div>
            <div><h3>Cautions</h3>{result.cautions.length ? <ul>{result.cautions.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No additional cautions were returned.</p>}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>AI provider: {result.provider} · model: {result.model} · {result.researchRunId ? "Saved to Research History" : "Not persisted"}</div>
        </section>}
    </main>;
}
