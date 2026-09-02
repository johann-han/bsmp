export type InterpretationMentorAssessment = "supported" | "mixed" | "unsupported" | "too_vague";

export interface InterpretationMentorObservation {
    readonly id: string;
    readonly verseReference: string;
    readonly statement: string;
    readonly targetLabel?: string | null;
}

export interface InterpretationMentorInput {
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

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [700, 1600] as const;

const INSTRUCTIONS = [
    "You are the BSMP interpretation mentor.",
    "The student has already completed observation. Your job is to test whether the student's interpretation is adequately grounded in the observations they selected.",
    "Do not supply a replacement interpretation. Do not preach, apply the text, or add theology not contained in the supplied material.",
    "Use only the supplied observations. Do not invent textual evidence.",
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
        `Selected supporting observations:\n${observations}`,
        `\nStudent interpretation:\n${input.interpretation}`,
        "\nAssess the interpretation only against the selected observations.",
    ].join("\n");
}

const OPENAI_RESPONSE_SCHEMA = {
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

interface ProviderResponse {
    readonly response: Response;
    readonly payload: unknown;
}

async function fetchProviderJson(url: string, init: RequestInit): Promise<ProviderResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, { ...init, signal: controller.signal });
        const payload = await response.json();
        return { response, payload };
    } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") {
            throw new Error("The interpretation mentor timed out after 30 seconds. Please try again.");
        }
        throw reason;
    } finally {
        clearTimeout(timeout);
    }
}

function isRetryableStatus(status: number): boolean {
    return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function wait(milliseconds: number): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchWithRetry(
    url: string,
    init: RequestInit,
    describeProviderError: (payload: unknown) => string | null,
): Promise<unknown> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
            const { response, payload } = await fetchProviderJson(url, init);
            if (response.ok) return payload;

            const message = describeProviderError(payload) ?? `The interpretation mentor provider returned HTTP ${response.status}.`;
            if (!isRetryableStatus(response.status) || attempt === MAX_RETRIES) throw new Error(message);
            lastError = new Error(message);
        } catch (reason) {
            if (reason instanceof Error && /timed out after 30 seconds/i.test(reason.message)) throw reason;
            lastError = reason instanceof Error ? reason : new Error("The interpretation mentor request failed.");
            if (attempt === MAX_RETRIES) throw lastError;
        }
        await wait(RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]);
    }

    throw lastError ?? new Error("The interpretation mentor request failed.");
}

class OpenAIInterpretationMentorProvider implements InterpretationMentorProvider {
    public constructor(private readonly apiKey: string, private readonly model: string) {}

    public async assess(input: InterpretationMentorInput): Promise<InterpretationMentorResult> {
        const payload = await fetchWithRetry(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",
                headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: this.model,
                    instructions: INSTRUCTIONS,
                    input: [{ role: "user", content: [{ type: "input_text", text: buildPrompt(input) }] }],
                    text: { format: { type: "json_schema", name: "interpretation_mentor_response", strict: true, schema: OPENAI_RESPONSE_SCHEMA } },
                    max_output_tokens: 700,
                }),
            },
            (value) => {
                if (!value || typeof value !== "object") return null;
                const error = (value as { error?: { message?: unknown } }).error;
                return typeof error?.message === "string" ? error.message : null;
            },
        );
        const raw = extractOpenAIText(payload);
        if (!raw) throw new Error("The OpenAI interpretation mentor returned no text.");
        return { ...parseResult(raw, input), model: this.model, provider: "openai" };
    }
}

class GeminiInterpretationMentorProvider implements InterpretationMentorProvider {
    public constructor(private readonly apiKey: string, private readonly model: string) {}

    public async assess(input: InterpretationMentorInput): Promise<InterpretationMentorResult> {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`;
        const payload = await fetchWithRetry(
            endpoint,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": this.apiKey,
                },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: INSTRUCTIONS }] },
                    contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        thinkingConfig: { thinkingLevel: "minimal" },
                        maxOutputTokens: 700,
                    },
                }),
            },
            (value) => {
                if (!value || typeof value !== "object") return null;
                const error = (value as { error?: { message?: unknown } }).error;
                return typeof error?.message === "string" ? error.message : null;
            },
        );
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
        return new GeminiInterpretationMentorProvider(apiKey, process.env.GEMINI_INTERPRETATION_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite");
    }
    throw new Error(`Unsupported AI_PROVIDER: ${provider}. Use "gemini" or "openai".`);
}
