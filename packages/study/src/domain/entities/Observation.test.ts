import { describe, expect, it } from "vitest";

import { Observation } from "./Observation.js";

import {
    ObservationId,
    ObservationStatement,
} from "../value-objects/index.js";

describe("Observation", () => {

    it("creates an observation", () => {

        const observation = Observation.create(
            ObservationId.create(),
            ObservationStatement.from(
                "Jesus asks three questions.",
            ),
        );

        expect(
            observation.statement.value,
        ).toBe(
            "Jesus asks three questions.",
        );

    });

    it("stores the creation date", () => {

        const observation = Observation.create(
            ObservationId.create(),
            ObservationStatement.from(
                "Repeated word: abide",
            ),
        );

        expect(
            observation.createdAt,
        ).toBeInstanceOf(Date);

    });

});