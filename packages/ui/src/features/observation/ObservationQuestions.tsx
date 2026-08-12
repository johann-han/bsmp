import type { ObservationQuestionViewModel } from "@bsmp/study";

export interface ObservationQuestionsProps {
    questions: readonly ObservationQuestionViewModel[];
}

export function ObservationQuestions({
    questions,
}: ObservationQuestionsProps) {
    return (
        <section>
            <h2>Observation Questions</h2>

            <ul>
                {questions.map((question) => (
                    <li key={question.id}>
                        {question.question}
                    </li>
                ))}
            </ul>
        </section>
    );
}