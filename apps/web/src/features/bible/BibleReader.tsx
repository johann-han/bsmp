"use client";

import { useState, type FormEvent } from "react";

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

export function BibleReader() {
    const [reference, setReference] = useState("Romans 12");
    const [translation, setTranslation] = useState("asv");
    const [result, setResult] = useState<BibleResponse | null>(null);
    const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function fetchPassage(referenceValue: string, translationValue: string, preserveVerse = false) {
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
            if (!preserveVerse) {
                setSelectedVerse(null);
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
                            const active = selectedVerse === verse.number;
                            return (
                                <button
                                    key={verse.reference}
                                    type="button"
                                    onClick={() => setSelectedVerse(verse.number)}
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

                    <p style={{ margin: "16px 0 0", fontSize: 13, color: "#6b7280" }}>
                        {selectedVerse === null ? "Select a verse to focus your reading." : `Focused verse: ${selectedVerse}`}
                    </p>
                </section>
            )}
        </div>
    );
}
