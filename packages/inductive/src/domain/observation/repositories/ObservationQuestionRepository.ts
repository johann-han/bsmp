import { ObservationQuestion } from "../entities/ObservationQuestion.js";
import { ObservationQuestionId } from "../value-objects/ObservationQuestionId.js";

export interface ObservationQuestionRepository {

    findById(
        id: ObservationQuestionId,
    ): Promise<ObservationQuestion | null>;

    findAll(): Promise<readonly ObservationQuestion[]>;

}