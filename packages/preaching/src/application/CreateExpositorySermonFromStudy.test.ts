import { describe, expect, it } from "vitest";
import {
    BookCode,
    ChapterNumber,
    Passage,
    VerseNumber,
    VerseReference,
} from "@bsmp/bible";
import {
    InMemoryStudyRepository,
    StudyId,
    StudySession,
    StudyTitle,
} from "@bsmp/study";

import { CreateExpositorySermonFromStudy } from "./CreateExpositorySermonFromStudy.js";

function john15(): Passage {
    const start = VerseReference.create(
        BookCode.from("JHN"),
        ChapterNumber.of(15),
        VerseNumber.from(1),
    );
    return Passage.create(start, start);
}

describe("CreateExpositorySermonFromStudy", () => {
    it("derives the sermon passage and provenance from the study", async () => {
        const repository = new InMemoryStudyRepository();
        const study = StudySession.create(
            StudyId.create("study-1"),
            StudyTitle.from("John 15"),
            john15(),
        );
        await repository.save(study);

        const command = new CreateExpositorySermonFromStudy(repository);
        const sermon = await command.execute(study.id, "Abide in Christ");

        expect(sermon.studyId.toString()).toBe(study.id.toString());
        expect(sermon.passage.toString()).toBe(study.passage.toString());
        expect(sermon.title.value).toBe("Abide in Christ");
    });

    it("rejects a missing study", async () => {
        const repository = new InMemoryStudyRepository();
        const command = new CreateExpositorySermonFromStudy(repository);

        await expect(
            command.execute(StudyId.create("missing"), "Abide in Christ"),
        ).rejects.toThrow("was not found");
    });
});
