import { Interpretation } from "../../domain/entities/Interpretation.js";

import {
    InterpretationId,
    InterpretationStatement,
    ObservationId,
    StudyId,
} from "../../domain/value-objects/index.js";

import {
    StudyRepository,
} from "../../domain/repositories/StudyRepository.js";

export class CreateInterpretation {

    public constructor(
        private readonly repository: StudyRepository,
    ) { }

    public async execute(
        studyId: StudyId,
        statement: string,
        observationIds: readonly ObservationId[] = [],
    ): Promise<Interpretation> {

        const study =
            await this.repository.find(
                studyId,
            );

        if (!study) {

            throw new Error(
                "Study not found.",
            );

        }

        if (observationIds.length === 0) {
            throw new Error(
                "Select at least one supporting observation before saving an interpretation.",
            );
        }

        const knownObservationIds = new Set(
            study.observations.map((observation) => observation.id.toString()),
        );

        for (const observationId of observationIds) {
            if (!knownObservationIds.has(observationId.toString())) {
                throw new Error(
                    `Observation ${observationId.toString()} is not part of this study.`,
                );
            }
        }

        const interpretation =
            Interpretation.create(
                InterpretationId.create(),
                InterpretationStatement.from(
                    statement,
                ),
                observationIds,
            );

        study.addInterpretation(
            interpretation,
        );

        await this.repository.save(
            study,
        );

        return interpretation;

    }

}
