import { describe, expect, it } from "vitest";

import { Purpose } from "./Purpose.js";

describe("Purpose", () => {

    it("creates a valid purpose", () => {

        const purpose = Purpose.from(
            "Identify every person in the passage.",
        );

        expect(purpose.toString()).toBe(
            "Identify every person in the passage.",
        );

    });

    it("rejects a short purpose", () => {

        expect(() =>
            Purpose.from("Short"),
        ).toThrow();

    });

});