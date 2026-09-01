import { describe, expect, it } from "vitest";

import { GetNextObservationQuestion } from "./GetNextObservationQuestion.js";
import { InMemoryObservationQuestionRepository } from "../../infrastructure/repositories/InMemoryObservationQuestionRepository.js";

describe("GetNextObservationQuestion", () => {
    it("returns the first question not yet considered", async () => {
        const repository = new InMemoryObservationQuestionRepository();
        const query = new GetNextObservationQuestion(repository);

        const question = await query.execute(["OBSQ-001", "OBSQ-002"]);

        expect(question?.id.toString()).toBe("OBSQ-003");
        expect(question?.question.value).toBe("Where?");
    });

    it("returns null when every question has been considered", async () => {
        const repository = new InMemoryObservationQuestionRepository();
        const query = new GetNextObservationQuestion(repository);

        const question = await query.execute([
            "OBSQ-001",
            "OBSQ-002",
            "OBSQ-003",
            "OBSQ-004",
            "OBSQ-005",
            "OBSQ-006",
        ]);

        expect(question).toBeNull();
    });
});
