import { afterEach, describe, expect, it, vi } from "vitest";
import { runBiblicalResearch } from "./biblicalResearchProvider";

describe("runBiblicalResearch", () => {
    const originalProvider = process.env.AI_PROVIDER;
    const originalKey = process.env.GEMINI_API_KEY;
    const originalModel = process.env.GEMINI_RESEARCH_MODEL;

    afterEach(() => {
        vi.restoreAllMocks();
        if (originalProvider === undefined) delete process.env.AI_PROVIDER;
        else process.env.AI_PROVIDER = originalProvider;
        if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalKey;
        if (originalModel === undefined) delete process.env.GEMINI_RESEARCH_MODEL;
        else process.env.GEMINI_RESEARCH_MODEL = originalModel;
    });

    it("rejects an unconfigured Gemini research provider", async () => {
        process.env.AI_PROVIDER = "gemini";
        delete process.env.GEMINI_API_KEY;

        await expect(runBiblicalResearch({
            question: "What is emphasized?",
            studyTitle: "Test Study",
            passage: "Romans 12:1-2",
            focus: "general",
            observations: [],
            interpretations: [],
            biblicalTheology: [],
        })).rejects.toThrow("Gemini research is not configured");
    });

    it("parses a structured Gemini result and preserves the supplied Study context and focus in the prompt", async () => {
        process.env.AI_PROVIDER = "gemini";
        process.env.GEMINI_API_KEY = "test-key";
        process.env.GEMINI_RESEARCH_MODEL = "gemini-research-test";

        const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
            const body = JSON.parse(String(init?.body ?? "{}")) as { contents?: Array<{ parts?: Array<{ text?: string }> }> };
            const prompt = body.contents?.[0]?.parts?.[0]?.text ?? "";
            expect(prompt).toContain("Research focus: geography");
            expect(prompt).toContain("geographical setting");
            expect(prompt).toContain("Study: Test Study");
            expect(prompt).toContain("Research question:\nWhat does this Study emphasize?");
            expect(prompt).toContain("Romans 12:1: Present your bodies");
            expect(prompt).toContain("Believers should respond in worship.");
            expect(prompt).toContain("Mercy produces transformed worship: grace is answered by renewed obedience.");

            return new Response(JSON.stringify({
                candidates: [{
                    content: {
                        parts: [{
                            text: JSON.stringify({
                                answer: "The recorded Study emphasizes a response to God's mercy.",
                                textualBasis: ["Romans 12:1", "The recorded observation about presenting the body"],
                                furtherQuestions: ["How does the exhortation develop in verse 2?"],
                                cautions: ["The Study context alone does not establish wider cross-references."],
                            }),
                        }],
                    },
                }],
            }), { status: 200, headers: { "Content-Type": "application/json" } });
        });
        vi.stubGlobal("fetch", fetchMock);

        const result = await runBiblicalResearch({
            question: "What does this Study emphasize?",
            studyTitle: "Test Study",
            passage: "Romans 12:1-2",
            focus: "geography",
            observations: ["Romans 12:1: Present your bodies"],
            interpretations: ["Believers should respond in worship."],
            biblicalTheology: [{ theme: "Mercy and response", synthesis: "Mercy produces transformed worship: grace is answered by renewed obedience." }],
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            answer: "The recorded Study emphasizes a response to God's mercy.",
            textualBasis: ["Romans 12:1", "The recorded observation about presenting the body"],
            furtherQuestions: ["How does the exhortation develop in verse 2?"],
            cautions: ["The Study context alone does not establish wider cross-references."],
            model: "gemini-research-test",
            provider: "gemini",
        });
    });

    it("limits returned research lists to five items", async () => {
        process.env.AI_PROVIDER = "gemini";
        process.env.GEMINI_API_KEY = "test-key";
        process.env.GEMINI_RESEARCH_MODEL = "gemini-research-test";

        vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: JSON.stringify({
                answer: "A grounded response.",
                textualBasis: ["1", "2", "3", "4", "5", "6"],
                furtherQuestions: ["1", "2", "3", "4", "5", "6"],
                cautions: ["1", "2", "3", "4", "5", "6"],
            }) }] } }],
        }), { status: 200, headers: { "Content-Type": "application/json" } })));

        const result = await runBiblicalResearch({
            question: "What should I investigate next?",
            studyTitle: "Test Study",
            passage: "Romans 12:1-2",
            focus: "general",
            observations: [],
            interpretations: [],
            biblicalTheology: [],
        });

        expect(result.textualBasis).toHaveLength(5);
        expect(result.furtherQuestions).toHaveLength(5);
        expect(result.cautions).toHaveLength(5);
    });
});
