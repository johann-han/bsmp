import { describe, expect, it } from "vitest";

import { EvidenceDescription } from "./EvidenceDescription.js";

describe("EvidenceDescription", () => {

    it("creates a description", () => {

        const description =
            EvidenceDescription.from(
                "The word 'abide' appears four times.",
            );

        expect(
            description.value,
        ).toBe(
            "The word 'abide' appears four times.",
        );

    });

    it("trims whitespace", () => {

        const description =
            EvidenceDescription.from(
                "  Evidence  ",
            );

        expect(
            description.value,
        ).toBe(
            "Evidence",
        );

    });

    it("rejects an empty description", () => {

        expect(() =>
            EvidenceDescription.from(""),
        ).toThrow();

    });

});