import { StudyId, createStudyPassage, createObservationWorkspace } from "@bsmp/study";
import type { StudySession } from "@bsmp/study";

import { SupabaseStudyRepository } from "./SupabaseStudyRepository";

export async function createSupabaseObservationWorkspace(
    studyId?: string,
    existingStudy?: StudySession,
) {
    const repository = new SupabaseStudyRepository();

    const study = existingStudy
        ?? (studyId
            ? await repository.find(StudyId.from(studyId))
            : (await repository.findAll())[0]);

    if (!study) {
        throw new Error("Select a study before opening the Study Workspace.");
    }

    const passageService = createStudyPassage(study.passage);

    return {
        workspace: createObservationWorkspace(repository, study),
        passageService,
        study,
    };
}
