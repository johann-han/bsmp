import { describe, expect, it } from "vitest";

import { ListObservationQuestions } from "./ListObservationQuestions.js";
import { InMemoryObservationQuestionRepository } from "../../infrastructure/repositories/InMemoryObservationQuestionRepository.js";

describe("ListObservationQuestions", () => {

    it("returns every observation question", async () => {

        const repository =
            new InMemoryObservationQuestionRepository();

        const query =
            new ListObservationQuestions(repository);

        const questions =
            await query.execute();

        expect(questions).toHaveLength(6);

    });

});