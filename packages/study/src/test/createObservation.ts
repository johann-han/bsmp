import { Observation } from "../domain/entities/Observation.js";

import {
    ObservationId,
    ObservationStatement,
} from "../domain/value-objects/index.js";

export function createObservation(
    statement = "Test Observation",
): Observation {

    return Observation.create(
        ObservationId.create(),
        ObservationStatement.from(
            statement,
        ),
    );

}