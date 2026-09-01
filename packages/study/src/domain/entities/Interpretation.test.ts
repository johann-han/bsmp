import { describe, expect, it } from "vitest";

import { Evidence } from "./Evidence.js";
import { Interpretation } from "./Interpretation.js";

import {
    EvidenceDescription,
    EvidenceId,
    EvidenceType,
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

    it("updates only the evidence record identified by id", () => {

        const first = Evidence.create(
            EvidenceId.create(),
            EvidenceType.scripture(),
            EvidenceDescription.from("Original first evidence"),
        );

        const second = Evidence.create(
            EvidenceId.create(),
            EvidenceType.geographical(),
            EvidenceDescription.from("Original second evidence"),
        );

        const interpretation = Interpretation.create(
            InterpretationId.create(),
            InterpretationStatement.from("Test interpretation"),
            [],
            [first, second],
        );

        interpretation.updateEvidence(
            first.id,
            EvidenceType.historical(),
            EvidenceDescription.from("Updated first evidence"),
        );

        expect(first.type.value).toBe("Historical");
        expect(first.description.value).toBe("Updated first evidence");
        expect(second.type.value).toBe("Geographical");
        expect(second.description.value).toBe("Original second evidence");

    });

});
