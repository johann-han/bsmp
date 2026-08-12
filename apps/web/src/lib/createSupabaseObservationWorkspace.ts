import {
    createObservationWorkspace,
    createStudyPassage,
    StudyId,
    StudySession,
    StudyTitle,
} from "@bsmp/study";

import { SupabaseStudyRepository } from "./SupabaseStudyRepository";

export async function createSupabaseObservationWorkspace() {
    const repository = new SupabaseStudyRepository();
    const passageService = createStudyPassage();
    const studies = await repository.findAll();

    let study = studies[0];

    if (!study) {
        study = StudySession.create(
            StudyId.create(),
            StudyTitle.from("John 15 Observation Study"),
            passageService.passageReference,
        );

        await repository.save(study);
    }

    return {
        workspace: createObservationWorkspace(repository, study),
        passageService,
    };
}
