export type ApplicationMentorAssessment = "grounded" | "mixed" | "disconnected" | "too_general";

export interface ApplicationMentorInput {
    readonly interpretation: string;
    readonly principle: string;
    readonly personal: string;
    readonly ministry: string;
    readonly action: string;
}

export interface ApplicationMentorResult {
    readonly assessment: ApplicationMentorAssessment;
    readonly coaching: string;
    readonly focuses: readonly ("principle" | "personal" | "ministry" | "action")[];
    readonly model: string;
    readonly provider: "openai" | "gemini";
}

export interface ApplicationMentorProvider {
    assess(input: ApplicationMentorInput): Promise<ApplicationMentorResult>;
}

const REQUEST_TIMEOUT_MS = 8_000;
const GEMINI_FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"] as const;

const INSTRUCTIONS = [
    "You are the BSMP application mentor.",
    "The student has already completed observation and interpretation. Your job is to test whether the student's application is a faithful response to the supplied interpretation.",
    "Do not supply a replacement application. Do not add theology, preaching points, or new biblical claims.",
    "Use only the supplied interpretation and four application fields: principle, personal, ministry, and action.",
    "Classify the application as grounded, mixed, disconnected, or too_general.",
    "Grounded means the response clearly follows from the supplied interpretation and contains a meaningful concrete response.",
    "Mixed means some of the response follows from the interpretation but one or more parts need clarification or appear to introduce an unsupported step.",
    "Disconnected means the application does not meaningfully follow from the supplied interpretation.",
    "Too_general means the response is vague, generic, or lacks a sufficiently concrete response to test.",
    "Give 2 to 4 sentences of coaching. Identify the reasoning or specificity gap rather than rewriting the student's application.",
    "Ask questions that help the student trace the response back to the interpretation and make the action concrete.",
    "Return one JSON object with assessment, coaching, and focuses. focuses may contain zero to four field names.",
    "Every focus must be exactly one of principle, personal, ministry, action.",
].join("\n");

function buildPrompt(input: ApplicationMentorInput): string {
    return [
        `Student interpretation:\n${input.interpretation}`,
        `\nPrinciple:\n${input.principle}`,
        `\nPersonal application:\n${input.personal}`,
        `\nMinistry application:\n${input.ministry}`,
        `\nConcrete action:\n${input.action}`,
        "\nAssess the application only against the supplied interpretation.",
    ].join("\n");
}

const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        assessment: { type: "string", enum: ["grounded", "mixed", "disconnected", "too_general"] },
        coaching: { type: "string" },
        focuses: {
            type: "array",
            maxItems: 4,
            items: { type: "string", enum: ["principle", "personal", "ministry", "action"] },
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

function parseResult(raw: string): Omit<ApplicationMentorResult, "model" | "provider"> {
    const payload = parseRecord(raw);
    const validAssessments: readonly ApplicationMentorAssessment[] = ["grounded", "mixed", "disconnected", "too_general"];
    const assessment = validAssessments.includes(payload?.assessment as ApplicationMentorAssessment)
        ? payload?.assessment as ApplicationMentorAssessment
        : "mixed";
    const coaching = typeof payload?.coaching === "string" ? payload.coaching.trim() : "";
    if (!coaching) throw new Error("The AI application mentor returned no usable coaching response. Please try again.");
    const validFields = new Set<ApplicationMentorResult["focuses"][number]>(["principle", "personal", "ministry", "action"]);
    const focuses = Array.isArray(payload?.focuses)
        ? payload.focuses.filter((value): value is string => typeof value === "string" && validFields.has(value as ApplicationMentorResult["focuses"][number])).slice(0, 4) as ApplicationMentorResult["focuses"]
        : [];
    return { assessment, coaching, focuses };
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
        if (reason instanceof DOMException && reason.name === "AbortError") throw new Error(`The application mentor timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`);
        throw reason;
    } finally {
        clearTimeout(timeout);
    }
}

function isTransientStatus(status: number): boolean {
    return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function providerErrorMessage(payload: unknown, provider: string, status: number): string {
    if (payload && typeof payload === "object") {
        const error = (payload as { error?: { message?: unknown } }).error;
        if (typeof error?.message === "string" && error.message.trim()) return error.message.trim();
    }
    return `${provider} returned HTTP ${status}.`;
}

class OpenAIApplicationMentorProvider implements ApplicationMentorProvider {
    public constructor(private readonly apiKey: string, private readonly model: string) {}
    public async assess(input: ApplicationMentorInput): Promise<ApplicationMentorResult> {
        const { response, payload } = await fetchProviderJson("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: this.model, instructions: INSTRUCTIONS, input: [{ role: "user", content: [{ type: "input_text", text: buildPrompt(input) }] }], text: { format: { type: "json_schema", name: "application_mentor_response", strict: true, schema: RESPONSE_SCHEMA } }, max_output_tokens: 700 }),
        });
        if (!response.ok) throw new Error(providerErrorMessage(payload, "OpenAI", response.status));
        const raw = extractOpenAIText(payload);
        if (!raw) throw new Error("The OpenAI application mentor returned no text.");
        return { ...parseResult(raw), model: this.model, provider: "openai" };
    }
}

class GeminiApplicationMentorProvider implements ApplicationMentorProvider {
    public constructor(private readonly apiKey: string, private readonly model: string) {}
    public async assess(input: ApplicationMentorInput): Promise<ApplicationMentorResult> {
        const models = Array.from(new Set([this.model, ...GEMINI_FALLBACK_MODELS]));
        const failures: string[] = [];
        for (const model of models) {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
            try {
                const { response, payload } = await fetchProviderJson(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
                    body: JSON.stringify({ systemInstruction: { parts: [{ text: INSTRUCTIONS }] }, contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }], generationConfig: { responseMimeType: "application/json", thinkingConfig: { thinkingLevel: "minimal" }, maxOutputTokens: 700 } }),
                });
                if (response.ok) {
                    const raw = extractGeminiText(payload);
                    if (!raw) { failures.push(`${model}: empty response`); continue; }
                    return { ...parseResult(raw), model, provider: "gemini" };
                }
                const message = providerErrorMessage(payload, `Gemini ${model}`, response.status);
                failures.push(`${model}: ${message}`);
                if (!isTransientStatus(response.status)) throw new Error(message);
            } catch (reason) {
                const message = reason instanceof Error ? reason.message : "Unknown provider error.";
                failures.push(`${model}: ${message}`);
            }
        }
        throw new Error(`The Gemini application mentor is temporarily unavailable. Tried ${models.join(", ")}. ${failures[failures.length - 1] ?? "Please try again later."}`);
    }
}

export function createApplicationMentorProvider(): ApplicationMentorProvider {
    const provider = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();
    if (provider === "openai") {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OpenAI mentor is not configured. Set OPENAI_API_KEY on the web server.");
        return new OpenAIApplicationMentorProvider(apiKey, process.env.OPENAI_APPLICATION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5.6-luna");
    }
    if (provider === "gemini") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini mentor is not configured. Set GEMINI_API_KEY on the web server.");
        return new GeminiApplicationMentorProvider(apiKey, process.env.GEMINI_APPLICATION_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite");
    }
    throw new Error(`Unsupported AI_PROVIDER: ${provider}. Use "gemini" or "openai".`);
}
