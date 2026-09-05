export type SermonExpositionMentorAssessment = "grounded" | "mixed" | "unclear" | "overstated";

export interface SermonExpositionMentorInput {
  readonly truth: string;
  readonly text: string;
  readonly meaning: string;
  readonly preaching: string;
  readonly response: string;
  readonly transition: string;
  readonly observations: readonly string[];
  readonly interpretations: readonly string[];
  readonly evidence: readonly string[];
  readonly applications: readonly string[];
  readonly biblicalTheology: readonly string[];
}

export interface SermonExpositionMentorResult {
  readonly assessment: SermonExpositionMentorAssessment;
  readonly coaching: string;
  readonly focuses: readonly ("text" | "meaning" | "preaching" | "response" | "transition" | "foundations")[];
  readonly model: string;
  readonly provider: "openai" | "gemini";
}

export interface SermonExpositionMentorProvider { assess(input: SermonExpositionMentorInput): Promise<SermonExpositionMentorResult>; }

const TIMEOUT_MS = 8_000;
const GEMINI_FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"] as const;
const FOCUS_FIELDS = ["text", "meaning", "preaching", "response", "transition", "foundations"] as const;

const INSTRUCTIONS = [
  "You are the BSMP Sermon Exposition Mentor.",
  "The preacher has already completed an inductive study and sermon outline. Review only the supplied material.",
  "Test whether Text, Meaning, Preaching, and Response faithfully develop the outline truth and remain grounded in the supplied observations, interpretations, evidence, applications, and Biblical Theology.",
  "Do not write a replacement exposition, illustration, application, transition, doctrine, or sermon.",
  "Do not introduce outside biblical claims or cross-references.",
  "Treat the supplied study foundations as the available evidence, not as facts to expand beyond their stated scope.",
  "Classify as grounded, mixed, unclear, or overstated.",
  "Grounded means the exposition is clear and traceable without materially exceeding the foundations.",
  "Mixed means the main development is grounded but one or more parts need clarification, stronger linkage, or narrower claims.",
  "Unclear means the exposition is too vague to evaluate confidently.",
  "Overstated means the exposition makes claims stronger than the supplied foundations establish.",
  "Give 2 to 4 sentences of coaching. Identify the reasoning or traceability issue; do not rewrite it.",
  "Return JSON with assessment, coaching, and focuses.",
].join("\n");

function prompt(input: SermonExpositionMentorInput): string {
  return [
    `Outline truth:\n${input.truth}`,
    `\nText:\n${input.text}`,
    `\nMeaning:\n${input.meaning}`,
    `\nPreaching:\n${input.preaching}`,
    `\nResponse:\n${input.response}`,
    `\nTransition:\n${input.transition}`,
    `\nObservations:\n- ${input.observations.join("\n- ")}`,
    `\nInterpretations:\n- ${input.interpretations.join("\n- ")}`,
    `\nEvidence:\n- ${input.evidence.join("\n- ")}`,
    `\nApplications:\n- ${input.applications.join("\n- ")}`,
    `\nBiblical Theology:\n- ${input.biblicalTheology.join("\n- ")}`,
  ].join("\n");
}

const SCHEMA = {
  type: "object",
  properties: {
    assessment: { type: "string", enum: ["grounded", "mixed", "unclear", "overstated"] },
    coaching: { type: "string" },
    focuses: { type: "array", items: { type: "string", enum: FOCUS_FIELDS } },
  },
  required: ["assessment", "coaching", "focuses"],
  additionalProperties: false,
} as const;

function parse(text: string): Omit<SermonExpositionMentorResult, "model" | "provider"> {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  let payload: Record<string, unknown> | null = null;
  try {
    const value = JSON.parse(trimmed) as unknown;
    if (value && typeof value === "object" && !Array.isArray(value)) payload = value as Record<string, unknown>;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        const value = JSON.parse(trimmed.slice(start, end + 1)) as unknown;
        if (value && typeof value === "object" && !Array.isArray(value)) payload = value as Record<string, unknown>;
      } catch { /* invalid response */ }
    }
  }
  const assessment = ["grounded", "mixed", "unclear", "overstated"].includes(String(payload?.assessment))
    ? payload?.assessment as SermonExpositionMentorAssessment
    : "mixed";
  const coaching = typeof payload?.coaching === "string" ? payload.coaching.trim() : "";
  if (!coaching) throw new Error("The sermon exposition mentor returned no usable coaching response. Please try again.");
  const focuses = Array.isArray(payload?.focuses)
    ? payload.focuses.filter((value): value is string => typeof value === "string" && (FOCUS_FIELDS as readonly string[]).includes(value)).slice(0, FOCUS_FIELDS.length) as SermonExpositionMentorResult["focuses"]
    : [];
  return { assessment, coaching, focuses };
}

function openAiText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const value = (payload as { output_text?: unknown }).output_text;
  return typeof value === "string" ? value.trim() : "";
}

function geminiText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return "";
  const parts = (candidates[0] as { content?: { parts?: unknown } } | undefined)?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((part) => part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string" ? (part as { text: string }).text : "").join("").trim();
}

async function requestJson(url: string, init: RequestInit): Promise<{ response: Response; payload: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const payload = await response.json();
    return { response, payload };
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === "AbortError") throw new Error(`The sermon exposition mentor timed out after ${TIMEOUT_MS / 1000} seconds.`);
    throw reason;
  } finally { clearTimeout(timer); }
}

function providerMessage(payload: unknown, provider: string, status: number): string {
  if (payload && typeof payload === "object") {
    const message = (payload as { error?: { message?: unknown } }).error?.message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  return `${provider} returned HTTP ${status}.`;
}

export function createSermonExpositionMentorProvider(): SermonExpositionMentorProvider {
  const provider = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();
  if (provider === "openai") return new OpenAIProvider(process.env.OPENAI_API_KEY ?? (() => { throw new Error("OpenAI mentor is not configured. Set OPENAI_API_KEY on the web server."); })(), process.env.OPENAI_SERMON_EXPOSITION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5.6-luna");
  if (provider === "gemini") return new GeminiProvider(process.env.GEMINI_API_KEY ?? (() => { throw new Error("Gemini mentor is not configured. Set GEMINI_API_KEY on the web server."); })(), process.env.GEMINI_SERMON_EXPOSITION_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite");
  throw new Error(`Unsupported AI_PROVIDER: ${provider}. Use "gemini" or "openai".`);
}

class OpenAIProvider implements SermonExpositionMentorProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}
  async assess(input: SermonExpositionMentorInput): Promise<SermonExpositionMentorResult> {
    const { response, payload } = await requestJson("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, instructions: INSTRUCTIONS, input: [{ role: "user", content: [{ type: "input_text", text: prompt(input) }] }], text: { format: { type: "json_schema", name: "sermon_exposition_mentor_response", strict: true, schema: SCHEMA } }, max_output_tokens: 700 }),
    });
    if (!response.ok) throw new Error(providerMessage(payload, "OpenAI", response.status));
    const raw = openAiText(payload);
    if (!raw) throw new Error("The OpenAI sermon exposition mentor returned no text.");
    return { ...parse(raw), model: this.model, provider: "openai" };
  }
}

class GeminiProvider implements SermonExpositionMentorProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}
  async assess(input: SermonExpositionMentorInput): Promise<SermonExpositionMentorResult> {
    const models = Array.from(new Set([this.model, ...GEMINI_FALLBACK_MODELS]));
    const failures: string[] = [];
    for (const model of models) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
        const { response, payload } = await requestJson(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: INSTRUCTIONS }] }, contents: [{ role: "user", parts: [{ text: prompt(input) }] }], generationConfig: { responseMimeType: "application/json", thinkingConfig: { thinkingLevel: "minimal" }, maxOutputTokens: 700 } }),
        });
        if (response.ok) {
          const raw = geminiText(payload);
          if (!raw) { failures.push(`${model}: empty response`); continue; }
          return { ...parse(raw), model, provider: "gemini" };
        }
        failures.push(`${model}: ${providerMessage(payload, `Gemini ${model}`, response.status)}`);
        if (![429, 500, 502, 503, 504].includes(response.status)) throw new Error(failures.at(-1) ?? "Gemini request failed.");
      } catch (reason) {
        failures.push(`${model}: ${reason instanceof Error ? reason.message : "Unknown provider error."}`);
      }
    }
    throw new Error(`The Gemini sermon exposition mentor is temporarily unavailable. ${failures.at(-1) ?? "Please try again later."}`);
  }
}
