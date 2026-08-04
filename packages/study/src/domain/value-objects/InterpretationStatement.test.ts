import { describe, expect, it } from "vitest";

import { InterpretationStatement } from "./InterpretationStatement.js";

describe("InterpretationStatement", () => {

    it("creates a statement", () => {

        const statement =
            InterpretationStatement.from(
                "Jesus teaches that abiding in Him produces fruit.",
            );

        expect(
            statement.value,
        ).toBe(
            "Jesus teaches that abiding in Him produces fruit.",
        );

    });

    it("trims whitespace", () => {

        const statement =
            InterpretationStatement.from(
                "  Interpretation  ",
            );

        expect(
            statement.value,
        ).toBe(
            "Interpretation",
        );

    });

    it("rejects an empty statement", () => {

        expect(() =>
            InterpretationStatement.from(""),
        ).toThrow();

    });

});