import { describe, expect, it } from "vitest";

import { CreateInterpretation } from "./CreateInterpretation.js";
import { UpdateInterpretation } from "./UpdateInterpretation.js";
import { InMemoryStudyRepository } from "../../infrastructure/repositories/InMemoryStudyRepository.js";
import { createObservation, createStudy } from "../../test/index.js";


describe("UpdateInterpretation", () => {
    it("updates the statement and supporting observations", async () => {
        const study = createStudy("Romans");
        const observation = createObservation("The text describes believers.");
        study.addObservation(observation);
        const repository = new InMemoryStudyRepository([study]);
        const create = new CreateInterpretation(repository);
        const update = new UpdateInterpretation(repository);

        const interpretation = await create.execute(
            study.id,
            "Initial interpretation.",
            [observation.id],
        );

        await update.execute(
            study.id,
            interpretation.id.toString(),
            "Revised interpretation.",
            [observation.id],
        );

        const loaded = await repository.find(study.id);
        expect(loaded).toBeDefined();
        expect(loaded!.interpretations[0]!.statement.value).toBe("Revised interpretation.");
        expect(loaded!.interpretations[0]!.observationIds).toHaveLength(1);
        expect(loaded!.interpretations[0]!.observationIds[0]!.value).toBe(observation.id.value);
    });

    it("rejects updates without supporting observations", async () => {
        const study = createStudy("Romans");
        const observation = createObservation("The text describes believers.");
        study.addObservation(observation);
        const repository = new InMemoryStudyRepository([study]);
        const create = new CreateInterpretation(repository);
        const update = new UpdateInterpretation(repository);
        const interpretation = await create.execute(study.id, "Initial interpretation.", [observation.id]);

        await expect(
            update.execute(study.id, interpretation.id.toString(), "Unsupported revision.", []),
        ).rejects.toThrow("Select at least one supporting observation");
    });
});
