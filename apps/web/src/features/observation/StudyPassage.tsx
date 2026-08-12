"use client";

import { useState } from "react";

export interface StudyVerse {
    readonly number: number;
    readonly text: string;
}

export interface StudyPassageProps {
    readonly reference: string;
    readonly translation: string;
    readonly verses: readonly StudyVerse[];
    readonly selectedVerse?: number | null;
    readonly onSelectVerse?: (verse: StudyVerse) => void;
}

export function StudyPassage({
    reference,
    translation,
    verses,
    selectedVerse = null,
    onSelectVerse,
}: StudyPassageProps) {
    const [internalSelectedVerse, setInternalSelectedVerse] =
        useState<number | null>(selectedVerse);

    const activeVerse = selectedVerse ?? internalSelectedVerse;

    function selectVerse(verse: StudyVerse) {
        setInternalSelectedVerse(verse.number);
        onSelectVerse?.(verse);
    }

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
                {verses.map((verse) => {
                    const isSelected = activeVerse === verse.number;

                    return (
                        <button
                            key={verse.number}
                            type="button"
                            onClick={() => selectVerse(verse)}
                            style={{
                                width: "100%",
                                border: isSelected
                                    ? "2px solid #111827"
                                    : "1px solid transparent",
                                borderRadius: 8,
                                background: isSelected
                                    ? "#f3f4f6"
                                    : "#f9fafb",
                                padding: "10px 12px",
                                textAlign: "left",
                                font: "inherit",
                                lineHeight: "inherit",
                                cursor: "pointer",
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
                        </button>
                    );
                })}
            </div>

            <p
                style={{
                    margin: "16px 0 0",
                    fontSize: 13,
                    color: "#6b7280",
                }}
            >
                {activeVerse === null
                    ? "Select a verse to focus your study."
                    : `Focused verse: ${reference.split(":")[0]}:${activeVerse}`}
            </p>
        </section>
    );
}
