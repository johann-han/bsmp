"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { BiblicalResearchFocus } from "../../lib/biblicalResearchProvider";

interface Props { studyId?: string; }
interface ResearchRun {
    id: string;
    study_id: string;
    question: string;
    focus: string;
    answer: string;
    textual_basis: unknown;
    further_questions: unknown;
    cautions: unknown;
    provider: string;
    model: string;
    created_at: string;
}
interface ResearchRunSource {
    id: string;
    research_run_id: string;
    url: string;
    title: string;
    provenance_type: string;
    citation_returned: boolean;
    created_at: string;
}
interface StudySummary { id: string; title: string; }

const FOCUSES: readonly { value: BiblicalResearchFocus | "all"; label: string }[] = [
    { value: "all", label: "All research areas" },
    { value: "general", label: "General Biblical Research" },
    { value: "geography", label: "Geographical Setting" },
    { value: "customs_culture", label: "Customs & Culture" },
    { value: "historical_period", label: "Historical / Time Period" },
    { value: "social_political", label: "Social & Political Setting" },
    { value: "religious_context", label: "Religious Context" },
    { value: "literary_setting", label: "Literary & Historical Setting" },
    { value: "archaeology_material", label: "Archaeology & Material Context" },
    { value: "language_terminology", label: "Language & Terminology" },
];

const linkStyle = { color: "#1d4ed8", textDecoration: "none", fontWeight: 600 } as const;

function focusLabel(focus: string): string {
    return FOCUSES.find((item) => item.value === focus)?.label ?? "General Biblical Research";
}

function stringList(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
        : [];
}

function provenanceLabel(value: string): string {
    return value === "provider_citation" ? "Provider citation" : "Supplied URL";
}

export function ResearchHistoryWorkspace({ studyId = "" }: Props) {
    const [runs, setRuns] = useState<ResearchRun[]>([]);
    const [sources, setSources] = useState<ResearchRunSource[]>([]);
    const [studies, setStudies] = useState<StudySummary[]>([]);
    const [focus, setFocus] = useState<BiblicalResearchFocus | "all">("all");
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            setError(null);
            const runQuery = supabase
                .from("research_runs")
                .select("id, study_id, question, focus, answer, textual_basis, further_questions, cautions, provider, model, created_at")
                .order("created_at", { ascending: false })
                .limit(100);
            const scopedRunQuery = studyId ? runQuery.eq("study_id", studyId) : runQuery;

            const { data: runData, error: runError } = await scopedRunQuery;
            if (!active) return;
            if (runError) {
                setError(runError.message);
                setLoading(false);
                return;
            }

            const nextRuns = (runData ?? []) as ResearchRun[];
            const runIds = nextRuns.map((run) => run.id);
            const studyIds = Array.from(new Set(nextRuns.map((run) => run.study_id)));

            const [{ data: sourceData, error: sourceError }, { data: studyData, error: studyError }] = await Promise.all([
                runIds.length
                    ? supabase
                          .from("research_run_sources")
                          .select("id, research_run_id, url, title, provenance_type, citation_returned, created_at")
                          .in("research_run_id", runIds)
                          .order("created_at", { ascending: true })
                    : Promise.resolve({ data: [], error: null }),
                studyIds.length
                    ? supabase.from("studies").select("id, title").in("id", studyIds)
                    : Promise.resolve({ data: [], error: null }),
            ]);

            if (!active) return;
            if (sourceError) {
                setError(sourceError.message);
                setLoading(false);
                return;
            }
            if (studyError) {
                setError(studyError.message);
                setLoading(false);
                return;
            }

            setRuns(nextRuns);
            setSources((sourceData ?? []) as ResearchRunSource[]);
            setStudies((studyData ?? []) as StudySummary[]);
            setSelectedRunId(nextRuns[0]?.id ?? null);
            setLoading(false);
        }

        void load();
        return () => { active = false; };
    }, [studyId]);

    const studyMap = useMemo(() => new Map(studies.map((study) => [study.id, study.title])), [studies]);
    const visibleRuns = useMemo(
        () => runs.filter((run) => focus === "all" || run.focus === focus),
        [runs, focus],
    );
    const sourceMap = useMemo(() => {
        const map = new Map<string, ResearchRunSource[]>();
        for (const source of sources) {
            const current = map.get(source.research_run_id) ?? [];
            current.push(source);
            map.set(source.research_run_id, current);
        }
        return map;
    }, [sources]);

    const selectedRun = visibleRuns.find((run) => run.id === selectedRunId) ?? visibleRuns[0] ?? null;
    const selectedSources = selectedRun ? sourceMap.get(selectedRun.id) ?? [] : [];

    async function deleteRun(run: ResearchRun) {
        setMessage(null);
        setError(null);
        const { error: deleteError } = await supabase.from("research_runs").delete().eq("id", run.id);
        if (deleteError) {
            setError(deleteError.message);
            return;
        }
        const nextRuns = runs.filter((item) => item.id !== run.id);
        setRuns(nextRuns);
        setSources((current) => current.filter((source) => source.research_run_id !== run.id));
        setSelectedRunId(nextRuns[0]?.id ?? null);
        setMessage("Research run deleted.");
    }

    if (loading) return <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}><p>Loading Research History...</p></main>;

    return (
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24, display: "grid", gap: 18 }}>
            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>BSMP → Research History</div>
                <h1 style={{ margin: "4px 0 8px" }}>Research History</h1>
                <p style={{ margin: 0, color: "#6b7280" }}>
                    Review saved research runs and the provenance of their external sources. Research History is separate from your Study evidence.
                </p>
                <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link href={studyId ? `/research?studyId=${encodeURIComponent(studyId)}` : "/research"} style={linkStyle}>Research Workspace</Link>
                    <span style={{ color: "#6b7280" }}>{runs.length} saved run{runs.length === 1 ? "" : "s"}</span>
                </div>
            </section>

            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                <label htmlFor="history-focus" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Filter research area</label>
                <select id="history-focus" value={focus} onChange={(event) => setFocus(event.target.value as BiblicalResearchFocus | "all")} style={{ width: "100%", maxWidth: 520, padding: 10 }}>
                    {FOCUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                {error && <p style={{ color: "#b91c1c", marginBottom: 0 }}>{error}</p>}
                {message && <p style={{ color: "#166534", marginBottom: 0 }}>{message}</p>}
            </section>

            {!visibleRuns.length ? (
                <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <p style={{ margin: 0, color: "#6b7280" }}>No saved research runs match this filter.</p>
                </section>
            ) : (
                <section style={{ display: "grid", gridTemplateColumns: "minmax(320px, 0.9fr) minmax(0, 1.6fr)", gap: 18, alignItems: "start" }}>
                    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, background: "#fff", display: "grid", gap: 8, maxHeight: 720, overflowY: "auto" }}>
                        {visibleRuns.map((run) => {
                            const active = selectedRun?.id === run.id;
                            const runSources = sourceMap.get(run.id) ?? [];
                            return (
                                <button key={run.id} type="button" onClick={() => setSelectedRunId(run.id)} style={{ textAlign: "left", padding: 12, border: active ? "2px solid #1d4ed8" : "1px solid #e5e7eb", borderRadius: 10, background: active ? "#eff6ff" : "#fff", cursor: "pointer" }}>
                                    <strong style={{ display: "block", lineHeight: 1.4 }}>{run.question}</strong>
                                    <span style={{ display: "block", marginTop: 6, fontSize: 12, color: "#6b7280" }}>{studyMap.get(run.study_id) ?? "Study"}</span>
                                    <span style={{ display: "block", marginTop: 3, fontSize: 12, color: "#6b7280" }}>{focusLabel(run.focus)} · {new Date(run.created_at).toLocaleString()}</span>
                                    <span style={{ display: "block", marginTop: 3, fontSize: 12, color: "#6b7280" }}>{run.provider} / {run.model} · {runSources.length} source{runSources.length === 1 ? "" : "s"}</span>
                                </button>
                            );
                        })}
                    </div>

                    {selectedRun && (
                        <article style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff", display: "grid", gap: 18 }}>
                            <header>
                                <div style={{ fontSize: 12, color: "#6b7280" }}>{focusLabel(selectedRun.focus)} · {new Date(selectedRun.created_at).toLocaleString()}</div>
                                <h2 style={{ margin: "6px 0" }}>{selectedRun.question}</h2>
                                <div style={{ fontSize: 13, color: "#6b7280" }}>{studyMap.get(selectedRun.study_id) ?? "Study"} · {selectedRun.provider} / {selectedRun.model}</div>
                                <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
                                    <Link href={`/research?studyId=${encodeURIComponent(selectedRun.study_id)}`} style={linkStyle}>Open Study Research</Link>
                                    <button type="button" onClick={() => void deleteRun(selectedRun)}>Delete run</button>
                                </div>
                            </header>

                            <div><h3>Research Guidance</h3><p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{selectedRun.answer}</p></div>
                            <div><h3>Textual Basis</h3>{stringList(selectedRun.textual_basis).length ? <ul>{stringList(selectedRun.textual_basis).map((item) => <li key={item}>{item}</li>)}</ul> : <p>No specific Study textual basis was returned.</p>}</div>

                            <div>
                                <h3>Source Provenance</h3>
                                {selectedSources.length ? (
                                    <div style={{ display: "grid", gap: 8 }}>
                                        {selectedSources.map((source) => (
                                            <div key={source.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10 }}>
                                                <a href={source.url} target="_blank" rel="noreferrer" style={linkStyle}>{source.title}</a>
                                                <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>{source.url}</div>
                                                <div style={{ marginTop: 4, fontSize: 12 }}>
                                                    <strong>{provenanceLabel(source.provenance_type)}</strong>
                                                    {" · "}
                                                    {source.citation_returned ? "Formal citation returned" : "No formal citation annotation returned"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p>No external sources were attached to this research run.</p>}
                            </div>

                            <div><h3>Questions for Further Study</h3>{stringList(selectedRun.further_questions).length ? <ul>{stringList(selectedRun.further_questions).map((item) => <li key={item}>{item}</li>)}</ul> : <p>No additional questions were saved.</p>}</div>
                            <div><h3>Cautions</h3>{stringList(selectedRun.cautions).length ? <ul>{stringList(selectedRun.cautions).map((item) => <li key={item}>{item}</li>)}</ul> : <p>No additional cautions were saved.</p>}</div>
                        </article>
                    )}
                </section>
            )}
        </main>
    );
}
