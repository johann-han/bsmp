import { describe, expect, it } from "vitest";
import { BookCode, ChapterNumber, Passage, VerseNumber, VerseReference } from "@bsmp/bible";
import { StudyId } from "@bsmp/study";
import {
    ExpositorySermon,
    ExpositorySermonId,
    SermonBigIdea,
    SermonDeliveryNotes,
    SermonPurpose,
    SermonTitle,
} from "../domain/ExpositorySermon.js";
import { evaluateFinalSermonReadiness } from "./EvaluateFinalSermonReadiness.js";

function john15(): Passage {
    const start = VerseReference.create(
        BookCode.from("JHN"),
        ChapterNumber.of(15),
        VerseNumber.from(1),
    );
    return Passage.create(start, start);
}

function sermon() {
    return ExpositorySermon.create(
        ExpositorySermonId.create("readiness-test"),
        StudyId.from("study-readiness"),
        SermonTitle.from("Abide in Christ"),
        john15(),
    );
}

describe("evaluateFinalSermonReadiness", () => {
    it("reports all core preparation checks as incomplete for a new sermon", () => {
        const checks = evaluateFinalSermonReadiness(sermon());

        expect(checks).toHaveLength(6);
        expect(checks.every((check) => !check.complete)).toBe(true);
    });

    it("marks preparation elements complete from saved sermon state", () => {
        const next = sermon();
        next.defineBigIdea(SermonBigIdea.from("Jesus calls His people to abide in Him."));
        next.definePurpose(SermonPurpose.from("Lead the church toward dependent obedience."));
        next.addOutlinePoint(
            "Abide in the vine",
            "Life comes from Christ.",
            {},
            "point-1",
            { explanation: "Abiding describes dependent fellowship with Christ." },
        );
        next.defineManuscript({
            get value() {
                return "Full sermon manuscript.";
            },
        } as never);
        next.defineDeliveryNotes(
            SermonDeliveryNotes.from("Pause before the final appeal."),
        );

        expect(evaluateFinalSermonReadiness(next).map((check) => check.complete)).toEqual([
            true,
            true,
            true,
            true,
            true,
            true,
        ]);
    });

    it("does not treat an outline point without exposition as developed exposition", () => {
        const next = sermon();
        next.addOutlinePoint("Abide", "Life comes from Christ.", {}, "point-1");

        const checks = evaluateFinalSermonReadiness(next);

        expect(checks.find((check) => check.id === "outline")?.complete).toBe(true);
        expect(checks.find((check) => check.id === "exposition")?.complete).toBe(false);
    });
});
