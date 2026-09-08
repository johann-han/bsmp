import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../../../src/lib/database.types";
import { createObservationMentorProvider } from "../../../../src/lib/aiMentorProvider";
import type { ObservationMentorContextItem } from "../../../../src/lib/aiMentorProvider";

interface MentorRequest {
    readonly passageReference?: unknown;
    readonly passageText?: unknown;
    readonly question?: unknown;
    readonly purpose?: unknown;
    readonly studentObservation?: unknown;
    readonly existingObservations?: unknown;
    readonly previousMentorCoaching?: unknown;
}

function requireBearerToken(request: Request): string {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
        throw new Error("A signed-in Supabase session is required.");
    }

    const token = authorization.slice("Bearer ".length).trim();
    if (!token) throw new Error("A signed-in Supabase session is required.");
    return token;
}

async function assertSignedIn(accessToken: string): Promise<void> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !publishableKey) {
        throw new Error("Missing Supabase environment configuration.");
    }

    const client = createClient<Database>(url, publishableKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) throw new Error("A valid signed-in Supabase session is required.");
}

function requiredText(value: unknown, field: string): string {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`${field} is required.`);
    }
    return value.trim();
}

function parseObservationContext(value: unknown): ObservationMentorContextItem[] {
    if (value === undefined) return [];
    if (!Array.isArray(value)) throw new Error("Existing observations must be an array.");

    return value.map((item, index) => {
        if (!item || typeof item !== "object") throw new Error(`Existing observation ${index + 1} is invalid.`);
        const candidate = item as Record<string, unknown>;
        const verseReference = requiredText(candidate.verseReference, `Existing observation ${index + 1} verse reference`);
        const statement = requiredText(candidate.statement, `Existing observation ${index + 1} statement`);
        const wordText = candidate.wordText === null || candidate.wordText === undefined ? null : requiredText(candidate.wordText, `Existing observation ${index + 1} word target`);
        const markupSymbol = candidate.markupSymbol === null || candidate.markupSymbol === undefined ? null : requiredText(candidate.markupSymbol, `Existing observation ${index + 1} markup symbol`);
        return { verseReference, statement, wordText, markupSymbol };
    });
}

function parseOptionalText(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value !== "string") throw new Error("Previous mentor coaching must be text.");
    return value.trim() || null;
}

export async function POST(request: Request) {
    try {
        const accessToken = requireBearerToken(request);
        await assertSignedIn(accessToken);

        const body = await request.json() as MentorRequest;
        const passageReference = requiredText(body.passageReference, "Passage reference");
        const passageText = requiredText(body.passageText, "Passage text");
        const question = requiredText(body.question, "Observation question");
        const purpose = requiredText(body.purpose, "Question purpose");
        const studentObservation = requiredText(body.studentObservation, "Student observation");
        const existingObservations = parseObservationContext(body.existingObservations);
        const previousMentorCoaching = parseOptionalText(body.previousMentorCoaching);

        const provider = createObservationMentorProvider();
        const result = await provider.coach({
            passageReference,
            passageText,
            question,
            purpose,
            studentObservation,
            existingObservations,
            previousMentorCoaching,
        });

        return NextResponse.json(result);
    } catch (reason: unknown) {
        const message = reason instanceof Error ? reason.message : "Unable to run the AI mentor.";
        const status = /session|signed-in|Supabase/i.test(message)
            ? 401
            : /not configured|Unsupported AI_PROVIDER/i.test(message)
                ? 503
                : 502;
        return NextResponse.json({ error: message }, { status });
    }
}
