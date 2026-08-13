import { describe, expect, it } from "vitest";

import {
    BookCode,
    ChapterNumber,
    VerseNumber,
    VerseReference,
    Passage,
} from "@bsmp/bible";

import { AddObservation } from "./AddObservation.js";
import { InMemoryStudyRepository } from "../../infrastructure/repositories/InMemoryStudyRepository.js";
import { StudySession } from "../../domain/aggregates/StudySession.js";
import {
    ObservationVerseReference,
    StudyId,
    StudyTitle,
} from "../../domain/value-objects/index.js";

describe("AddObservation", () => {
    it("adds a verse-linked observation to a study", async () => {
        const verseReference = VerseReference.create(
            BookCode.from("JHN"),
            ChapterNumber.of(15),
            VerseNumber.from(1),
        );

        const passage = Passage.create(
            verseReference,
            VerseReference.create(
                BookCode.from("JHN"),
                ChapterNumber.of(15),
                VerseNumber.from(11),
            ),
        );

        const study = StudySession.create(
            StudyId.create(),
            StudyTitle.from("John 15 Study"),
            passage,
        );

        const repository = new InMemoryStudyRepository([study]);
        const command = new AddObservation(repository);

        const observation = await command.execute(
            study.id,
            verseReference,
            "Jesus identifies Himself as the true vine.",
        );

        expect(observation.statement.value).toBe("Jesus identifies Himself as the true vine.");
        expect(observation.verseReference.toString()).toBe("JHN 15:1");
        expect(observation.target.isWordTarget).toBe(false);

        const savedStudy = await repository.find(study.id);
        expect(savedStudy?.observations).toHaveLength(1);
        expect(savedStudy?.observations[0]).toBe(observation);
    });

    it("adds a translation-specific word-targeted observation", async () => {
        const verseReference = VerseReference.create(
            BookCode.from("ROM"),
            ChapterNumber.of(12),
            VerseNumber.from(1),
        );
        const study = StudySession.create(
            StudyId.create(),
            StudyTitle.from("Romans 12 Study"),
            Passage.create(verseReference, verseReference),
        );
        const repository = new InMemoryStudyRepository([study]);
        const command = new AddObservation(repository);

        const observation = await command.execute(
            study.id,
            verseReference,
            "The keyword Therefore points to the previous chapter.",
            {
                translation: "asv",
                wordIndex: 1,
                wordText: "Therefore",
                markupSymbol: "N",
            },
        );

        expect(observation.target.isWordTarget).toBe(true);
        expect(observation.target.translation).toBe("asv");
        expect(observation.target.wordIndex).toBe(1);
        expect(observation.target.wordText).toBe("Therefore");
        expect(observation.target.markupSymbol).toBe("N");
    });

    it("rejects an identical observation for the same target", async () => {
        const verseReference = VerseReference.create(
            BookCode.from("ROM"),
            ChapterNumber.of(12),
            VerseNumber.from(1),
        );
        const study = StudySession.create(
            StudyId.create(),
            StudyTitle.from("Romans 12 Study"),
            Passage.create(verseReference, verseReference),
        );
        const repository = new InMemoryStudyRepository([study]);
        const command = new AddObservation(repository);
        const target = {
            translation: "asv",
            wordIndex: 1,
            wordText: "Therefore",
            markupSymbol: "N",
        } as const;

        await command.execute(study.id, verseReference, "The keyword Therefore points to the previous chapter.", target);

        await expect(
            command.execute(study.id, verseReference, "The keyword Therefore points to the previous chapter.", target),
        ).rejects.toThrow("An identical observation already exists for this study target.");
    });
});
