import { describe, expect, it } from "vitest";

import { CreateObservation } from "./CreateObservation.js";

import { InMemoryStudyRepository } from "../../infrastructure/repositories/InMemoryStudyRepository.js";

import { createStudy } from "../../test/index.js";

import {
    StudyId,
    StudyTitle,
} from "../../domain/value-objects/index.js";


describe("CreateObservation", () => {

    it("adds an observation to a study", async () => {

        

        const study = createStudy("Romans");

        const repository =
            new InMemoryStudyRepository([
                study,
            ]);

        const command =
            new CreateObservation(
                repository,
            );

        await command.execute(
            StudyId.from("study-1"),
            "Paul introduces himself.",
        );

        const loaded =
            await repository.find(
                StudyId.from("study-1"),
            );

        expect(loaded).toBeDefined();

        if (!loaded) {
            throw new Error("Study was not found.");
        }

        expect(loaded.observations).toHaveLength(1);

        expect(
            loaded.observations[0]!.statement.value,
        ).toBe(
            "Paul introduces himself.",
        );

    });

});