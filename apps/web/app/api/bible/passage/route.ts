import { NextResponse } from "next/server";

const BIBLE_API_BASE = "https://bible-api.com";
const DEFAULT_TRANSLATION = "asv";
const DEFAULT_TRANSLATION_NAME = "American Standard Version";

const SUPPORTED_TRANSLATIONS = new Map<string, string>([
    ["asv", "American Standard Version (1901)"],
    ["kjv", "King James Version"],
    ["web", "World English Bible"],
]);

export async function GET(request: Request) {
    const url = new URL(request.url);
    const reference = url.searchParams.get("reference")?.trim();
    const translation = url.searchParams.get("translation")?.trim().toLowerCase() || DEFAULT_TRANSLATION;

    if (!reference) {
        return NextResponse.json({ error: "A Bible passage reference is required." }, { status: 400 });
    }

    if (reference.length > 120) {
        return NextResponse.json({ error: "The Bible passage reference is too long." }, { status: 400 });
    }

    if (!/^[a-z0-9-]+$/i.test(translation) || !SUPPORTED_TRANSLATIONS.has(translation)) {
        return NextResponse.json(
            {
                error: "Unsupported Bible translation.",
                supportedTranslations: Array.from(SUPPORTED_TRANSLATIONS.entries()).map(([id, name]) => ({ id, name })),
            },
            { status: 400 },
        );
    }

    try {
        const response = await fetch(
            `${BIBLE_API_BASE}/${encodeURIComponent(reference)}?translation=${encodeURIComponent(translation)}`,
            { next: { revalidate: 86400 } },
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: `Bible source returned HTTP ${response.status}.` },
                { status: 502 },
            );
        }

        const payload = (await response.json()) as {
            reference?: string;
            verses?: Array<{
                book_id: string;
                book_name: string;
                chapter: number;
                verse: number;
                text: string;
            }>;
            translation_id?: string;
            translation_name?: string;
            translation_note?: string;
        };

        if (!payload.verses?.length) {
            return NextResponse.json({ error: "No verses were returned for that passage." }, { status: 404 });
        }

        return NextResponse.json({
            reference: payload.reference ?? reference,
            translation: payload.translation_name ?? SUPPORTED_TRANSLATIONS.get(translation) ?? DEFAULT_TRANSLATION_NAME,
            translationId: payload.translation_id ?? translation,
            translationNote: payload.translation_note ?? "Public Domain",
            verses: payload.verses.map((verse) => ({
                number: verse.verse,
                reference: `${verse.book_id} ${verse.chapter}:${verse.verse}`,
                text: verse.text.trim(),
            })),
        });
    } catch (error: unknown) {
        return NextResponse.json(
            {
                error: error instanceof Error
                    ? `Unable to reach the Bible source: ${error.message}`
                    : "Unable to reach the Bible source.",
            },
            { status: 502 },
        );
    }
}
