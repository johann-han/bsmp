import { describe, expect, it, vi } from "vitest";
import { runOpenRouterBiblicalResearch } from "./openRouterBiblicalResearchProvider";

const input = {
    question: "Where was this event taking place?",
    studyTitle: "Exodus 31 Study",
    passage: "Exodus 31:1-6",
    studyContext: ["Jehovah spoke to Moses."],
    sourceUrls: ["https://en.wikipedia.org/wiki/Geography_of_Israel"],
    focus: "geography" as const,
    external: true,
};

describe("runOpenRouterBiblicalResearch", () => {
    it("returns structured content without exposing reasoning fields", async () => {
        process.env.OPENROUTER_API_KEY = "test-key";
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
            output_text: JSON.stringify({
                answer: "The supplied source provides regional geographical context.",
                textualBasis: [],
                furtherQuestions: ["What specific location does Exodus 31 identify?"],
                cautions: [],
            }),
            output: [{
                type: "message",
                content: [{
                    type: "output_text",
                    text: JSON.stringify({
                        answer: "The supplied source provides regional geographical context.",
                        textualBasis: [],
                        furtherQuestions: ["What specific location does Exodus 31 identify?"],
                        cautions: [],
                    }),
                    annotations: [{ type: "url_citation", url: input.sourceUrls[0], title: "Geography of Israel" }],
                }],
            }],
        }), { status: 200 }));

        const result = await runOpenRouterBiblicalResearch(input);

        expect(result.answer).toBe("The supplied source provides regional geographical context.");
        expect(result.sources).toEqual([{ url: input.sourceUrls[0], title: "Geography of Israel" }]);
        expect(result.answer).not.toContain("Wait, I need to be careful");
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
        expect(body.reasoning).toEqual({ exclude: true });
        expect(body.text).toEqual({
            format: {
                type: "json_schema",
                name: "biblical_research_response",
                strict: false,
                schema: expect.any(Object),
            },
        });
        expect(body.response_format).toBeUndefined();

        fetchMock.mockRestore();
    });

    it("rejects an unstructured provider response instead of exposing it", async () => {
        process.env.OPENROUTER_API_KEY = "test-key";
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
            output_text: "Wait, I need to be careful. Let me craft the JSON response.",
        }), { status: 200 }));

        await expect(runOpenRouterBiblicalResearch(input)).rejects.toThrow("structured research response");
        fetchMock.mockRestore();
    });
});
