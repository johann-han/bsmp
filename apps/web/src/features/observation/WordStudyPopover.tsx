"use client";

import { useEffect, useState, type ReactNode } from "react";

interface StrongsEntry {
    readonly number: string;
    readonly language: "G" | "H";
    readonly lemma: string;
    readonly transliteration: string | null;
    readonly pronunciation: string | null;
    readonly derivation: string | null;
    readonly strongsDefinition: string | null;
    readonly kjvDefinition: string | null;
    readonly originalForm: string | null;
    readonly morphology: {
        readonly language: "G" | "H" | "A";
        readonly code: string;
        readonly summary: string;
        readonly partOfSpeech: string | null;
        readonly tense: string | null;
        readonly voice: string | null;
        readonly mood: string | null;
        readonly form: string | null;
        readonly person: string | null;
        readonly grammaticalCase: string | null;
        readonly number: string | null;
        readonly gender: string | null;
        readonly state: string | null;
        readonly degree: string | null;
        readonly qualifier: string | null;
    } | null;
    readonly morphemes: readonly {
        readonly originalForm: string;
        readonly role: "prefix" | "root" | "suffix" | "segment";
        readonly morphology: {
            readonly language: "G" | "H" | "A";
            readonly code: string;
            readonly summary: string;
        };
    }[] | null;
}

interface WordStudyResponse {
    readonly reference: string;
    readonly translation: "kjv";
    readonly word: string;
    readonly wordIndex: number;
    readonly strongs: readonly StrongsEntry[];
}

interface WordStudyPopoverProps {
    readonly children: ReactNode;
    readonly reference: string;
    readonly word: string;
    readonly wordIndex: number;
    readonly translation: string;
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly hasPrevious: boolean;
    readonly hasNext: boolean;
    readonly onNavigate: (direction: -1 | 1) => void;
}

function displayDefinition(entry: StrongsEntry): string {
    return entry.strongsDefinition ?? entry.kjvDefinition ?? "No definition was returned.";
}

function morphologyDetails(
    morphology: NonNullable<StrongsEntry["morphology"]>,
): readonly { label: string; value: string }[] {
    return [
        ["Part of speech", morphology.partOfSpeech],
        ["Tense", morphology.tense],
        ["Voice", morphology.voice],
        ["Mood", morphology.mood],
        ["Form / aspect", morphology.form],
        ["Person", morphology.person ? morphology.person + " person" : null],
        ["Case", morphology.grammaticalCase],
        ["Number", morphology.number],
        ["Gender", morphology.gender],
        ["State", morphology.state],
        ["Degree", morphology.degree],
        ["Qualifier", morphology.qualifier],
    ]
        .filter((item): item is [string, string] => Boolean(item[1]))
        .map(([label, value]) => ({ label, value }));
}

export function WordStudyPopover({
    children,
    reference,
    word,
    wordIndex,
    translation,
    open,
    onOpenChange,
    hasPrevious,
    hasNext,
    onNavigate,
}: WordStudyPopoverProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<WordStudyResponse | null>(null);

    useEffect(() => {
        if (!open) return;

        if (translation.toLowerCase() !== "kjv") {
            setResult(null);
            setError("Strong's word study is currently available for the KJV passage data.");
            return;
        }

        let active = true;
        const controller = new AbortController();

        setLoading(true);
        setError(null);

        void fetch(
            "/api/bible/strongs?reference=" +
                encodeURIComponent(reference) +
                "&word=" +
                encodeURIComponent(word) +
                "&wordIndex=" +
                encodeURIComponent(String(wordIndex)) +
                "&translation=kjv",
            { signal: controller.signal },
        )
            .then(async (response) => {
                const payload: unknown = await response.json();
                if (!response.ok) {
                    const message =
                        typeof payload === "object" &&
                        payload !== null &&
                        "error" in payload &&
                        typeof payload.error === "string"
                            ? payload.error
                            : "Unable to load Strong's word study.";
                    throw new Error(message);
                }
                return payload as WordStudyResponse;
            })
            .then((payload) => {
                if (!active) return;
                setResult(payload);
            })
            .catch((reason: unknown) => {
                if (
                    !active ||
                    (reason instanceof DOMException && reason.name === "AbortError")
                ) {
                    return;
                }

                setResult(null);
                setError(
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load Strong's word study.",
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, [open, reference, word, wordIndex, translation]);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onOpenChange(false);
            } else if (event.key === "ArrowLeft" && hasPrevious) {
                event.preventDefault();
                onNavigate(-1);
            } else if (event.key === "ArrowRight" && hasNext) {
                event.preventDefault();
                onNavigate(1);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [hasNext, hasPrevious, onNavigate, onOpenChange, open]);

    return (
        <span style={{ position: "relative", display: "inline-block" }}>
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-expanded={open}
                title={
                    translation.toLowerCase() === "kjv"
                        ? "Open Strong's word study for " + word
                        : "Strong's word study is currently available for KJV"
                }
                style={{
                    border: 0,
                    background: open ? "#eff6ff" : "rgba(37,99,235,.045)",
                    padding: "1px 3px",
                    margin: "1px 1px",
                    borderRadius: 4,
                    font: "inherit",
                    color: "inherit",
                    cursor: "pointer",
                    boxShadow: open ? "inset 0 -2px 0 #2563eb" : "inset 0 -1px 0 #bfdbfe",
                }}
            >
                {children}
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label={"Strong's word study for " + word}
                    style={{
                        position: "absolute",
                        zIndex: 50,
                        top: "calc(100% + 8px)",
                        left: 0,
                        width: "min(360px, calc(100vw - 32px))",
                        maxHeight: "min(520px, 70vh)",
                        overflowY: "auto",
                        padding: 14,
                        border: "1px solid #cbd5e1",
                        borderRadius: 12,
                        background: "#ffffff",
                        color: "#0f172a",
                        boxShadow: "0 16px 36px rgba(15,23,42,.18)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "flex-start",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    letterSpacing: ".08em",
                                    textTransform: "uppercase",
                                    color: "#64748b",
                                }}
                            >
                                Word Study
                            </div>
                            <div style={{ marginTop: 3, fontSize: 18, fontWeight: 800 }}>
                                {result?.word ?? word}
                            </div>
                            <div style={{ marginTop: 2, fontSize: 12, color: "#64748b" }}>
                                {reference}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            aria-label="Close word study"
                            style={{
                                border: "1px solid #cbd5e1",
                                borderRadius: 7,
                                background: "#fff",
                                padding: "4px 8px",
                                cursor: "pointer",
                                fontWeight: 700,
                            }}
                        >
                            ×
                        </button>
                    </div>

                    {loading && (
                        <p style={{ margin: "14px 0 0", color: "#64748b" }}>
                            Loading Strong&apos;s data…
                        </p>
                    )}

                    {error && (
                        <p style={{ margin: "14px 0 0", color: "#b91c1c", fontSize: 13 }}>
                            {error}
                        </p>
                    )}

                    {result && !loading && !error && (
                        result.strongs.length > 0 ? (
                            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                                {result.strongs.map((entry) => (
                                    <article
                                        key={entry.number}
                                        style={{
                                            padding: 10,
                                            border: "1px solid #e2e8f0",
                                            borderRadius: 9,
                                            background: "#f8fafc",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: 10,
                                            }}
                                        >
                                            <strong style={{ fontSize: 14 }}>
                                                Strong&apos;s {entry.number}
                                            </strong>
                                            <span style={{ fontSize: 11, color: "#64748b" }}>
                                                {entry.morphology?.language === "A"
                                                    ? "Aramaic"
                                                    : entry.language === "G"
                                                      ? "Greek"
                                                      : "Hebrew"}
                                            </span>
                                        </div>

                                        <div style={{ marginTop: 5, fontSize: 18, fontWeight: 700 }}>
                                            {entry.lemma || "Lemma unavailable"}
                                        </div>

                                        {entry.transliteration && (
                                            <div
                                                style={{
                                                    marginTop: 2,
                                                    fontSize: 13,
                                                    fontStyle: "italic",
                                                    color: "#475569",
                                                }}
                                            >
                                                {entry.transliteration}
                                            </div>
                                        )}

                                        {entry.originalForm && (
                                            <div
                                                style={{
                                                    marginTop: 6,
                                                    fontSize: 15,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <span style={{ fontWeight: 800 }}>Original form:</span>{" "}
                                                {entry.originalForm}
                                            </div>
                                        )}

                                        {entry.morphology && (
                                            <div
                                                style={{
                                                    marginTop: 6,
                                                    padding: "7px 9px",
                                                    borderRadius: 7,
                                                    background: "#eef2ff",
                                                    fontSize: 12,
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                <strong>
                                                    {entry.morphology.language === "A"
                                                        ? "Aramaic morphology:"
                                                        : "Morphology:"}
                                                </strong>{" "}
                                                {entry.morphology.summary}{" "}
                                                <span style={{ color: "#64748b" }}>
                                                    ({entry.morphology.code})
                                                </span>
                                            </div>
                                        )}

                                        {entry.morphology &&
                                            morphologyDetails(entry.morphology).length > 0 && (
                                                <div
                                                    style={{
                                                        marginTop: 7,
                                                        padding: "8px 9px",
                                                        borderRadius: 7,
                                                        background: "#ffffff",
                                                        border: "1px solid #e2e8f0",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 800,
                                                            color: "#475569",
                                                            textTransform: "uppercase",
                                                            letterSpacing: ".06em",
                                                        }}
                                                    >
                                                        Morphology details
                                                    </div>

                                                    <dl
                                                        style={{
                                                            display: "grid",
                                                            gridTemplateColumns: "auto minmax(0, 1fr)",
                                                            gap: "4px 10px",
                                                            margin: "7px 0 0",
                                                            fontSize: 11,
                                                            lineHeight: 1.45,
                                                        }}
                                                    >
                                                        {morphologyDetails(entry.morphology).map((detail) => (
                                                            <div
                                                                key={detail.label}
                                                                style={{
                                                                    display: "contents",
                                                                }}
                                                            >
                                                                <dt
                                                                    style={{
                                                                        color: "#64748b",
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    {detail.label}
                                                                </dt>
                                                                <dd
                                                                    style={{
                                                                        margin: 0,
                                                                        color: "#0f172a",
                                                                    }}
                                                                >
                                                                    {detail.value}
                                                                </dd>
                                                            </div>
                                                        ))}
                                                    </dl>
                                                </div>
                                            )}

                                        {entry.language === "H" &&
                                            entry.morphemes &&
                                            entry.morphemes.length > 1 && (
                                                <div
                                                    style={{
                                                        marginTop: 7,
                                                        padding: "8px 9px",
                                                        borderRadius: 7,
                                                        background: "#f8fafc",
                                                        border: "1px solid #e2e8f0",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 800,
                                                            color: "#475569",
                                                            textTransform: "uppercase",
                                                            letterSpacing: ".06em",
                                                        }}
                                                    >
                                                        Morpheme breakdown
                                                    </div>

                                                    <div
                                                        dir="rtl"
                                                        style={{
                                                            display: "grid",
                                                            gap: 7,
                                                            marginTop: 7,
                                                        }}
                                                    >
                                                        {entry.morphemes.map((morpheme, index) => (
                                                            <div
                                                                key={
                                                                    morpheme.morphology.code +
                                                                    "-" +
                                                                    index
                                                                }
                                                                style={{
                                                                    display: "grid",
                                                                    gridTemplateColumns: "minmax(0, 1fr) auto",
                                                                    gap: 10,
                                                                    alignItems: "center",
                                                                    padding: "7px 8px",
                                                                    borderRadius: 6,
                                                                    background: "#ffffff",
                                                                    border: "1px solid #e5e7eb",
                                                                }}
                                                            >
                                                                <div>
                                                                    <div
                                                                        style={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: 7,
                                                                            flexWrap: "wrap",
                                                                        }}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                fontSize: 17,
                                                                                fontWeight: 800,
                                                                            }}
                                                                        >
                                                                            {morpheme.originalForm}
                                                                        </span>
                                                                        <span
                                                                            dir="ltr"
                                                                            style={{
                                                                                padding: "2px 5px",
                                                                                borderRadius: 5,
                                                                                background: "#e2e8f0",
                                                                                color: "#475569",
                                                                                fontSize: 9,
                                                                                fontWeight: 800,
                                                                                textTransform: "uppercase",
                                                                                letterSpacing: ".05em",
                                                                            }}
                                                                        >
                                                                            {morpheme.role}
                                                                        </span>
                                                                    </div>
                                                                    <div
                                                                        dir="ltr"
                                                                        style={{
                                                                            marginTop: 2,
                                                                            fontSize: 11,
                                                                            color: "#475569",
                                                                            lineHeight: 1.45,
                                                                        }}
                                                                    >
                                                                        {morpheme.morphology.summary}
                                                                    </div>
                                                                </div>

                                                                <code
                                                                    dir="ltr"
                                                                    style={{
                                                                        fontSize: 10,
                                                                        color: "#64748b",
                                                                        whiteSpace: "nowrap",
                                                                    }}
                                                                >
                                                                    {morpheme.morphology.code}
                                                                </code>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        {entry.pronunciation && (
                                            <div
                                                style={{
                                                    marginTop: 2,
                                                    fontSize: 12,
                                                    color: "#64748b",
                                                }}
                                            >
                                                Pronunciation: {entry.pronunciation}
                                            </div>
                                        )}

                                        <p
                                            style={{
                                                margin: "8px 0 0",
                                                fontSize: 13,
                                                lineHeight: 1.55,
                                            }}
                                        >
                                            <strong>Definition:</strong> {displayDefinition(entry)}
                                        </p>

                                        {entry.kjvDefinition &&
                                            entry.kjvDefinition !== entry.strongsDefinition && (
                                                <p
                                                    style={{
                                                        margin: "5px 0 0",
                                                        fontSize: 12,
                                                        lineHeight: 1.5,
                                                        color: "#475569",
                                                    }}
                                                >
                                                    <strong>KJV gloss:</strong> {entry.kjvDefinition}
                                                </p>
                                            )}

                                        {entry.derivation && (
                                            <p
                                                style={{
                                                    margin: "5px 0 0",
                                                    fontSize: 12,
                                                    lineHeight: 1.5,
                                                    color: "#475569",
                                                }}
                                            >
                                                <strong>Derivation:</strong> {entry.derivation}
                                            </p>
                                        )}
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p style={{ margin: "14px 0 0", color: "#475569", fontSize: 13 }}>
                                No Strong&apos;s number is attached to this KJV word in the source data.
                            </p>
                        )
                    )}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                            marginTop: 12,
                            paddingTop: 10,
                            borderTop: "1px solid #e2e8f0",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => onNavigate(-1)}
                            disabled={!hasPrevious}
                            aria-label="Previous word in passage"
                            style={{
                                flex: 1,
                                border: "1px solid #cbd5e1",
                                borderRadius: 8,
                                background: "#fff",
                                padding: "7px 9px",
                                color: "#334155",
                                fontSize: 12,
                                fontWeight: 700,
                            }}
                        >
                            ← Previous
                        </button>
                        <button
                            type="button"
                            onClick={() => onNavigate(1)}
                            disabled={!hasNext}
                            aria-label="Next word in passage"
                            style={{
                                flex: 1,
                                border: "1px solid #cbd5e1",
                                borderRadius: 8,
                                background: "#fff",
                                padding: "7px 9px",
                                color: "#334155",
                                fontSize: 12,
                                fontWeight: 700,
                            }}
                        >
                            Next →
                        </button>
                    </div>

                    <p
                        style={{
                            margin: "12px 0 0",
                            paddingTop: 10,
                            borderTop: "1px solid #e2e8f0",
                            color: "#64748b",
                            fontSize: 11,
                            lineHeight: 1.45,
                        }}
                    >
                        Strong&apos;s metadata is reference material for word study. It does not
                        determine the meaning of the passage by itself.
                    </p>
                </div>
            )}
        </span>
    );
}
