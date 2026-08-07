import { describe, expect, it } from "vitest";

import { InMemoryObservationQuestionRepository } from "./InMemoryObservationQuestionRepository.js";
import { ObservationQuestionId } from "../../domain/observation/value-objects/ObservationQuestionId.js";

describe("InMemoryObservationQuestionRepository", () => {

    it("returns all observation questions", async () => {

        const repository =
            new InMemoryObservationQuestionRepository();

        const questions =
            await repository.findAll();

        expect(questions).toHaveLength(6);

    });

    it("finds a question by id", async () => {

        const repository =
            new InMemoryObservationQuestionRepository();

        const question =
            await repository.findById(
                ObservationQuestionId.from("OBSQ-001"),
            );

        expect(question).not.toBeNull();
        expect(question?.question.toString()).toBe("Who?");

    });

    it("returns null for an unknown id", async () => {

        const repository =
            new InMemoryObservationQuestionRepository();

        const question =
            await repository.findById(
                ObservationQuestionId.from("OBSQ-999"),
            );

        expect(question).toBeNull();

    });

});