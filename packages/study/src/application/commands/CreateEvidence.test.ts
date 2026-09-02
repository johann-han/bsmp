import { describe, expect, it } from "vitest";

import { CreateEvidence } from "./CreateEvidence.js";
import { CreateInterpretation } from "./CreateInterpretation.js";
import { InMemoryStudyRepository } from "../../infrastructure/repositories/InMemoryStudyRepository.js";
import { createStudy } from "../../test/index.js";

describe("CreateEvidence", () => {
    it("adds evidence to an interpretation using its raw ID value", async () => {
        const study = createStudy("Romans");
        const repository = new InMemoryStudyRepository([study]);
        const createInterpretation = new CreateInterpretation(repository);
        const createEvidence = new CreateEvidence(repository);
        const observation = study.observations[0];

        expect(observation).toBeDefined();
        if (!observation) {
            throw new Error("Test study must contain an observation.");
        }

        const interpretation = await createInterpretation.execute(
            study.id,
            "Paul teaches justification by faith.",
            [observation.id],
        );

        await createEvidence.execute(
            study.id,
            interpretation.id.value,
            "Scripture",
            "Romans 3:28 reinforces the claim.",
        );

        const loaded = await repository.find(study.id);
        expect(loaded).toBeDefined();
        expect(loaded!.interpretations[0]!.evidence).toHaveLength(1);
        expect(loaded!.interpretations[0]!.evidence[0]!.type.value).toBe("Scripture");
        expect(loaded!.interpretations[0]!.evidence[0]!.description.value).toBe(
            "Romans 3:28 reinforces the claim.",
        );
    });

    it("rejects an unknown interpretation ID", async () => {
        const study = createStudy("Romans");
        const repository = new InMemoryStudyRepository([study]);
        const createEvidence = new CreateEvidence(repository);

        await expect(
            createEvidence.execute(
                study.id,
                crypto.randomUUID(),
                "Scripture",
                "Romans 3:28 reinforces the claim.",
            ),
        ).rejects.toThrow("Interpretation not found.");
    });
});
