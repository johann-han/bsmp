import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../../src/lib/database.types";
import { runRoutedBiblicalResearch, runRoutedExternalBiblicalResearch } from "../../../../src/lib/biblicalResearchRouter";
import type { BiblicalResearchFocus } from "../../../../src/lib/biblicalResearchProvider";

interface RequestBody { studyId?: unknown; question?: unknown; external?: unknown; sourceUrls?: unknown; focus?: unknown; }
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
    if (/quota|rate limit|too many requests|resource_exhausted|429/i.test(message)) return 429;
    if (/Missing Supabase environment|not configured|Unsupported AI_PROVIDER/i.test(message)) return 503;
    return 502;
}

function clientErrorMessage(message: string): string {
    if (/quota|rate limit|too many requests|resource_exhausted|429/i.test(message)) {
        return "External research is temporarily unavailable because the configured AI provider has reached its current quota or rate limit. Check the provider usage/billing settings, or retry after the quota resets.";
    }
    return message;
}

export async function POST(request: Request) {
    try {
        const token = bearer(request);
        const { client, userId } = await context(token);
        const body = await request.json() as RequestBody;
        const studyId = requiredText(body.studyId, "Study ID");
        const question = requiredText(body.question, "Research question");
        const focus = researchFocus(body.focus);
        const useExternal = body.external === true;

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

        if (useExternal) {
            const result = await runRoutedExternalBiblicalResearch({ question, studyTitle: study.title, passage, studyContext, sourceUrls: sourceUrls(body.sourceUrls), focus });
            return NextResponse.json(result);
        }

        const result = await runRoutedBiblicalResearch({
            question,
            studyTitle: study.title,
            passage,
            focus,
            observations: (observations ?? []).map((item) => `${item.verse_book} ${item.verse_chapter}:${item.verse_verse}: ${item.statement}`),
            interpretations: (interpretations ?? []).map((item) => item.statement),
            biblicalTheology: (theology ?? []).map((item) => ({ theme: item.theme, synthesis: item.synthesis })),
        });

        return NextResponse.json(result);
    } catch (reason: unknown) {
        const message = reason instanceof Error ? reason.message : "Unable to run Biblical Research.";
        return NextResponse.json({ error: clientErrorMessage(message) }, { status: errorStatus(message) });
    }
}
