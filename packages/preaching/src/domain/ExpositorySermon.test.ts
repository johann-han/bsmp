import { describe, expect, it } from "vitest";
import { BookCode, ChapterNumber, Passage, VerseNumber, VerseReference } from "@bsmp/bible";
import { StudyId } from "@bsmp/study";

import { ExpositorySermon, ExpositorySermonId, SermonBigIdea, SermonContext, SermonConclusion, SermonIntroduction, SermonPurpose, SermonTitle } from "./ExpositorySermon.js";

function john15(): Passage {
    const start = VerseReference.create(BookCode.from("JHN"), ChapterNumber.of(15), VerseNumber.from(1));
    return Passage.create(start, start);
}

describe("ExpositorySermon", () => {
    it("captures the sermon preparation foundation and study provenance", () => {
        const sermon = ExpositorySermon.create(ExpositorySermonId.create("sermon-1"), StudyId.from("study-1"), SermonTitle.from("Abide in Christ"), john15());
        sermon.defineBigIdea(SermonBigIdea.from("Jesus calls His people to abide in Him."));
        sermon.definePurpose(SermonPurpose.from("Lead the church toward dependent obedience."));
        sermon.defineIntroduction(SermonIntroduction.from("Open with the believer's need for Christ."));
        sermon.defineContext(SermonContext.from("Jesus teaches this in the farewell discourse before the cross."));
        sermon.defineConclusion(SermonConclusion.from("Call the church to remain in Christ and bear fruit."));
        sermon.addOutlinePoint("Abide in the vine", "Life and fruitfulness come from Christ.");
        sermon.addOutlinePoint("Bear lasting fruit", "Abiding produces visible obedience.");
        expect(sermon.title.value).toBe("Abide in Christ");
        expect(sermon.studyId.value).toBe("study-1");
        expect(sermon.passage.toString()).toBe("JHN 15:1");
        expect(sermon.bigIdea?.value).toContain("abide in Him");
        expect(sermon.purpose?.value).toContain("dependent obedience");
        expect(sermon.introduction?.value).toContain("believer's need");
        expect(sermon.context?.value).toContain("farewell discourse");
        expect(sermon.conclusion?.value).toContain("bear fruit");
        expect(sermon.outline).toHaveLength(2);
    });

    it("manages outline points without duplication", () => {
        const sermon = ExpositorySermon.create(ExpositorySermonId.create("sermon-3"), StudyId.from("study-3"), SermonTitle.from("Test"), john15());
        const first = sermon.addOutlinePoint("First", "Truth one");
        const second = sermon.addOutlinePoint("Second", "Truth two");
        expect(() => sermon.addOutlinePoint("First", "Truth one")).toThrow("already part of the sermon");
        sermon.updateOutlinePoint(second.id, "Second revised", "Truth two revised");
        expect(sermon.outline[1]?.heading).toBe("Second revised");
        sermon.moveOutlinePoint(second.id, "up");
        expect(sermon.outline[0]?.id).toBe(second.id);
        expect(sermon.outline[1]?.id).toBe(first.id);
        sermon.removeOutlinePoint(first.id);
        expect(sermon.outline).toHaveLength(1);
        expect(sermon.outline[0]?.id).toBe(second.id);
    });

    it("stores and updates exposition for an outline point", () => {
        const sermon = ExpositorySermon.create(ExpositorySermonId.create("sermon-4"), StudyId.from("study-4"), SermonTitle.from("Test"), john15());
        const point = sermon.addOutlinePoint("Abide in Christ", "Fruitfulness comes from remaining in Christ.", {}, "point-4", {
            explanation: "Explain the command and its relationship to fruitfulness.",
            illustration: "Use a branch and vine illustration.",
            application: "Call believers to remain dependent on Christ.",
            transition: "Move from abiding to the fruit it produces.",
        });
        expect(point.explanation).toContain("relationship to fruitfulness");
        expect(point.illustration).toContain("branch and vine");
        expect(point.application).toContain("dependent on Christ");
        expect(point.transition).toContain("fruit it produces");
        sermon.defineOutlinePointExposition(point.id, { explanation: "Revised explanation.", application: "Revised application." });
        expect(sermon.outline[0]?.explanation).toBe("Revised explanation.");
        expect(sermon.outline[0]?.illustration).toContain("branch and vine");
        expect(sermon.outline[0]?.application).toBe("Revised application.");
        expect(sermon.outline[0]?.transition).toContain("fruit it produces");
    });

    it("rejects empty outline content", () => {
        const sermon = ExpositorySermon.create(ExpositorySermonId.create("sermon-2"), StudyId.from("study-2"), SermonTitle.from("Test"), john15());
        expect(() => sermon.addOutlinePoint("", "truth")).toThrow();
        expect(() => sermon.addOutlinePoint("heading", "")).toThrow();
    });
});
