import { describe, expect, it } from "vitest";

import { ObservationQuestionId } from "./ObservationQuestionId.js";

describe("ObservationQuestionId", () => {

    it("creates a valid observation question id", () => {

        const id = ObservationQuestionId.from("OBSQ-001");

        expect(id.toString()).toBe("OBSQ-001");

    });

    it("rejects an invalid id", () => {

        expect(() =>
            ObservationQuestionId.from("QUESTION-001"),
        ).toThrow();

    });

});