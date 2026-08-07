import { ObservationQuestion } from "../../domain/observation/entities/ObservationQuestion.js";
import { ObservationQuestionRepository } from "../../domain/observation/repositories/ObservationQuestionRepository.js";

export class ListObservationQuestions {

    public constructor(
        private readonly repository: ObservationQuestionRepository,
    ) { }

    public async execute(): Promise<readonly ObservationQuestion[]> {
        return this.repository.findAll();
    }

}