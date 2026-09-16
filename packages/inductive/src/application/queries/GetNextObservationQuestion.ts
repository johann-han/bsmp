import { ObservationQuestion } from "../../domain/observation/entities/ObservationQuestion.js";
import { ObservationQuestionRepository } from "../../domain/observation/repositories/ObservationQuestionRepository.js";

export class GetNextObservationQuestion {
    public constructor(
        private readonly repository: ObservationQuestionRepository,
    ) { }

    public async execute(
        completedQuestionIds: readonly string[],
    ): Promise<ObservationQuestion | null> {
        const completed = new Set(completedQuestionIds);
        const questions = await this.repository.findAll();

        return questions.find((question) => !completed.has(question.id.toString())) ?? null;
    }
}
