export interface ObservationMentorContextItem {
    readonly verseReference: string;
    readonly statement: string;
    readonly wordText?: string | null;
    readonly markupSymbol?: string | null;
}

export interface ObservationMentorFocus {
    readonly verseReference: string;
    readonly textCue: string;
    readonly question: string;
}

export interface ObservationMentorInput {
    readonly passageReference: string;
    readonly passageText: string;
    readonly question: string;
    readonly purpose: string;
    readonly studentObservation: string;
    readonly existingObservations: readonly ObservationMentorContextItem[];
    readonly previousMentorCoaching?: string | null;
}

export interface ObservationMentorResult {
    readonly coaching: string;
    readonly focuses: readonly ObservationMentorFocus[];
    readonly model: string;
    readonly provider: "openai" | "gemini";
}

export interface ObservationMentorProvider {
    coach(input: ObservationMentorInput): Promise<ObservationMentorResult>;
}

const MENTOR_INSTRUCTIONS = [
    "You are the BSMP inductive Bible-study mentor.",
    "Coach observation only. Observation must come before interpretation.",
    "Do not provide interpretation, theology, application, sermon points, or cross-references.",
    "Use only the supplied passage and study observations.",
    "Treat existing observations as the student's study record, not as authoritative conclusions.",
    "Avoid generic praise. Identify one concrete weakness, missing detail, repeated pattern, or opportunity to look again.",
    "Direct attention to visible words, phrases, people, actions, relationships, repetition, contrast, location, time, or sequence.",
    "Keep coaching to 2 to 4 sentences and end by inviting the student to revise or deepen the observation.",
    "Return only JSON with this shape: {\"coaching\":\"string\",\"focuses\":[{\"verseReference\":\"string\",\"textCue\":\"string\",\"question\":\"string\"}]}.",
    "The focuses array may contain zero to three items. Each focus must use a verse reference that appears in the supplied passage and a short observable text cue from that verse.",
].join("\n");

function buildPrompt(input: ObservationMentorInput): string {
    const existing = input.existingObservations.length === 0
        ? "None yet."
        : input.existingObservations.map((item, index) => {
            const target = item.wordText ? ` [word target: ${item.wordText}${item.markupSymbol ? ` ${item.markupSymbol}` : ""}]` : "";
            return `${index + 1}. ${item.verseReference}${target}: ${item.statement}`;
        }).join("\n");

    return [
        `Passage: ${input.passageReference}`,
        `\nPassage text:\n${input.passageText}`,
        `\nCanonical observation question: ${input.question}`,
        `\nQuestion purpose: ${input.purpose}`,
        `\nExisting study observations:\n${existing}`,
        `\nPrevious mentor coaching:\n${input.previousMentorCoaching?.trim() || "None."}`,
        `\nStudent's current observation:\n${input.studentObservation}`,
        "\nReturn the structured mentor response only.",
    ].join("\n");
}

function extractJsonObject(text: string): string {
    const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    return start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
}

function parseJsonRecord(text: string): Record<string, unknown> | null {
    try {
        const parsed = JSON.parse(extractJsonObject(text)) as unknown;
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed as Record<string, unknown>
            : null;
    } catch {
        return null;
    }
}

function extractCoachingFromJsonString(text: string): { coaching: string; focuses: unknown } | null {
    const parsed = parseJsonRecord(text);
    if (!parsed) return null;
    return {
        coaching: typeof parsed.coaching === "string" ? parsed.coaching.trim() : "",
        focuses: parsed.focuses,
    };
}

function parseMentorResult(raw: string, passageText: string): { coaching: string; focuses: ObservationMentorFocus[] } {
    let payload = parseJsonRecord(raw);

    // Some providers/models may wrap the structured object as a JSON string.
    // Unwrap that form so the UI never receives raw JSON as visible coaching text.
    if (payload && typeof payload.coaching === "string") {
        let nested = extractCoachingFromJsonString(payload.coaching);
        for (let depth = 0; nested && depth < 2 && nested.coaching !== payload.coaching; depth += 1) {
            const next = extractCoachingFromJsonString(nested.coaching);
            if (!next) break;
            payload = { coaching: next.coaching, focuses: next.focuses ?? payload.focuses };
            nested = next;
        }
    }

    if (!payload) {
        const recovered = extractCoachingFromJsonString(raw);
        if (recovered) payload = recovered.focuses === undefined
            ? { coaching: recovered.coaching }
            : { coaching: recovered.coaching, focuses: recovered.focuses };
    }

    if (!payload) return { coaching: "", focuses: [] };

    const coaching = typeof payload.coaching === "string" ? payload.coaching.trim() : "";
    const normalizedPassage = passageText.toLowerCase();
    const focuses = Array.isArray(payload.focuses)
        ? payload.focuses.flatMap((focus) => {
            if (!focus || typeof focus !== "object") return [];
            const item = focus as { verseReference?: unknown; textCue?: unknown; question?: unknown };
            if (typeof item.verseReference !== "string" || typeof item.textCue !== "string" || typeof item.question !== "string") return [];
            const verseReference = item.verseReference.trim();
            const textCue = item.textCue.trim();
            const question = item.question.trim();
            if (!verseReference || !textCue || !question) return [];
            if (!normalizedPassage.includes(verseReference.toLowerCase())) return [];
            return [{ verseReference, textCue, question }];
        }).slice(0, 3)
        : [];

    return { coaching, focuses };
}

function extractOpenAIText(payload: unknown): string {
    if (!payload || typeof payload !== "object") return "";
    const value = (payload as { output_text?: unknown }).output_text;
    return typeof value === "string" ? value.trim() : "";
}

function extractGeminiText(payload: unknown): string {
    if (!payload || typeof payload !== "object") return "";
    const candidates = (payload as { candidates?: unknown }).candidates;
    if (!Array.isArray(candidates)) return "";
    const parts = (candidates[0] as { content?: { parts?: unknown } } | undefined)?.content?.parts;
    if (!Array.isArray(parts)) return "";
    return parts.map((part) => part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string" ? (part as { text: string }).text : "").join("").trim();
}

const OPENAI_MENTOR_RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        coaching: { type: "string" },
        focuses: {
            type: "array",
            maxItems: 3,
            items: {
                type: "object",
                properties: {
                    verseReference: { type: "string" },
                    textCue: { type: "string" },
                    question: { type: "string" },
                },
                required: ["verseReference", "textCue", "question"],
                additionalProperties: false,
            },
        },
    },
    required: ["coaching", "focuses"],
    additionalProperties: false,
} as const;

class OpenAIObservationMentorProvider implements ObservationMentorProvider {
    public constructor(private readonly apiKey: string, private readonly model: string) {}

    public async coach(input: ObservationMentorInput): Promise<ObservationMentorResult> {
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: this.model,
                instructions: MENTOR_INSTRUCTIONS,
                input: [{ role: "user", content: [{ type: "input_text", text: buildPrompt(input) }] }],
                text: { format: { type: "json_schema", name: "observation_mentor_response", strict: true, schema: OPENAI_MENTOR_RESPONSE_SCHEMA } },
                max_output_tokens: 700,
            }),
        });
        const payload = await response.json() as { output_text?: unknown; error?: { message?: unknown } };
        if (!response.ok) throw new Error(typeof payload.error?.message === "string" ? payload.error.message : "The OpenAI mentor request failed.");
        const raw = extractOpenAIText(payload);
        if (!raw) throw new Error("The OpenAI mentor returned no coaching response.");
        const parsed = parseMentorResult(raw, input.passageText);
        if (!parsed.coaching) throw new Error("The AI mentor returned no coaching response. Please try again.");
        return { ...parsed, model: this.model, provider: "openai" };
    }
}

class GeminiObservationMentorProvider implements ObservationMentorProvider {
    public constructor(private readonly apiKey: string, private readonly model: string) {}

    public async coach(input: ObservationMentorInput): Promise<ObservationMentorResult> {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: MENTOR_INSTRUCTIONS }] },
                contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            coaching: { type: "string" },
                            focuses: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        verseReference: { type: "string" },
                                        textCue: { type: "string" },
                                        question: { type: "string" },
                                    },
                                    required: ["verseReference", "textCue", "question"],
                                },
                            },
                        },
                        required: ["coaching", "focuses"],
                    },
                    maxOutputTokens: 700,
                },
            }),
        });
        const payload = await response.json() as { candidates?: unknown; error?: { message?: unknown } };
        if (!response.ok) throw new Error(typeof payload.error?.message === "string" ? payload.error.message : "The Gemini mentor request failed.");
        const raw = extractGeminiText(payload);
        if (!raw) throw new Error("The Gemini mentor returned no coaching response.");
        const parsed = parseMentorResult(raw, input.passageText);
        if (!parsed.coaching) throw new Error("The AI mentor returned no coaching response. Please try again.");
        return { ...parsed, model: this.model, provider: "gemini" };
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
