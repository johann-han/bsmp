import { NextResponse } from "next/server";

import { lookupStrongsWordStudy } from "../../../../src/lib/strongsWordStudy";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const translation = url.searchParams.get("translation")?.trim().toLowerCase() ?? "kjv";
    const reference = url.searchParams.get("reference")?.trim() ?? "";
    const word = url.searchParams.get("word")?.trim() ?? "";
    const wordIndexText = url.searchParams.get("wordIndex")?.trim() ?? "";

    if (translation !== "kjv") {
        return NextResponse.json(
            { error: "Strong's word study is currently available only for KJV passage data." },
            { status: 400 },
        );
    }

    const wordIndex = Number(wordIndexText);
    if (!reference || !word || !Number.isInteger(wordIndex) || wordIndex < 0) {
        return NextResponse.json(
            { error: "Reference, word, and a valid word index are required." },
            { status: 400 },
        );
    }

    try {
        return NextResponse.json(
            await lookupStrongsWordStudy({
                reference,
                word,
                wordIndex,
            }),
        );
    } catch (reason: unknown) {
        return NextResponse.json(
            {
                error:
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load Strong's word study.",
            },
            { status: 502 },
        );
    }
}
