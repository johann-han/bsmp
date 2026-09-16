export type BiblicalResearchFocus =
    | "general"
    | "geography"
    | "customs_culture"
    | "historical_period"
    | "social_political"
    | "religious_context"
    | "literary_setting"
    | "archaeology_material"
    | "language_terminology";

export interface BiblicalResearchInput {
    readonly question: string;
    readonly studyTitle: string;
    readonly passage: string;
    readonly observations: readonly string[];
    readonly interpretations: readonly string[];
    readonly biblicalTheology: readonly { theme: string; synthesis: string }[];
    readonly focus: BiblicalResearchFocus;
}

export interface BiblicalResearchResult {
    readonly answer: string;
    readonly textualBasis: readonly string[];
    readonly furtherQuestions: readonly string[];
    readonly cautions: readonly string[];
    readonly model: string;
    readonly provider: "openai" | "gemini";
}

const FOCUS_GUIDANCE: Record<BiblicalResearchFocus, string> = {
    general: "Investigate the focused biblical research question without assuming a particular contextual category.",
    geography: "Investigate the geographical setting: places, routes, terrain, distances, climate, regions, political boundaries, and how location may clarify the passage. Distinguish secure geographical facts from reconstructions or uncertain identifications.",
    customs_culture: "Investigate customs and culture: social practices, family life, hospitality, honor and shame, clothing, food, marriage, burial, festivals, agricultural practices, and other cultural conventions relevant to the passage. Explain only practices that are relevant to the passage and distinguish period-specific evidence from generalized claims.",
    historical_period: "Investigate the historical and chronological setting: approximate date, major historical events, rulers, empires, conflicts, and developments relevant to the passage. Clearly distinguish established chronology from debated dating.",
    social_political: "Investigate the social and political setting: governing authorities, institutions, social classes, citizenship, taxation, patronage, slavery or servitude where relevant, ethnic relations, and other power structures that illuminate the passage.",
    religious_context: "Investigate the religious setting: worship practices, temple or synagogue context, festivals, purity practices, priesthood, competing religious beliefs, and relevant Jewish, Greco-Roman, or other religious background. Distinguish historical description from theological interpretation.",
    literary_setting: "Investigate the literary and historical setting: genre, immediate literary context, audience, occasion, rhetorical situation, authorship and provenance where reasonably established, and how the passage functions within its surrounding book. Do not substitute external theories for the student's own interpretation.",
    archaeology_material: "Investigate archaeological and material context: sites, inscriptions, artifacts, architecture, roads, household structures, tools, coins, agriculture, and other material evidence relevant to the passage. Identify the limits of archaeological evidence and avoid treating an artifact as proof of a specific interpretation without adequate support.",
    language_terminology: "Investigate important language and terminology: significant Hebrew, Aramaic, or Greek terms, semantic range, idioms, translation issues, and relevant ancient usage. Do not invent lexical data, morphology, or etymologies, and make uncertainty explicit.",
};

const INSTRUCTIONS = [
    "You are the BSMP Biblical Research Assistant.",
    "Provide study-grounded biblical research assistance using only the supplied Study context.",
    "Do not invent quotations, sources, historical facts, Greek or Hebrew claims, or cross-references.",
    "Do not present uncertain claims as established facts.",
    "Do not replace the student's interpretation or theology; distinguish supplied study material from your own synthesis.",
    "Prefer concise, text-sensitive reasoning that helps the student investigate further.",
    "When the supplied context is insufficient, say so explicitly and suggest a precise question the student can investigate.",
    "Return exactly one JSON object with answer, textualBasis, furtherQuestions, and cautions.",
].join("\n");

function prompt(input: BiblicalResearchInput): string {
    const observations = input.observations.length ? input.observations.map((value, i) => `${i + 1}. ${value}`).join("\n") : "None recorded.";
    const interpretations = input.interpretations.length ? input.interpretations.map((value, i) => `${i + 1}. ${value}`).join("\n") : "None recorded.";
    const theology = input.biblicalTheology.length
        ? input.biblicalTheology.map((entry, i) => `${i + 1}. ${entry.theme}: ${entry.synthesis}`).join("\n")
        : "None recorded.";
    return [
        `Research focus: ${input.focus}`,
        FOCUS_GUIDANCE[input.focus],
        `Study: ${input.studyTitle}`,
        `Passage: ${input.passage}`,
        `\nResearch question:\n${input.question}`,
        `\nObservations:\n${observations}`,
        `\nInterpretations:\n${interpretations}`,
        `\nBiblical Theology syntheses:\n${theology}`,
    ].join("\n");
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

function parseResult(raw: string): Omit<BiblicalResearchResult, "model" | "provider"> {
    const stripped = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(stripped) as Record<string, unknown>;
    const list = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 5) : [];
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    if (!answer) throw new Error("The AI research assistant returned no usable answer.");
    return {
        answer,
        textualBasis: list(parsed.textualBasis),
        furtherQuestions: list(parsed.furtherQuestions),
        cautions: list(parsed.cautions),
    };
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
    additionalProperties: false,
} as const;

export async function runBiblicalResearch(input: BiblicalResearchInput): Promise<BiblicalResearchResult> {
    const provider = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();
    if (provider === "openai") {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OpenAI research is not configured. Set OPENAI_API_KEY on the web server.");
        const model = process.env.OPENAI_RESEARCH_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5.6-luna";
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model, instructions: INSTRUCTIONS, input: [{ role: "user", content: [{ type: "input_text", text: prompt(input) }] }], text: { format: { type: "json_schema", name: "biblical_research_response", strict: true, schema: RESPONSE_SCHEMA } }, max_output_tokens: 900 }),
        });
        const payload = await response.json() as { output_text?: unknown; error?: { message?: unknown } };
        if (!response.ok) throw new Error(typeof payload.error?.message === "string" ? payload.error.message : "The OpenAI research request failed.");
        return { ...parseResult(extractOpenAIText(payload)), model, provider: "openai" };
    }
    if (provider === "gemini") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini research is not configured. Set GEMINI_API_KEY on the web server.");
        const model = process.env.GEMINI_RESEARCH_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ systemInstruction: { parts: [{ text: INSTRUCTIONS }] }, contents: [{ role: "user", parts: [{ text: prompt(input) }] }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1200 } }),
        });
        const payload = await response.json() as { candidates?: unknown; error?: { message?: unknown } };
        if (!response.ok) throw new Error(typeof payload.error?.message === "string" ? payload.error.message : "The Gemini research request failed.");
        return { ...parseResult(extractGeminiText(payload)), model, provider: "gemini" };
    }
    throw new Error(`Unsupported AI_PROVIDER: ${provider}. Use "gemini" or "openai".`);
}
