import { ObservationQuestionRepository } from "../../domain/observation/repositories/ObservationQuestionRepository.js";
import { ObservationQuestion } from "../../domain/observation/entities/ObservationQuestion.js";
import { ObservationQuestionId } from "../../domain/observation/value-objects/ObservationQuestionId.js";
import { QuestionText } from "../../domain/observation/value-objects/QuestionText.js";
import { Purpose } from "../../domain/observation/value-objects/Purpose.js";

import { observationQuestions } from "../../data/observation/observationQuestions.js";

export class InMemoryObservationQuestionRepository
    implements ObservationQuestionRepository {

    private readonly questions = new Map<string, ObservationQuestion>();

    public constructor() {
        this.seed();
    }

    private seed(): void {

        for (const record of observationQuestions) {

            const question = ObservationQuestion.create(
                ObservationQuestionId.from(record.id),
                QuestionText.from(record.question),
                Purpose.from(record.purpose),
            );

            this.questions.set(
                question.id.toString(),
                question,
            );

        }

    }

    public async findById(
        id: ObservationQuestionId,
    ): Promise<ObservationQuestion | null> {

        return this.questions.get(id.toString()) ?? null;

    }

    public async findAll(): Promise<readonly ObservationQuestion[]> {

        return [...this.questions.values()];

    }

}