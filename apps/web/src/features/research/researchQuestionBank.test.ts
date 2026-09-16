import { describe, expect, it } from "vitest";
import { RESEARCH_QUESTION_SUGGESTIONS } from "./researchQuestionBank";

describe("RESEARCH_QUESTION_SUGGESTIONS", () => {
    it("provides guided questions for every research focus", () => {
        for (const focus of ["general", "geography", "customs_culture", "historical_period", "social_political", "religious_context", "literary_setting", "archaeology_material", "language_terminology"] as const) {
            expect(RESEARCH_QUESTION_SUGGESTIONS[focus].length).toBeGreaterThanOrEqual(4);
            expect(RESEARCH_QUESTION_SUGGESTIONS[focus].every((item) => item.question.length >= 20)).toBe(true);
        }
    });

    it("keeps suggestion identifiers unique", () => {
        const ids = Object.values(RESEARCH_QUESTION_SUGGESTIONS).flat().map((item) => item.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
