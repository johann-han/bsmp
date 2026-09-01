import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../../../src/lib/database.types";

interface MentorRequest {
    readonly passageReference?: unknown;
    readonly passageText?: unknown;
    readonly question?: unknown;
    readonly purpose?: unknown;
    readonly studentObservation?: unknown;
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

export async function POST(request: Request) {
    try {
        const accessToken = requireBearerToken(request);
        await assertSignedIn(accessToken);

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "AI mentor is not configured yet. Set OPENAI_API_KEY on the web server." },
                { status: 503 },
            );
        }

        const body = await request.json() as MentorRequest;
        const passageReference = requiredText(body.passageReference, "Passage reference");
        const passageText = requiredText(body.passageText, "Passage text");
        const question = requiredText(body.question, "Observation question");
        const purpose = requiredText(body.purpose, "Question purpose");
        const studentObservation = requiredText(body.studentObservation, "Student observation");

        const model = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model,
                instructions: [
                    "You are the BSMP inductive Bible-study mentor.",
                    "Your job is to coach the student in observation, not to do the Bible study for them.",
                    "Observation must come before interpretation.",
                    "Use only the supplied passage and the student's observation as the immediate evidence base.",
                    "Do not provide an interpretation, theological conclusion, sermon point, application, or cross-reference as an answer.",
                    "Do not invent details that are not visible in the supplied passage.",
                    "Briefly affirm what is genuinely text-grounded when appropriate.",
                    "Identify one concrete weakness, unsupported inference, missing detail, or opportunity to look again when present.",
                    "Ask at most three focused coaching questions that help the student inspect the text for observable details.",
                    "Keep the tone encouraging, clear, and teacher-like rather than authoritative.",
                    "End with a concise invitation for the student to revise or deepen the observation.",
                ].join("\n"),
                input: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "input_text",
                                text: [
                                    `Passage: ${passageReference}`,
                                    `\nPassage text:\n${passageText}`,
                                    `\nCanonical observation question: ${question}`,
                                    `\nQuestion purpose: ${purpose}`,
                                    `\nStudent observation:\n${studentObservation}`,
                                ].join("\n"),
                            },
                        ],
                    },
                ],
                max_output_tokens: 500,
            }),
        });

        const payload = await response.json() as { output_text?: unknown; error?: { message?: unknown } };
        if (!response.ok) {
            const message = typeof payload.error?.message === "string"
                ? payload.error.message
                : "The AI mentor request failed.";
            return NextResponse.json({ error: message }, { status: 502 });
        }

        const coaching = typeof payload.output_text === "string" ? payload.output_text.trim() : "";
        if (!coaching) {
            return NextResponse.json({ error: "The AI mentor returned no coaching response." }, { status: 502 });
        }

        return NextResponse.json({ coaching, model });
    } catch (reason: unknown) {
        const message = reason instanceof Error ? reason.message : "Unable to run the AI mentor.";
        const status = /session|signed-in|Supabase/i.test(message) ? 401 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}
