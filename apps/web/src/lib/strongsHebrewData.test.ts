import { describe, expect, it } from "vitest";

import { __test__ } from "./strongsHebrewData";

const { parseTahotVerse, findTahotSegment, baseStrong } = __test__();

const GENESIS_1_2_1 = [
    "Gen.1.2#01=L\tוְ/הָ/אָ֗רֶץ\tve./ha./'A.retz\tand/ the/ earth\tH9002/H9009/{H0776G}\tHC/Td/Ncfsa\t\t\tH0776G\t\t\tH9002=ו=and/H9009=ה=the/{H0776G=אֶ֫רֶץ=: country;_planet»land:2_country;_planet}",
].join("\n");

const GENESIS_1_2_11 = [
    "Gen.1.2#11=L\tמְרַחֶ֖פֶת\tme.ra.Che.fet\t[was] hovering\t{H7363B}\tHVprfsa\t\t\tH7363B\t\t\t{H7363B=רָחַף=to hover}",
].join("\n");

const GENESIS_1_1 = [
    "Eng (Heb) Ref & Type\tHebrew\tTransliteration\tTranslation\tdStrongs\tGrammar\tMeaning Variants\tSpelling Variants\tRoot dStrong+Instance\tAlternative Strongs+Instance\tConjoin word\tExpanded Strong tags",
    "Gen.1.1#01=L\tבְּ/רֵאשִׁ֖ית\tbe./re.Shit\tin/ beginning\tH9003/{H7225G}\tHR/Ncfsa\t\t\tH7225G\t\t\tH9003=ב=in/{H7225G=רֵאשִׁית=: beginning»first:1_beginning}",
    "Gen.1.1#02=L\tבָּרָ֣א\tba.Ra'\the created\t{H1254A}\tHVqp3ms\t\t\tH1254A\t\t\t{H1254A=בָּרָא=to create}",
    "Gen.1.1#03=L\tאֱלֹהִ֑ים\t'E.lo.Him\tGod\t{H0430G}\tHNcmpa\t\t\tH0430G\t\t\t{H0430G=אֱלֹהִים=God}",
].join("\n");

describe("TAHOT Hebrew word alignment", () => {
    it("parses only verse rows and preserves source order and source type", () => {
        const words = parseTahotVerse(GENESIS_1_1, "Gen.1.1");

        expect(words).toHaveLength(3);
        expect(words.map((word) => word.wordIndex)).toEqual([1, 2, 3]);
        expect(words[0]).toMatchObject({
            location: "Gen.1.1#01=L",
            type: "L",
            hebrew: "בְּ/רֵאשִׁ֖ית",
            dStrongs: "H9003/{H7225G}",
            grammar: "HR/Ncfsa",
        });
    });

    it("aligns an actual pinned TAHOT three-segment composite row", () => {
        const words = parseTahotVerse(GENESIS_1_2_1, "Gen.1.2");

        const match = findTahotSegment(words, "H0776", 1);

        expect(match?.originalForm).toBe("אָ֗רֶץ");
        expect(match?.morphology).toMatchObject({
            language: "H",
            code: "HNcfsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Feminine",
            number: "Singular",
            state: "Absolute",
        });
        expect(match?.morphemes).toHaveLength(3);
        expect(match?.morphemes).toMatchObject([
            {
                originalForm: "וְ",
                role: "prefix",
                strongsNumbers: ["H9002"],
                sourceStrongSegment: "H9002",
                sourceGrammarSegment: "HC",
                matchedStrong: false,
                morphology: { language: "H", code: "HC", summary: "Conjunction" },
            },
            {
                originalForm: "הָ",
                role: "prefix",
                strongsNumbers: ["H9009"],
                sourceStrongSegment: "H9009",
                sourceGrammarSegment: "Td",
                matchedStrong: false,
                morphology: {
                    language: "H",
                    code: "HTd",
                    summary: "Definite article",
                },
            },
            {
                originalForm: "אָ֗רֶץ",
                role: "root",
                strongsNumbers: ["H0776G"],
                sourceStrongSegment: "{H0776G}",
                sourceGrammarSegment: "Ncfsa",
                matchedStrong: true,
                morphology: { language: "H", code: "HNcfsa" },
            },
        ]);
    });

    it("aligns an actual pinned TAHOT Piel participle row", () => {
        const words = parseTahotVerse(GENESIS_1_2_11, "Gen.1.2");

        const match = findTahotSegment(words, "H7363", 1);

        expect(match?.originalForm).toBe("מְרַחֶ֖פֶת");
        expect(match?.morphology).toMatchObject({
            language: "H",
            code: "HVprfsa",
            partOfSpeech: "Verb",
            qualifier: "Piel · Absolute",
            form: "Participle active",
            person: null,
            gender: "Feminine",
            number: "Singular",
            state: "Absolute",
        });
        expect(match?.morphology.summary).toContain(
            "Verb · Piel · Absolute · Participle active · Singular · Feminine",
        );
        expect(match?.morphemes).toHaveLength(1);
        expect(match?.morphemes[0]).toMatchObject({
            originalForm: "מְרַחֶ֖פֶת",
            role: "root",
            strongsNumbers: ["H7363B"],
            sourceStrongSegment: "{H7363B}",
            sourceGrammarSegment: "HVprfsa",
            matchedStrong: true,
        });
    });

    it("maps a root Strong's instance to the corresponding Hebrew segment", () => {
        const words = parseTahotVerse(GENESIS_1_1, "Gen.1.1");

        const match = findTahotSegment(words, "H7225", 1);

        expect(match?.originalForm).toBe("רֵאשִׁ֖ית");
        expect(match?.morphology.code).toBe("HNcfsa");
        expect(match?.morphology.summary).toContain(
            "Noun · Common · Absolute · Singular · Feminine",
        );
        expect(match?.morphemes).toHaveLength(2);
        expect(match?.morphemes[0]).toMatchObject({
            originalForm: "בְּ",
            role: "prefix",
            strongsNumbers: ["H9003"],
            sourceStrongSegment: "H9003",
            sourceGrammarSegment: "HR",
            matchedStrong: false,
            morphology: { code: "HR", summary: "Preposition" },
        });
        expect(match?.morphemes[1]).toMatchObject({
            originalForm: "רֵאשִׁ֖ית",
            role: "root",
            strongsNumbers: ["H7225G"],
            sourceStrongSegment: "{H7225G}",
            sourceGrammarSegment: "Ncfsa",
            matchedStrong: true,
            morphology: { code: "HNcfsa" },
        });
    });

    it("preserves a morpheme with no Strong's tag", () => {
        const fixture =
            "Gen.1.1#01=L\tבְּ/רֵאשִׁ֖ית/־\tbe./re.Shit/-\tin/ beginning/\tH9003/{H7225G}/\tHR/Ncfsa/Td\t\t\tH7225G\t\t\t";
        const words = parseTahotVerse(fixture, "Gen.1.1");

        const match = findTahotSegment(words, "H7225", 1);

        expect(match?.morphemes[2]).toMatchObject({
            originalForm: "־",
            strongsNumbers: [],
            sourceStrongSegment: "",
            sourceGrammarSegment: "Td",
        });
    });

    it("classifies a trailing suffix as a suffix", () => {
        const fixture =
            "Gen.1.1#01=L\tבְּ/רֵאשִׁ֖ית/וֹ\tbe./re.Shit/o\tin/ beginning/his\tH9003/{H7225G}/H0001\tHR/Ncfsa/Sp3m\t\t\tH7225G\t\t\t";
        const words = parseTahotVerse(fixture, "Gen.1.1");

        const match = findTahotSegment(words, "H7225", 1);

        expect(match?.morphemes).toMatchObject([
            { role: "prefix", originalForm: "בְּ" },
            { role: "root", originalForm: "רֵאשִׁ֖ית" },
            { role: "suffix", originalForm: "וֹ" },
        ]);
    });

    it("marks the morpheme that matched the selected Strong's occurrence", () => {
        const words = parseTahotVerse(GENESIS_1_1, "Gen.1.1");

        const rootMatch = findTahotSegment(words, "H7225", 1);
        const prefixMatch = findTahotSegment(words, "H9003", 1);

        expect(rootMatch?.morphemes.map((morpheme) => morpheme.matchedStrong)).toEqual([
            false,
            true,
        ]);
        expect(prefixMatch?.morphemes.map((morpheme) => morpheme.matchedStrong)).toEqual([
            true,
            false,
        ]);
    });

    it("maps a prefix Strong's number to its own Hebrew segment", () => {
        const words = parseTahotVerse(GENESIS_1_1, "Gen.1.1");

        const match = findTahotSegment(words, "H9003", 1);

        expect(match?.originalForm).toBe("בְּ");
        expect(match?.morphology.code).toBe("HR");
        expect(match?.morphology.summary).toBe("Preposition");
    });

    it("re-attaches the language marker to later composite grammar segments", () => {
        const fixture =
            "Gen.1.3#01=L\tוַ/יֹּ֥אמֶר\tva/i.Yo.mer\tand/ he said\tH9001/{H0559}\tHc/Vqw3ms\t\t\tH0559\t\t\t";
        const words = parseTahotVerse(fixture, "Gen.1.3");

        const match = findTahotSegment(words, "H0559", 1);

        expect(match?.originalForm).toBe("יֹּ֥אמֶר");
        expect(match?.morphology.code).toBe("HVqw3ms");
        expect(match?.morphology.summary).toContain(
            "Verb · Qal · Sequential imperfect · 3rd person · Singular · Masculine",
        );
    });

    it("aligns an Aramaic composite TAHOT word and preserves its language", () => {
        const fixture =
            "Dan.2.4#01=L\tאֲ/מַר\t'a./mar\tsaid/ he said\tH9001/{H0559A}\tAC/AVqp3ms\t\t\tH0559A\t\t\t";
        const words = parseTahotVerse(fixture, "Dan.2.4");

        const match = findTahotSegment(words, "H0559", 1);

        expect(match?.originalForm).toBe("מַר");
        expect(match?.morphology.language).toBe("A");
        expect(match?.morphology.code).toBe("AVqp3ms");
        expect(match?.morphemes).toMatchObject([
            {
                originalForm: "אֲ",
                role: "prefix",
                strongsNumbers: ["H9001"],
                matchedStrong: false,
                morphology: { language: "A", code: "AC" },
            },
            {
                originalForm: "מַר",
                role: "root",
                strongsNumbers: ["H0559A"],
                matchedStrong: true,
                morphology: { language: "A", code: "AVqp3ms" },
            },
        ]);
    });

    it("keeps Strong's disambiguation out of the base-number comparison", () => {
        expect(baseStrong("H7225G")).toBe("H7225");
        expect(baseStrong("H0430G")).toBe("H0430");
    });
});
