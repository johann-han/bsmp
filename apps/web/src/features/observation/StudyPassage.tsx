export interface StudyVerse {
    readonly number: number;
    readonly text: string;
}

export interface StudyPassageProps {
    readonly reference: string;
    readonly translation: string;
    readonly verses: readonly StudyVerse[];
}

export function StudyPassage({
    reference,
    translation,
    verses,
}: StudyPassageProps) {
    return (
        <section
            style={{
                minWidth: 0,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                background: "#ffffff",
                padding: 20,
            }}
        >
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    alignItems: "baseline",
                    marginBottom: 16,
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "#6b7280",
                        }}
                    >
                        Current Passage
                    </p>
                    <h2 style={{ margin: "4px 0 0", fontSize: 24 }}>
                        {reference}
                    </h2>
                </div>

                <span
                    style={{
                        fontSize: 13,
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                    }}
                >
                    {translation}
                </span>
            </header>

            <div
                style={{
                    display: "grid",
                    gap: 10,
                    lineHeight: 1.7,
                }}
            >
                {verses.map((verse) => (
                    <p
                        key={verse.number}
                        style={{
                            margin: 0,
                            padding: "10px 12px",
                            borderRadius: 8,
                            background: "#f9fafb",
                        }}
                    >
                        <sup
                            style={{
                                marginRight: 8,
                                fontWeight: 700,
                                color: "#6b7280",
                            }}
                        >
                            {verse.number}
                        </sup>
                        {verse.text}
                    </p>
                ))}
            </div>
        </section>
    );
}
