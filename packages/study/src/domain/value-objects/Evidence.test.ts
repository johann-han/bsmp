import { describe, expect, it } from "vitest";

import { Evidence } from "../entities/Evidence.js";

import {
    EvidenceDescription,
    EvidenceId,
} from "../value-objects/index.js";

describe("Evidence", () => {

    it("creates evidence", () => {

        const evidence = Evidence.create(
            EvidenceId.create(),
            EvidenceDescription.from(
                "The word 'abide' appears four times.",
            ),
        );

        expect(
            evidence.description.value,
        ).toBe(
            "The word 'abide' appears four times.",
        );

    });

    it("stores the creation date", () => {

        const evidence = Evidence.create(
            EvidenceId.create(),
            EvidenceDescription.from(
                "Evidence",
            ),
        );

        expect(
            evidence.createdAt,
        ).toBeInstanceOf(Date);

    });

});