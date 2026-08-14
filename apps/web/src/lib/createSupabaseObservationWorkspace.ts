import { StudyId, createStudyPassage, createObservationWorkspace } from "@bsmp/study";

import { SupabaseStudyRepository } from "./SupabaseStudyRepository";
import { takeCachedStudyForWorkspace } from "./studyWorkspaceNavigationCache";

export async function createSupabaseObservationWorkspace(
    studyId?: string,
) {
    const repository = new SupabaseStudyRepository();
    const cachedStudy = studyId ? takeCachedStudyForWorkspace(studyId) : undefined;

    const study = cachedStudy
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
