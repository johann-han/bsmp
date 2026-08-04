import { describe, expect, it } from "vitest";

import { StudyId } from "./StudyId.js";

describe("StudyId", () => {

    it("creates a unique identifier", () => {

        const id = StudyId.create();

        expect(id).toBeDefined();

    });

    it("creates an identifier from a string", () => {

        const id = StudyId.from(
            "study-1",
        );

        expect(id.value).toBe(
            "study-1",
        );

    });

});