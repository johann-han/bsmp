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
    "Your job is to coach the student in observation, not to do the Bible study for them.",
    "Observation must come before interpretation.",
    "Use only the supplied passage, existing observations, and the student's observation as the immediate evidence base.",
    "Treat existing observations as the student's own study record, not as authoritative conclusions.",
    "Do not provide an interpretation, theological conclusion, sermon point, application, or cross-reference as an answer.",
    "Do not invent details that are not visible in the supplied passage.",
    "Do not turn an observation into an interpretation merely because it sounds plausible.",
    "Briefly affirm what is genuinely text-grounded when appropriate, but do not give generic praise as the main coaching response.",
    "Identify one concrete weakness, unsupported inference, missing detail, repeated pattern, or opportunity to look again when present.",
    "Use the existing observations to avoid repeating what the student has already noticed and to point toward overlooked observable details.",
    "Always make the coaching concrete by directing attention to a visible word, phrase, person, action, relationship, repetition, contrast, location, time reference, or sequence in the supplied passage.",
    "A focus must use a verse reference that appears in the supplied passage text. Never invent a verse reference.",
    "Ask at most three focused coaching questions that help the student inspect the text for observable details.",
    "Keep the tone encouraging, clear, and teacher-like rather than authoritative.",
    "End with a concise invitation for the student to revise or deepen the observation.",
    "Return ONLY valid JSON with this exact shape: {\"coaching\":\"string\",\"focuses\":[{\"verseReference\":\"string\",\"textCue\":\"string\",\"question\":\"string\"}]}.",
    "Do not use Markdown fences, headings, bullet markers, unexplained numeric fragments, or any text outside that JSON object.",
    "The focuses array must contain zero to three items. Each textCue must be a short exact or near-exact observable word or phrase from the supplied passage. Each question must be about observation, not interpretation.",
].join("\n");

function buildPrompt(input: ObservationMentorInput): string {
    const existingObservations = input.existingObservations.length === 0
        ? "None yet."
        : input.existingObservations.map((observation, index) => {
            const target = observation.wordText
                ? ` [word target: ${observation.wordText}${observation.markupSymbol ? ` ${observation.markupSymbol}` : ""}]`
                : "";
            return `${index + 1}. ${observation.verseReference}${target}: ${observation.statement}`;
        }).join("\n");

    return [
        `Passage: ${input.passageReference}`,
        `\nPassage text:\n${input.passageText}`,
        `\nCanonical observation question: ${input.question}`,
        `\nQuestion purpose: ${input.purpose}`,
        `\nExisting study observations:\n${existingObservations}`,
        input.previousMentorCoaching?.trim()
            ? `\nPrevious mentor coaching:\n${input.previousMentorCoaching.trim()}`
            : "\nPrevious mentor coaching:\nNone.",
        `\nStudent's current observation:\n${input.studentObservation}`,
        "\nReturn the required JSON object only.",
    ].join("\n");
}

function extractJsonObject(text: string): string {
    const trimmed = text.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fenced?.[1]) return fenced[1].trim();

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    return start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
}

function parseMentorResult(raw: string, passageText: string): { coaching: string; focuses: ObservationMentorFocus[] } {
    let payload: unknown;
    try {
        payload = JSON.parse(extractJsonObject(raw)) as unknown;
    } catch {
        return { coaching: raw.trim(), focuses: [] };
    }

    if (!payload || typeof payload !== "object") return { coaching: raw.trim(), focuses: [] };

    const candidate = payload as { coaching?: unknown; focuses?: unknown };
    const coaching = typeof candidate.coaching === "string" ? candidate.coaching.trim() : "";
    const normalizedPassage = passageText.toLowerCase();
    const focuses = Array.isArray(candidate.focuses)
        ? candidate.focuses.flatMap((focus) => {
            if (!focus || typeof focus !== "object") return [];
            const item = focus as { verseReference?: unknown; textCue?: unknown; question?: unknown };
            if (
                typeof item.verseReference !== "string" ||
                typeof item.textCue !== "string" ||
                typeof item.question !== "string"
            ) return [];

            const verseReference = item.verseReference.trim();
            const textCue = item.textCue.trim();
            const question = item.question.trim();
            if (!verseReference || !textCue || !question) return [];
            if (!normalizedPassage.includes(verseReference.toLowerCase())) return [];

            return [{ verseReference, textCue, question }];
        })
        : [];

    return {
        coaching: coaching || raw.trim(),
        focuses: focuses.slice(0, 3),
    };
}

function extractOpenAIText(payload: unknown): string {
    if (!payload || typeof payload !== "object") return "";
    const outputText = (payload as { output_text?: unknown }).output_text;
    return typeof outputText === "string" ? outputText.trim() : "";
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

        const raw = extractOpenAIText(payload);
        if (!raw) throw new Error("The OpenAI mentor returned no coaching response.");

        const parsed = parseMentorResult(raw, input.passageText);
        if (!parsed.coaching) throw new Error("The OpenAI mentor returned no coaching response.");

        return { ...parsed, model: this.model, provider: "openai" };
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

        const raw = extractGeminiText(payload);
        if (!raw) throw new Error("The Gemini mentor returned no coaching response.");

        const parsed = parseMentorResult(raw, input.passageText);
        if (!parsed.coaching) throw new Error("The Gemini mentor returned no coaching response.");

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
