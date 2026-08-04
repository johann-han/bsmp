import { describe, expect, it } from "vitest";

import { Observation } from "./Observation.js";
import { Evidence } from "./Evidence.js";

import {
    EvidenceDescription,
    EvidenceId,
    EvidenceType,
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

    it("adds evidence", () => {

        const observation = Observation.create(
            ObservationId.create(),
            ObservationStatement.from(
                "Jesus asks three questions.",
            ),
        );

        const evidence = Evidence.create(
            EvidenceId.create(),
            EvidenceType.scripture(),
            EvidenceDescription.from(
                "Matthew 16:13",
            ),
        );

        observation.addEvidence(
            evidence,
        );

        expect(
            observation.evidence,
        ).toHaveLength(1);

    });

});