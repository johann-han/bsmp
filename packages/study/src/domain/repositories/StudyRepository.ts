import { StudySession } from "../aggregates/StudySession.js";
import { StudyId } from "../value-objects/index.js";

export interface StudyRepository {

    find(
        id: StudyId,
    ): Promise<StudySession | undefined>;

    save(
        study: StudySession,
    ): Promise<void>;

}