import { describe, expect, it } from "vitest";

import { BookCode, ChapterNumber, VerseNumber, VerseReference } from "@bsmp/bible";

import { Observation } from "./Observation.js";
import { Evidence } from "./Evidence.js";

import {
    EvidenceDescription,
    EvidenceId,
    EvidenceType,
    ObservationId,
    ObservationStatement,
    ObservationVerseReference,
} from "../value-objects/index.js";

describe("Observation", () => {

    const verseReference = ObservationVerseReference.from(
        VerseReference.create(
            BookCode.from("JHN"),
            ChapterNumber.of(15),
            VerseNumber.from(1),
        ),
    );

    it("creates an observation anchored to a verse", () => {

        const observation = Observation.create(
            ObservationId.create(),
            ObservationStatement.from(
                "Jesus describes Himself as the true vine.",
            ),
            verseReference,
        );

        expect(
            observation.statement.value,
        ).toBe(
            "Jesus describes Himself as the true vine.",
        );

        expect(
            observation.verseReference.toString(),
        ).toBe(
            "JHN 15:1",
        );

    });

    it("adds evidence", () => {

        const observation = Observation.create(
            ObservationId.create(),
            ObservationStatement.from(
                "Jesus describes Himself as the true vine.",
            ),
            verseReference,
        );

        const evidence = Evidence.create(
            EvidenceId.create(),
            EvidenceType.scripture(),
            EvidenceDescription.from(
                "John 15:1",
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
