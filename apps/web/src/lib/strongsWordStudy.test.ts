import { describe, expect, it } from "vitest";

import { __test__, parseStrongsDictionary, parseTaggedVerse } from "./strongsWordStudy";

describe("Strong's word-study data helpers", () => {
    it("parses embedded Strong's tags without losing the visible word", () => {
        const words = parseTaggedVerse(
            "For[G1063] God[G2316] so[G3779] loved[G25] the world[G2889].",
        );

        expect(words).toEqual([
            { word: "For", strongs: ["G1063"] },
            { word: "God", strongs: ["G2316"] },
            { word: "so", strongs: ["G3779"] },
            { word: "loved", strongs: ["G25"] },
            { word: "the", strongs: [] },
            { word: "world.", strongs: ["G2889"] },
        ]);
    });

    it("parses the Open Scriptures JavaScript dictionary wrapper", () => {
        const dictionary = parseStrongsDictionary(
            'var strongsGreekDictionary = {"G25":{"lemma":"ἀγαπάω","translit":"agapaō","strongs_def":"to love","kjv_def":"love"}}; module.exports = strongsGreekDictionary;',
        );

        expect(dictionary.G25).toMatchObject({
            lemma: "ἀγαπάω",
            translit: "agapaō",
            strongs_def: "to love",
            kjv_def: "love",
        });
    });

    it("matches a selected word by index first and falls back to the nearest matching word", () => {
        const words = parseTaggedVerse("God[G2316] loved[G25] God[G2316].");

        expect(__test__.selectTaggedWord(words, "loved", 1)).toMatchObject({
            word: "loved",
            index: 1,
        });
        expect(__test__.selectTaggedWord(words, "God", 2)).toMatchObject({
            word: "God",
            index: 2,
        });
    });

    it("normalizes punctuation for word matching", () => {
        expect(__test__.normalizeWord("world.")).toBe("world");
        expect(__test__.normalizeWord("God,")).toBe("god");
    });

    it("rejects malformed dictionary sources", () => {
        expect(() => parseStrongsDictionary("not a dictionary")).toThrow(
            /unsupported format/i,
        );
    });

    it("rejects malformed verse references", () => {
        expect(() => __test__.splitReference("Romans chapter one")).toThrow(
            /reference/i,
        );
    });
});
