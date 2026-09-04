import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../../../src/lib/database.types";
import { createTeachingMentorProvider } from "../../../../src/lib/teachingMentorProvider";

interface MentorRequest {
    readonly interpretation?: unknown;
    readonly theology?: unknown;
    readonly centralTruth?: unknown;
    readonly teachingAim?: unknown;
    readonly keyPoints?: unknown;
    readonly explanation?: unknown;
    readonly discussionQuestions?: unknown;
    readonly responsePrompt?: unknown;
}

function requireBearerToken(request: Request): string {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) throw new Error("A signed-in Supabase session is required.");
    const token = authorization.slice("Bearer ".length).trim();
    if (!token) throw new Error("A signed-in Supabase session is required.");
    return token;
}

async function assertSignedIn(accessToken: string): Promise<void> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishableKey) throw new Error("Missing Supabase environment configuration.");
    const client = createClient<Database>(url, publishableKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) throw new Error("A valid signed-in Supabase session is required.");
}

function requiredText(value: unknown, field: string): string {
    if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required.`);
    return value.trim();
}

function requiredTextArray(value: unknown, field: string): string[] {
    if (!Array.isArray(value)) throw new Error(`${field} is required.`);
    const items = value.filter((item): item is string => typeof item === "string" && item.trim()).map((item) => item.trim());
    if (items.length === 0) throw new Error(`${field} must contain at least one item.`);
    return items;
}

export async function POST(request: Request) {
    try {
        const accessToken = requireBearerToken(request);
        await assertSignedIn(accessToken);
        const body = await request.json() as MentorRequest;
        const result = await createTeachingMentorProvider().assess({
            interpretation: requiredText(body.interpretation, "Interpretation"),
            theology: requiredText(body.theology, "Biblical Theology"),
            centralTruth: requiredText(body.centralTruth, "Central truth"),
            teachingAim: requiredText(body.teachingAim, "Teaching aim"),
            keyPoints: requiredTextArray(body.keyPoints, "Key points"),
            explanation: requiredText(body.explanation, "Explanation"),
            discussionQuestions: Array.isArray(body.discussionQuestions) ? body.discussionQuestions.filter((item): item is string => typeof item === "string" && item.trim()).map((item) => item.trim()) : [],
            responsePrompt: requiredText(body.responsePrompt, "Response prompt"),
        });
        return NextResponse.json(result);
    } catch (reason: unknown) {
        const message = reason instanceof Error ? reason.message : "Unable to run the teaching mentor.";
        const status = /session|signed-in|Supabase/i.test(message) ? 401 : /not configured|Unsupported AI_PROVIDER/i.test(message) ? 503 : 502;
        return NextResponse.json({ error: message }, { status });
    }
}
