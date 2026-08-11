import type { ConnectingWord } from "@bsmp/inductive";

interface ConnectingWordsProps {
    connectingWords: readonly ConnectingWord[];
}

export function ConnectingWords({
    connectingWords,
}: ConnectingWordsProps) {
    return (
        <section>
            <h2>Connecting Words</h2>

            <ul>
                {connectingWords.map((word) => (
                    <li key={word.id.toString()}>
                        <strong>
                            {word.text.toString()}
                        </strong>

                        {" "}

                        <span>
                            ({word.category})
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}