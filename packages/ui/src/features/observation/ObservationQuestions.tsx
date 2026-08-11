import type { ObservationQuestion } from "@bsmp/inductive";

interface ObservationQuestionsProps {
    questions: readonly ObservationQuestion[];
}

export function ObservationQuestions({
    questions,
}: ObservationQuestionsProps) {
    return (
        <section>
            <h2>Observation Questions</h2>

            <ul>
                {questions.map((question) => (
                    <li key={question.id.toString()}>
                        {question.question.toString()}
                    </li>
                ))}
            </ul>
        </section>
    );
}