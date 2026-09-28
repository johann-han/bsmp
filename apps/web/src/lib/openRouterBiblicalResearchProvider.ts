import type { BiblicalResearchFocus } from "./biblicalResearchProvider";

export interface OpenRouterBiblicalResearchInput {
    readonly question: string;
    readonly studyTitle: string;
    readonly passage: string;
    readonly studyContext: readonly string[];
    readonly sourceUrls: readonly string[];
    readonly focus: BiblicalResearchFocus;
    readonly external: boolean;
}

export interface OpenRouterResearchSource {
    readonly url: string;
    readonly title: string;
}

export interface OpenRouterBiblicalResearchResult {
    readonly answer: string;
    readonly textualBasis: readonly string[];
    readonly furtherQuestions: readonly string[];
    readonly cautions: readonly string[];
    readonly sources: readonly OpenRouterResearchSource[];
    readonly model: string;
    readonly provider: "openrouter";
}

const FOCUS_GUIDANCE: Record<BiblicalResearchFocus, string> = {
    general: "Investigate the focused biblical research question without assuming a particular contextual category.",
    geography: "Investigate geographical setting, places, routes, terrain, distances, climate, regions, boundaries, and location-related context.",
    customs_culture: "Investigate customs and culture relevant to the passage, including social practices, family life, hospitality, honor and shame, clothing, food, marriage, burial, festivals, agriculture, and household life.",
    historical_period: "Investigate the historical and chronological setting, including approximate dating, rulers, empires, conflicts, major events, and developments relevant to the passage.",
    social_political: "Investigate political authority and social structures, including institutions, classes, citizenship, taxation, patronage, ethnic relations, and relevant power structures.",
    religious_context: "Investigate religious setting, including worship, temple or synagogue life, festivals, purity, priesthood, sacrificial practice, and relevant Jewish, Greco-Roman, or other religious background.",
    literary_setting: "Investigate literary and historical setting, including genre, audience, occasion, rhetorical situation, authorship, provenance, and the passage's place within its surrounding book.",
    archaeology_material: "Investigate archaeological and material context, including sites, inscriptions, artifacts, architecture, roads, household structures, tools, coins, agriculture, and limits of material evidence.",
    language_terminology: "Investigate significant Hebrew, Aramaic, or Greek terms, semantic range, idioms, translation issues, and relevant ancient usage without inventing lexical claims.",
};

const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        answer: { type: "string" },
        textualBasis: { type: "array", items: { type: "string" }, maxItems: 5 },
        furtherQuestions: { type: "array", items: { type: "string" }, maxItems: 5 },
        cautions: { type: "array", items: { type: "string" }, maxItems: 5 },
    },
    required: ["answer", "textualBasis", "furtherQuestions", "cautions"],
    additionalProperties: false,
} as const;

function buildInput(input: OpenRouterBiblicalResearchInput): string {
    const context = input.studyContext.length ? input.studyContext.map((item, index) => `${index + 1}. ${item}`).join("\n") : "None recorded.";
    const sources = input.sourceUrls.length ? input.sourceUrls.join("\n") : "No source URLs supplied.";
    return [
        "You are the BSMP Biblical Research Assistant using OpenRouter.",
        "The Study context is student-authored and must remain distinct from external research.",
        "Do not invent quotations, source details, historical facts, Greek or Hebrew claims, or cross-references.",
        "Do not replace the student's interpretation, Biblical Theology, or Teaching.",
        "Distinguish established facts from uncertainty and do not treat an uncited claim as verified.",
        input.external
            ? "External research is allowed only from the supplied public source URLs. Use the openrouter:web_fetch tool for those URLs when needed. Do not claim to have searched the wider web."
            : "Use only the supplied Study context. Do not claim to have consulted external sources.",
        "Do not reveal private reasoning, scratch work, planning, tool-use narration, API details, or attempts to construct the response. Start directly with the final answer content.",
        "Return exactly one JSON object with answer, textualBasis, furtherQuestions, and cautions. Do not place commentary before or after the JSON object. Never discuss the response format or API.",
        `Research focus: ${input.focus}`,
        FOCUS_GUIDANCE[input.focus],
        `Study: ${input.studyTitle}`,
        `Passage: ${input.passage}`,
        `\nResearch question:\n${input.question}`,
        `\nStudent-authored Study context:\n${context}`,
        `\nSource URLs:\n${sources}`,
    ].join("\n");
}

function extractText(payload: unknown): string {
    if (!payload || typeof payload !== "object") return "";
    const outputText = (payload as { output_text?: unknown }).output_text;
    if (typeof outputText === "string" && outputText.trim()) return outputText.trim();
    const output = (payload as { output?: unknown }).output;
    if (!Array.isArray(output)) return "";
    const texts: string[] = [];
    for (const item of output) {
        if (!item || typeof item !== "object") continue;
        const content = (item as { content?: unknown }).content;
        if (!Array.isArray(content)) continue;
        for (const block of content) {
            if (!block || typeof block !== "object") continue;
            const text = (block as { text?: unknown }).text;
            if (typeof text === "string" && text.trim()) texts.push(text);
        }
    }
    return texts.join("\n").trim();
}

function extractSources(payload: unknown): OpenRouterResearchSource[] {
    if (!payload || typeof payload !== "object") return [];
    const output = (payload as { output?: unknown }).output;
    if (!Array.isArray(output)) return [];
    const sources = new Map<string, OpenRouterResearchSource>();
    for (const item of output) {
        if (!item || typeof item !== "object") continue;
        const content = (item as { content?: unknown }).content;
        if (!Array.isArray(content)) continue;
        for (const block of content) {
            if (!block || typeof block !== "object") continue;
            const annotations = (block as { annotations?: unknown }).annotations;
            if (!Array.isArray(annotations)) continue;
            for (const annotation of annotations) {
                if (!annotation || typeof annotation !== "object") continue;
                const type = (annotation as { type?: unknown }).type;
                if (type !== "url_citation") continue;
                const url = (annotation as { url?: unknown }).url;
                if (typeof url !== "string" || !url.trim()) continue;
                const title = (annotation as { title?: unknown }).title;
                sources.set(url, { url, title: typeof title === "string" && title.trim() ? title.trim() : url });
            }
        }
    }
    return Array.from(sources.values()).slice(0, 10);
}

function list(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 5)
        : [];
}

function parseStructuredObject(raw: string): Record<string, unknown> | null {
    const stripped = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    try {
        const parsed = JSON.parse(stripped) as unknown;
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
    } catch {
        const start = stripped.indexOf("{");
        const end = stripped.lastIndexOf("}");
        if (start < 0 || end <= start) return null;
        try {
            const parsed = JSON.parse(stripped.slice(start, end + 1)) as unknown;
            return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
        } catch {
            return null;
        }
    }
}

function parseResult(raw: string): Omit<OpenRouterBiblicalResearchResult, "model" | "provider" | "sources"> {
    const parsed = parseStructuredObject(raw);
    if (!parsed) throw new Error("The OpenRouter research assistant did not return a structured research response. Please retry the research request.");
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    if (!answer) throw new Error("The OpenRouter research assistant did not return a usable research answer. Please retry the research request.");
    if (/^(?:wait,|let me|i need to|i should|actually,? looking|given the strict constraints)/i.test(answer)) {
        throw new Error("The OpenRouter research assistant did not return a structured research response. Please retry the research request.");
    }
    return {
        answer,
        textualBasis: list(parsed.textualBasis),
        furtherQuestions: list(parsed.furtherQuestions),
        cautions: list(parsed.cautions),
    };
}

export async function runOpenRouterBiblicalResearch(input: OpenRouterBiblicalResearchInput): Promise<OpenRouterBiblicalResearchResult> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OpenRouter research is not configured. Set OPENROUTER_API_KEY on the web server.");
    if (input.external && input.sourceUrls.length === 0) {
        throw new Error("The free OpenRouter fallback can use supplied source URLs, but it does not provide free general web search. Add one or more HTTPS source URLs or use Gemini when available.");
    }

    const model = process.env.OPENROUTER_RESEARCH_MODEL ?? "google/gemma-4-31b-it:free";
    const tools = input.external ? [{ type: "openrouter:web_fetch", parameters: { engine: "openrouter", max_content_tokens: 12000 } }] : undefined;
    const response = await fetch("https://openrouter.ai/api/v1/responses", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "https://bsmp.app",
            "X-Title": process.env.OPENROUTER_APP_NAME ?? "BSMP Biblical Research",
        },
        body: JSON.stringify({
            model,
            input: buildInput(input),
            ...(tools ? { tools } : {}),
            text: {
                format: {
                    type: "json_schema",
                    name: "biblical_research_response",
                    strict: false,
                    schema: RESPONSE_SCHEMA,
                },
            },
            reasoning: { exclude: true },
            max_output_tokens: 1600,
        }),
    });
    const payload = await response.json() as { output_text?: unknown; output?: unknown; error?: { message?: unknown } };
    if (!response.ok) {
        const detail = typeof payload.error?.message === "string" ? payload.error.message : "The OpenRouter research request failed.";
        throw new Error(`[openrouter:${response.status}] ${detail}`);
    }
    const raw = extractText(payload);
    const result = parseResult(raw);
    return { ...result, sources: extractSources(payload), model, provider: "openrouter" };
}
