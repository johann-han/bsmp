"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@repo/ui";
import type { StudySession } from "@bsmp/study";
import { StudyId } from "@bsmp/study";
import type { Database } from "../../lib/database.types";
import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { supabase } from "../../lib/supabase";
import { findTeachingPlans, saveTeachingPlan, type TeachingPlan } from "../../lib/teachingPlanRepository";

type BiblicalTheologyEntry = Database["public"]["Tables"]["biblical_theology_entries"]["Row"];
type MentorFocus = "centralTruth" | "teachingAim" | "keyPoints" | "explanation" | "discussionQuestions" | "responsePrompt";

const linkStyle = { color: "#1d4ed8", textDecoration: "none" } as const;

function lines(value: string): string[] {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function joinLines(value: readonly string[]): string {
    return value.join("\n");
}

function toggleId(values: string[], id: string): string[] {
    return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}

function initialTitle(study: StudySession): string {
    return `${study.title.value} — Teaching Plan`;
}

export function TeachingWorkspace({ studyId }: { studyId: string }) {
    const router = useRouter();
    const [study, setStudy] = useState<StudySession | null>(null);
    const [theologyEntries, setTheologyEntries] = useState<readonly BiblicalTheologyEntry[]>([]);
    const [planId, setPlanId] = useState("");
    const [title, setTitle] = useState("");
    const [audience, setAudience] = useState("");
    const [centralTruth, setCentralTruth] = useState("");
    const [teachingAim, setTeachingAim] = useState("");
    const [explanation, setExplanation] = useState("");
    const [keyPoints, setKeyPoints] = useState("");
    const [discussionQuestions, setDiscussionQuestions] = useState("");
    const [responsePrompt, setResponsePrompt] = useState("");
    const [selectedInterpretationIds, setSelectedInterpretationIds] = useState<string[]>([]);
    const [selectedTheologyIds, setSelectedTheologyIds] = useState<string[]>([]);
    const [assessment, setAssessment] = useState<string | null>(null);
    const [coaching, setCoaching] = useState<string | null>(null);
    const [focuses, setFocuses] = useState<MentorFocus[]>([]);
    const [mentorLoading, setMentorLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                if (!studyId) throw new Error("A study is required to open Teaching.");
                const studyRepository = new SupabaseStudyRepository();
                const [{ data: theologyRows, error: theologyError }, nextStudy, plans] = await Promise.all([
                    supabase.from("biblical_theology_entries").select("*").eq("study_id", studyId).order("created_at", { ascending: true }),
                    studyRepository.find(StudyId.from(studyId)),
                    findTeachingPlans(studyId),
                ]);
                if (cancelled) return;
                if (theologyError) throw theologyError;
                if (!nextStudy) throw new Error("The selected study could not be found.");
                const latest = plans[0];
                setStudy(nextStudy);
                setTheologyEntries((theologyRows ?? []) as BiblicalTheologyEntry[]);
                setPlanId(latest?.id ?? "");
                setTitle(latest?.title ?? initialTitle(nextStudy));
                setAudience(latest?.audience ?? "");
                setCentralTruth(latest?.central_truth ?? "");
                setTeachingAim(latest?.teaching_aim ?? "");
                setExplanation(latest?.explanation ?? "");
                setKeyPoints(joinLines(latest?.key_points ?? []));
                setDiscussionQuestions(joinLines(latest?.discussion_questions ?? []));
                setResponsePrompt(latest?.response_prompt ?? "");
                setSelectedInterpretationIds([...(latest?.supporting_interpretation_ids ?? [])]);
                setSelectedTheologyIds([...(latest?.supporting_biblical_theology_ids ?? [])]);
            } catch (reason: unknown) {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load the Teaching workspace.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void load();
        return () => { cancelled = true; };
    }, [studyId]);

    const selectedInterpretations = useMemo(
        () => (study?.interpretations ?? []).filter((item) => selectedInterpretationIds.includes(item.id.value)),
        [study, selectedInterpretationIds],
    );
    const selectedTheology = useMemo(
        () => theologyEntries.filter((entry) => selectedTheologyIds.includes(entry.id)),
        [theologyEntries, selectedTheologyIds],
    );
    const mentorReady = Boolean(selectedInterpretations.length > 0 && selectedTheology.length > 0 && centralTruth.trim() && teachingAim.trim() && explanation.trim() && lines(keyPoints).length > 0 && responsePrompt.trim());

    async function save() {
        if (!study) return;
        setSaving(true); setMessage(null); setError(null);
        try {
            const saved = await saveTeachingPlan({
                id: planId || crypto.randomUUID(),
                study_id: studyId,
                title: title.trim() || initialTitle(study),
                audience: audience.trim(),
                central_truth: centralTruth.trim(),
                teaching_aim: teachingAim.trim(),
                explanation: explanation.trim(),
                key_points: lines(keyPoints),
                discussion_questions: lines(discussionQuestions),
                response_prompt: responsePrompt.trim(),
                supporting_interpretation_ids: selectedInterpretationIds,
                supporting_biblical_theology_ids: selectedTheologyIds,
            });
            setPlanId(saved.id);
            setTitle(saved.title);
            setMessage("Teaching plan saved.");
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to save the Teaching plan.");
        } finally { setSaving(false); }
    }

    async function runMentor() {
        if (!study || !mentorReady) return;
        setMentorLoading(true); setAssessment(null); setCoaching(null); setFocuses([]); setError(null);
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (!token) throw new Error("A signed-in Supabase session is required for the teaching mentor.");
            const response = await fetch("/api/ai/teaching-mentor", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    interpretation: selectedInterpretations.map((item) => item.statement.value).join("\n"),
                    theology: selectedTheology.map((item) => `${item.theme}\n${item.synthesis}`).join("\n\n"),
                    centralTruth: centralTruth.trim(),
                    teachingAim: teachingAim.trim(),
                    keyPoints: lines(keyPoints),
                    explanation: explanation.trim(),
                    discussionQuestions: lines(discussionQuestions),
                    responsePrompt: responsePrompt.trim(),
                }),
            });
            const payload = await response.json() as { assessment?: string; coaching?: string; focuses?: unknown; error?: string };
            if (!response.ok) throw new Error(payload.error ?? "The teaching mentor could not respond.");
            setAssessment(payload.assessment ?? null);
            setCoaching(payload.coaching ?? null);
            setFocuses(Array.isArray(payload.focuses) ? payload.focuses.filter((item): item is MentorFocus => ["centralTruth", "teachingAim", "keyPoints", "explanation", "discussionQuestions", "responsePrompt"].includes(String(item))) : []);
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to run the teaching mentor.");
        } finally { setMentorLoading(false); }
    }

    if (loading) return <AppShell title="Teaching"><p>Loading Teaching workspace...</p></AppShell>;
    if (error || !study) return <AppShell title="Teaching"><p style={{ color: "#b91c1c" }}>{error ?? "Teaching workspace could not be loaded."}</p><button type="button" onClick={() => router.push(`/studies?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>← Back to Studies</button></AppShell>;

    const fieldStyle = (field: MentorFocus) => ({ outline: focuses.includes(field) ? "2px solid #f59e0b" : undefined, outlineOffset: focuses.includes(field) ? 2 : undefined });

    return <AppShell title="Teaching"><div style={{ display: "grid", gap: 20 }}>
        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Inductive Study → Biblical Theology → Teaching</div>
            <h2 style={{ margin: "4px 0 8px" }}>{study.title.value}</h2>
            <p style={{ margin: "4px 0" }}><strong>Passage:</strong> {study.passage.toString()}</p>
            <p style={{ margin: "10px 0 0", color: "#6b7280" }}>Turn what you have established from the text into a teachable lesson without asking AI to supply the message. The foundations remain student-selected and traceable.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}><Link href={`/workspace?studyId=${encodeURIComponent(studyId)}&returnTo=${encodeURIComponent(`/teaching?studyId=${studyId}`)}`} style={linkStyle}>Open Study Workspace</Link><Link href={`/biblical-theology?studyId=${encodeURIComponent(studyId)}`} style={linkStyle}>Review Biblical Theology</Link></div>
        </section>

        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <h2 style={{ marginTop: 0 }}>Teaching Foundations</h2>
            <p style={{ color: "#6b7280", marginTop: 0 }}>Select the interpretations and Biblical Theology syntheses that this lesson will explicitly teach from.</p>
            <h3>Interpretations</h3>
            {study.interpretations.length === 0 ? <p>No interpretations have been recorded yet.</p> : study.interpretations.map((interpretation) => <label key={interpretation.id.value} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 8 }}><input type="checkbox" checked={selectedInterpretationIds.includes(interpretation.id.value)} onChange={() => setSelectedInterpretationIds((current) => toggleId(current, interpretation.id.value))} /><span>{interpretation.statement.value}</span></label>)}
            <h3 style={{ marginTop: 18 }}>Biblical Theology</h3>
            {theologyEntries.length === 0 ? <p>No Biblical Theology syntheses have been recorded for this study yet. Create one before running the Teaching Mentor.</p> : theologyEntries.map((entry) => <label key={entry.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 8 }}><input type="checkbox" checked={selectedTheologyIds.includes(entry.id)} onChange={() => setSelectedTheologyIds((current) => toggleId(current, entry.id))} /><span><strong>{entry.theme}</strong> — {entry.synthesis}</span></label>)}
        </section>

        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
            <h2 style={{ marginTop: 0 }}>Teaching Plan</h2>
            <label style={{ display: "grid", gap: 6, marginBottom: 14 }}><strong>Title</strong><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Teaching lesson title" style={{ padding: 10 }} /></label>
            <label style={{ display: "grid", gap: 6, marginBottom: 14 }}><strong>Audience</strong><input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="Who will be taught?" style={{ padding: 10 }} /></label>
            <label style={{ display: "grid", gap: 6, marginBottom: 14 }}><strong>Central truth</strong><textarea value={centralTruth} onChange={(event) => setCentralTruth(event.target.value)} rows={3} placeholder="State the truth you intend to teach." style={{ padding: 10, ...fieldStyle("centralTruth") }} /></label>
            <label style={{ display: "grid", gap: 6, marginBottom: 14 }}><strong>Teaching aim</strong><textarea value={teachingAim} onChange={(event) => setTeachingAim(event.target.value)} rows={3} placeholder="What should the learner understand or be prepared to respond to?" style={{ padding: 10, ...fieldStyle("teachingAim") }} /></label>
            <label style={{ display: "grid", gap: 6, marginBottom: 14 }}><strong>Explanation</strong><textarea value={explanation} onChange={(event) => setExplanation(event.target.value)} rows={8} placeholder="Explain the truth from the selected foundations." style={{ padding: 10, ...fieldStyle("explanation") }} /></label>
            <label style={{ display: "grid", gap: 6, marginBottom: 14 }}><strong>Key teaching points</strong><textarea value={keyPoints} onChange={(event) => setKeyPoints(event.target.value)} rows={7} placeholder="One teaching point per line." style={{ padding: 10, ...fieldStyle("keyPoints") }} /></label>
            <label style={{ display: "grid", gap: 6, marginBottom: 14 }}><strong>Discussion questions</strong><textarea value={discussionQuestions} onChange={(event) => setDiscussionQuestions(event.target.value)} rows={6} placeholder="One question per line." style={{ padding: 10, ...fieldStyle("discussionQuestions") }} /></label>
            <label style={{ display: "grid", gap: 6 }}><strong>Response prompt</strong><textarea value={responsePrompt} onChange={(event) => setResponsePrompt(event.target.value)} rows={4} placeholder="Close with a clear response or reflection prompt." style={{ padding: 10, ...fieldStyle("responsePrompt") }} /></label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 16 }}><button type="button" onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save Teaching Plan"}</button><button type="button" onClick={() => void runMentor()} disabled={!mentorReady || mentorLoading}>{mentorLoading ? "Checking..." : "Check with Teaching Mentor"}</button>{message && <span style={{ color: "#047857" }}>{message}</span>}{!mentorReady && <span style={{ color: "#6b7280", fontSize: 13 }}>Mentor check needs at least one interpretation, one Biblical Theology synthesis, a central truth, aim, explanation, key point, and response prompt.</span>}</div>
        </section>

        {(assessment || coaching) && <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#f8fafc" }}><h2 style={{ marginTop: 0 }}>Teaching Mentor</h2><p style={{ marginBottom: 8 }}><strong>Assessment:</strong> {assessment}</p><p style={{ marginTop: 0 }}>{coaching}</p>{focuses.length > 0 && <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 0 }}>Review the highlighted fields before teaching. The mentor coaches clarity, grounding, structure, and scope; it does not write the lesson.</p>}</section>}
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
    </div></AppShell>;
}
