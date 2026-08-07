import { describe, expect, it } from "vitest";

import { QuestionText } from "./QuestionText.js";

describe("QuestionText", () => {

    it("creates a valid question", () => {

        const text = QuestionText.from("Who?");

        expect(text.toString()).toBe("Who?");

    });

    it("rejects empty text", () => {

        expect(() =>
            QuestionText.from(""),
        ).toThrow();

    });

});