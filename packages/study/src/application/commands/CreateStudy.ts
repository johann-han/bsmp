import { Passage } from "@bsmp/bible";

import { StudySession } from "../../domain/aggregates/StudySession.js";
import { StudyRepository } from "../../domain/repositories/StudyRepository.js";

import {
    StudyId,
    StudyTitle,
} from "../../domain/value-objects/index.js";

export class CreateStudy {

    public constructor(
        private readonly repository: StudyRepository,
    ) { }

    public async execute(
        title: string,
        passage: Passage,
    ): Promise<StudySession> {

        const study =
            StudySession.create(
                StudyId.create(),
                StudyTitle.from(title),
                passage,
            );

        await this.repository.save(
            study,
        );

        return study;

    }

}