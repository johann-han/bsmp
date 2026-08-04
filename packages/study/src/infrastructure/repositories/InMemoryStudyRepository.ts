import { StudyRepository } from "../../domain/repositories/StudyRepository.js";

import { StudySession } from "../../domain/aggregates/StudySession.js";
import { StudyId } from "../../domain/value-objects/index.js";

export class InMemoryStudyRepository
    implements StudyRepository {

    private readonly studies =
        new Map<string, StudySession>();

    public constructor(
        initialStudies: readonly StudySession[] = [],
    ) {

        for (const study of initialStudies) {

            this.studies.set(
                study.id.value,
                study,
            );

        }

    }

    public async find(
        id: StudyId,
    ): Promise<StudySession | undefined> {

        return this.studies.get(
            id.value,
        );

    }

    public async save(
        study: StudySession,
    ): Promise<void> {

        this.studies.set(
            study.id.value,
            study,
        );

    }

    public async findAll():
        Promise<readonly StudySession[]> {

        return [
            ...this.studies.values(),
        ];

    }

       

    public async delete(
        id: StudyId,
    ): Promise<void> {

        this.studies.delete(id.value);

    }

}