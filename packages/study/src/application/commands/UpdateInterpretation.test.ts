import { describe, expect, it } from "vitest";

import { CreateInterpretation } from "./CreateInterpretation.js";
import { UpdateInterpretation } from "./UpdateInterpretation.js";
import { InMemoryStudyRepository } from "../../infrastructure/repositories/InMemoryStudyRepository.js";
import { createStudy } from "../../test/index.js";


describe("UpdateInterpretation", () => {
    it("updates the statement and supporting observations", async () => {
        const study = createStudy("Romans");
        const repository = new InMemoryStudyRepository([study]);
        const create = new CreateInterpretation(repository);
        const update = new UpdateInterpretation(repository);

        const observation = study.observations[0];
        const interpretation = await create.execute(
            study.id,
            "Initial interpretation.",
        );

        await update.execute(
            study.id,
            interpretation.id.toString(),
            "Revised interpretation.",
            observation ? [observation.id] : [],
        );

        const loaded = await repository.find(study.id);
        expect(loaded).toBeDefined();
        expect(loaded!.interpretations[0]!.statement.value).toBe("Revised interpretation.");
        expect(loaded!.interpretations[0]!.observationIds).toHaveLength(observation ? 1 : 0);
    });
});
