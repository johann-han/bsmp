import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../../../src/lib/database.types";
import { createApplicationMentorProvider } from "../../../../src/lib/applicationMentorProvider";

interface MentorRequest {
    readonly interpretation?: unknown;
    readonly principle?: unknown;
    readonly personal?: unknown;
    readonly ministry?: unknown;
    readonly action?: unknown;
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

export async function POST(request: Request) {
    try {
        const accessToken = requireBearerToken(request);
        await assertSignedIn(accessToken);
        const body = await request.json() as MentorRequest;
        const provider = createApplicationMentorProvider();
        const result = await provider.assess({
            interpretation: requiredText(body.interpretation, "Interpretation"),
            principle: requiredText(body.principle, "Principle"),
            personal: requiredText(body.personal, "Personal application"),
            ministry: requiredText(body.ministry, "Ministry application"),
            action: requiredText(body.action, "Action"),
        });
        return NextResponse.json(result);
    } catch (reason: unknown) {
        const message = reason instanceof Error ? reason.message : "Unable to run the application mentor.";
        const status = /session|signed-in|Supabase/i.test(message) ? 401 : /not configured|Unsupported AI_PROVIDER/i.test(message) ? 503 : 502;
        return NextResponse.json({ error: message }, { status });
    }
}
