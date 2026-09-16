import { describe, expect, it } from "vitest";

import {
    BookCode,
    ChapterNumber,
    VerseNumber,
    VerseReference,
} from "@bsmp/bible";

import { ObservationTarget } from "./ObservationTarget.js";

describe("ObservationTarget", () => {
    const verse = VerseReference.create(
        BookCode.from("ROM"),
        ChapterNumber.of(12),
        VerseNumber.from(1),
    );

    it("creates a verse target", () => {
        const target = ObservationTarget.verse(verse);

        expect(target.toString()).toBe("ROM 12:1");
        expect(target.isWordTarget).toBe(false);
        expect(target.isTextTarget).toBe(false);
        expect(target.wordIndex).toBeNull();
    });

    it("creates a translation-specific word target with markup", () => {
        const target = ObservationTarget.word(verse, {
            translation: "asv",
            wordIndex: 0,
            wordText: "I",
            markupSymbol: "N",
        });

        expect(target.toString()).toBe("ROM 12:1 · I");
        expect(target.translation).toBe("asv");
        expect(target.wordIndex).toBe(0);
        expect(target.wordText).toBe("I");
        expect(target.markupSymbol).toBe("N");
        expect(target.isWordTarget).toBe(true);
        expect(target.isTextTarget).toBe(false);
    });

    it("creates a translation-specific text target for a mentor cue", () => {
        const target = ObservationTarget.text(verse, {
            translation: "asv",
            textCue: "every man that is among you",
        });

        expect(target.toString()).toBe("ROM 12:1 · every man that is among you");
        expect(target.translation).toBe("asv");
        expect(target.wordIndex).toBeNull();
        expect(target.wordText).toBe("every man that is among you");
        expect(target.markupSymbol).toBeNull();
        expect(target.isWordTarget).toBe(false);
        expect(target.isTextTarget).toBe(true);
    });
});
