import { describe, expect, it } from "vitest";

import { ObservationQuestion } from "./ObservationQuestion.js";

import { ObservationQuestionId } from "../value-objects/ObservationQuestionId.js";
import { QuestionText } from "../value-objects/QuestionText.js";
import { Purpose } from "../value-objects/Purpose.js";

describe("ObservationQuestion", () => {

    it("creates an observation question", () => {

        const question = ObservationQuestion.create(
            ObservationQuestionId.from("OBSQ-001"),
            QuestionText.from("Who?"),
            Purpose.from(
                "Identify every person in the passage.",
            ),
        );

        expect(question.id.toString()).toBe("OBSQ-001");
        expect(question.question.toString()).toBe("Who?");
        expect(question.purpose.toString()).toBe(
            "Identify every person in the passage.",
        );

    });

});