import { describe, expect, it } from "vitest";

import { InMemoryStudyRepository } from "./InMemoryStudyRepository.js";

import {
    StudyId,
    StudyTitle,
} from "../../domain/value-objects/index.js";

import { StudySession } from "../../domain/aggregates/StudySession.js";

describe("InMemoryStudyRepository", () => {

    it("loads a stored study", async () => {

        const study = StudySession.create(
            StudyId.from("study-1"),
            StudyTitle.from(
                "Romans Study",
            ),
        );

        const repository =
            new InMemoryStudyRepository([
                study,
            ]);

        const loaded =
            await repository.find(
                StudyId.from("study-1"),
            );

        expect(
            loaded,
        ).toBe(study);

    });

    it("saves a study", async () => {

        const repository =
            new InMemoryStudyRepository();

        const study =
            StudySession.create(
                StudyId.from("study-1"),
                StudyTitle.from(
                    "Romans Study",
                ),
            );

        await repository.save(
            study,
        );

        const loaded =
            await repository.find(
                StudyId.from("study-1"),
            );

        expect(
            loaded,
        ).toBe(study);

    });

});