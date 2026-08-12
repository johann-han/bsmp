import type { StudyId, StudyRepository } from "@bsmp/study";

import { CreateExpositorySermonFromStudy } from "./CreateExpositorySermonFromStudy.js";
import type { ExpositorySermonRepository } from "../domain/ExpositorySermonRepository.js";
import type { ExpositorySermon } from "../domain/ExpositorySermon.js";

export class CreateAndSaveExpositorySermonFromStudy {
    private readonly creator: CreateExpositorySermonFromStudy;

    public constructor(
        studyRepository: StudyRepository,
        private readonly sermonRepository: ExpositorySermonRepository,
    ) {
        this.creator = new CreateExpositorySermonFromStudy(studyRepository);
    }

    public async execute(
        studyId: StudyId,
        title: string,
    ): Promise<ExpositorySermon> {
        const sermon = await this.creator.execute(studyId, title);
        await this.sermonRepository.save(sermon);
        return sermon;
    }
}
