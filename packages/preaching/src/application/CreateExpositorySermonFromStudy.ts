import type { StudyRepository, StudyId } from "@bsmp/study";

import {
    ExpositorySermon,
    ExpositorySermonId,
    SermonTitle,
} from "../domain/ExpositorySermon.js";

export class CreateExpositorySermonFromStudy {
    public constructor(private readonly repository: StudyRepository) {}

    public async execute(
        studyId: StudyId,
        title: string,
    ): Promise<ExpositorySermon> {
        const study = await this.repository.find(studyId);
        if (!study) {
            throw new Error(`Study ${studyId.toString()} was not found.`);
        }

        return ExpositorySermon.create(
            ExpositorySermonId.create(),
            study.id,
            SermonTitle.from(title),
            study.passage,
        );
    }
}
