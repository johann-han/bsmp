import { describe, expect, it } from "vitest";

import { classifyObservationEntry } from "./ObservationEntryType.js";

describe("classifyObservationEntry", () => {
    it("recognizes questions", () => {
        expect(classifyObservationEntry("Who is Paul addressing?")) .toBe("question");
        expect(classifyObservationEntry("To whom did Paul speak")) .toBe("question");
    });

    it("recognizes direct observations", () => {
        expect(classifyObservationEntry("Paul addresses every man among you.")) .toBe("observation");
        expect(classifyObservationEntry("The passage names many members.")) .toBe("observation");
    });

    it("recognizes inferences", () => {
        expect(classifyObservationEntry("This shows that every believer has a responsibility.")) .toBe("inference");
        expect(classifyObservationEntry("This suggests the group is united.")) .toBe("inference");
    });

    it("recognizes conclusions", () => {
        expect(classifyObservationEntry("Therefore Christians should not think too highly of themselves.")) .toBe("interpretation");
        expect(classifyObservationEntry("This means each believer must serve.")) .toBe("interpretation");
    });

    it("recognizes empty input", () => {
        expect(classifyObservationEntry("   ")).toBe("empty");
    });
});
