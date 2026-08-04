import { Interpretation } from "../../domain/entities/Interpretation.js";

import {
    InterpretationId,
    InterpretationStatement,
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

        const interpretation =
            Interpretation.create(
                InterpretationId.create(),
                InterpretationStatement.from(
                    statement,
                ),
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