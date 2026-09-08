export type SermonDeliveryMentorAssessment = "grounded" | "mixed" | "unclear" | "overstated";

export interface SermonDeliveryMentorInput {
  readonly bigIdea: string;
  readonly purpose: string;
  readonly manuscript: string;
  readonly deliveryNotes: string;
  readonly outline: readonly string[];
}

export interface SermonDeliveryMentorResult {
  readonly assessment: SermonDeliveryMentorAssessment;
  readonly coaching: string;
  readonly focuses: readonly ("message" | "deliveryNotes" | "clarity" | "emphasis" | "application")[];
  readonly model: string;
  readonly provider: "openai" | "gemini";
}

export interface SermonDeliveryMentorProvider { assess(input: SermonDeliveryMentorInput): Promise<SermonDeliveryMentorResult>; }

const TIMEOUT_MS = 8_000;
const GEMINI_FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"] as const;
const FOCUS_FIELDS = ["message", "deliveryNotes", "clarity", "emphasis", "application"] as const;
const INSTRUCTIONS = [
  "You are the BSMP Sermon Delivery Mentor.",
  "The preacher has already completed the Study, framework, exposition, and final manuscript. Review only the supplied material.",
  "Assess whether delivery notes and delivery emphasis remain faithful to the completed manuscript, Big Idea, Purpose, and prepared outline.",
  "Do not judge preaching style as a matter of taste. Focus on message fidelity, clarity, emphasis, and whether delivery notes introduce or imply claims not present in the prepared sermon.",
  "Do not write or rewrite the sermon, delivery notes, illustrations, applications, or doctrine.",
  "Do not introduce outside biblical claims, cross-references, or generic theological assertions.",
  "Classify as grounded, mixed, unclear, or overstated.",
  "Grounded means the delivery plan reinforces the prepared message without materially changing its claims or priorities.",
  "Mixed means the delivery plan is substantially faithful but contains an emphasis, omission, or note that should be reviewed.",
  "Unclear means the supplied material does not permit a confident judgment.",
  "Overstated means delivery notes introduce or intensify claims beyond the supplied sermon foundations.",
  "Give 2 to 4 sentences of coaching. Identify what to inspect; do not provide replacement wording.",
  "Return JSON with assessment, coaching, and focuses.",
].join("\n");

function prompt(input: SermonDeliveryMentorInput): string {
  return [
    `Big Idea:\n${input.bigIdea}`,
    `\nPurpose:\n${input.purpose}`,
    `\nFinal Manuscript:\n${input.manuscript}`,
    `\nDelivery Notes:\n${input.deliveryNotes}`,
    `\nPrepared Outline:\n- ${input.outline.join("\n- ")}`,
  ].join("\n");
}

const SCHEMA = { type: "object", properties: { assessment: { type: "string", enum: ["grounded", "mixed", "unclear", "overstated"] }, coaching: { type: "string" }, focuses: { type: "array", items: { type: "string", enum: FOCUS_FIELDS } } }, required: ["assessment", "coaching", "focuses"], additionalProperties: false } as const;

function parse(text: string): Omit<SermonDeliveryMentorResult, "model" | "provider"> {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  let payload: Record<string, unknown> | null = null;
  try { const value = JSON.parse(trimmed) as unknown; if (value && typeof value === "object" && !Array.isArray(value)) payload = value as Record<string, unknown>; }
  catch { const start = trimmed.indexOf("{"); const end = trimmed.lastIndexOf("}"); if (start >= 0 && end > start) { try { const value = JSON.parse(trimmed.slice(start, end + 1)) as unknown; if (value && typeof value === "object" && !Array.isArray(value)) payload = value as Record<string, unknown>; } catch { /* invalid response */ } } }
  const assessment = ["grounded", "mixed", "unclear", "overstated"].includes(String(payload?.assessment)) ? payload?.assessment as SermonDeliveryMentorAssessment : "mixed";
  const coaching = typeof payload?.coaching === "string" ? payload.coaching.trim() : "";
  if (!coaching) throw new Error("The sermon delivery mentor returned no usable coaching response. Please try again.");
  const focuses = Array.isArray(payload?.focuses) ? payload.focuses.filter((value): value is string => typeof value === "string" && (FOCUS_FIELDS as readonly string[]).includes(value)).slice(0, FOCUS_FIELDS.length) as SermonDeliveryMentorResult["focuses"] : [];
  return { assessment, coaching, focuses };
}
function openAiText(payload: unknown): string { if (!payload || typeof payload !== "object") return ""; const value = (payload as { output_text?: unknown }).output_text; return typeof value === "string" ? value.trim() : ""; }
function geminiText(payload: unknown): string { if (!payload || typeof payload !== "object") return ""; const candidates = (payload as { candidates?: unknown }).candidates; if (!Array.isArray(candidates)) return ""; const parts = (candidates[0] as { content?: { parts?: unknown } } | undefined)?.content?.parts; if (!Array.isArray(parts)) return ""; return parts.map((part) => part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string" ? (part as { text: string }).text : "").join("").trim(); }
async function requestJson(url: string, init: RequestInit): Promise<{ response: Response; payload: unknown }> { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), TIMEOUT_MS); try { const response = await fetch(url, { ...init, signal: controller.signal }); const payload = await response.json(); return { response, payload }; } catch (reason) { if (reason instanceof DOMException && reason.name === "AbortError") throw new Error(`The sermon delivery mentor timed out after ${TIMEOUT_MS / 1000} seconds.`); throw reason; } finally { clearTimeout(timer); } }
function providerMessage(payload: unknown, provider: string, status: number): string { if (payload && typeof payload === "object") { const message = (payload as { error?: { message?: unknown } }).error?.message; if (typeof message === "string" && message.trim()) return message.trim(); } return `${provider} returned HTTP ${status}.`; }

export function createSermonDeliveryMentorProvider(): SermonDeliveryMentorProvider {
  const provider = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();
  if (provider === "openai") return new OpenAIProvider(process.env.OPENAI_API_KEY ?? (() => { throw new Error("OpenAI mentor is not configured. Set OPENAI_API_KEY on the web server."); })(), process.env.OPENAI_SERMON_DELIVERY_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5.6-luna");
  if (provider === "gemini") return new GeminiProvider(process.env.GEMINI_API_KEY ?? (() => { throw new Error("Gemini mentor is not configured. Set GEMINI_API_KEY on the web server."); })(), process.env.GEMINI_SERMON_DELIVERY_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite");
  throw new Error(`Unsupported AI_PROVIDER: ${provider}. Use "gemini" or "openai".`);
}
class OpenAIProvider implements SermonDeliveryMentorProvider { constructor(private readonly apiKey: string, private readonly model: string) {} async assess(input: SermonDeliveryMentorInput): Promise<SermonDeliveryMentorResult> { const { response, payload } = await requestJson("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: this.model, instructions: INSTRUCTIONS, input: [{ role: "user", content: [{ type: "input_text", text: prompt(input) }] }], text: { format: { type: "json_schema", name: "sermon_delivery_mentor_response", strict: true, schema: SCHEMA } }, max_output_tokens: 700 }) }); if (!response.ok) throw new Error(providerMessage(payload, "OpenAI", response.status)); const raw = openAiText(payload); if (!raw) throw new Error("The OpenAI sermon delivery mentor returned no text."); return { ...parse(raw), model: this.model, provider: "openai" }; } }
class GeminiProvider implements SermonDeliveryMentorProvider { constructor(private readonly apiKey: string, private readonly model: string) {} async assess(input: SermonDeliveryMentorInput): Promise<SermonDeliveryMentorResult> { const models = Array.from(new Set([this.model, ...GEMINI_FALLBACK_MODELS])); const failures: string[] = []; for (const model of models) { try { const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`; const { response, payload } = await requestJson(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey }, body: JSON.stringify({ systemInstruction: { parts: [{ text: INSTRUCTIONS }] }, contents: [{ role: "user", parts: [{ text: prompt(input) }] }], generationConfig: { responseMimeType: "application/json", thinkingConfig: { thinkingLevel: "minimal" }, maxOutputTokens: 700 } }) }); if (response.ok) { const raw = geminiText(payload); if (!raw) { failures.push(`${model}: empty response`); continue; } return { ...parse(raw), model, provider: "gemini" }; } failures.push(`${model}: ${providerMessage(payload, `Gemini ${model}`, response.status)}`); if (![429, 500, 502, 503, 504].includes(response.status)) throw new Error(failures.at(-1) ?? "Gemini request failed."); } catch (reason) { failures.push(`${model}: ${reason instanceof Error ? reason.message : "Unknown provider error."}`); } } throw new Error(`The Gemini sermon delivery mentor is temporarily unavailable. ${failures.at(-1) ?? "Please try again later."}`); } }
