import { describe, expect, it } from "vitest";

import {
    __test__,
    parseStrongsDictionary,
    parseTaggedVerse,
} from "./strongsWordStudy";

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
            `/**
 * JSON version
 * ============
 * Copyright 2009, Open Scriptures. CC-BY-SA. Derived from XML.
 */
var strongsGreekDictionary = {"G25":{"lemma":"ἀγαπάω","translit":"agapaō","strongs_def":"to love","kjv_def":"love"}}; module.exports = strongsGreekDictionary;`,
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
            word: "God.",
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

    it("parses STEPBible TAGNT rows and preserves the original-language form", () => {
        const words = __test__.parseTagntVerse(
            "Rom.1.16#08=NKO\tδύναμις (dunamis)\t[the] power\tG1411=N-NSF\tδύναμις=power\tNA28+NA27+Tyn+SBL+WH+Treg+TR+Byz\t\t\tpoder\tpower\t#08\tG1411",
            "Rom.1.16",
        );

        expect(words).toEqual([
            expect.objectContaining({
                wordIndex: 8,
                wordType: "NKO",
                originalForm: "δύναμις",
                grammar: "N-NSF",
                sStrongInstance: "G1411",
            }),
        ]);
    });

    it("matches the KJV Strong's instance to the corresponding traditional Greek token", () => {
        const words = __test__.parseTagntVerse(
            [
                "Rom.1.16#02=NKO\tγὰρ (gar)\tfor\tG1063=CONJ\tγάρ=for\tNA28+NA27+Tyn+SBL+WH+Treg+TR+Byz\t\t\tporque\tfor\t#02\tG1063_A",
                "Rom.1.16#09=NKO\tγὰρ (gar)\tfor\tG1063=CONJ\tγάρ=for\tNA28+NA27+Tyn+SBL+WH+Treg+TR+Byz\t\t\tporque\tfor\t#09\tG1063_B",
            ].join("\n"),
            "Rom.1.16",
        );

        expect(__test__.findTagntWord(words, "G1063", 2)).toMatchObject({
            wordIndex: 9,
            originalForm: "γὰρ",
            grammar: "CONJ",
        });
    });

    it("calculates the Strong's instance ordinal from the selected KJV word", () => {
        const words = parseTaggedVerse(
            "For[G1063] I[G1473] am[G1510] ashamed[G1870] for[G1063] God[G2316].",
        );

        expect(__test__.selectedStrongOccurrence(words, 4, "G1063")).toBe(2);
    });

    it("rejects malformed verse references", () => {
        expect(() => __test__.splitReference("Romans chapter one")).toThrow(
            /reference/i,
        );
    });
});
