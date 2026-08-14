import { StudyId } from "@bsmp/study";
import { createStudyPassage } from "@bsmp/study";
import { createObservationWorkspace } from "@bsmp/study";

import { SupabaseStudyRepository } from "./SupabaseStudyRepository";

export async function createSupabaseObservationWorkspace(
    studyId?: string,
) {
    const repository = new SupabaseStudyRepository();

    const study = studyId
        ? await repository.find(StudyId.from(studyId))
        : (await repository.findAll())[0];

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
