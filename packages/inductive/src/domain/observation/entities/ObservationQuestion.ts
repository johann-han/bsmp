import { Entity } from "@bsmp/shared";

import { ObservationQuestionId } from "../value-objects/ObservationQuestionId.js";
import { Purpose } from "../value-objects/Purpose.js";
import { QuestionText } from "../value-objects/QuestionText.js";

export class ObservationQuestion extends Entity<ObservationQuestionId> {

    private constructor(
        id: ObservationQuestionId,
        public readonly question: QuestionText,
        public readonly purpose: Purpose,
    ) {
        super(id);
    }

    public static create(
        id: ObservationQuestionId,
        question: QuestionText,
        purpose: Purpose,
    ): ObservationQuestion {

        return new ObservationQuestion(
            id,
            question,
            purpose,
        );

    }

}