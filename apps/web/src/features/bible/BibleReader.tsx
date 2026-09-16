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
        void fetchPassage("Romans 12", "asv");
    }, []);

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

    function clearSelection() {
        setSelectedStart(null);
        setSelectedEnd(null);
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
        ? "Tap a verse to begin a focus. Tap another verse to select the range."
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
        <div className="bsmp-bible-reader">
            <style>{`
                .bsmp-bible-reader { width:100%; max-width:980px; display:grid; gap:16px; }
                .bsmp-bible-controls { display:grid; gap:12px; padding:16px; border:1px solid #dbe3ee; border-radius:14px; background:#fff; box-shadow:0 4px 14px rgba(15,23,42,.05); }
                .bsmp-bible-controls-label { margin:0; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#64748b; }
                .bsmp-bible-form-row { display:grid; grid-template-columns:minmax(0,1fr) 220px auto; gap:10px; }
                .bsmp-bible-input, .bsmp-bible-select { min-width:0; box-sizing:border-box; width:100%; min-height:46px; padding:11px 12px; border:1px solid #cbd5e1; border-radius:10px; background:#fff; color:#0f172a; font:inherit; }
                .bsmp-bible-input:focus, .bsmp-bible-select:focus { outline:3px solid rgba(29,78,216,.16); border-color:#2563eb; }
                .bsmp-bible-read-button { min-height:46px; padding:10px 18px; border:1px solid #1d4ed8; border-radius:10px; background:#1d4ed8; color:#fff; font-weight:800; cursor:pointer; }
                .bsmp-bible-read-button:disabled { opacity:.55; cursor:not-allowed; }
                .bsmp-bible-help { margin:0; color:#64748b; font-size:13px; line-height:1.5; }
                .bsmp-bible-error { margin:0; padding:12px 14px; border:1px solid #fecaca; border-radius:10px; background:#fff1f2; color:#b91c1c; }
                .bsmp-bible-book { overflow:hidden; border:1px solid #dbe3ee; border-radius:16px; background:#fff; box-shadow:0 6px 18px rgba(15,23,42,.06); }
                .bsmp-bible-book-header { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; padding:18px 20px; border-bottom:1px solid #e5e7eb; background:linear-gradient(#fff,#f8fafc); }
                .bsmp-bible-kicker { margin:0 0 4px; font-size:11px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#64748b; }
                .bsmp-bible-title { margin:0; font-size:28px; line-height:1.15; color:#0f172a; }
                .bsmp-bible-translation { max-width:330px; text-align:right; color:#64748b; font-size:12px; line-height:1.5; }
                .bsmp-bible-translation strong { display:block; color:#334155; font-size:13px; }
                .bsmp-bible-content { padding:18px 20px 20px; }
                .bsmp-bible-verses { display:grid; gap:3px; }
                .bsmp-bible-verse { width:100%; display:block; text-align:left; border:1px solid transparent; border-radius:10px; padding:10px 12px; background:transparent; color:#1f2937; font:inherit; font-size:18px; line-height:1.75; cursor:pointer; }
                .bsmp-bible-verse:hover { background:#f8fafc; }
                .bsmp-bible-verse:focus-visible { outline:3px solid rgba(29,78,216,.18); outline-offset:1px; }
                .bsmp-bible-verse.active { border-color:#93c5fd; background:#eff6ff; box-shadow:inset 3px 0 0 #2563eb; }
                .bsmp-bible-verse-number { display:inline-block; min-width:26px; margin-right:6px; color:#64748b; font-size:12px; font-weight:800; vertical-align:top; padding-top:3px; }
                .bsmp-bible-focus-bar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:16px; padding:12px 14px; border:1px solid #e2e8f0; border-radius:10px; background:#f8fafc; }
                .bsmp-bible-focus-text { margin:0; color:#475569; font-size:13px; line-height:1.45; }
                .bsmp-bible-focus-actions { display:flex; gap:8px; flex-wrap:wrap; }
                .bsmp-bible-secondary-button, .bsmp-bible-study-button { min-height:40px; padding:8px 12px; border-radius:9px; font-weight:750; cursor:pointer; }
                .bsmp-bible-secondary-button { border:1px solid #cbd5e1; background:#fff; color:#334155; }
                .bsmp-bible-study-button { border:1px solid #1d4ed8; background:#1d4ed8; color:#fff; }
                .bsmp-bible-secondary-button:disabled, .bsmp-bible-study-button:disabled { opacity:.5; cursor:not-allowed; }
                @media (max-width:700px) {
                    .bsmp-bible-reader { gap:12px; max-width:none; }
                    .bsmp-bible-controls { position:sticky; top:52px; z-index:20; padding:12px; border-radius:12px; box-shadow:0 5px 16px rgba(15,23,42,.08); }
                    .bsmp-bible-form-row { grid-template-columns:1fr; gap:8px; }
                    .bsmp-bible-read-button { width:100%; }
                    .bsmp-bible-book { border-radius:12px; }
                    .bsmp-bible-book-header { display:block; padding:15px 14px; }
                    .bsmp-bible-title { font-size:23px; }
                    .bsmp-bible-translation { max-width:none; margin-top:8px; text-align:left; }
                    .bsmp-bible-content { padding:10px 10px 14px; }
                    .bsmp-bible-verses { gap:2px; }
                    .bsmp-bible-verse { padding:11px 10px; font-size:18px; line-height:1.78; border-radius:9px; }
                    .bsmp-bible-verse-number { min-width:24px; }
                    .bsmp-bible-focus-bar { display:grid; gap:10px; margin-top:12px; padding:11px 12px; }
                    .bsmp-bible-focus-actions { display:grid; grid-template-columns:1fr 1fr; }
                    .bsmp-bible-secondary-button, .bsmp-bible-study-button { width:100%; }
                }
            `}</style>

            <section className="bsmp-bible-controls" aria-label="Bible passage controls">
                <p className="bsmp-bible-controls-label">Read a passage</p>
                <form onSubmit={loadPassage} className="bsmp-bible-form-row">
                    <input
                        className="bsmp-bible-input"
                        value={reference}
                        onChange={(event) => setReference(event.target.value)}
                        placeholder="John 3:16 or Romans 12"
                        aria-label="Bible passage reference"
                        autoComplete="off"
                    />
                    <select
                        className="bsmp-bible-select"
                        value={translation}
                        onChange={(event) => void handleTranslationChange(event.target.value)}
                        aria-label="Bible translation"
                        disabled={loading}
                    >
                        {TRANSLATIONS.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                    <button className="bsmp-bible-read-button" type="submit" disabled={loading || !reference.trim()}>
                        {loading ? "Loading…" : "Read"}
                    </button>
                </form>
                <p className="bsmp-bible-help">Enter a chapter or verse reference. Select one verse, then another verse to focus on a range.</p>
            </section>

            {error && <p className="bsmp-bible-error" role="alert">{error}</p>}

            {result && (
                <section className="bsmp-bible-book" aria-label={`${result.reference} in ${result.translation}`}>
                    <header className="bsmp-bible-book-header">
                        <div>
                            <p className="bsmp-bible-kicker">Bible Reader</p>
                            <h2 className="bsmp-bible-title">{result.reference}</h2>
                        </div>
                        <div className="bsmp-bible-translation">
                            <strong>{result.translation} ({result.translationId.toUpperCase()})</strong>
                            <span>{result.translationNote}</span>
                        </div>
                    </header>

                    <div className="bsmp-bible-content">
                        <div className="bsmp-bible-verses">
                            {result.verses.map((verse) => {
                                const active = selectedRange.includes(verse.number);
                                return (
                                    <button
                                        key={verse.reference}
                                        type="button"
                                        className={`bsmp-bible-verse${active ? " active" : ""}`}
                                        onClick={() => selectVerse(verse.number)}
                                        aria-pressed={active}
                                    >
                                        <span className="bsmp-bible-verse-number" aria-hidden="true">{verse.number}</span>
                                        <span>{verse.text}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="bsmp-bible-focus-bar" aria-live="polite">
                            <p className="bsmp-bible-focus-text">{focusLabel}</p>
                            <div className="bsmp-bible-focus-actions">
                                <button type="button" className="bsmp-bible-secondary-button" onClick={clearSelection} disabled={selectedRange.length === 0}>
                                    Clear focus
                                </button>
                                <button type="button" className="bsmp-bible-study-button" onClick={studySelectedPassage} disabled={!studyPassage}>
                                    Study selected passage
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
