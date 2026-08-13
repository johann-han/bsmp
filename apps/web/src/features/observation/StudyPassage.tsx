"use client";

import { useEffect, useState } from "react";

export interface StudyVerse {
    readonly number: number;
    readonly reference: string;
    readonly text: string;
}

export interface StudyWordMarkup {
    readonly verseNumber: number;
    readonly wordIndex: number;
    readonly symbol: string;
}

export interface StudyPassageProps {
    readonly reference: string;
    readonly translation: string;
    readonly verses: readonly StudyVerse[];
    readonly selectedVerses?: readonly number[];
    readonly onSelectVerseRange?: (verses: readonly StudyVerse[]) => void;
    readonly onSelectVerse?: (verse: StudyVerse) => void;
}

const MARKUP_SYMBOLS = [
    { symbol: "N", label: "Note" },
    { symbol: "?", label: "Question" },
    { symbol: "!", label: "Important" },
    { symbol: "→", label: "Action / Result" },
] as const;

function storageKey(reference: string, translation: string): string {
    return `bsmp:word-markup:${translation}:${reference.trim().toLowerCase()}`;
}

function tokenize(text: string): string[] {
    return text.match(/\S+/g) ?? [];
}

function markupLabel(symbol: string): string {
    return MARKUP_SYMBOLS.find((item) => item.symbol === symbol)?.label ?? symbol;
}

export function StudyPassage({
    reference,
    translation,
    verses,
    selectedVerses = [],
    onSelectVerseRange,
    onSelectVerse,
}: StudyPassageProps) {
    const [rangeStart, setRangeStart] = useState<number | null>(selectedVerses[0] ?? null);
    const [wordMarkups, setWordMarkups] = useState<readonly StudyWordMarkup[]>([]);
    const [markupSymbol, setMarkupSymbol] = useState("N");
    const [markupMode, setMarkupMode] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const raw = window.localStorage.getItem(storageKey(reference, translation));
        if (!raw) {
            setWordMarkups([]);
            return;
        }

        try {
            const parsed = JSON.parse(raw) as StudyWordMarkup[];
            setWordMarkups(Array.isArray(parsed) ? parsed : []);
        } catch {
            window.localStorage.removeItem(storageKey(reference, translation));
            setWordMarkups([]);
        }
    }, [reference, translation]);

    useEffect(() => {
        setRangeStart(selectedVerses.length === 1 ? selectedVerses[0] ?? null : null);
    }, [selectedVerses]);

    function saveWordMarkups(next: readonly StudyWordMarkup[]) {
        setWordMarkups(next);
        window.localStorage.setItem(storageKey(reference, translation), JSON.stringify(next));
    }

    function selectVerse(verse: StudyVerse) {
        onSelectVerse?.(verse);

        if (!onSelectVerseRange) return;

        if (rangeStart === null) {
            setRangeStart(verse.number);
            onSelectVerseRange([verse]);
            return;
        }

        if (verse.number === rangeStart) {
            setRangeStart(null);
            onSelectVerseRange([verse]);
            return;
        }

        const lower = Math.min(rangeStart, verse.number);
        const upper = Math.max(rangeStart, verse.number);
        const range = verses.filter((item) => item.number >= lower && item.number <= upper);
        setRangeStart(null);
        onSelectVerseRange(range);
    }

    function toggleWordMarkup(verseNumber: number, wordIndex: number) {
        const existing = wordMarkups.find(
            (item) => item.verseNumber === verseNumber && item.wordIndex === wordIndex,
        );

        if (existing?.symbol === markupSymbol) {
            saveWordMarkups(
                wordMarkups.filter(
                    (item) => !(item.verseNumber === verseNumber && item.wordIndex === wordIndex),
                ),
            );
            return;
        }

        saveWordMarkups([
            ...wordMarkups.filter(
                (item) => !(item.verseNumber === verseNumber && item.wordIndex === wordIndex),
            ),
            { verseNumber, wordIndex, symbol: markupSymbol },
        ]);
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
                    marginBottom: 12,
                }}
            >
                <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280" }}>
                        Current Passage
                    </p>
                    <h2 style={{ margin: "4px 0 0", fontSize: 24 }}>{reference}</h2>
                </div>

                <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>{translation}</span>
            </header>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12, alignItems: "center" }}>
                <button
                    type="button"
                    onClick={() => setMarkupMode((current) => !current)}
                    style={{
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        background: markupMode ? "#f3f4f6" : "#fff",
                        padding: "7px 10px",
                        fontWeight: 600,
                    }}
                >
                    {markupMode ? "Close Markup" : "Word Markup"}
                </button>

                {markupMode && MARKUP_SYMBOLS.map((item) => (
                    <button
                        key={item.symbol}
                        type="button"
                        onClick={() => setMarkupSymbol(item.symbol)}
                        title={`${item.symbol} — ${item.label}`}
                        aria-label={`${item.symbol} — ${item.label}`}
                        aria-pressed={markupSymbol === item.symbol}
                        style={{
                            width: 36,
                            height: 36,
                            border: markupSymbol === item.symbol ? "2px solid #111827" : "1px solid #d1d5db",
                            borderRadius: 8,
                            background: markupSymbol === item.symbol ? "#f3f4f6" : "#fff",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            cursor: "pointer",
                        }}
                    >
                        {item.symbol}
                    </button>
                ))}
            </div>

            <div style={{ display: "grid", gap: 10, lineHeight: 1.7 }}>
                {verses.map((verse) => {
                    const isSelected = selectedVerses.includes(verse.number);
                    const words = tokenize(verse.text);

                    return (
                        <div
                            key={verse.reference}
                            style={{
                                border: isSelected ? "2px solid #111827" : "1px solid transparent",
                                borderRadius: 8,
                                background: isSelected ? "#f3f4f6" : "#f9fafb",
                                padding: "10px 12px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => selectVerse(verse)}
                                style={{ border: 0, background: "transparent", padding: 0, font: "inherit", cursor: "pointer" }}
                            >
                                <sup style={{ marginRight: 8, fontWeight: 700, color: "#6b7280" }}>{verse.number}</sup>
                            </button>

                            {markupMode ? (
                                <span>
                                    {words.map((word, index) => {
                                        const markup = wordMarkups.find(
                                            (item) => item.verseNumber === verse.number && item.wordIndex === index,
                                        );
                                        const label = markup ? markupLabel(markup.symbol) : null;
                                        return (
                                            <button
                                                key={`${verse.number}-${index}`}
                                                type="button"
                                                onClick={() => toggleWordMarkup(verse.number, index)}
                                                aria-label={markup ? `${word}: ${markup.symbol} — ${label}` : `Mark ${word}`}
                                                title={markup ? `${markup.symbol} — ${label}` : "Mark this word"}
                                                style={{
                                                    border: 0,
                                                    background: markup ? "#f3f4f6" : "transparent",
                                                    padding: "1px 2px",
                                                    margin: "0 1px",
                                                    borderRadius: 4,
                                                    font: "inherit",
                                                    cursor: "pointer",
                                                    textDecoration: markup ? "underline" : "none",
                                                    textDecorationThickness: markup ? 2 : undefined,
                                                }}
                                            >
                                                {word}{markup ? <sup style={{ marginLeft: 2, fontWeight: 800 }}>{markup.symbol}</sup> : ""}
                                            </button>
                                        );
                                    })}
                                </span>
                            ) : (
                                <span>{verse.text}</span>
                            )}
                        </div>
                    );
                })}
            </div>

            <p style={{ margin: "16px 0 0", fontSize: 13, color: "#6b7280" }}>
                {selectedVerses.length === 0
                    ? "Click a verse to focus it. Click another verse to select a range."
                    : selectedVerses.length === 1
                        ? `Focused verse: ${verses.find((verse) => verse.number === selectedVerses[0])?.reference ?? selectedVerses[0]}`
                        : `Focused range: ${verses.find((verse) => verse.number === selectedVerses[0])?.reference ?? selectedVerses[0]}–${selectedVerses[selectedVerses.length - 1]}`}
            </p>
        </section>
    );
}
