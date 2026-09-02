export interface ObservationMentorInput {
    readonly passageReference: string;
    readonly passageText: string;
    readonly question: string;
    readonly purpose: string;
    readonly studentObservation: string;
}

export interface ObservationMentorResult {
    readonly coaching: string;
    readonly model: string;
    readonly provider: "openai" | "gemini";
}

export interface ObservationMentorProvider {
    coach(input: ObservationMentorInput): Promise<ObservationMentorResult>;
}

const MENTOR_INSTRUCTIONS = [
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
].join("\n");

function buildPrompt(input: ObservationMentorInput): string {
    return [
        `Passage: ${input.passageReference}`,
        `\nPassage text:\n${input.passageText}`,
        `\nCanonical observation question: ${input.question}`,
        `\nQuestion purpose: ${input.purpose}`,
        `\nStudent observation:\n${input.studentObservation}`,
    ].join("\n");
}

function extractGeminiText(payload: unknown): string {
    if (!payload || typeof payload !== "object") return "";
    const candidates = (payload as { candidates?: unknown }).candidates;
    if (!Array.isArray(candidates)) return "";

    const parts = (candidates[0] as { content?: { parts?: unknown } } | undefined)?.content?.parts;
    if (!Array.isArray(parts)) return "";

    return parts
        .map((part) => (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"
            ? (part as { text: string }).text
            : ""))
        .join("")
        .trim();
}

class OpenAIObservationMentorProvider implements ObservationMentorProvider {
    public constructor(
        private readonly apiKey: string,
        private readonly model: string,
    ) { }

    public async coach(input: ObservationMentorInput): Promise<ObservationMentorResult> {
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.model,
                instructions: MENTOR_INSTRUCTIONS,
                input: [
                    {
                        role: "user",
                        content: [{ type: "input_text", text: buildPrompt(input) }],
                    },
                ],
                max_output_tokens: 500,
            }),
        });

        const payload = await response.json() as { output_text?: unknown; error?: { message?: unknown } };
        if (!response.ok) {
            const message = typeof payload.error?.message === "string"
                ? payload.error.message
                : "The OpenAI mentor request failed.";
            throw new Error(message);
        }

        const coaching = typeof payload.output_text === "string" ? payload.output_text.trim() : "";
        if (!coaching) throw new Error("The OpenAI mentor returned no coaching response.");

        return { coaching, model: this.model, provider: "openai" };
    }
}

class GeminiObservationMentorProvider implements ObservationMentorProvider {
    public constructor(
        private readonly apiKey: string,
        private readonly model: string,
    ) { }

    public async coach(input: ObservationMentorInput): Promise<ObservationMentorResult> {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: MENTOR_INSTRUCTIONS }],
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: buildPrompt(input) }],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 500,
                },
            }),
        });

        const payload = await response.json() as { error?: { message?: unknown } };
        if (!response.ok) {
            const message = typeof payload.error?.message === "string"
                ? payload.error.message
                : "The Gemini mentor request failed.";
            throw new Error(message);
        }

        const coaching = extractGeminiText(payload);
        if (!coaching) throw new Error("The Gemini mentor returned no coaching response.");

        return { coaching, model: this.model, provider: "gemini" };
    }
}

export function createObservationMentorProvider(): ObservationMentorProvider {
    const provider = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();

    if (provider === "openai") {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OpenAI mentor is not configured. Set OPENAI_API_KEY on the web server.");
        return new OpenAIObservationMentorProvider(apiKey, process.env.OPENAI_MODEL ?? "gpt-5.6-luna");
    }

    if (provider === "gemini") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini mentor is not configured. Set GEMINI_API_KEY on the web server.");
        return new GeminiObservationMentorProvider(apiKey, process.env.GEMINI_MODEL ?? "gemini-3.6-flash");
    }

    throw new Error(`Unsupported AI_PROVIDER: ${provider}. Use "gemini" or "openai".`);
}
