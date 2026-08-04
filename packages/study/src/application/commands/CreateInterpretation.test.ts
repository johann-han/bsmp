import { describe, expect, it } from "vitest";

import { CreateInterpretation } from "./CreateInterpretation.js";

import { InMemoryStudyRepository } from "../../infrastructure/repositories/InMemoryStudyRepository.js";

import {
    StudyId,
} from "../../domain/value-objects/index.js";

import {
    createStudy,
} from "../../test/index.js";

describe("CreateInterpretation", () => {

    it("adds an interpretation to a study", async () => {

        const study =
            createStudy(
                "Romans",
            );

        const repository =
            new InMemoryStudyRepository([
                study,
            ]);

        const command =
            new CreateInterpretation(
                repository,
            );

        await command.execute(
            study.id,
            "Paul teaches justification by faith.",
        );

        const loaded =
            await repository.find(
                study.id,
            );

        expect(
            loaded,
        ).toBeDefined();

        if (!loaded) {

            throw new Error(
                "Study not found.",
            );

        }

        expect(
            loaded.interpretations,
        ).toHaveLength(1);

        expect(
            loaded.interpretations[0]!,
        ).toBeDefined();

        expect(
            loaded.interpretations[0]!.statement.value,
        ).toBe(
            "Paul teaches justification by faith.",
        );

    });

});