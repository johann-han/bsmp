import { describe, expect, it } from "vitest";

import { Evidence } from "./Evidence.js";

import {
    EvidenceDescription,
    EvidenceId,
    EvidenceType,
} from "../value-objects/index.js";

describe("Evidence", () => {

    it("creates evidence", () => {

        const evidence = Evidence.create(
            EvidenceId.create(),
            EvidenceType.scripture(),
            EvidenceDescription.from(
                "John 15:4",
            ),
        );

        expect(
            evidence.type.value,
        ).toBe(
            "Scripture",
        );

        expect(
            evidence.description.value,
        ).toBe(
            "John 15:4",
        );

    });

    it("stores the creation date", () => {

        const evidence = Evidence.create(
            EvidenceId.create(),
            EvidenceType.scripture(),
            EvidenceDescription.from(
                "John 15:4",
            ),
        );

        expect(
            evidence.createdAt,
        ).toBeInstanceOf(Date);

    });

});