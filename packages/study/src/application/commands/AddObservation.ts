import { VerseReference } from "@bsmp/bible";

import { Observation } from "../../domain/entities/Observation.js";
import { StudyRepository } from "../../domain/repositories/StudyRepository.js";

import {
    ObservationId,
    ObservationStatement,
    ObservationTarget,
    ObservationVerseReference,
    ObservationWordTargetInput,
    StudyId,
} from "../../domain/value-objects/index.js";

export class AddObservation {
    public constructor(
        private readonly repository: StudyRepository,
    ) { }

    public async execute(
        studyId: StudyId,
        verseReference: VerseReference,
        statement: string,
        wordTarget?: ObservationWordTargetInput,
    ): Promise<Observation> {
        const study = await this.repository.find(studyId);

        if (!study) {
            throw new Error(`Study not found: ${studyId.toString()}`);
        }

        const target = wordTarget
            ? ObservationTarget.word(verseReference, wordTarget)
            : ObservationTarget.verse(verseReference);
        const normalizedStatement = statement.trim();

        const duplicate = study.observations.find((existing) =>
            existing.statement.value === normalizedStatement &&
            this.sameTarget(existing.target, target),
        );

        if (duplicate) {
            throw new Error("An identical observation already exists for this study target.");
        }

        const observation = Observation.create(
            ObservationId.create(),
            ObservationStatement.from(normalizedStatement),
            ObservationVerseReference.from(verseReference),
            target,
        );

        study.addObservation(observation);
        await this.repository.save(study);
        return observation;
    }

    private sameTarget(left: ObservationTarget, right: ObservationTarget): boolean {
        return left.verseReference.toString() === right.verseReference.toString()
            && left.translation === right.translation
            && left.wordIndex === right.wordIndex
            && left.wordText === right.wordText
            && left.markupSymbol === right.markupSymbol;
    }
}

export class UpdateObservation {
    public constructor(
        private readonly repository: StudyRepository,
    ) { }

    public async execute(
        studyId: StudyId,
        observationId: string,
        verseReference: VerseReference,
        statement: string,
        wordTarget?: ObservationWordTargetInput,
    ): Promise<Observation> {
        const study = await this.repository.find(studyId);
        if (!study) throw new Error(`Study not found: ${studyId.toString()}`);

        const id = ObservationId.from(observationId);
        const observation = study.observations.find((item) => item.id.value === id.value);
        if (!observation) throw new Error(`Observation not found: ${observationId}`);

        const target = wordTarget
            ? ObservationTarget.word(verseReference, wordTarget)
            : ObservationTarget.verse(verseReference);
        const normalizedStatement = statement.trim();

        const duplicate = study.observations.find((existing) =>
            existing.id.value !== id.value &&
            existing.statement.value === normalizedStatement &&
            this.sameTarget(existing.target, target),
        );
        if (duplicate) throw new Error("An identical observation already exists for this study target.");

        observation.edit(ObservationStatement.from(normalizedStatement), target);
        await this.repository.save(study);
        return observation;
    }

    private sameTarget(left: ObservationTarget, right: ObservationTarget): boolean {
        return left.verseReference.toString() === right.verseReference.toString()
            && left.translation === right.translation
            && left.wordIndex === right.wordIndex
            && left.wordText === right.wordText
            && left.markupSymbol === right.markupSymbol;
    }
}
