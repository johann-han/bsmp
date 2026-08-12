import { describe, expect, it } from "vitest";

import { VerseReference } from "@bsmp/bible";

import { CreateObservation } from "./CreateObservation.js";

import { InMemoryStudyRepository } from "../../infrastructure/repositories/InMemoryStudyRepository.js";

import { createStudy } from "../../test/index.js";

describe("CreateObservation", () => {

    it("adds an observation to a study", async () => {

        // Arrange

        const study = createStudy("Romans");

        const repository =
            new InMemoryStudyRepository([
                study,
            ]);

        const command =
            new CreateObservation(
                repository,
            );

        const verseReference =
            VerseReference.create(
                "ROM",
                1,
                1,
            );

        // Act

        await command.execute(
            study.id,
            verseReference,
            "Paul introduces himself.",
        );

        const loaded =
            await repository.find(
                study.id,
            );

        // Assert

        expect(loaded).toBeDefined();

        if (!loaded) {

            throw new Error(
                "Study not found.",
            );

        }

        expect(
            loaded.observations,
        ).toHaveLength(1);

        const observation =
            loaded.observations[0];

        expect(
            observation,
        ).toBeDefined();

        expect(
            observation!.statement.value,
        ).toBe(
            "Paul introduces himself.",
        );

        expect(
            observation!.verseReference.value.book.value,
        ).toBe(
            "ROM",
        );

        expect(
            observation!.verseReference.value.chapter.value,
        ).toBe(
            1,
        );

        expect(
            observation!.verseReference.value.verse.value,
        ).toBe(
            1,
        );

    });

});