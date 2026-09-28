import { afterEach, describe, expect, it, vi } from "vitest";
import { runExternalBiblicalResearch } from "./externalBiblicalResearchProvider";

describe("runExternalBiblicalResearch", () => {
    const originalKey = process.env.GEMINI_API_KEY;
    const originalModel = process.env.GEMINI_RESEARCH_MODEL;

    afterEach(() => {
        vi.restoreAllMocks();
        if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalKey;
        if (originalModel === undefined) delete process.env.GEMINI_RESEARCH_MODEL;
        else process.env.GEMINI_RESEARCH_MODEL = originalModel;
    });

    it("requires Gemini configuration", async () => {
        delete process.env.GEMINI_API_KEY;
        await expect(runExternalBiblicalResearch({
            question: "What does this source contribute?",
            studyTitle: "Test Study",
            passage: "Romans 12:1-2",
            studyContext: ["Observation: present your bodies"],
            sourceUrls: ["https://example.com/article"],
            focus: "historical_period",
        })).rejects.toThrow("Gemini external research is not configured");
    });

    it("returns structured research and URL citation annotations", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        process.env.GEMINI_RESEARCH_MODEL = "gemini-3.6-flash";
        const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
            const body = JSON.parse(String(init?.body ?? "{}")) as { input?: string };
            expect(body.input).toContain("Research focus: customs_culture");
            expect(body.input).toContain("customs and culture");
            return new Response(JSON.stringify({
                status: "completed",
                output_text: JSON.stringify({
                    answer: "External material adds historical context while the Study remains primary.",
                    textualBasis: ["The supplied Study observation should be checked against the retrieved source."],
                    furtherQuestions: ["Does the source's context change the interpretation?"],
                    cautions: ["External material is supplementary and must be checked against the text."],
                }),
                steps: [{
                    type: "model_output",
                    content: [{
                        type: "text",
                        text: "structured",
                        annotations: [{ type: "url_citation", title: "Example Source", url: "https://example.com/article" }],
                    }],
                }],
            }), { status: 200, headers: { "Content-Type": "application/json" } });
        });
        vi.stubGlobal("fetch", fetchMock);

        const result = await runExternalBiblicalResearch({
            question: "What does this source contribute?",
            studyTitle: "Test Study",
            passage: "Romans 12:1-2",
            studyContext: ["Observation: present your bodies"],
            sourceUrls: ["https://example.com/article"],
            focus: "customs_culture",
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(result.sources).toEqual([{ title: "Example Source", url: "https://example.com/article" }]);
        expect(result.answer).toContain("historical context");
    });
});
