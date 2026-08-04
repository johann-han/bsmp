import { describe, expect, it } from "vitest";

import { EvidenceId } from "./EvidenceId.js";

describe("EvidenceId", () => {

    it("creates a unique identifier", () => {

        const id = EvidenceId.create();

        expect(id).toBeDefined();

    });

    it("creates an identifier from a string", () => {

        const id = EvidenceId.from(
            "evidence-1",
        );

        expect(id.value).toBe(
            "evidence-1",
        );

    });

});