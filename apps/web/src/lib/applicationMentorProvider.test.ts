import { afterEach, describe, expect, it, vi } from "vitest";
import { createApplicationMentorProvider } from "./applicationMentorProvider";

describe("createApplicationMentorProvider", () => {
    const originalProvider = process.env.AI_PROVIDER;
    const originalKey = process.env.GEMINI_API_KEY;

    afterEach(() => {
        vi.restoreAllMocks();
        if (originalProvider === undefined) delete process.env.AI_PROVIDER;
        else process.env.AI_PROVIDER = originalProvider;
        if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalKey;
        delete process.env.GEMINI_APPLICATION_MODEL;
        delete process.env.GEMINI_MODEL;
    });

    it("rejects an unconfigured Gemini mentor", () => {
        process.env.AI_PROVIDER = "gemini";
        delete process.env.GEMINI_API_KEY;

        expect(() => createApplicationMentorProvider()).toThrow("Gemini mentor is not configured");
    });

    it("parses a structured Gemini response and limits focus fields", async () => {
        process.env.AI_PROVIDER = "gemini";
        process.env.GEMINI_API_KEY = "test-key";
        process.env.GEMINI_APPLICATION_MODEL = "gemini-test";

        vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
            candidates: [{
                content: {
                    parts: [{
                        text: JSON.stringify({
                            assessment: "mixed",
                            coaching: "Your principle follows the interpretation, but the action is not yet concrete enough to test.",
                            focuses: ["principle", "action", "invalid", "personal", "ministry"],
                        }),
                    }],
                },
            }],
        }), { status: 200, headers: { "Content-Type": "application/json" } })));

        const provider = createApplicationMentorProvider();
        const result = await provider.assess({
            interpretation: "God calls believers to depend on Christ.",
            principle: "Depend on Christ rather than self.",
            personal: "I will pray before making major decisions.",
            ministry: "I will encourage others to depend on Christ.",
            action: "I will do better.",
        });

        expect(result).toMatchObject({ assessment: "mixed", provider: "gemini", model: "gemini-test" });
        expect(result.coaching).toContain("action is not yet concrete");
        expect(result.focuses).toEqual(["principle", "action", "personal"]);
    });

    it("falls back to the next Gemini model after a transient provider failure", async () => {
        process.env.AI_PROVIDER = "gemini";
        process.env.GEMINI_API_KEY = "test-key";
        process.env.GEMINI_APPLICATION_MODEL = "gemini-primary";

        let calls = 0;
        vi.stubGlobal("fetch", vi.fn(async () => {
            calls += 1;
            if (calls === 1) {
                return new Response(JSON.stringify({ error: { message: "busy" } }), { status: 503, headers: { "Content-Type": "application/json" } });
            }
            return new Response(JSON.stringify({
                candidates: [{ content: { parts: [{ text: JSON.stringify({ assessment: "grounded", coaching: "The response follows the interpretation and names a concrete step.", focuses: ["action"] }) }] } }],
            }), { status: 200, headers: { "Content-Type": "application/json" } });
        }));

        const result = await createApplicationMentorProvider().assess({
            interpretation: "Serve others faithfully.",
            principle: "Faithful service matters.",
            personal: "I will serve with consistency.",
            ministry: "I will train others to serve.",
            action: "I will volunteer this week.",
        });

        expect(calls).toBe(2);
        expect(result.assessment).toBe("grounded");
        expect(result.model).toBe("gemini-3.5-flash-lite");
    });
});
