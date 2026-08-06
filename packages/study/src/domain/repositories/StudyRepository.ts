import { StudySession } from "../aggregates/StudySession.js";
import { StudyId } from "../value-objects/index.js";

export interface StudyRepository {

    find(
        id: StudyId,
    ): Promise<StudySession | undefined>;

    findAll(): Promise<readonly StudySession[]>;

    save(
        study: StudySession,
    ): Promise<void>;

    delete(
        id: StudyId,
    ): Promise<void>;

}