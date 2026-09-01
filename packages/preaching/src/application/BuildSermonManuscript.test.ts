import { describe, expect, it } from "vitest";
import { BookCode, ChapterNumber, Passage, VerseNumber, VerseReference } from "@bsmp/bible";
import { StudyId } from "@bsmp/study";
import { ExpositorySermon, ExpositorySermonId, SermonBigIdea, SermonConclusion, SermonContext, SermonIntroduction, SermonPurpose, SermonTitle } from "../domain/ExpositorySermon.js";
import { buildSermonManuscript } from "./BuildSermonManuscript.js";

function john15(): Passage {
    const start = VerseReference.create(BookCode.from("JHN"), ChapterNumber.of(15), VerseNumber.from(1));
    return Passage.create(start, start);
}

describe("buildSermonManuscript", () => {
    it("assembles the sermon framework and completed outline into a structured draft", () => {
        const sermon = ExpositorySermon.create(
            ExpositorySermonId.create("sermon-1"),
            StudyId.from("study-1"),
            SermonTitle.from("Abide in Christ"),
            john15(),
        );
        sermon.defineBigIdea(SermonBigIdea.from("Jesus calls His people to abide in Him."));
        sermon.definePurpose(SermonPurpose.from("Lead the church toward dependent obedience."));
        sermon.defineIntroduction(SermonIntroduction.from("Open with our need for Christ."));
        sermon.defineContext(SermonContext.from("John 15 belongs to Jesus' farewell discourse."));
        sermon.addOutlinePoint("Abide in the vine", "Life comes from Christ.", {}, "point-1", {
            text: "Jesus commands His disciples to remain in Him.",
            explanation: "Abiding describes dependent fellowship with Christ.",
            illustration: "Picture a branch receiving life from the vine.",
            application: "Call believers to remain dependent on Christ.",
            transition: "Now consider the fruit this abiding produces.",
        });
        sermon.defineConclusion(SermonConclusion.from("Call the church to remain in Christ."));

        const draft = buildSermonManuscript(sermon);

        expect(draft).toContain("SERMON: Abide in Christ");
        expect(draft).toContain("BIG IDEA");
        expect(draft).toContain("INTRODUCTION");
        expect(draft).toContain("1. Abide in the vine");
        expect(draft).toContain("Jesus commands His disciples");
        expect(draft).toContain("CONCLUSION");
    });
});
