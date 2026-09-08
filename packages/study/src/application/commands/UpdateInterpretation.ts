import { InterpretationStatement } from "../../domain/value-objects/InterpretationStatement.js";
import { ObservationId, StudyId } from "../../domain/value-objects/index.js";
import type { Interpretation } from "../../domain/entities/Interpretation.js";
import { StudyRepository } from "../../domain/repositories/StudyRepository.js";

export class UpdateInterpretation {
    public constructor(
        private readonly repository: StudyRepository,
    ) { }

    public async execute(
        studyId: StudyId,
        interpretationId: string,
        statement: string,
        observationIds: readonly ObservationId[] = [],
    ): Promise<Interpretation> {
        const study = await this.repository.find(studyId);
        if (!study) {
            throw new Error("Study not found.");
        }

        const interpretation = study.interpretations.find(
            (item) => item.id.toString() === interpretationId,
        );

        if (!interpretation) {
            throw new Error("Interpretation not found.");
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

        interpretation.revise(
            InterpretationStatement.from(statement),
            observationIds,
        );

        await this.repository.save(study);
        return interpretation;
    }
}
