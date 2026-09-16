export type TeachingMentorAssessment = "grounded" | "mixed" | "unclear" | "overstated";

export interface TeachingMentorInput {
    readonly interpretation: string;
    readonly theology: string;
    readonly centralTruth: string;
    readonly teachingAim: string;
    readonly keyPoints: readonly string[];
    readonly explanation: string;
    readonly discussionQuestions: readonly string[];
    readonly responsePrompt: string;
}

export interface TeachingMentorResult {
    readonly assessment: TeachingMentorAssessment;
    readonly coaching: string;
    readonly focuses: readonly ("centralTruth" | "teachingAim" | "keyPoints" | "explanation" | "discussionQuestions" | "responsePrompt")[];
    readonly model: string;
    readonly provider: "openai" | "gemini";
}

export interface TeachingMentorProvider { assess(input: TeachingMentorInput): Promise<TeachingMentorResult>; }

const REQUEST_TIMEOUT_MS = 8_000;
const GEMINI_FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"] as const;

const INSTRUCTIONS = [
    "You are the BSMP teaching mentor.",
    "The student has already completed observation and interpretation. The supplied Biblical Theology is a student-authored synthesis grounded in selected interpretations.",
    "Your task is to test whether the student's teaching plan faithfully communicates the supplied interpretation and theology and has a clear teaching aim and structure.",
    "Do not write a replacement lesson, replacement explanation, replacement teaching points, or new theology.",
    "Do not introduce outside biblical claims, cross-references, illustrations, or applications that are not supplied.",
    "Use only the supplied interpretation, theology, central truth, teaching aim, key points, explanation, discussion questions, and response prompt.",
    "Classify as grounded, mixed, unclear, or overstated.",
    "Grounded means the teaching plan is clearly traceable to the supplied foundations and can be taught without changing their meaning.",
    "Mixed means most of the plan is grounded but one or more parts need clarification or appear to move beyond the supplied foundations.",
    "Unclear means the central teaching direction or structure is too vague to evaluate confidently.",
    "Overstated means the plan makes a stronger claim than the supplied interpretation or theology supports.",
    "Give 2 to 4 sentences of coaching. Point to the reasoning, clarity, structure, or scope gap; do not rewrite the student's material.",
    "Return one JSON object with assessment, coaching, and focuses.",
    "focuses may contain zero or more of: centralTruth, teachingAim, keyPoints, explanation, discussionQuestions, responsePrompt.",
].join("\n");

function buildPrompt(input: TeachingMentorInput): string {
    return [
        `Student interpretation:\n${input.interpretation}`,
        `\nStudent Biblical Theology synthesis:\n${input.theology}`,
        `\nCentral truth:\n${input.centralTruth}`,
        `\nTeaching aim:\n${input.teachingAim}`,
        `\nKey points:\n${input.keyPoints.join("\n- ")}`,
        `\nExplanation:\n${input.explanation}`,
        `\nDiscussion questions:\n${input.discussionQuestions.join("\n- ")}`,
        `\nResponse prompt:\n${input.responsePrompt}`,
        "\nAssess only whether the teaching plan faithfully communicates the supplied foundations.",
    ].join("\n");
}

const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        assessment: { type: "string", enum: ["grounded", "mixed", "unclear", "overstated"] },
        coaching: { type: "string" },
        focuses: {
            type: "array",
            items: { type: "string", enum: ["centralTruth", "teachingAim", "keyPoints", "explanation", "discussionQuestions", "responsePrompt"] },
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
    } catch { /* try embedded JSON below */ }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
        const parsed = JSON.parse(trimmed.slice(start, end + 1)) as unknown;
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
    } catch { return null; }
}

function parseResult(raw: string): Omit<TeachingMentorResult, "model" | "provider"> {
    const payload = parseRecord(raw);
    const assessments: readonly TeachingMentorAssessment[] = ["grounded", "mixed", "unclear", "overstated"];
    const assessment = assessments.includes(payload?.assessment as TeachingMentorAssessment) ? payload?.assessment as TeachingMentorAssessment : "mixed";
    const coaching = typeof payload?.coaching === "string" ? payload.coaching.trim() : "";
    if (!coaching) throw new Error("The AI teaching mentor returned no usable coaching response. Please try again.");
    const fields = new Set<TeachingMentorResult["focuses"][number]>(["centralTruth", "teachingAim", "keyPoints", "explanation", "discussionQuestions", "responsePrompt"]);
    const focuses = Array.isArray(payload?.focuses)
        ? payload.focuses.filter((value): value is string => typeof value === "string" && fields.has(value as TeachingMentorResult["focuses"][number])).slice(0, 6) as TeachingMentorResult["focuses"]
        : [];
    return { assessment, coaching, focuses };
}

function extractOpenAIText(payload: unknown): string {
    if (!payload || typeof payload !== "object") return "";
    const text = (payload as { output_text?: unknown }).output_text;
    return typeof text === "string" ? text.trim() : "";
}

function extractGeminiText(payload: unknown): string {
    if (!payload || typeof payload !== "object") return "";
    const candidates = (payload as { candidates?: unknown }).candidates;
    if (!Array.isArray(candidates)) return "";
    const parts = (candidates[0] as { content?: { parts?: unknown } } | undefined)?.content?.parts;
    if (!Array.isArray(parts)) return "";
    return parts.map((part) => part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string" ? (part as { text: string }).text : "").join("").trim();
}

async function fetchJson(url: string, init: RequestInit): Promise<{ response: Response; payload: unknown }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const response = await fetch(url, { ...init, signal: controller.signal });
        const payload = await response.json();
        return { response, payload };
    } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") throw new Error(`The teaching mentor timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`);
        throw reason;
    } finally { clearTimeout(timeout); }
}

function isTransientStatus(status: number): boolean { return status === 429 || status === 500 || status === 502 || status === 503 || status === 504; }
function providerErrorMessage(payload: unknown, provider: string, status: number): string {
    if (payload && typeof payload === "object") {
        const error = (payload as { error?: { message?: unknown } }).error;
        if (typeof error?.message === "string" && error.message.trim()) return error.message.trim();
    }
    return `${provider} returned HTTP ${status}.`;
}

class OpenAITeachingMentorProvider implements TeachingMentorProvider {
    public constructor(private readonly apiKey: string, private readonly model: string) {}
    public async assess(input: TeachingMentorInput): Promise<TeachingMentorResult> {
        const { response, payload } = await fetchJson("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: this.model, instructions: INSTRUCTIONS, input: [{ role: "user", content: [{ type: "input_text", text: buildPrompt(input) }] }], text: { format: { type: "json_schema", name: "teaching_mentor_response", strict: true, schema: RESPONSE_SCHEMA } }, max_output_tokens: 700 }),
        });
        if (!response.ok) throw new Error(providerErrorMessage(payload, "OpenAI", response.status));
        const raw = extractOpenAIText(payload);
        if (!raw) throw new Error("The OpenAI teaching mentor returned no text.");
        return { ...parseResult(raw), model: this.model, provider: "openai" };
    }
}

class GeminiTeachingMentorProvider implements TeachingMentorProvider {
    public constructor(private readonly apiKey: string, private readonly model: string) {}
    public async assess(input: TeachingMentorInput): Promise<TeachingMentorResult> {
        const models = Array.from(new Set([this.model, ...GEMINI_FALLBACK_MODELS]));
        const failures: string[] = [];
        for (const model of models) {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
            try {
                const { response, payload } = await fetchJson(endpoint, {
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
                failures.push(`${model}: ${reason instanceof Error ? reason.message : "Unknown provider error."}`);
            }
        }
        throw new Error(`The Gemini teaching mentor is temporarily unavailable. Tried ${models.join(", ")}. ${failures[failures.length - 1] ?? "Please try again later."}`);
    }
}

export function createTeachingMentorProvider(): TeachingMentorProvider {
    const provider = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();
    if (provider === "openai") {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OpenAI mentor is not configured. Set OPENAI_API_KEY on the web server.");
        return new OpenAITeachingMentorProvider(apiKey, process.env.OPENAI_TEACHING_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5.6-luna");
    }
    if (provider === "gemini") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini mentor is not configured. Set GEMINI_API_KEY on the web server.");
        return new GeminiTeachingMentorProvider(apiKey, process.env.GEMINI_TEACHING_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite");
    }
    throw new Error(`Unsupported AI_PROVIDER: ${provider}. Use "gemini" or "openai".`);
}
