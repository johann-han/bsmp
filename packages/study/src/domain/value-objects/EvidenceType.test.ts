import { describe, expect, it } from "vitest";

import { EvidenceType } from "./EvidenceType.js";

describe("EvidenceType", () => {

    it("creates a scripture evidence type", () => {

        expect(
            EvidenceType.scripture().value,
        ).toBe("Scripture");

    });

    it("creates a historical evidence type", () => {

        expect(
            EvidenceType.historical().value,
        ).toBe("Historical");

    });

    it("creates an original language evidence type", () => {

        expect(
            EvidenceType.originalLanguage().value,
        ).toBe("OriginalLanguage");

    });

});