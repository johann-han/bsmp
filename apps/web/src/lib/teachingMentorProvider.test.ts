import { afterEach, describe, expect, it, vi } from "vitest";
import { createTeachingMentorProvider } from "./teachingMentorProvider";

describe("createTeachingMentorProvider", () => {
    const originalProvider = process.env.AI_PROVIDER;
    const originalKey = process.env.GEMINI_API_KEY;

    afterEach(() => {
        vi.restoreAllMocks();
        if (originalProvider === undefined) delete process.env.AI_PROVIDER;
        else process.env.AI_PROVIDER = originalProvider;
        if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalKey;
        delete process.env.GEMINI_TEACHING_MODEL;
        delete process.env.GEMINI_MODEL;
    });

    it("rejects an unconfigured Gemini mentor", () => {
        process.env.AI_PROVIDER = "gemini";
        delete process.env.GEMINI_API_KEY;
        expect(() => createTeachingMentorProvider()).toThrow("Gemini mentor is not configured");
    });

    it("parses a structured response and limits focus fields", async () => {
        process.env.AI_PROVIDER = "gemini";
        process.env.GEMINI_API_KEY = "test-key";
        process.env.GEMINI_TEACHING_MODEL = "gemini-test";
        vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ assessment: "mixed", coaching: "The central truth is grounded, but the key points need a clearer connection to the supplied synthesis.", focuses: ["centralTruth", "keyPoints", "invalid", "explanation"] }) }] } }] }), { status: 200, headers: { "Content-Type": "application/json" } })));

        const result = await createTeachingMentorProvider().assess({
            interpretation: "God calls his people to respond to mercy.",
            theology: "God's mercy shapes the believer's response.",
            centralTruth: "God's mercy should shape our response.",
            teachingAim: "Help learners explain the connection between mercy and response.",
            keyPoints: ["Identify God's mercy", "Explain the response"],
            explanation: "The passage connects God's mercy with the believer's response.",
            discussionQuestions: ["What connection does the text make?"],
            responsePrompt: "State one way you will respond to the truth.",
        });

        expect(result).toMatchObject({ assessment: "mixed", provider: "gemini", model: "gemini-test" });
        expect(result.focuses).toEqual(["centralTruth", "keyPoints", "explanation"]);
    });

    it("falls back after a transient Gemini failure", async () => {
        process.env.AI_PROVIDER = "gemini";
        process.env.GEMINI_API_KEY = "test-key";
        process.env.GEMINI_TEACHING_MODEL = "gemini-primary";
        let calls = 0;
        vi.stubGlobal("fetch", vi.fn(async () => {
            calls += 1;
            if (calls === 1) return new Response(JSON.stringify({ error: { message: "busy" } }), { status: 503, headers: { "Content-Type": "application/json" } });
            return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ assessment: "grounded", coaching: "The teaching plan stays within the supplied foundations and has a clear direction.", focuses: ["teachingAim"] }) }] } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
        }));

        const result = await createTeachingMentorProvider().assess({
            interpretation: "Teach the truth faithfully.",
            theology: "Faithful teaching communicates established biblical truth.",
            centralTruth: "Teach the established truth faithfully.",
            teachingAim: "Help learners understand the truth.",
            keyPoints: ["State the truth", "Explain the truth"],
            explanation: "The teaching follows the supplied interpretation.",
            discussionQuestions: ["What truth is established?"],
            responsePrompt: "Explain the truth in your own words.",
        });

        expect(calls).toBe(2);
        expect(result.assessment).toBe("grounded");
        expect(result.model).toBe("gemini-3.5-flash-lite");
    });
});
