import {
    Observation,
} from "../../domain/entities/Observation.js";

import {
    ObservationId,
    ObservationStatement,
    StudyId,
} from "../../domain/value-objects/index.js";

import {
    StudyRepository,
} from "../../domain/repositories/StudyRepository.js";

export class CreateObservation {

    public constructor(
        private readonly repository: StudyRepository,
    ) { }

    public async execute(
        studyId: StudyId,
        statement: string,
    ): Promise<Observation> {

        const study =
            await this.repository.find(
                studyId,
            );

        if (!study) {

            throw new Error(
                "Study not found.",
            );

        }

        const observation =
            Observation.create(
                ObservationId.create(),
                ObservationStatement.from(
                    statement,
                ),
            );

        study.addObservation(
            observation,
        );

        await this.repository.save(
            study,
        );

        return observation;

    }

}