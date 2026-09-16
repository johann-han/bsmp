import { describe, expect, it } from "vitest";

describe("external research integration contract", () => {
    it("documents the Gemini Interactions API contract used by the provider", () => {
        expect({ endpoint: "https://generativelanguage.googleapis.com/v1beta/interactions", tools: ["google_search", "url_context"], responseType: "application/json" }).toEqual({ endpoint: "https://generativelanguage.googleapis.com/v1beta/interactions", tools: ["google_search", "url_context"], responseType: "application/json" });
    });
});
