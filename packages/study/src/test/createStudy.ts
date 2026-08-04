import { StudySession } from "../domain/aggregates/StudySession.js";

import {
    StudyId,
    StudyTitle,
} from "../domain/value-objects/index.js";

export function createStudy(
    title = "Test Study",
): StudySession {

    return StudySession.create(
        StudyId.create(),
        StudyTitle.from(title),
    );

}