"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

interface BibleVerse {
    readonly number: number;
    readonly reference: string;
    readonly text: string;
}

interface BibleResponse {
    readonly reference: string;
    readonly translation: string;
    readonly translationId: string;
    readonly translationNote: string;
    readonly verses: readonly BibleVerse[];
}

interface BibleErrorResponse {
    readonly error?: string;
}

const TRANSLATIONS = [
    { id: "asv", name: "American Standard Version (1901)" },
    { id: "kjv", name: "King James Version" },
    { id: "web", name: "World English Bible" },
] as const;

function isBibleResponse(payload: BibleResponse | BibleErrorResponse): payload is BibleResponse {
    return "verses" in payload && Array.isArray(payload.verses);
}

function getBibleError(payload: BibleResponse | BibleErrorResponse): string {
    return "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Unable to load passage.";
}

function focusStorageKey(reference: string, translation: string): string {
    return `bsmp:bible-focus:${translation}:${reference.trim().toLowerCase()}`;
}

interface SavedFocus {
    readonly start: number | null;
    readonly end: number | null;
}

function buildStudyPassage(result: BibleResponse, selectedRange: readonly number[]): string | null {
    if (selectedRange.length === 0) return null;

    const first = result.verses.find((verse) => verse.number === selectedRange[0]);
    const last = result.verses.find((verse) => verse.number === selectedRange[selectedRange.length - 1]);
    if (!first || !last) return null;

    const firstParts = first.reference.split(" ");
    const firstVerse = firstParts.pop();
    const firstChapter = firstParts.pop();
    const book = firstParts.join(" ");
    const lastParts = last.reference.split(" ");
    const lastVerse = lastParts.pop();
    const lastChapter = lastParts.pop();
    if (!book || !firstChapter || !firstVerse || !lastChapter || !lastVerse) return result.reference;

    return firstChapter === lastChapter
        ? `${book} ${firstChapter}:${firstVerse}-${lastVerse}`
        : `${book} ${firstChapter}:${firstVerse}-${lastChapter}:${lastVerse}`;
}

export function BibleReader() {
    const [reference, setReference] = useState("Romans 12");
    const [translation, setTranslation] = useState("asv");
    const [result, setResult] = useState<BibleResponse | null>(null);
    const [selectedStart, setSelectedStart] = useState<number | null>(null);
    const [selectedEnd, setSelectedEnd] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function fetchPassage(referenceValue: string, translationValue: string, preserveFocus = false) {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/bible/passage?reference=${encodeURIComponent(referenceValue)}&translation=${encodeURIComponent(translationValue)}`,
            );
            const payload = await response.json() as BibleResponse | BibleErrorResponse;

            if (!response.ok || !isBibleResponse(payload)) {
                throw new Error(getBibleError(payload));
            }

            setResult(payload);

            if (!preserveFocus) {
                setSelectedStart(null);
                setSelectedEnd(null);
            }
        } catch (reason: unknown) {
            setResult(null);
            setError(reason instanceof Error ? reason.message : "Unable to load passage.");
        } finally {
            setLoading(false);
        }
    }

    async function loadPassage(event?: FormEvent) {
        event?.preventDefault();
        await fetchPassage(reference, translation);
    }

    async function handleTranslationChange(nextTranslation: string) {
        setTranslation(nextTranslation);

        if (result) {
            await fetchPassage(reference, nextTranslation, true);
        }
    }

    useEffect(() => {
        if (!result) return;

        const key = focusStorageKey(result.reference, translation);
        const raw = window.localStorage.getItem(key);
        if (!raw) return;

        try {
            const saved = JSON.parse(raw) as SavedFocus;
            const validStart = typeof saved.start === "number" && result.verses.some((verse) => verse.number === saved.start);
            const validEnd = typeof saved.end === "number" && result.verses.some((verse) => verse.number === saved.end);

            if (validStart) setSelectedStart(saved.start);
            if (validEnd) setSelectedEnd(saved.end);
        } catch {
            window.localStorage.removeItem(key);
        }
    }, [result, translation]);

    useEffect(() => {
        if (!result) return;

        const key = focusStorageKey(result.reference, translation);
        window.localStorage.setItem(
            key,
            JSON.stringify({ start: selectedStart, end: selectedEnd } satisfies SavedFocus),
        );
    }, [result, translation, selectedStart, selectedEnd]);

    function selectVerse(number: number) {
        if (selectedStart === null || (selectedStart !== null && selectedEnd !== null)) {
            setSelectedStart(number);
            setSelectedEnd(null);
            return;
        }

        if (number === selectedStart) {
            setSelectedEnd(null);
            return;
        }

        setSelectedEnd(number);
    }

    const selectedRange = useMemo(() => {
        if (selectedStart === null) return [];

        const end = selectedEnd ?? selectedStart;
        const lower = Math.min(selectedStart, end);
        const upper = Math.max(selectedStart, end);

        return result?.verses
            .filter((verse) => verse.number >= lower && verse.number <= upper)
            .map((verse) => verse.number) ?? [];
    }, [result, selectedStart, selectedEnd]);

    const focusLabel = selectedRange.length === 0
        ? "Select a verse to focus your study."
        : selectedRange.length === 1
            ? `Focused verse: ${result?.verses.find((verse) => verse.number === selectedRange[0])?.reference ?? selectedRange[0]}`
            : `Focused range: ${result?.verses.find((verse) => verse.number === selectedRange[0])?.reference ?? selectedRange[0]}–${selectedRange[selectedRange.length - 1]}`;

    const studyPassage = result ? buildStudyPassage(result, selectedRange) : null;

    function studySelectedPassage() {
        if (!studyPassage) return;
        const title = encodeURIComponent(`${studyPassage} Study`);
        const passage = encodeURIComponent(studyPassage);
        window.location.assign(`/studies?newStudy=1&title=${title}&passage=${passage}`);
    }

    return (
        <div style={{ display: "grid", gap: 16, maxWidth: 900 }}>
            <form onSubmit={loadPassage} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10 }}>
                <input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="John 3:16 or Romans 12"
                    style={{ minWidth: 0, padding: 12, border: "1px solid #d1d5db", borderRadius: 8 }}
                />
                <select
                    value={translation}
                    onChange={(event) => void handleTranslationChange(event.target.value)}
                    style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }}
                    aria-label="Bible translation"
                    disabled={loading}
                >
                    {TRANSLATIONS.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
                <button type="submit" disabled={loading || !reference.trim()} style={{ padding: "10px 16px" }}>
                    {loading ? "Loading..." : "Read"}
                </button>
            </form>

            {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

            {result && (
                <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fff" }}>
                    <header style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
                        <div>
                            <p style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>Bible Reader</p>
                            <h2 style={{ margin: "4px 0 0" }}>{result.reference}</h2>
                        </div>
                        <div style={{ textAlign: "right", fontSize: 13, color: "#6b7280" }}>
                            <div>{result.translation} ({result.translationId.toUpperCase()})</div>
                            <div>{result.translationNote}</div>
                        </div>
                    </header>

                    <div style={{ display: "grid", gap: 8, lineHeight: 1.8 }}>
                        {result.verses.map((verse) => {
                            const active = selectedRange.includes(verse.number);
                            return (
                                <button
                                    key={verse.reference}
                                    type="button"
                                    onClick={() => selectVerse(verse.number)}
                                    style={{
                                        textAlign: "left",
                                        border: active ? "2px solid #111827" : "1px solid transparent",
                                        background: active ? "#f3f4f6" : "transparent",
                                        borderRadius: 8,
                                        padding: "8px 10px",
                                        font: "inherit",
                                        cursor: "pointer",
                                    }}
                                >
                                    <sup style={{ marginRight: 8, fontWeight: 700, color: "#6b7280" }}>{verse.number}</sup>
                                    {verse.text}
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
                        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{focusLabel}</p>
                        <button
                            type="button"
                            onClick={studySelectedPassage}
                            disabled={!studyPassage}
                            style={{ padding: "9px 14px", border: "1px solid #1d4ed8", borderRadius: 8, background: "#1d4ed8", color: "#fff", cursor: studyPassage ? "pointer" : "not-allowed", fontWeight: 700, opacity: studyPassage ? 1 : 0.55 }}
                        >
                            Study this passage
                        </button>
                    </div>

                    {selectedEnd !== null && (
                        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>
                            Click another verse to start a new range.
                        </p>
                    )}
                </section>
            )}
        </div>
    );
}
