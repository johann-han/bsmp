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
}

function displayDefinition(entry: StrongsEntry): string {
    return entry.strongsDefinition ?? entry.kjvDefinition ?? "No definition was returned.";
}

export function WordStudyPopover({
    children,
    reference,
    word,
    wordIndex,
    translation,
    open,
    onOpenChange,
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
                const payload = (await response.json()) as WordStudyResponse | { error?: string };
                if (!response.ok) {
                    throw new Error(
                        typeof payload.error === "string"
                            ? payload.error
                            : "Unable to load Strong's word study.",
                    );
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
            if (event.key === "Escape") onOpenChange(false);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onOpenChange]);

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
                    background: open ? "#eff6ff" : "transparent",
                    padding: "1px 2px",
                    margin: "0 1px",
                    borderRadius: 4,
                    font: "inherit",
                    color: "inherit",
                    cursor: "pointer",
                    boxShadow: open ? "inset 0 -2px 0 #2563eb" : "none",
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
                                                {entry.language === "G" ? "Greek" : "Hebrew"}
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
