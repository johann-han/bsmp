import { describe, expect, it } from "vitest";

import { StudyTitle } from "./StudyTitle.js";

describe("StudyTitle", () => {

    it("creates a study title", () => {

        const title = StudyTitle.from(
            "Romans 8 Study",
        );

        expect(title.value).toBe(
            "Romans 8 Study",
        );

    });

    it("trims whitespace", () => {

        const title = StudyTitle.from(
            "  Romans 8 Study  ",
        );

        expect(title.value).toBe(
            "Romans 8 Study",
        );

    });

    it("rejects an empty title", () => {

        expect(() =>
            StudyTitle.from(""),
        ).toThrow();

    });

});