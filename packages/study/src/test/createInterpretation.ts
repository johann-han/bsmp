import { Interpretation } from "../domain/entities/Interpretation.js";

import {
    InterpretationId,
    InterpretationStatement,
} from "../domain/value-objects/index.js";

export function createInterpretation(
    statement = "Test Interpretation",
): Interpretation {

    return Interpretation.create(
        InterpretationId.create(),
        InterpretationStatement.from(
            statement,
        ),
    );

}