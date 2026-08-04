import { describe, expect, it } from "vitest";

import { Interpretation } from "./Interpretation.js";

import {
    InterpretationId,
    InterpretationStatement,
} from "../value-objects/index.js";

describe("Interpretation", () => {

    it("creates an interpretation", () => {

        const interpretation =
            Interpretation.create(
                InterpretationId.create(),
                InterpretationStatement.from(
                    "Jesus teaches that abiding in Him produces fruit.",
                ),
            );

        expect(
            interpretation.statement.value,
        ).toBe(
            "Jesus teaches that abiding in Him produces fruit.",
        );

    });

    it("stores the creation date", () => {

        const interpretation =
            Interpretation.create(
                InterpretationId.create(),
                InterpretationStatement.from(
                    "Interpretation",
                ),
            );

        expect(
            interpretation.createdAt,
        ).toBeInstanceOf(Date);

    });

});