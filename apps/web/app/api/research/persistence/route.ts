import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types";

interface SourceInput { url: string; title?: string; sourceType?: string; }
interface RunInput {
    question: string;
    focus: string;
    answer: string;
    textualBasis: string[];
    furtherQuestions: string[];
    cautions: string[];
    sources: SourceInput[];
    sourceUrls: string[];
    provider: string;
    model: string;
}

function bearer(request: Request): string {
    const value = request.headers.get("authorization");
    if (!value?.startsWith("Bearer ")) throw new Error("A signed-in Supabase session is required.");
    const token = value.slice(7).trim();
    if (!token) throw new Error("A signed-in Supabase session is required.");
    return token;
}

async function context(request: Request) {
    const token = bearer(request);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase environment configuration.");
    const client = createClient<Database>(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) throw new Error("A valid signed-in Supabase session is required.");
    return { client, userId: data.user.id };
}

function requiredText(value: unknown, name: string): string {
    if (typeof value !== "string" || !value.trim()) throw new Error(`${name} is required.`);
    return value.trim();
}

function list(value: unknown, max = 10): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, max)
        : [];
}

function sourceList(value: unknown): SourceInput[] {
    if (!Array.isArray(value)) return [];
    return Array.from(new Map(value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) => {
            const url = typeof item.url === "string" ? item.url.trim() : "";
            const title = typeof item.title === "string" ? item.title.trim() : "";
            return [url, { url, title, sourceType: typeof item.sourceType === "string" ? item.sourceType.trim() : "external" } as SourceInput] as const;
        })
        .filter(([url]) => /^https:\/\//i.test(url))).values()).slice(0, 10);
}

function status(message: string): number {
    if (/signed-in|session/i.test(message)) return 401;
    if (/required|not found/i.test(message)) return 400;
    if (/Missing Supabase/i.test(message)) return 503;
    return 500;
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const studyId = requiredText(url.searchParams.get("studyId"), "Study ID");
        const { client, userId } = await context(request);
        const { data: study, error: studyError } = await client.from("studies").select("id").eq("id", studyId).eq("user_id", userId).maybeSingle();
        if (studyError) throw studyError;
        if (!study) throw new Error("The selected Study could not be found.");

        const [{ data: sources, error: sourcesError }, { data: runs, error: runsError }] = await Promise.all([
            client.from("research_sources").select("id, study_id, url, title, source_type, last_used_at, created_at, updated_at").order("updated_at", { ascending: false }),
            client.from("research_runs").select("id, study_id, question, focus, answer, textual_basis, further_questions, cautions, sources, source_urls, provider, model, created_at").eq("study_id", studyId).eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
        ]);
        if (sourcesError) throw sourcesError;
        if (runsError) throw runsError;
        return NextResponse.json({ sources: sources ?? [], runs: runs ?? [] });
    } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Unable to load research history.";
        return NextResponse.json({ error: message }, { status: status(message) });
    }
}

export async function POST(request: Request) {
    try {
        const { client, userId } = await context(request);
        const body = await request.json() as { studyId?: unknown; run?: unknown };
        const studyId = requiredText(body.studyId, "Study ID");
        if (!body.run || typeof body.run !== "object") throw new Error("Research result is required.");
        const run = body.run as Partial<RunInput>;
        const question = requiredText(run.question, "Research question");
        const answer = requiredText(run.answer, "Research answer");
        const provider = requiredText(run.provider, "Research provider");
        const model = requiredText(run.model, "Research model");
        const { data: study, error: studyError } = await client.from("studies").select("id").eq("id", studyId).eq("user_id", userId).maybeSingle();
        if (studyError) throw studyError;
        if (!study) throw new Error("The selected Study could not be found.");

        const sourceUrls = list(run.sourceUrls, 10).filter((value) => /^https:\/\//i.test(value));
        const sources = sourceList(run.sources);
        const { data: savedRun, error: runError } = await client.from("research_runs").insert({
            user_id: userId,
            study_id: studyId,
            question,
            focus: typeof run.focus === "string" && run.focus.trim() ? run.focus.trim() : "general",
            answer,
            textual_basis: list(run.textualBasis, 5),
            further_questions: list(run.furtherQuestions, 5),
            cautions: list(run.cautions, 5),
            sources,
            source_urls: sourceUrls,
            provider,
            model,
        }).select("id").single();
        if (runError) throw runError;

        const sourceCandidates = Array.from(new Map([
            ...sources.map((source) => [source.url, source] as const),
            ...sourceUrls.map((url) => [url, { url, title: new URL(url).hostname.replace(/^www\./, ""), sourceType: "external" } as SourceInput] as const),
        ]).values()).slice(0, 10);
        if (sourceCandidates.length) {
            const now = new Date().toISOString();
            const { error: sourceError } = await client.from("research_sources").upsert(sourceCandidates.map((source) => ({
                user_id: userId,
                study_id: studyId,
                url: source.url,
                title: source.title || source.url,
                source_type: source.sourceType || "external",
                updated_at: now,
                last_used_at: now,
            })), { onConflict: "user_id,url" });
            if (sourceError) throw sourceError;
        }

        return NextResponse.json({ savedRunId: savedRun.id, savedSourceCount: sourceCandidates.length });
    } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Unable to save research.";
        return NextResponse.json({ error: message }, { status: status(message) });
    }
}

export async function DELETE(request: Request) {
    try {
        const { client } = await context(request);
        const body = await request.json() as { sourceId?: unknown };
        const sourceId = requiredText(body.sourceId, "Source ID");
        const { error } = await client.from("research_sources").delete().eq("id", sourceId);
        if (error) throw error;
        return NextResponse.json({ ok: true });
    } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Unable to remove research source.";
        return NextResponse.json({ error: message }, { status: status(message) });
    }
}
