"use client";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

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

export interface StudyPassageMentorFocus {
    readonly verseReference: string;
    readonly textCue: string;
}

export interface StudyPassageProps {
    readonly studyId?: string;
    readonly reference: string;
    readonly translation: string;
    readonly verses: readonly StudyVerse[];
    readonly selectedVerses?: readonly number[];
    readonly mentorFocus?: StudyPassageMentorFocus | null;
    readonly onSelectVerseRange?: (verses: readonly StudyVerse[]) => void;
    readonly onSelectVerse?: (verse: StudyVerse) => void;
    readonly onMarkedWordSelect?: (verse: StudyVerse, markup: StudyWordMarkup, word: string) => void;
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

function markupLabel(symbol: string): string {
    return MARKUP_SYMBOLS.find((item) => item.symbol === symbol)?.label ?? symbol;
}

function tokenize(text: string): string[] {
    return text.match(/\S+/g) ?? [];
}

function asMarkupTable() {
    return supabase.from("study_markups" as never) as any;
}

function normalizeReference(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function splitAroundCue(text: string, cue: string): { before: string; match: string; after: string } | null {
    const normalizedText = text.toLowerCase();
    const normalizedCue = cue.trim().toLowerCase();
    if (!normalizedCue) return null;
    const index = normalizedText.indexOf(normalizedCue);
    if (index < 0) return null;
    return {
        before: text.slice(0, index),
        match: text.slice(index, index + cue.trim().length),
        after: text.slice(index + cue.trim().length),
    };
}

export function StudyPassage({
    studyId,
    reference,
    translation,
    verses,
    selectedVerses = [],
    mentorFocus = null,
    onSelectVerseRange,
    onSelectVerse,
    onMarkedWordSelect,
}: StudyPassageProps) {
    const [rangeStart, setRangeStart] = useState<number | null>(selectedVerses[0] ?? null);
    const [wordMarkups, setWordMarkups] = useState<readonly StudyWordMarkup[]>([]);
    const [markupSymbol, setMarkupSymbol] = useState("N");
    const [markupMode, setMarkupMode] = useState(false);
    const [markupError, setMarkupError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadMarkups() {
            if (!studyId) {
                const raw = window.localStorage.getItem(storageKey(reference, translation));
                if (!raw) {
                    setWordMarkups([]);
                    return;
                }

                try {
                    const parsed = JSON.parse(raw) as StudyWordMarkup[];
                    if (!cancelled) setWordMarkups(Array.isArray(parsed) ? parsed : []);
                } catch {
                    window.localStorage.removeItem(storageKey(reference, translation));
                    if (!cancelled) setWordMarkups([]);
                }
                return;
            }

            const { data, error } = await asMarkupTable()
                .select("verse_number,word_index,symbol")
                .eq("study_id", studyId)
                .eq("translation", translation)
                .order("verse_number", { ascending: true })
                .order("word_index", { ascending: true });

            if (cancelled) return;

            if (error) {
                setMarkupError("Unable to load saved study markup.");
                setWordMarkups([]);
                return;
            }

            setMarkupError(null);
            setWordMarkups((data ?? []).map((row: { verse_number: number; word_index: number; symbol: string }) => ({
                verseNumber: row.verse_number,
                wordIndex: row.word_index,
                symbol: row.symbol,
            })));
        }

        void loadMarkups();
        return () => {
            cancelled = true;
        };
    }, [studyId, reference, translation]);

    useEffect(() => {
        setRangeStart(selectedVerses.length === 1 ? selectedVerses[0] ?? null : null);
    }, [selectedVerses]);

    useEffect(() => {
        if (!mentorFocus) return;
        const targetReference = normalizeReference(mentorFocus.verseReference);
        const targetVerse = verses.find((verse) => {
            const verseReference = normalizeReference(verse.reference);
            return verseReference === targetReference || verseReference.endsWith(targetReference);
        });
        if (!targetVerse) return;

        window.setTimeout(() => {
            document.getElementById(`study-verse-${targetVerse.number}`)?.scrollIntoView({ behavior: "smooth", block: "center" });

            const cue = mentorFocus.textCue.trim();
            const normalizedVerseText = targetVerse.text.toLowerCase();
            const cueIndex = normalizedVerseText.indexOf(cue.toLowerCase());
            if (cueIndex < 0) return;

            const wordIndex = tokenize(targetVerse.text.slice(0, cueIndex)).length;
            const wordText = targetVerse.text.slice(cueIndex, cueIndex + cue.length);

            window.dispatchEvent(new CustomEvent("bsmp:mentor-focus-ready", {
                detail: {
                    verseReference: targetVerse.reference,
                    textCue: wordText,
                    wordIndex,
                    wordText,
                    translation,
                },
            }));
        }, 0);
    }, [mentorFocus, verses, translation]);

    async function saveWordMarkups(next: readonly StudyWordMarkup[]) {
        setWordMarkups(next);
        setMarkupError(null);

        try {
            if (!studyId) {
                window.localStorage.setItem(storageKey(reference, translation), JSON.stringify(next));
                return;
            }

            const userResult = await supabase.auth.getUser();
            if (userResult.error || !userResult.data.user) {
                throw userResult.error ?? new Error("A signed-in user is required to save markup.");
            }

            const table = asMarkupTable();
            const { error: deleteError } = await table
                .delete()
                .eq("study_id", studyId)
                .eq("user_id", userResult.data.user.id)
                .eq("translation", translation);

            if (deleteError) throw deleteError;

            if (next.length > 0) {
                const { error: insertError } = await table.insert(next.map((item) => ({
                    study_id: studyId,
                    user_id: userResult.data.user.id,
                    translation,
                    verse_number: item.verseNumber,
                    word_index: item.wordIndex,
                    symbol: item.symbol,
                })));
                if (insertError) throw insertError;
            }
        } catch (reason: unknown) {
            setMarkupError(reason instanceof Error ? reason.message : "Unable to save study markup.");
        }
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
        const verse = verses.find((item) => item.number === verseNumber);
        const word = verse ? tokenize(verse.text)[wordIndex] ?? "" : "";
        const existing = wordMarkups.find(
            (item) => item.verseNumber === verseNumber && item.wordIndex === wordIndex,
        );

        if (existing) {
            onMarkedWordSelect?.(verse ?? { number: verseNumber, reference, text: "" }, existing, word);
            return;
        }

        const nextMarkup = { verseNumber, wordIndex, symbol: markupSymbol };
        void saveWordMarkups([
            ...wordMarkups.filter(
                (item) => !(item.verseNumber === verseNumber && item.wordIndex === wordIndex),
            ),
            nextMarkup,
        ]);
    }

    return (
        <section style={{ minWidth: 0, border: "1px solid #e5e7eb", borderRadius: 12, background: "#ffffff", padding: 20 }}>
            <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline", marginBottom: 12 }}>
                <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280" }}>Current Passage</p>
                    <h2 style={{ margin: "4px 0 0", fontSize: 24 }}>{reference}</h2>
                </div>
                <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>{translation}</span>
            </header>

            <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    <button type="button" onClick={() => setMarkupMode((current) => !current)} style={{ border: "1px solid #d1d5db", borderRadius: 8, background: markupMode ? "#f3f4f6" : "#fff", padding: "7px 10px", fontWeight: 600 }}>
                        {markupMode ? "Close Markup" : "Word Markup"}
                    </button>
                    {markupMode && MARKUP_SYMBOLS.map((item) => (
                        <button key={item.symbol} type="button" onClick={() => setMarkupSymbol(item.symbol)} title={item.label} aria-label={`${item.symbol} — ${item.label}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 36, border: markupSymbol === item.symbol ? "2px solid #111827" : "1px solid #d1d5db", borderRadius: 8, background: markupSymbol === item.symbol ? "#f3f4f6" : "#fff", fontWeight: 700 }}>
                            {item.symbol}
                        </button>
                    ))}
                </div>
                {markupError && <p style={{ margin: 0, color: "#b91c1c", fontSize: 12 }}>{markupError}</p>}
            </div>

            {mentorFocus && (
                <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, border: "1px solid #bfdbfe", background: "#f8fbff", fontSize: 13 }}>
                    <strong>Mentor focus:</strong> {mentorFocus.verseReference} · “{mentorFocus.textCue}”
                    <span style={{ marginLeft: 6, color: "#475569" }}>The highlighted text is a prompt to inspect, not a conclusion.</span>
                </div>
            )}

            <div style={{ display: "grid", gap: 10, lineHeight: 1.7 }}>
                {verses.map((verse) => {
                    const isSelected = selectedVerses.includes(verse.number);
                    const words = tokenize(verse.text);
                    const isMentorVerse = mentorFocus && (
                        normalizeReference(verse.reference) === normalizeReference(mentorFocus.verseReference)
                        || normalizeReference(verse.reference).endsWith(normalizeReference(mentorFocus.verseReference))
                    );
                    const cueParts = isMentorVerse ? splitAroundCue(verse.text, mentorFocus?.textCue ?? "") : null;

                    return (
                        <div id={`study-verse-${verse.number}`} key={verse.reference} style={{ border: isSelected ? "2px solid #111827" : isMentorVerse ? "2px solid #93c5fd" : "1px solid transparent", borderRadius: 8, background: isSelected ? "#f3f4f6" : isMentorVerse ? "#eff6ff" : "#f9fafb", padding: "10px 12px", scrollMarginTop: 100 }}>
                            <button type="button" onClick={() => selectVerse(verse)} style={{ border: 0, background: "transparent", padding: 0, font: "inherit", cursor: "pointer" }}>
                                <sup style={{ marginRight: 8, fontWeight: 700, color: "#6b7280" }}>{verse.number}</sup>
                            </button>

                            {markupMode ? (
                                <span>
                                    {words.map((word, index) => {
                                        const markup = wordMarkups.find((item) => item.verseNumber === verse.number && item.wordIndex === index);
                                        const label = markup ? markupLabel(markup.symbol) : null;
                                        return (
                                            <button key={`${verse.number}-${index}`} type="button" onClick={() => toggleWordMarkup(verse.number, index)} aria-label={markup ? `${word}: ${markup.symbol} — ${label}` : `Mark ${word}`} title={markup ? `${markup.symbol} — ${label}; click to target Observation` : "Mark this word"} style={{ border: 0, background: markup ? "#f3f4f6" : "transparent", padding: "1px 2px", margin: "0 1px", borderRadius: 4, font: "inherit", cursor: "pointer", textDecoration: markup ? "underline" : "none", textDecorationThickness: markup ? 2 : undefined }}>
                                                {word}{markup ? <sup style={{ marginLeft: 2, fontWeight: 800 }}>{markup.symbol}</sup> : ""}
                                            </button>
                                        );
                                    })}
                                </span>
                            ) : cueParts ? (
                                <span>
                                    {cueParts.before}
                                    <mark style={{ padding: "1px 3px", borderRadius: 4, fontWeight: 700 }}>{cueParts.match}</mark>
                                    {cueParts.after}
                                </span>
                            ) : <span>{verse.text}</span>}
                        </div>
                    );
                })}
            </div>

            <p style={{ margin: "16px 0 0", fontSize: 13, color: "#6b7280" }}>
                {selectedVerses.length === 0 ? "Click a verse to focus it. Click another verse to select a range." : selectedVerses.length === 1 ? `Focused verse: ${verses.find((verse) => verse.number === selectedVerses[0])?.reference ?? selectedVerses[0]}` : `Focused range: ${verses.find((verse) => verse.number === selectedVerses[0])?.reference ?? selectedVerses[0]}–${selectedVerses[selectedVerses.length - 1]}`}
            </p>

            {wordMarkups.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb", fontSize: 12, color: "#4b5563" }}>
                    <strong>Study Markup</strong>
                    <span style={{ marginLeft: 8 }}>{wordMarkups.length} marked {wordMarkups.length === 1 ? "word" : "words"}</span>
                </div>
            )}
        </section>
    );
}
