import { describe, expect, it } from "vitest";
import { BookCode, ChapterNumber, Passage, VerseNumber, VerseReference } from "@bsmp/bible";
import { StudyId } from "@bsmp/study";
import { ExpositorySermon, ExpositorySermonId, SermonBigIdea, SermonContext, SermonConclusion, SermonDeliveryNotes, SermonIntroduction, SermonManuscript, SermonPurpose, SermonTitle } from "./ExpositorySermon.js";

function john15(): Passage {
    const start = VerseReference.create(BookCode.from("JHN"), ChapterNumber.of(15), VerseNumber.from(1));
    return Passage.create(start, start);
}

describe("ExpositorySermon", () => {
    it("captures sermon preparation foundation and provenance", () => {
        const sermon = ExpositorySermon.create(ExpositorySermonId.create("sermon-1"), StudyId.from("study-1"), SermonTitle.from("Abide in Christ"), john15());
        sermon.defineBigIdea(SermonBigIdea.from("Jesus calls His people to abide in Him."));
        sermon.definePurpose(SermonPurpose.from("Lead the church toward dependent obedience."));
        sermon.defineIntroduction(SermonIntroduction.from("Open with the believer's need for Christ."));
        sermon.defineContext(SermonContext.from("Jesus teaches this in the farewell discourse before the cross."));
        sermon.defineConclusion(SermonConclusion.from("Call the church to remain in Christ and bear fruit."));
        sermon.addOutlinePoint("Abide in the vine", "Life and fruitfulness come from Christ.");
        expect(sermon.studyId.value).toBe("study-1");
        expect(sermon.outline).toHaveLength(1);
    });

    it("manages outline ordering and prevents exact duplicates", () => {
        const sermon = ExpositorySermon.create(ExpositorySermonId.create("sermon-2"), StudyId.from("study-2"), SermonTitle.from("Test"), john15());
        const first = sermon.addOutlinePoint("First", "Truth one");
        const second = sermon.addOutlinePoint("Second", "Truth two");
        expect(() => sermon.addOutlinePoint("First", "Truth one")).toThrow("already part of the sermon");
        sermon.updateOutlinePoint(second.id, "Second revised", "Truth two revised");
        sermon.moveOutlinePoint(second.id, "up");
        expect(sermon.outline[0]?.id).toBe(second.id);
        sermon.removeOutlinePoint(first.id);
        expect(sermon.outline).toHaveLength(1);
    });

    it("stores study-backed exposition mappings", () => {
        const sermon = ExpositorySermon.create(ExpositorySermonId.create("sermon-3"), StudyId.from("study-3"), SermonTitle.from("Test"), john15());
        const point = sermon.addOutlinePoint("Remain in Christ", "Fruitfulness depends on abiding.", { supportingObservationIds: ["obs-1"], supportingInterpretationIds: ["int-1"] }, "point-3", {
            text: "Jesus commands His disciples to remain in Him.", explanation: "The command describes dependent union with Christ.", illustration: "Use a branch and vine illustration.", application: "Call believers to remain dependent on Christ.", transition: "Move from abiding to fruit.",
            textObservationIds: ["obs-1"], meaningInterpretationIds: ["int-1"], meaningEvidenceIds: ["evidence-1"], responseApplicationIds: ["application-1"],
        });
        expect(point.textObservationIds).toEqual(["obs-1"]);
        expect(point.meaningEvidenceIds).toEqual(["evidence-1"]);
    });

    it("preserves Biblical Theology support when a normal outline edit omits it", () => {
        const sermon = ExpositorySermon.create(ExpositorySermonId.create("sermon-bt"), StudyId.from("study-bt"), SermonTitle.from("Test"), john15());
        const point = sermon.addOutlinePoint(
            "Remain in Christ",
            "Fruitfulness depends on abiding.",
            { supportingBiblicalTheologyIds: ["bt-1", "bt-2"] },
            "point-bt",
            { supportingBiblicalTheologyIds: ["bt-1", "bt-2"] },
        );

        const updated = sermon.updateOutlinePoint(
            point.id,
            "Remain in Christ",
            "Fruitfulness depends on abiding faithfully.",
            {},
            { explanation: "Updated explanation without restating Biblical Theology support." },
        );

        expect(updated.supportingBiblicalTheologyIds).toEqual(["bt-1", "bt-2"]);
    });

    it("stores traceable manuscript sections and removes sections with deleted outline points", () => {
        const sermon = ExpositorySermon.create(ExpositorySermonId.create("sermon-sections"), StudyId.from("study-sections"), SermonTitle.from("Sections"), john15());
        const point = sermon.addOutlinePoint("Remain", "Abide in Christ", {}, "point-sections");
        sermon.defineManuscriptSections([
            { id: "intro", title: "Introduction", content: "A faithful introduction." },
            { id: "point-section", title: "Remain", content: "This section explains the main point.", outlinePointId: point.id },
            { id: "blank", title: " ", content: "ignored" },
        ]);
        expect(sermon.manuscriptSections).toEqual([
            { id: "intro", title: "Introduction", content: "A faithful introduction." },
            { id: "point-section", title: "Remain", content: "This section explains the main point.", outlinePointId: point.id },
        ]);

        sermon.removeOutlinePoint(point.id);
        expect(sermon.manuscriptSections).toEqual([
            { id: "intro", title: "Introduction", content: "A faithful introduction." },
        ]);
    });

    it("keeps manuscript section links attached to outline point ids when points are reordered", () => {
        const sermon = ExpositorySermon.create(ExpositorySermonId.create("sermon-reorder"), StudyId.from("study-reorder"), SermonTitle.from("Reorder"), john15());
        const first = sermon.addOutlinePoint("First", "Truth one", {}, "point-first");
        const second = sermon.addOutlinePoint("Second", "Truth two", {}, "point-second");

        sermon.defineManuscriptSections([
            { id: "first-section", title: "First", content: "First manuscript content.", outlinePointId: first.id },
            { id: "second-section", title: "Second", content: "Second manuscript content.", outlinePointId: second.id },
        ]);

        sermon.moveOutlinePoint(second.id, "up");

        expect(sermon.outline.map((point) => point.id)).toEqual([second.id, first.id]);
        expect(sermon.manuscriptSections).toEqual([
            { id: "first-section", title: "First", content: "First manuscript content.", outlinePointId: first.id },
            { id: "second-section", title: "Second", content: "Second manuscript content.", outlinePointId: second.id },
        ]);
    });

    it("stores the final manuscript and delivery notes", () => {
        const sermon = ExpositorySermon.create(ExpositorySermonId.create("sermon-4"), StudyId.from("study-4"), SermonTitle.from("Final Draft"), john15());
        sermon.defineManuscript(SermonManuscript.from("Full sermon manuscript."));
        sermon.defineDeliveryNotes(SermonDeliveryNotes.from("Emphasize the repeated command and pause before the final appeal."));
        expect(sermon.manuscript?.value).toBe("Full sermon manuscript.");
        expect(sermon.deliveryNotes?.value).toContain("final appeal");
    });
});
