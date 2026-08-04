import { describe, expect, it } from "vitest";

import { StudySession } from "./StudySession.js";
import {
    ObservationId,
    ObservationStatement,
    StudyId,
    StudyTitle,
} from "../value-objects/index.js";
import { Observation } from "../../index.js";

describe("StudySession", () => {

    it("creates a study session", () => {

        const study = StudySession.create(
            StudyId.create(),
            StudyTitle.from("Romans 8 Study"),
        );

        expect(study).toBeDefined();

        expect(study.title.value)
            .toBe("Romans 8 Study");

        expect(study.status.value)
            .toBe("Draft");

        expect(study.createdAt)
            .toBeInstanceOf(Date);

    });

    it("adds an observation", () => {

        const study = StudySession.create(
            StudyId.create(),
            StudyTitle.from("Romans"),
        );

        const observation = Observation.create(
            ObservationId.create(),
            ObservationStatement.from(
                "Paul introduces himself.",
            ),
        );

        study.addObservation(
            observation,
        );

        expect(
            study.observations,
        ).toHaveLength(1);

    });

});