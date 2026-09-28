import { describe, expect, it } from "vitest";
import { buildResearchContextSnapshot } from "./researchRunProvenance";

describe("buildResearchContextSnapshot", () => {
    it("normalizes and copies the research context", () => {
        const snapshot = buildResearchContextSnapshot({
            studyTitle: "  Romans 1  ",
            passage: " Romans 1:16 ",
            observations: ["  Paul is the writer.  ", "", "The gospel is central."],
            interpretations: [" The gospel reveals God's righteousness. "],
            biblicalTheology: [
                { theme: "  Gospel ", synthesis: " Salvation is God's work. " },
                { theme: " ", synthesis: " " },
            ],
        });

        expect(snapshot).toEqual({
            studyTitle: "Romans 1",
            passage: "Romans 1:16",
            observations: ["Paul is the writer.", "The gospel is central."],
            interpretations: ["The gospel reveals God's righteousness."],
            biblicalTheology: [
                { theme: "Gospel", synthesis: "Salvation is God's work." },
            ],
        });
    });

    it("creates a detached snapshot so later input mutation does not change history data", () => {
        const input = {
            studyTitle: "Romans",
            passage: "Romans 1:16",
            observations: ["First observation"],
            interpretations: ["First interpretation"],
            biblicalTheology: [{ theme: "Gospel", synthesis: "Good news" }],
        };

        const snapshot = buildResearchContextSnapshot(input);
        input.observations[0] = "Edited observation";
        input.biblicalTheology[0] = { theme: "Changed", synthesis: "Changed" };

        expect(snapshot.observations).toEqual(["First observation"]);
        expect(snapshot.biblicalTheology).toEqual([{ theme: "Gospel", synthesis: "Good news" }]);
    });
});
