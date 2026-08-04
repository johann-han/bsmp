import { Evidence } from "../domain/entities/Evidence.js";

import {
    EvidenceDescription,
    EvidenceId,
    EvidenceType,
} from "../domain/value-objects/index.js";

export function createEvidence(
    description = "Test Evidence",
): Evidence {

    return Evidence.create(
        EvidenceId.create(),
        EvidenceType.scripture(),
        EvidenceDescription.from(
            description,
        ),
    );

}