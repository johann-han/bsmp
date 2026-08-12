import { describe, expect, it } from "vitest";

import {
    BookCode,
    ChapterNumber,
    VerseNumber,
    VerseReference,
} from "@bsmp/bible";

import { AddObservation } from "./AddObservation.js";
import { InMemoryStudyRepository } from "../../infrastructure/repositories/InMemoryStudyRepository.js";
import { StudySession } from "../../domain/aggregates/StudySession.js";
import {
    ObservationVerseReference,
    StudyId,
    StudyTitle,
} from "../../domain/value-objects/index.js";
import { Passage } from "@bsmp/bible";

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

        expect(observation.statement.value)
            .toBe("Jesus identifies Himself as the true vine.");

        expect(observation.verseReference.toString())
            .toBe("JHN 15:1");

        const savedStudy = await repository.find(study.id);

        expect(savedStudy?.observations).toHaveLength(1);
        expect(savedStudy?.observations[0]).toBe(observation);
    });
});
