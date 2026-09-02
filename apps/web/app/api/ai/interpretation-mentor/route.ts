import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../../../src/lib/database.types";
import {
    createInterpretationMentorProvider,
    type InterpretationMentorObservation,
} from "../../../../src/lib/interpretationMentorProvider";

interface MentorRequest {
    readonly passageReference?: unknown;
    readonly passageText?: unknown;
    readonly interpretation?: unknown;
    readonly observations?: unknown;
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

    const client = createClient<Database>(url, publishableKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) throw new Error("A valid signed-in Supabase session is required.");
}

function requiredText(value: unknown, field: string): string {
    if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required.`);
    return value.trim();
}

function parseObservations(value: unknown): InterpretationMentorObservation[] {
    if (!Array.isArray(value) || value.length === 0) throw new Error("Select at least one supporting observation.");

    return value.map((item, index) => {
        if (!item || typeof item !== "object") throw new Error(`Supporting observation ${index + 1} is invalid.`);
        const candidate = item as Record<string, unknown>;
        return {
            id: requiredText(candidate.id, `Supporting observation ${index + 1} ID`),
            verseReference: requiredText(candidate.verseReference, `Supporting observation ${index + 1} verse reference`),
            statement: requiredText(candidate.statement, `Supporting observation ${index + 1} statement`),
            targetLabel: candidate.targetLabel === null || candidate.targetLabel === undefined ? null : requiredText(candidate.targetLabel, `Supporting observation ${index + 1} target`),
        };
    });
}

export async function POST(request: Request) {
    try {
        const accessToken = requireBearerToken(request);
        await assertSignedIn(accessToken);
        const body = await request.json() as MentorRequest;

        const provider = createInterpretationMentorProvider();
        const result = await provider.assess({
            passageReference: requiredText(body.passageReference, "Passage reference"),
            passageText: requiredText(body.passageText, "Passage text"),
            interpretation: requiredText(body.interpretation, "Interpretation"),
            observations: parseObservations(body.observations),
        });

        return NextResponse.json(result);
    } catch (reason: unknown) {
        const message = reason instanceof Error ? reason.message : "Unable to run the interpretation mentor.";
        const status = /session|signed-in|Supabase|supporting observation/i.test(message)
            ? 401
            : /not configured|Unsupported AI_PROVIDER/i.test(message)
                ? 503
                : 502;
        return NextResponse.json({ error: message }, { status });
    }
}
