import { describe, expect, it } from "vitest";

import { InMemoryStudyRepository } from "./InMemoryStudyRepository.js";

import { createStudy } from "../../test/index.js";

describe("InMemoryStudyRepository", () => {

    it("loads a stored study", async () => {

        const study = createStudy("Romans Study");

        const repository =
            new InMemoryStudyRepository([
                study,
            ]);

        const loaded =
            await repository.find(
                study.id,
            );

        expect(
            loaded,
        ).toBe(study);

    });

    it("saves a study", async () => {

        const repository =
            new InMemoryStudyRepository();

        const study =
            createStudy(
                "Romans Study",
            );

        await repository.save(
            study,
        );

        const loaded =
            await repository.find(
                study.id,
            );

        expect(
            loaded,
        ).toBe(study);

    });

    it("returns all studies", async () => {

        const study1 =
            createStudy(
                "Romans",
            );

        const study2 =
            createStudy(
                "John",
            );

        const repository =
            new InMemoryStudyRepository([
                study1,
                study2,
            ]);

        const studies =
            await repository.findAll();

        expect(
            studies,
        ).toHaveLength(2);

        expect(
            studies,
        ).toContain(
            study1,
        );

        expect(
            studies,
        ).toContain(
            study2,
        );

    });

    it("deletes a study", async () => {

        const study =
            createStudy();

        const repository =
            new InMemoryStudyRepository([
                study,
            ]);

        await repository.delete(
            study.id,
        );

        const loaded =
            await repository.find(
                study.id,
            );

        expect(
            loaded,
        ).toBeUndefined();

    });

});