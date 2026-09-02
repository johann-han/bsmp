import { describe, expect, it } from "vitest";

import { CreateApplication } from "./CreateApplication.js";
import { CreateInterpretation } from "./CreateInterpretation.js";
import { InMemoryStudyRepository } from "../../infrastructure/repositories/InMemoryStudyRepository.js";
import { createStudy } from "../../test/index.js";

describe("CreateApplication", () => {
    it("adds an application anchored to an interpretation", async () => {
        const study = createStudy("Romans");
        const repository = new InMemoryStudyRepository([study]);
        const createInterpretation = new CreateInterpretation(repository);
        const observation = study.observations[0];

        expect(observation).toBeDefined();
        if (!observation) {
            throw new Error("Test study must contain an observation.");
        }

        const interpretation = await createInterpretation.execute(
            study.id,
            "God justifies the sinner by faith.",
            [observation.id],
        );

        const createApplication = new CreateApplication(repository);
        await createApplication.execute(
            study.id,
            interpretation.id,
            "Faith is the proper ground of reliance on God.",
            "I will trust God rather than my own performance.",
            "I will encourage believers who are living under condemnation.",
            "Pray before reacting to the next accusation and respond in faith.",
        );

        const loaded = await repository.find(study.id);
        expect(loaded?.applications).toHaveLength(1);
        expect(loaded?.applications[0]?.interpretationId.toString()).toBe(interpretation.id.toString());
        expect(loaded?.applications[0]?.action.value).toContain("Pray before reacting");
    });
});
