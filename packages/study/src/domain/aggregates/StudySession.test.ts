import { describe, expect, it } from "vitest";

import {
    BookCode,
    ChapterNumber,
    Passage,
    VerseNumber,
    VerseReference,
} from "@bsmp/bible";

import { StudySession } from "./StudySession.js";

import {
    StudyId,
    StudyTitle,
} from "../value-objects/index.js";

describe("StudySession", () => {

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

    it("creates a study session", () => {

        const study = StudySession.create(
            StudyId.create(),
            StudyTitle.from(
                "Romans 8 Study",
            ),
            passage,
        );

        expect(study).toBeDefined();

        expect(
            study.title.value,
        ).toBe(
            "Romans 8 Study",
        );

        expect(
            study.passage,
        ).toBe(
            passage,
        );

        expect(
            study.status.value,
        ).toBe(
            "Draft",
        );

        expect(
            study.createdAt,
        ).toBeInstanceOf(Date);

    });

});