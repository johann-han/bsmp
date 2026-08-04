import { describe, expect, it } from "vitest";

import { ListStudies } from "./ListStudies.js";

import { InMemoryStudyRepository } from "../../infrastructure/repositories/InMemoryStudyRepository.js";

import { createStudy } from "../../test/index.js";

describe("ListStudies", () => {

    it("returns all studies", async () => {

        const repository =
            new InMemoryStudyRepository([
                createStudy("Romans"),
                createStudy("John"),
            ]);

        const query =
            new ListStudies(
                repository,
            );

        const studies =
            await query.execute();

        expect(studies).toHaveLength(2);

    });

});