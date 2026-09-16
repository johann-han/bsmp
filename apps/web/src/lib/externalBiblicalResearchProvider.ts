export interface ExternalBiblicalResearchInput {
    readonly question: string;
    readonly studyTitle: string;
    readonly passage: string;
    readonly studyContext: readonly string[];
    readonly sourceUrls: readonly string[];
}

export interface ExternalResearchSource {
    readonly url: string;
    readonly title: string;
}

export interface ExternalBiblicalResearchResult {
    readonly answer: string;
    readonly textualBasis: readonly string[];
    readonly furtherQuestions: readonly string[];
    readonly cautions: readonly string[];
    readonly sources: readonly ExternalResearchSource[];
    readonly model: string;
    readonly provider: "gemini";
}

const INSTRUCTIONS = [
    "You are the BSMP External Biblical Research Assistant.",
    "Use the supplied Study context as the primary student-authored foundation.",
    "External sources are supplementary research material and must never be represented as part of the student's Study evidence.",
    "When external sources are used, distinguish clearly between Study-grounded observations and externally retrieved material.",
    "Do not invent quotations, source details, historical facts, Greek or Hebrew claims, or cross-references.",
    "Do not treat an uncited external claim as verified.",
    "Do not replace the student's interpretation, Biblical Theology, or Teaching with an AI-generated conclusion.",
    "Prefer concise, text-sensitive research guidance and identify uncertainty explicitly.",
    "Return exactly one JSON object with answer, textualBasis, furtherQuestions, and cautions.",
].join("\n");

function buildInput(input: ExternalBiblicalResearchInput): string {
    const context = input.studyContext.length ? input.studyContext.map((item, index) => `${index + 1}. ${item}`).join("\n") : "None recorded.";
    const urls = input.sourceUrls.length ? input.sourceUrls.join("\n") : "No URLs supplied; use Google Search only when appropriate.";
    return [
        INSTRUCTIONS,
        `Study: ${input.studyTitle}`,
        `Passage: ${input.passage}`,
        `\nResearch question:\n${input.question}`,
        `\nStudent-authored Study context:\n${context}`,
        `\nCandidate source URLs:\n${urls}`,
        "\nUse the external research tools to retrieve relevant public material. Cite sources through tool-provided URL annotations and do not imply that a source was consulted unless the tool returned it.",
    ].join("\n");
}

const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        answer: { type: "string" },
        textualBasis: { type: "array", items: { type: "string" }, maxItems: 5 },
        furtherQuestions: { type: "array", items: { type: "string" }, maxItems: 5 },
        cautions: { type: "array", items: { type: "string" }, maxItems: 5 },
    },
    required: ["answer", "textualBasis", "furtherQuestions", "cautions"],
} as const;

function textFromSteps(payload: unknown): string {
    if (!payload || typeof payload !== "object") return "";
    const steps = (payload as { steps?: unknown }).steps;
    if (!Array.isArray(steps)) return "";
    for (const step of steps) {
        if (!step || typeof step !== "object" || (step as { type?: unknown }).type !== "model_output") continue;
        const content = (step as { content?: unknown }).content;
        if (!Array.isArray(content)) continue;
        const texts = content
            .filter((block): block is { type?: unknown; text?: unknown } => Boolean(block) && typeof block === "object")
            .filter((block) => block.type === "text" && typeof block.text === "string")
            .map((block) => block.text as string);
        if (texts.length) return texts.join("\n").trim();
    }
    return "";
}

function sourcesFromSteps(payload: unknown): ExternalResearchSource[] {
    if (!payload || typeof payload !== "object") return [];
    const steps = (payload as { steps?: unknown }).steps;
    if (!Array.isArray(steps)) return [];
    const sources = new Map<string, ExternalResearchSource>();
    for (const step of steps) {
        if (!step || typeof step !== "object" || (step as { type?: unknown }).type !== "model_output") continue;
        const content = (step as { content?: unknown }).content;
        if (!Array.isArray(content)) continue;
        for (const block of content) {
            if (!block || typeof block !== "object") continue;
            const annotations = (block as { annotations?: unknown }).annotations;
            if (!Array.isArray(annotations)) continue;
            for (const annotation of annotations) {
                if (!annotation || typeof annotation !== "object") continue;
                if ((annotation as { type?: unknown }).type !== "url_citation") continue;
                const url = (annotation as { url?: unknown }).url;
                if (typeof url !== "string" || !url.trim()) continue;
                const title = (annotation as { title?: unknown }).title;
                sources.set(url, { url, title: typeof title === "string" && title.trim() ? title.trim() : url });
            }
        }
    }
    return Array.from(sources.values()).slice(0, 10);
}

function parseResult(raw: string): Omit<ExternalBiblicalResearchResult, "model" | "provider" | "sources"> {
    const stripped = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(stripped) as Record<string, unknown>;
    const list = (value: unknown) => Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 5)
        : [];
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    if (!answer) throw new Error("The external research assistant returned no usable answer.");
    return {
        answer,
        textualBasis: list(parsed.textualBasis),
        furtherQuestions: list(parsed.furtherQuestions),
        cautions: list(parsed.cautions),
    };
}

export async function runExternalBiblicalResearch(input: ExternalBiblicalResearchInput): Promise<ExternalBiblicalResearchResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini external research is not configured. Set GEMINI_API_KEY on the web server.");
    const model = process.env.GEMINI_RESEARCH_MODEL ?? "gemini-3.6-flash";
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
            model,
            input: buildInput(input),
            tools: [{ type: "google_search" }, { type: "url_context" }],
            response_format: { type: "text", mime_type: "application/json", schema: RESPONSE_SCHEMA },
            generation_config: { max_output_tokens: 1200 },
        }),
    });
    const payload = await response.json() as { status?: unknown; output_text?: unknown; error?: { message?: unknown }; steps?: unknown };
    if (!response.ok) throw new Error(typeof payload.error?.message === "string" ? payload.error.message : "The Gemini external research request failed.");
    if (payload.status === "failed" || payload.status === "cancelled") throw new Error("The Gemini external research interaction did not complete.");
    const raw = typeof payload.output_text === "string" ? payload.output_text : textFromSteps(payload);
    const result = parseResult(raw);
    return { ...result, sources: sourcesFromSteps(payload), model, provider: "gemini" };
}
