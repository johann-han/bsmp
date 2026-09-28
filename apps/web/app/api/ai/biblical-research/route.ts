import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../../src/lib/database.types";
import { runRoutedBiblicalResearch, runRoutedExternalBiblicalResearch } from "../../../../src/lib/biblicalResearchRouter";
import type { BiblicalResearchFocus } from "../../../../src/lib/biblicalResearchProvider";
import { AiQuotaExceededError, assertAiQuotaAvailable } from "../../../../src/lib/aiQuota";
import { recordAiUsageEvent } from "../../../../src/lib/aiUsage";

interface RequestBody { studyId?: unknown; question?: unknown; external?: unknown; sourceUrls?: unknown; focus?: unknown; }
interface ResearchSource { url: string; title: string; }
interface PersistedResearchRun { researchRunId: string; sourcesSaved: number; }
interface ResearchResult {
    answer: string;
    textualBasis: readonly string[];
    furtherQuestions: readonly string[];
    cautions: readonly string[];
    sources?: readonly ResearchSource[];
    provider: string;
    model: string;
}

const VALID_FOCUSES: readonly BiblicalResearchFocus[] = ["general", "geography", "customs_culture", "historical_period", "social_political", "religious_context", "literary_setting", "archaeology_material", "language_terminology"];

function requiredText(value: unknown, name: string): string {
    if (typeof value !== "string" || !value.trim()) throw new Error(`${name} is required.`);
    return value.trim();
}

function researchFocus(value: unknown): BiblicalResearchFocus {
    return typeof value === "string" && VALID_FOCUSES.includes(value as BiblicalResearchFocus) ? value as BiblicalResearchFocus : "general";
}

function bearer(request: Request): string {
    const value = request.headers.get("authorization");
    if (!value?.startsWith("Bearer ")) throw new Error("A signed-in Supabase session is required.");
    const token = value.slice(7).trim();
    if (!token) throw new Error("A signed-in Supabase session is required.");
    return token;
}

function sourceUrls(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))).slice(0, 10);
}

function validateExternalUrls(urls: readonly string[]): void {
    if (urls.some((url) => !/^https:\/\//i.test(url))) throw new Error("External research sources must use complete HTTPS URLs.");
}

function fallbackTitle(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function normalizeSources(value: unknown): ResearchSource[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const url = (item as { url?: unknown }).url;
        const title = (item as { title?: unknown }).title;
        if (typeof url !== "string" || !url.trim()) return [];
        return [{ url: url.trim(), title: typeof title === "string" && title.trim() ? title.trim() : fallbackTitle(url) }];
    }).slice(0, 10);
}

async function context(token: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase environment configuration.");
    const client = createClient<Database>(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) throw new Error("A valid signed-in Supabase session is required.");
    return { client, userId: data.user.id };
}

function errorStatus(message: string): number {
    if (/signed-in|session/i.test(message)) return 401;
    if (/AI_QUOTA_EXCEEDED|your current AI usage allowance|rate limit|too many requests|resource_exhausted|429/i.test(message)) return 429;
    if (/Missing Supabase environment|not configured|Unsupported AI_PROVIDER/i.test(message)) return 503;
    return 502;
}

function clientErrorMessage(message: string): string {
    if (/AI_QUOTA_EXCEEDED|your current AI usage allowance/i.test(message)) {
        return "Your current BSMP AI usage allowance has been reached. Review your Subscription and AI Usage pages for the current allowance and usage.";
    }
    if (/rate limit|too many requests|resource_exhausted|429/i.test(message)) {
        return "External research is temporarily unavailable because the configured AI provider has reached its current quota or rate limit. Check the provider usage/billing settings, or retry after the quota resets.";
    }
    return message;
}

async function persistResearch(
    client: ReturnType<typeof createClient<Database>>,
    userId: string,
    studyId: string,
    question: string,
    focus: BiblicalResearchFocus,
    requestedUrls: readonly string[],
    result: ResearchResult,
): Promise<PersistedResearchRun> {
    const now = new Date().toISOString();
    const formalSources = normalizeSources(result.sources);
    const sourceCandidates = Array.from(new Map([
        ...formalSources.map((source) => [source.url, source] as const),
        ...requestedUrls.map((url) => [url, { url, title: fallbackTitle(url) }] as const),
    ]).values()).slice(0, 10);

    if (sourceCandidates.length) {
        const rows = sourceCandidates.map((source) => ({
            user_id: userId,
            study_id: studyId,
            url: source.url,
            title: source.title || fallbackTitle(source.url),
            source_type: "external",
            updated_at: now,
            last_used_at: now,
        }));
        const { error: sourceError } = await client.from("research_sources").upsert(rows, { onConflict: "user_id,url", ignoreDuplicates: true });
        if (sourceError) throw sourceError;
        const { error: usageError } = await client.from("research_sources").update({ last_used_at: now, updated_at: now }).eq("user_id", userId).in("url", sourceCandidates.map((source) => source.url));
        if (usageError) throw usageError;
    }

    const { data: run, error: runError } = await client.from("research_runs").insert({
        user_id: userId,
        study_id: studyId,
        question,
        focus,
        answer: result.answer,
        textual_basis: result.textualBasis,
        further_questions: result.furtherQuestions,
        cautions: result.cautions,
        sources: formalSources,
        source_urls: requestedUrls,
        provider: result.provider,
        model: result.model,
    }).select("id").single();
    if (runError) throw runError;
    return { researchRunId: run.id, sourcesSaved: sourceCandidates.length };
}

function addFallbackProvenanceCaution(result: ResearchResult, requestedUrls: readonly string[]): ResearchResult {
    const formalSources = normalizeSources(result.sources);
    if (!requestedUrls.length || formalSources.length) return result;
    return {
        ...result,
        cautions: [...result.cautions, "The provider did not return formal citation annotations. The URLs shown below were supplied to the research request; verify important claims directly against those sources."],
    };
}

export async function POST(request: Request) {
    const startedAt = Date.now();
    let meteringUserId: string | null = null;
    let meteringStudyId: string | null = null;
    let meteringProvider = "unknown";
    let meteringModel = "unknown";
    let meteringOperation = "research";

    try {
        const token = bearer(request);
        const { client, userId } = await context(token);
        meteringUserId = userId;

        const body = await request.json() as RequestBody;
        const studyId = requiredText(body.studyId, "Study ID");
        meteringStudyId = studyId;
        const question = requiredText(body.question, "Research question");
        const focus = researchFocus(body.focus);
        const requestedUrls = sourceUrls(body.sourceUrls);
        validateExternalUrls(requestedUrls);
        const useExternal = body.external === true || focus !== "general";
        meteringOperation = useExternal ? "external_research" : "grounded_research";

        await assertAiQuotaAvailable(userId);

        const { data: study, error: studyError } = await client.from("studies").select("id, title, passage_start_book, passage_start_chapter, passage_start_verse, passage_end_book, passage_end_chapter, passage_end_verse").eq("id", studyId).eq("user_id", userId).maybeSingle();
        if (studyError) throw studyError;
        if (!study) throw new Error("The selected Study could not be found.");

        const [{ data: observations, error: observationsError }, { data: interpretations, error: interpretationsError }, { data: theology, error: theologyError }] = await Promise.all([
            client.from("study_observations").select("verse_book, verse_chapter, verse_verse, statement").eq("study_id", studyId).eq("user_id", userId).order("created_at", { ascending: true }),
            client.from("study_interpretations").select("statement").eq("study_id", studyId).eq("user_id", userId).order("created_at", { ascending: true }),
            client.from("biblical_theology_entries").select("theme, synthesis").eq("study_id", studyId).eq("user_id", userId).order("created_at", { ascending: true }),
        ]);
        if (observationsError) throw observationsError;
        if (interpretationsError) throw interpretationsError;
        if (theologyError) throw theologyError;

        const passage = `${study.passage_start_book} ${study.passage_start_chapter}:${study.passage_start_verse}-${study.passage_end_book} ${study.passage_end_chapter}:${study.passage_end_verse}`;
        const studyContext = [
            ...(observations ?? []).map((item) => `Observation — ${item.verse_book} ${item.verse_chapter}:${item.verse_verse}: ${item.statement}`),
            ...(interpretations ?? []).map((item) => `Interpretation — ${item.statement}`),
            ...(theology ?? []).map((item) => `Biblical Theology — ${item.theme}: ${item.synthesis}`),
        ];

        let result: ResearchResult;
        if (useExternal) {
            result = await runRoutedExternalBiblicalResearch({ question, studyTitle: study.title, passage, studyContext, sourceUrls: requestedUrls, focus });
            result = addFallbackProvenanceCaution(result, requestedUrls);
        } else {
            result = await runRoutedBiblicalResearch({
                question,
                studyTitle: study.title,
                passage,
                focus,
                observations: (observations ?? []).map((item) => `${item.verse_book} ${item.verse_chapter}:${item.verse_verse}: ${item.statement}`),
                interpretations: (interpretations ?? []).map((item) => item.statement),
                biblicalTheology: (theology ?? []).map((item) => ({ theme: item.theme, synthesis: item.synthesis })),
            });
        }

        meteringProvider = result.provider;
        meteringModel = result.model;
        const persistence = await persistResearch(client, userId, studyId, question, focus, requestedUrls, result);
        await recordAiUsageEvent({
            userId,
            studyId,
            feature: "biblical_research",
            operation: meteringOperation,
            provider: result.provider,
            model: result.model,
            status: "success",
            durationMs: Date.now() - startedAt,
            metadata: {
                focus,
                external: useExternal,
                source_count: requestedUrls.length,
                formal_citation_count: normalizeSources(result.sources).length,
            },
        });

        return NextResponse.json({ ...result, sources: normalizeSources(result.sources), sourceUrls: requestedUrls, persistence });
    } catch (reason: unknown) {
        const message = reason instanceof Error ? reason.message : "Unable to run Biblical Research.";
        if (meteringUserId && !(reason instanceof AiQuotaExceededError)) {
            await recordAiUsageEvent({
                userId: meteringUserId,
                studyId: meteringStudyId,
                feature: "biblical_research",
                operation: meteringOperation,
                provider: meteringProvider,
                model: meteringModel,
                status: "error",
                durationMs: Date.now() - startedAt,
                errorCode: String(errorStatus(message)),
            });
        }
        return NextResponse.json({ error: clientErrorMessage(message) }, { status: errorStatus(message) });
    }
}
