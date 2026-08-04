import { describe, expect, it } from "vitest";

import {
    BookCode,
    ChapterNumber,
    Passage,
    VerseNumber,
    VerseReference,
} from "@bsmp/bible";

import { CreateStudy } from "./CreateStudy.js";

import { InMemoryStudyRepository } from "../../infrastructure/repositories/InMemoryStudyRepository.js";

describe("CreateStudy", () => {

    it("creates and saves a study", async () => {

        const repository =
            new InMemoryStudyRepository();

        const command =
            new CreateStudy(
                repository,
            );

        const passage = Passage.create(
            VerseReference.create(
                BookCode.from("ROM"),
                ChapterNumber.of(8),
                VerseNumber.from(1),
            ),
            VerseReference.create(
                BookCode.from("ROM"),
                ChapterNumber.of(8),
                VerseNumber.from(39),
            ),
        );

        const study =
            await command.execute(
                "Romans 8 Study",
                passage,
            );

        const loaded =
            await repository.find(
                study.id,
            );

        expect(loaded).toBeDefined();

        if (!loaded) {
            throw new Error(
                "Study not found.",
            );
        }

        expect(
            loaded.title.value,
        ).toBe(
            "Romans 8 Study",
        );

        expect(
            loaded.passage,
        ).toBe(
            passage,
        );

    });

});