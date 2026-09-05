import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../../../src/lib/database.types";
import { createBiblicalTheologyMentorProvider } from "../../../../src/lib/biblicalTheologyMentorProvider";

interface MentorRequest {
    readonly studyId?: unknown;
    readonly interpretationIds?: unknown;
    readonly interpretations?: unknown;
    readonly theme?: unknown;
    readonly synthesis?: unknown;
}

function requireBearerToken(request: Request): string {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) throw new Error("A signed-in Supabase session is required.");
    const token = authorization.slice("Bearer ".length).trim();
    if (!token) throw new Error("A signed-in Supabase session is required.");
    return token;
}

async function getSignedInUser(accessToken: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishableKey) throw new Error("Missing Supabase environment configuration.");
    const client = createClient<Database>(url, publishableKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) throw new Error("A valid signed-in Supabase session is required.");
    return { client, user: data.user };
}

function requiredText(value: unknown, field: string): string {
    if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required.`);
    return value.trim();
}

function requiredTextArray(value: unknown, field: string): string[] {
    if (!Array.isArray(value)) throw new Error(`${field} is required.`);
    const items = value
        .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
        .map((item) => item.trim());
    if (items.length === 0) throw new Error(`${field} must contain at least one item.`);
    return items;
}

function optionalIdArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim());
}

export async function POST(request: Request) {
    try {
        const accessToken = requireBearerToken(request);
        const { client, user } = await getSignedInUser(accessToken);
        const body = await request.json() as MentorRequest;
        const studyId = requiredText(body.studyId, "Study ID");
        const interpretationIds = optionalIdArray(body.interpretationIds);
        const suppliedInterpretations = optionalIdArray(body.interpretations);

        if (interpretationIds.length === 0 && suppliedInterpretations.length === 0) {
            throw new Error("At least one supporting interpretation is required.");
        }

        let interpretations = suppliedInterpretations;
        if (interpretationIds.length > 0) {
            const { data, error } = await client
                .from("study_interpretations")
                .select("id, statement")
                .eq("study_id", studyId)
                .eq("user_id", user.id)
                .in("id", interpretationIds);
            if (error) throw error;
            if (!data || data.length !== interpretationIds.length) {
                throw new Error("One or more supporting interpretations could not be found in the current Study.");
            }
            const ordered = new Map(data.map((row) => [row.id, row.statement]));
            interpretations = interpretationIds.map((id) => ordered.get(id)).filter((value): value is string => Boolean(value?.trim()));
        }

        const result = await createBiblicalTheologyMentorProvider().assess({
            interpretations,
            theme: requiredText(body.theme, "Theme"),
            synthesis: requiredText(body.synthesis, "Biblical Theology synthesis"),
        });
        return NextResponse.json(result);
    } catch (reason: unknown) {
        const message = reason instanceof Error ? reason.message : "Unable to run the Biblical Theology mentor.";
        const status = /session|signed-in|Supabase/i.test(message) ? 401 : /not configured|Unsupported AI_PROVIDER/i.test(message) ? 503 : 502;
        return NextResponse.json({ error: message }, { status });
    }
}
