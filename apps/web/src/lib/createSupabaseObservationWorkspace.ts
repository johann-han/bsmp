import { StudyId } from "@bsmp/study";

import { SupabaseStudyRepository } from "./SupabaseStudyRepository";
import { createStudyPassage } from "@bsmp/study";
import { createObservationWorkspace } from "@bsmp/study";

export async function createSupabaseObservationWorkspace(
    studyId?: string,
) {
    const repository = new SupabaseStudyRepository();
    const studies = await repository.findAll();

    const study = studyId
        ? await repository.find(StudyId.from(studyId))
        : studies[0];

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
