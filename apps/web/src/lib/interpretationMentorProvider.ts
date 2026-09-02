export type InterpretationMentorAssessment = "supported" | "mixed" | "unsupported" | "too_vague";

export interface InterpretationMentorObservation {
    readonly id: string;
    readonly verseReference: string;
    readonly statement: string;
    readonly targetLabel?: string | null;
}

export interface InterpretationMentorInput {
    readonly passageReference: string;
    readonly passageText: string;
    readonly interpretation: string;
    readonly observations: readonly InterpretationMentorObservation[];
}

export interface InterpretationMentorFocus {
    readonly observationId: string;
    readonly question: string;
}

export interface InterpretationMentorResult {
    readonly assessment: InterpretationMentorAssessment;
    readonly coaching: string;
    readonly focuses: readonly InterpretationMentorFocus[];
    readonly model: string;
    readonly provider: "openai" | "gemini";
}

export interface InterpretationMentorProvider {
    assess(input: InterpretationMentorInput): Promise<InterpretationMentorResult>;
}

const INSTRUCTIONS = [
    "You are the BSMP interpretation mentor.",
    "The student has already completed observation. Your job is to test whether the student's interpretation is adequately grounded in the observations they selected.",
    "Do not supply a replacement interpretation. Do not preach, apply the text, or add theology not contained in the supplied material.",
    "Use only the supplied passage and the supplied observations.",
    "Treat observations as the student's recorded textual evidence, not as infallible conclusions.",
    "Classify the interpretation as supported, mixed, unsupported, or too_vague.",
    "Supported means the interpretation is reasonably grounded in the selected observations without a major unsupported leap.",
    "Mixed means some of the interpretation is grounded but one or more claims go beyond the selected observations.",
    "Unsupported means the interpretation is not adequately grounded in the selected observations or conflicts with them.",
    "Too_vague means the statement is too broad or unclear to test against the selected observations.",
    "Give 2 to 4 sentences of coaching. Identify the exact reasoning gap rather than using generic praise.",
    "Ask the student to trace the interpretation back to specific observations. Do not tell the student what the final interpretation should be.",
    "Return one JSON object with assessment, coaching, and focuses. focuses may contain zero to three items.",
    "Every focus must use an observationId copied exactly from the supplied observations and a concise question that helps the student examine that observation.",
].join("\n");

function buildPrompt(input: InterpretationMentorInput): string {
    const observations = input.observations.map((observation, index) => [
        `${index + 1}. observationId=${observation.id}`,
        `verse=${observation.verseReference}`,
        observation.targetLabel ? `target=${observation.targetLabel}` : "target=verse",
        `statement=${observation.statement}`,
    ].join(" | ")).join("\n");

    return [
        `Passage: ${input.passageReference}`,
        `\nPassage text:\n${input.passageText}`,
        `\nSelected supporting observations:\n${observations}`,
        `\nStudent interpretation:\n${input.interpretation}`,
        "\nAssess the interpretation only against the selected observations.",
    ].join("\n");
}

const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        assessment: { type: "string", enum: ["supported", "mixed", "unsupported", "too_vague"] },
        coaching: { type: "string" },
        focuses: {
            type: "array",
            maxItems: 3,
            items: {
                type: "object",
                properties: {
                    observationId: { type: "string" },
                    question: { type: "string" },
                },
                required: ["observationId", "question"],
                additionalProperties: false,
            },
        },
    },
    required: ["assessment", "coaching", "focuses"],
    additionalProperties: false,
} as const;

function parseRecord(text: string): Record<string, unknown> | null {
    const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
        // Fall through to embedded-object extraction.
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
        const parsed = JSON.parse(trimmed.slice(start, end + 1)) as unknown;
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
    } catch {
        return null;
    }
}

function parseResult(raw: string, input: InterpretationMentorInput): Omit<InterpretationMentorResult, "model" | "provider"> {
    const payload = parseRecord(raw);
    const assessment = payload?.assessment;
    const coaching = payload?.coaching;
    const validAssessments: readonly InterpretationMentorAssessment[] = ["supported", "mixed", "unsupported", "too_vague"];
    const normalizedAssessment = validAssessments.includes(assessment as InterpretationMentorAssessment)
        ? assessment as InterpretationMentorAssessment
        : "mixed";

    const focuses = Array.isArray(payload?.focuses)
        ? payload.focuses.flatMap((focus) => {
            if (!focus || typeof focus !== "object") return [];
            const item = focus as { observationId?: unknown; question?: unknown };
            if (typeof item.observationId !== "string" || typeof item.question !== "string") return [];
            const observationId = item.observationId.trim();
            const question = item.question.trim();
            if (!observationId || !question || !input.observations.some((observation) => observation.id === observationId)) return [];
            return [{ observationId, question }];
        }).slice(0, 3)
        : [];

    const normalizedCoaching = typeof coaching === "string" ? coaching.trim() : "";
    if (!normalizedCoaching) throw new Error("The AI interpretation mentor returned no usable coaching response. Please try again.");

    return { assessment: normalizedAssessment, coaching: normalizedCoaching, focuses };
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

class OpenAIInterpretationMentorProvider implements InterpretationMentorProvider {
    public constructor(private readonly apiKey: string, private readonly model: string) {}

    public async assess(input: InterpretationMentorInput): Promise<InterpretationMentorResult> {
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: this.model,
                instructions: INSTRUCTIONS,
                input: [{ role: "user", content: [{ type: "input_text", text: buildPrompt(input) }] }],
                text: { format: { type: "json_schema", name: "interpretation_mentor_response", strict: true, schema: RESPONSE_SCHEMA } },
                max_output_tokens: 700,
            }),
        });
        const payload = await response.json() as { output_text?: unknown; error?: { message?: unknown } };
        if (!response.ok) throw new Error(typeof payload.error?.message === "string" ? payload.error.message : "The OpenAI interpretation mentor request failed.");
        const raw = extractOpenAIText(payload);
        if (!raw) throw new Error("The OpenAI interpretation mentor returned no text.");
        return { ...parseResult(raw, input), model: this.model, provider: "openai" };
    }
}

class GeminiInterpretationMentorProvider implements InterpretationMentorProvider {
    public constructor(private readonly apiKey: string, private readonly model: string) {}

    public async assess(input: InterpretationMentorInput): Promise<InterpretationMentorResult> {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: INSTRUCTIONS }] },
                contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    thinkingConfig: { thinkingLevel: "minimal" },
                    maxOutputTokens: 1200,
                },
            }),
        });
        const payload = await response.json() as { candidates?: unknown; error?: { message?: unknown } };
        if (!response.ok) throw new Error(typeof payload.error?.message === "string" ? payload.error.message : "The Gemini interpretation mentor request failed.");
        const raw = extractGeminiText(payload);
        if (!raw) throw new Error("The Gemini interpretation mentor returned no text.");
        return { ...parseResult(raw, input), model: this.model, provider: "gemini" };
    }
}

export function createInterpretationMentorProvider(): InterpretationMentorProvider {
    const provider = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();
    if (provider === "openai") {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OpenAI mentor is not configured. Set OPENAI_API_KEY on the web server.");
        return new OpenAIInterpretationMentorProvider(apiKey, process.env.OPENAI_MODEL ?? "gpt-5.6-luna");
    }
    if (provider === "gemini") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini mentor is not configured. Set GEMINI_API_KEY on the web server.");
        return new GeminiInterpretationMentorProvider(apiKey, process.env.GEMINI_MODEL ?? "gemini-3.6-flash");
    }
    throw new Error(`Unsupported AI_PROVIDER: ${provider}. Use "gemini" or "openai".`);
}
