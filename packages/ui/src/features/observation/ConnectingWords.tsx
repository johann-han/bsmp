import type { ConnectingWordViewModel } from "@bsmp/study";

export interface ConnectingWordsProps {
    connectingWords: readonly ConnectingWordViewModel[];
}

export function ConnectingWords({
    connectingWords,
}: ConnectingWordsProps) {
    return (
        <section>
            <h2>Connecting Words</h2>

            <ul>
                {connectingWords.map((word) => (
                    <li key={word.id}>
                        <strong>
                            {word.text}
                        </strong>

                        {" — "}

                        <span>
                            {word.category}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}