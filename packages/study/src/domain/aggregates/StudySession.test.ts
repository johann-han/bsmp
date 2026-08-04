import { describe, expect, it } from "vitest";

import { StudySession } from "./StudySession.js";
import {
    StudyId,
    StudyStatus,
    StudyTitle,
} from "../value-objects/index.js";

describe("StudySession", () => {

    it("creates a new study session", () => {

        const study = StudySession.create(
            StudyId.create(),
            StudyTitle.from("Romans 8 Study"),
        );

        expect(study).toBeDefined();

        expect(study.title.value)
            .toBe("Romans 8 Study");

        expect(study.status.value)
            .toBe("Draft");

    });

});