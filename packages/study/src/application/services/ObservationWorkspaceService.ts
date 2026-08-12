import {
    ConnectingWord,
    ListConnectingWords,
    ListObservationQuestions,
    ObservationQuestion,
} from "@bsmp/inductive";
import type { VerseReference } from "@bsmp/bible";

import { AddObservation } from "../commands/AddObservation.js";
import { CreateInterpretation } from "../commands/CreateInterpretation.js";
import type {
    ConnectingWordViewModel,
    InterpretationViewModel,
    ObservationQuestionViewModel,
    ObservationViewModel,
} from "../view-models/index.js";
import type { Interpretation } from "../../domain/entities/Interpretation.js";
import type { Observation } from "../../domain/entities/Observation.js";
import type { StudyRepository } from "../../domain/repositories/StudyRepository.js";
import type { ObservationId } from "../../domain/value-objects/ObservationId.js";
import type { StudyId } from "../../domain/value-objects/StudyId.js";

export interface ObservationWorkspaceData {
    observationQuestions: readonly ObservationQuestionViewModel[];
    connectingWords: readonly ConnectingWordViewModel[];
    observations: readonly ObservationViewModel[];
    interpretations: readonly InterpretationViewModel[];
}

export class ObservationWorkspaceService {

    public constructor(
        private readonly listObservationQuestions:
            ListObservationQuestions,

        private readonly listConnectingWords:
            ListConnectingWords,

        private readonly addObservationCommand?: AddObservation,

        private readonly studyId?: StudyId,

        private readonly studyRepository?: StudyRepository,

        private readonly createInterpretationCommand?: CreateInterpretation,
    ) { }

    public async load(): Promise<ObservationWorkspaceData> {
        const [
            observationQuestions,
            connectingWords,
        ] = await Promise.all([
            this.listObservationQuestions.execute(),
            this.listConnectingWords.execute(),
        ]);

        const study =
            this.studyId && this.studyRepository
                ? await this.studyRepository.find(this.studyId)
                : undefined;

        return {
            observationQuestions:
                observationQuestions.map(
                    (question) =>
                        this.toObservationQuestionViewModel(question),
                ),

            connectingWords:
                connectingWords.map(
                    (word) =>
                        this.toConnectingWordViewModel(word),
                ),

            observations: (study?.observations ?? [])
                .map((observation) =>
                    this.toObservationViewModel(observation),
                ),

            interpretations: (study?.interpretations ?? [])
                .map((interpretation) =>
                    this.toInterpretationViewModel(interpretation),
                ),
        };
    }

    public async addObservation(
        verseReference: VerseReference,
        statement: string,
    ): Promise<Observation> {

        if (!this.addObservationCommand || !this.studyId) {
            throw new Error(
                "Observation persistence is not configured for this workspace.",
            );
        }

        return this.addObservationCommand.execute(
            this.studyId,
            verseReference,
            statement,
        );
    }

    public async addInterpretation(
        statement: string,
        observationIds: readonly string[] = [],
    ): Promise<Interpretation> {

        if (!this.createInterpretationCommand || !this.studyId) {
            throw new Error(
                "Interpretation persistence is not configured for this workspace.",
            );
        }

        return this.createInterpretationCommand.execute(
            this.studyId,
            statement,
            observationIds.map((id) => ({ toString: () => id } as ObservationId)),
        );
    }

    private toObservationQuestionViewModel(
        question: ObservationQuestion,
    ): ObservationQuestionViewModel {
        return {
            id: question.id.toString(),
            question: question.question.toString(),
            purpose: question.purpose.toString(),
        };
    }

    private toConnectingWordViewModel(
        word: ConnectingWord,
    ): ConnectingWordViewModel {
        return {
            id: word.id.toString(),
            text: word.text.toString(),
            category: word.category,
            meaning: word.meaning.toString(),
        };
    }

    private toObservationViewModel(
        observation: Observation,
    ): ObservationViewModel {
        return {
            id: observation.id.toString(),
            verseReference: observation.verseReference.toString(),
            statement: observation.statement.value,
            createdAt: observation.createdAt.toISOString(),
        };
    }

    private toInterpretationViewModel(
        interpretation: Interpretation,
    ): InterpretationViewModel {
        return {
            id: interpretation.id.toString(),
            statement: interpretation.statement.value,
            observationIds: interpretation.observationIds.map((id) => id.toString()),
            createdAt: interpretation.createdAt.toISOString(),
        };
    }
}
