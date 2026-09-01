import { describe, expect, it } from "vitest";
import {
    BookCode,
    ChapterNumber,
    Passage,
    VerseNumber,
    VerseReference,
} from "@bsmp/bible";

import {
    ExpositorySermon,
    ExpositorySermonId,
    SermonBigIdea,
    SermonPurpose,
    SermonTitle,
} from "./ExpositorySermon.js";
import type { SermonStudyContext } from "./StudyContext.js";

function john15(): Passage {
    const start = VerseReference.create(
        BookCode.from("JHN"),
        ChapterNumber.from(15),
        VerseNumber.from(1),
    );
    return Passage.create(start, start);
}

function context(): SermonStudyContext {
    return {
        studyId: "study-1",
        studyTitle: "John 15 Study",
        passageReference: "JHN 15:1",
        observations: [
            { id: "obs-1", verseReference: "JHN 15:1", statement: "Jesus identifies Himself as the true vine." },
        ],
        interpretations: [
            {
                id: "int-1",
                statement: "Jesus is the source of spiritual life.",
                observationIds: ["obs-1"],
                evidence: [
                    { id: "ev-1", interpretationId: "int-1", type: "Scripture", description: "The surrounding passage emphasizes abiding in Christ." },
                ],
            },
        ],
        applications: [
            {
                id: "app-1",
                interpretationId: "int-1",
                principle: "Remain dependent on Christ.",
                personal: "Cultivate daily dependence on Jesus.",
                ministry: "Teach believers to abide in Christ.",
                action: "Pray before beginning each day.",
            },
        ],
    };
}

describe("ExpositorySermon", () => {
    it("captures the sermon preparation foundation", () => {
        const sermon = ExpositorySermon.create(
            ExpositorySermonId.create("sermon-1"),
            SermonTitle.from("Abide in Christ"),
            john15(),
        );

        sermon.defineBigIdea(SermonBigIdea.from("Jesus calls His people to abide in Him."));
        sermon.definePurpose(SermonPurpose.from("Lead the church toward dependent obedience."));
        sermon.addOutlinePoint("Abide in the vine", "Life and fruitfulness come from Christ.");
        sermon.addOutlinePoint("Bear lasting fruit", "Abiding produces visible obedience.");

        expect(sermon.title.value).toBe("Abide in Christ");
        expect(sermon.passage.toString()).toBe("JHN 15:1");
        expect(sermon.bigIdea?.value).toContain("abide in Him");
        expect(sermon.purpose?.value).toContain("dependent obedience");
        expect(sermon.outline).toHaveLength(2);
    });

    it("rejects empty outline content", () => {
        const sermon = ExpositorySermon.create(
            ExpositorySermonId.create("sermon-2"),
            SermonTitle.from("Test"),
            john15(),
        );

        expect(() => sermon.addOutlinePoint("", "truth")).toThrow();
        expect(() => sermon.addOutlinePoint("heading", "")).toThrow();
    });

    it("links an outline point only to study-owned support", () => {
        const sermon = ExpositorySermon.create(
            ExpositorySermonId.create("sermon-3"),
            SermonTitle.from("Abide"),
            john15(),
        );
        const point = sermon.addOutlinePoint("Abide in Christ", "Depend on Christ for life.");
        const study = context();

        sermon.attachStudySupport(point.id, study, {
            observationIds: ["obs-1"],
            interpretationIds: ["int-1"],
            evidenceIds: ["ev-1"],
            applicationIds: ["app-1"],
        });

        expect(sermon.outline[0]?.supportingObservationIds).toEqual(["obs-1"]);
        expect(sermon.outline[0]?.supportingInterpretationIds).toEqual(["int-1"]);
        expect(sermon.outline[0]?.supportingEvidenceIds).toEqual(["ev-1"]);
        expect(sermon.outline[0]?.supportingApplicationIds).toEqual(["app-1"]);

        expect(() => sermon.attachStudySupport(point.id, study, { observationIds: ["missing"] }))
            .toThrow("outside the originating study");
    });
});
