import {
    BookCode,
    ChapterNumber,
    VerseNumber,
    VerseReference,
} from "@bsmp/bible";

import { Observation } from "../domain/entities/Observation.js";

import {
    ObservationId,
    ObservationStatement,
    ObservationVerseReference,
} from "../domain/value-objects/index.js";

export function createObservation(
    statement = "Test Observation",
): Observation {

    const verseReference =
        VerseReference.create(
            BookCode.from("JHN"),
            ChapterNumber.of(15),
            VerseNumber.from(1),
        );

    return Observation.create(
        ObservationId.create(),
        ObservationStatement.from(
            statement,
        ),
        ObservationVerseReference.from(
            verseReference,
        ),
    );

}