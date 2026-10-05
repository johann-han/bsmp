import { describe, expect, it } from "vitest";

import { parseHebrewMorphology } from "./strongsHebrewMorphology";

describe("Hebrew morphology", () => {
    it("decodes a both-gender singular absolute noun", () => {
        expect(parseHebrewMorphology("HNcbsa")).toMatchObject({
            language: "H",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Both",
            number: "Singular",
            state: "Absolute",
        });

        expect(parseHebrewMorphology("HNcbsa").summary).toContain(
            "Noun · Common · Absolute · Singular · Both",
        );
    });

    it("decodes an Open Scriptures common masculine plural absolute noun", () => {
        expect(parseHebrewMorphology("HNcmpa")).toMatchObject({
            language: "H",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Plural",
            state: "Absolute",
        });
    });

    it("decodes a common masculine singular absolute noun", () => {
        expect(parseHebrewMorphology("HNcmsa")).toMatchObject({
            language: "H",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });

        expect(parseHebrewMorphology("HNcmsa").summary).toContain(
            "Noun · Common · Absolute · Singular · Masculine",
        );
    });

    it("decodes a TEHMC title noun", () => {
        expect(parseHebrewMorphology("HNtfsa")).toMatchObject({
            language: "H",
            partOfSpeech: "Noun",
            qualifier: "Title · Absolute",
            gender: "Feminine",
            number: "Singular",
            state: "Absolute",
        });

        expect(parseHebrewMorphology("HNtfsa").summary).toContain(
            "Noun · Title · Absolute · Singular · Feminine",
        );
    });

    it("decodes a TEHMC feminine plural absolute title noun", () => {
        expect(parseHebrewMorphology("HNtfpa")).toMatchObject({
            language: "H",
            partOfSpeech: "Noun",
            qualifier: "Title · Absolute",
            gender: "Feminine",
            number: "Plural",
            state: "Absolute",
        });

        expect(parseHebrewMorphology("HNtfpa").summary).toContain(
            "Noun · Title · Absolute · Plural · Feminine",
        );
    });

    it("decodes a TEHMC masculine singular construct title noun", () => {
        expect(parseHebrewMorphology("HNtmsc")).toMatchObject({
            language: "H",
            partOfSpeech: "Noun",
            qualifier: "Title · Construct",
            gender: "Masculine",
            number: "Singular",
            state: "Construct",
        });

        expect(parseHebrewMorphology("HNtmsc").summary).toContain(
            "Noun · Title · Construct · Singular · Masculine",
        );
    });

    it("decodes the next Genesis 2 Open Scriptures standalone proper-name noun", () => {
        expect(parseHebrewMorphology("HNp")).toMatchObject({
            language: "H",
            partOfSpeech: "Noun",
            qualifier: "Proper name",
            person: null,
            gender: null,
            number: null,
            state: null,
            tense: null,
        });

        expect(parseHebrewMorphology("HNp").summary).toBe(
            "Noun · Proper name",
        );
    });

    it("decodes a proper-name noun", () => {
        expect(parseHebrewMorphology("HNpmsa")).toMatchObject({
            partOfSpeech: "Noun",
            qualifier: "Proper name · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
    });

    it("decodes the next Genesis 2 Open Scriptures feminine plural construct noun", () => {
        expect(parseHebrewMorphology("HNcfpc")).toMatchObject({
            language: "H",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Feminine",
            number: "Plural",
            state: "Construct",
        });

        expect(parseHebrewMorphology("HNcfpc").summary).toContain(
            "Noun · Common · Construct · Plural · Feminine",
        );
    });

    it("decodes a gentilic noun", () => {
        expect(parseHebrewMorphology("HNgmsa")).toMatchObject({
            partOfSpeech: "Noun",
            qualifier: "Gentilic · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
    });

    it("decodes a proper-name title noun", () => {
        expect(parseHebrewMorphology("HNpt")).toMatchObject({
            partOfSpeech: "Noun",
            qualifier: "Proper name · Title",
            gender: null,
            number: null,
            state: null,
        });
    });

    it("decodes a common noun with both-gender plural construct features", () => {
        expect(parseHebrewMorphology("HNcbpc")).toMatchObject({
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Both",
            number: "Plural",
            state: "Construct",
        });
    });

    it("decodes a common feminine singular absolute noun", () => {
        expect(parseHebrewMorphology("HNcfsa")).toMatchObject({
            language: "H",
            code: "HNcfsa",
            partOfSpeech: "Noun",
            number: "Singular",
            gender: "Feminine",
            state: "Absolute",
            qualifier: "Common · Absolute",
        });

        expect(parseHebrewMorphology("HNcfsa").summary).toContain(
            "Noun · Common · Absolute · Singular · Feminine",
        );
    });

    it("decodes a construct noun state", () => {
        expect(parseHebrewMorphology("HNcfsc")).toMatchObject({
            partOfSpeech: "Noun",
            number: "Singular",
            gender: "Feminine",
            state: "Construct",
            qualifier: "Common · Construct",
        });
    });

    it("decodes a determined-state masculine singular noun", () => {
        expect(parseHebrewMorphology("HNcmsd")).toMatchObject({
            partOfSpeech: "Noun",
            qualifier: "Common · Determined",
            gender: "Masculine",
            number: "Singular",
            state: "Determined",
        });
    });

    it("decodes a common masculine singular construct noun", () => {
        expect(parseHebrewMorphology("HNcmsc")).toMatchObject({
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Masculine",
            number: "Singular",
            state: "Construct",
        });
    });

    it("decodes a participle with the Open Scriptures x placeholder", () => {
        expect(parseHebrewMorphology("HVprxfs")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            form: "Participle active",
            qualifier: "Piel",
            person: null,
            gender: "Feminine",
            number: "Singular",
            state: null,
        });

        expect(parseHebrewMorphology("HVprxfs").summary).toContain(
            "Verb · Piel · Participle active · Singular · Feminine",
        );
    });

    it("decodes an Open Scriptures feminine singular Qal participle", () => {
        expect(parseHebrewMorphology("HVqrxfs")).toMatchObject({
            partOfSpeech: "Verb",
            form: "Participle active",
            qualifier: "Qal",
            person: null,
            gender: "Feminine",
            number: "Singular",
            state: null,
            tense: null,
        });
    });

    it("decodes Open Scriptures masculine singular participles", () => {
        expect(parseHebrewMorphology("HVqrxms")).toMatchObject({
            partOfSpeech: "Verb",
            form: "Participle active",
            qualifier: "Qal",
            person: null,
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
        });

        expect(parseHebrewMorphology("HVhrxms")).toMatchObject({
            partOfSpeech: "Verb",
            form: "Participle active",
            qualifier: "Hiphil",
            person: null,
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
        });
    });

    it("decodes a noun with both-gender plural absolute features", () => {
        expect(parseHebrewMorphology("HNcbpa")).toMatchObject({
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Both",
            number: "Plural",
            state: "Absolute",
        });
    });

    it("decodes an Open Scriptures Qal cohortative verb", () => {
        expect(parseHebrewMorphology("HVqh1cp")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            form: "Cohortative",
            mood: "Cohortative",
            qualifier: "Qal",
            person: "1st",
            gender: "Common",
            number: "Plural",
            state: null,
            tense: null,
        });
    });

    it("decodes an Open Scriptures Qal imperative verb", () => {
        expect(parseHebrewMorphology("HVqv2mp")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Imperative",
            mood: "Imperative",
            person: "2nd",
            gender: "Masculine",
            number: "Plural",
            state: null,
            tense: null,
        });
    });

    it("decodes an Open Scriptures Qal imperfect verb", () => {
        expect(parseHebrewMorphology("HVqi3ms")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Imperfect",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
        });
    });

    it("decodes the published Open Scriptures Qal infinitive-absolute pattern", () => {
        expect(parseHebrewMorphology("HVqaj3ms")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Infinitive absolute",
            person: null,
            gender: null,
            number: null,
            state: null,
            tense: null,
        });

        expect(parseHebrewMorphology("HVqaj3ms").summary).toContain(
            "Verb · Qal · Infinitive absolute",
        );
    });

    it("decodes a Qal imperfect verb with a first-person pronominal suffix", () => {
        const parsed = parseHebrewMorphology("HVqi3ms/Sp1bs");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HVqi3ms",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Imperfect",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HSp1bs",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "1st",
            gender: "Both",
            number: "Singular",
        });
        expect(parsed.summary).toContain(
            "Verb · Qal · Imperfect · 3rd person · Singular · Masculine",
        );
        expect(parsed.summary).toContain(
            "Suffix · Pronominal · 1st person · Singular · Both",
        );
    });

    it("decodes a masculine plural construct noun with a third-person suffix", () => {
        const parsed = parseHebrewMorphology("HNcmpc/Sp3ms");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HNcmpc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Masculine",
            number: "Plural",
            state: "Construct",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HSp3ms",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
        });
        expect(parsed.summary).toContain(
            "Noun · Common · Construct · Plural · Masculine",
        );
        expect(parsed.summary).toContain(
            "Suffix · Pronominal · 3rd person · Singular · Masculine",
        );
    });

    it("decodes a both-gender plural construct noun with a first-person suffix", () => {
        const parsed = parseHebrewMorphology("HNcbpc/Sp1bs");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HNcbpc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Both",
            number: "Plural",
            state: "Construct",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HSp1bs",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "1st",
            gender: "Both",
            number: "Singular",
        });
        expect(parsed.summary).toContain(
            "Noun · Common · Construct · Plural · Both",
        );
        expect(parsed.summary).toContain(
            "Suffix · Pronominal · 1st person · Singular · Both",
        );
    });

    it("decodes a Piel imperfect first-person common singular verb", () => {
        expect(parseHebrewMorphology("HVpi1cs")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Piel",
            form: "Imperfect",
            person: "1st",
            gender: "Common",
            number: "Singular",
            state: null,
            tense: null,
        });

        expect(parseHebrewMorphology("HVpi1cs").summary).toContain(
            "Verb · Piel · Imperfect · 1st person · Singular · Common",
        );
    });

    it("decodes the next Genesis 2 Open Scriptures Hiphil perfect verb", () => {
        expect(parseHebrewMorphology("HVhp3ms")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Hiphil",
            form: "Perfect",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
            mood: null,
        });

        expect(parseHebrewMorphology("HVhp3ms").summary).toContain(
            "Verb · Hiphil · Perfect · 3rd person · Singular · Masculine",
        );
    });

    it("decodes the next Genesis 2 Open Scriptures Hiphil imperfect composite", () => {
        const parsed = parseHebrewMorphology("HC/Vhq3ms");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HC",
            partOfSpeech: "Conjunction",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVhq3ms",
            partOfSpeech: "Verb",
            qualifier: "Hiphil",
            form: "Sequential perfect",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
            mood: null,
        });
        expect(parsed.summary).toContain("Conjunction");
        expect(parsed.summary).toContain(
            "Verb · Hiphil · Sequential perfect · 3rd person · Singular · Masculine",
        );
    });

    it("decodes a Hiphil imperfect first-person common singular verb", () => {
        expect(parseHebrewMorphology("HVhi1cs")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Hiphil",
            form: "Imperfect",
            person: "1st",
            gender: "Common",
            number: "Singular",
            state: null,
            tense: null,
        });

        expect(parseHebrewMorphology("HVhi1cs").summary).toContain(
            "Verb · Hiphil · Imperfect · 1st person · Singular · Common",
        );
    });

    it("decodes an Open Scriptures Qal jussive verb", () => {
        expect(parseHebrewMorphology("HVqj3ms")).toMatchObject({
            partOfSpeech: "Verb",
            form: "Jussive",
            mood: "Jussive",
            qualifier: "Qal",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
        });
    });

    it("decodes the pinned TAHOT Hophal perfect feminine singular form", () => {
        expect(parseHebrewMorphology("HVHp3fs")).toMatchObject({
            language: "H",
            code: "HVHp3fs",
            partOfSpeech: "Verb",
            qualifier: "Hophal",
            form: "Perfect",
            person: "3rd",
            gender: "Feminine",
            number: "Singular",
            state: null,
            tense: null,
            mood: null,
        });

        expect(parseHebrewMorphology("HVHp3fs").summary).toContain(
            "Verb · Hophal · Perfect · 3rd person · Singular · Feminine",
        );
    });

    it("decodes the pinned TAHOT Hophal perfect common plural form", () => {
        expect(parseHebrewMorphology("HVHp3cp")).toMatchObject({
            language: "H",
            code: "HVHp3cp",
            partOfSpeech: "Verb",
            qualifier: "Hophal",
            form: "Perfect",
            person: "3rd",
            gender: "Common",
            number: "Plural",
            state: null,
            tense: null,
            mood: null,
        });

        expect(parseHebrewMorphology("HVHp3cp").summary).toContain(
            "Verb · Hophal · Perfect · 3rd person · Plural · Common",
        );
    });

    it("decodes the pinned TAHOT Hophal passive participle feminine plural construct form", () => {
        expect(parseHebrewMorphology("HVHsfpc")).toMatchObject({
            language: "H",
            code: "HVHsfpc",
            partOfSpeech: "Verb",
            qualifier: "Hophal · Construct",
            form: "Participle passive",
            person: null,
            gender: "Feminine",
            number: "Plural",
            state: "Construct",
            tense: null,
            mood: null,
        });

        expect(parseHebrewMorphology("HVHsfpc").summary).toContain(
            "Verb · Hophal · Construct · Participle passive · Plural · Feminine",
        );
    });

    it("decodes the pinned TAHOT Hiphil imperfect feminine plural form", () => {
        expect(parseHebrewMorphology("HVhi3fp")).toMatchObject({
            language: "H",
            code: "HVhi3fp",
            partOfSpeech: "Verb",
            qualifier: "Hiphil",
            form: "Imperfect",
            person: "3rd",
            gender: "Feminine",
            number: "Plural",
            state: null,
            tense: null,
            mood: null,
        });

        expect(parseHebrewMorphology("HVhi3fp").summary).toContain(
            "Verb · Hiphil · Imperfect · 3rd person · Plural · Feminine",
        );
    });

    it("decodes an Open Scriptures third-person feminine Hiphil imperfect verb", () => {
        expect(parseHebrewMorphology("HVhij3fs")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Hiphil",
            form: "Imperfect",
            person: "3rd",
            gender: "Feminine",
            number: "Singular",
            state: null,
            tense: null,
        });

        expect(parseHebrewMorphology("HVhij3fs").summary).toContain(
            "Verb · Hiphil · Imperfect · 3rd person · Singular · Feminine",
        );
    });

    it("decodes an Open Scriptures third-person feminine Qal perfect verb", () => {
        expect(parseHebrewMorphology("HVqp3fs")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Perfect",
            person: "3rd",
            gender: "Feminine",
            number: "Singular",
            state: null,
            tense: null,
        });
    });

    it("decodes an Open Scriptures third-person common-plural Qal perfect verb", () => {
        expect(parseHebrewMorphology("HVqp3cp")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Perfect",
            person: "3rd",
            gender: "Common",
            number: "Plural",
            state: null,
            tense: null,
        });
    });

    it("decodes an Open Scriptures first-person Qal perfect verb", () => {
        expect(parseHebrewMorphology("HVqp1cs")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Perfect",
            person: "1st",
            gender: "Common",
            number: "Singular",
            state: null,
            tense: null,
        });
    });

    it("decodes a Qal perfect verb", () => {
        expect(parseHebrewMorphology("HVqp3ms")).toMatchObject({
            partOfSpeech: "Verb",
            tense: null,
            form: "Perfect",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            qualifier: "Qal",
        });

        expect(parseHebrewMorphology("HVqp3ms").summary).toContain(
            "Verb · Qal · Perfect · 3rd person · Singular · Masculine",
        );
        expect(parseHebrewMorphology("HVqp3ms").summary).not.toContain("Past / present");
    });

    it("decodes the conjunctive conjunction form", () => {
        expect(parseHebrewMorphology("HCc")).toMatchObject({
            language: "H",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
    });

    it("decodes the vav-consecutive conjunction form", () => {
        expect(parseHebrewMorphology("HCv")).toMatchObject({
            language: "H",
            partOfSpeech: "Conjunction",
            qualifier: "Vav consecutive",
        });
    });

    it("decodes an Open Scriptures standalone Hebrew preposition", () => {
        expect(parseHebrewMorphology("HR")).toMatchObject({
            language: "H",
            partOfSpeech: "Preposition",
            qualifier: null,
            person: null,
            gender: null,
            number: null,
            state: null,
            tense: null,
        });

        expect(parseHebrewMorphology("HR").summary).toBe("Preposition");
    });

    it("decodes the next Genesis 2 Open Scriptures negative particle", () => {
        expect(parseHebrewMorphology("HTn")).toMatchObject({
            language: "H",
            partOfSpeech: "Particle",
            qualifier: "Negative",
            person: null,
            gender: null,
            number: null,
            state: null,
            tense: null,
        });

        expect(parseHebrewMorphology("HTn").summary).toBe(
            "Particle · Negative",
        );
    });

    it("decodes a definite article", () => {
        expect(parseHebrewMorphology("HTd")).toMatchObject({
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
    });

    it("decodes a personal pronoun with an unspecified person placeholder", () => {
        expect(parseHebrewMorphology("HPpxfs")).toMatchObject({
            partOfSpeech: "Pronoun",
            qualifier: "Personal",
            person: null,
            gender: "Feminine",
            number: "Singular",
            state: null,
        });
    });

    it("decodes an Open Scriptures interrogative pronoun", () => {
        expect(parseHebrewMorphology("HPi")).toMatchObject({
            language: "H",
            partOfSpeech: "Pronoun",
            qualifier: "Interrogative",
            person: null,
            gender: null,
            number: null,
            state: null,
        });

        expect(parseHebrewMorphology("HPi").summary).toContain(
            "Pronoun · Interrogative",
        );
    });

    it("decodes the next Genesis 2 Open Scriptures demonstrative pronoun", () => {
        expect(parseHebrewMorphology("HPdxcp")).toMatchObject({
            language: "H",
            partOfSpeech: "Pronoun",
            qualifier: "Demonstrative",
            person: null,
            gender: "Common",
            number: "Plural",
            state: null,
            tense: null,
        });

        expect(parseHebrewMorphology("HPdxcp").summary).toContain(
            "Pronoun · Demonstrative · Plural · Common",
        );
    });

    it("decodes a demonstrative pronoun", () => {
        expect(parseHebrewMorphology("HPd")).toMatchObject({
            partOfSpeech: "Pronoun",
            qualifier: "Demonstrative",
        });
    });

    it("decodes a standalone relative pronoun", () => {
        expect(parseHebrewMorphology("HPr")).toMatchObject({
            partOfSpeech: "Pronoun",
            qualifier: "Relative",
            person: null,
            gender: null,
            number: null,
            state: null,
        });
    });

    it("decodes a personal pronoun", () => {
        expect(parseHebrewMorphology("HPp3ms")).toMatchObject({
            partOfSpeech: "Pronoun",
            qualifier: "Personal",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
        });
    });

    it("decodes a standard adjective", () => {
        expect(parseHebrewMorphology("HAamsa")).toMatchObject({
            partOfSpeech: "Adjective",
            qualifier: "Adjective · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
    });

    it("decodes an adjective without an explicit state suffix", () => {
        expect(parseHebrewMorphology("HAams")).toMatchObject({
            partOfSpeech: "Adjective",
            qualifier: "Adjective",
            gender: "Masculine",
            number: "Singular",
            state: null,
        });
    });

    it("decodes an adjective with an unspecified gender placeholder", () => {
        expect(parseHebrewMorphology("HAxmsa")).toMatchObject({
            partOfSpeech: "Adjective",
            qualifier: "Unspecified · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
    });

    it("decodes an Open Scriptures feminine singular absolute adjective", () => {
        expect(parseHebrewMorphology("HAafsa")).toMatchObject({
            language: "H",
            partOfSpeech: "Adjective",
            qualifier: "Adjective · Absolute",
            gender: "Feminine",
            number: "Singular",
            state: "Absolute",
        });
    });

    it("decodes a gentilic adjective", () => {
        expect(parseHebrewMorphology("HAgmsa")).toMatchObject({
            partOfSpeech: "Adjective",
            qualifier: "Gentilic · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
    });

    it("decodes a cardinal adjective in masculine dual construct form", () => {
        expect(parseHebrewMorphology("HAcmdc")).toMatchObject({
            language: "H",
            partOfSpeech: "Adjective",
            qualifier: "Cardinal number · Construct",
            gender: "Masculine",
            number: "Dual",
            state: "Construct",
        });
    });

    it("decodes a cardinal adjective", () => {
        expect(parseHebrewMorphology("HAcmsa")).toMatchObject({
            partOfSpeech: "Adjective",
            qualifier: "Cardinal number · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
    });

    it("decodes an ordinal adjective", () => {
        expect(parseHebrewMorphology("HAomsa")).toMatchObject({
            partOfSpeech: "Adjective",
            qualifier: "Ordinal number · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
    });

    it("decodes a preposition plus noun composite", () => {
        const parsed = parseHebrewMorphology("HR/Ncfsa");

        expect(parsed).toMatchObject({
            language: "H",
            code: "HR/Ncfsa",
        });
        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcfsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Feminine",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Preposition");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Singular · Feminine",
        );
    });

    it("decodes an Open Scriptures Qal jussive masculine plural verb", () => {
        expect(parseHebrewMorphology("HVqj3mp")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Jussive",
            mood: "Jussive",
            person: "3rd",
            gender: "Masculine",
            number: "Plural",
            state: null,
            tense: null,
        });

        expect(parseHebrewMorphology("HVqj3mp").summary).toContain(
            "Verb · Qal · Jussive · Jussive · 3rd person · Plural · Masculine",
        );
    });

    it("decodes an Open Scriptures Piel jussive verb", () => {
        expect(parseHebrewMorphology("HVpj3ms")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Piel",
            form: "Jussive",
            mood: "Jussive",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
        });
    });

    it("decodes an Open Scriptures Niphal jussive verb", () => {
        expect(parseHebrewMorphology("HVNj3mp")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Niphal",
            form: "Jussive",
            mood: "Jussive",
            person: "3rd",
            gender: "Masculine",
            number: "Plural",
            state: null,
            tense: null,
        });
    });

    it("decodes an Open Scriptures standalone direct-object marker", () => {
        expect(parseHebrewMorphology("HTo")).toMatchObject({
            language: "H",
            code: "HTo",
            partOfSpeech: "Particle",
            qualifier: "Direct object marker",
            tense: null,
            person: null,
            gender: null,
            number: null,
            state: null,
        });
        expect(parseHebrewMorphology("HTo").summary).toBe(
            "Particle · Direct object marker",
        );
    });

    it("decodes an Open Scriptures standalone Hebrew adverb", () => {
        expect(parseHebrewMorphology("HD")).toMatchObject({
            language: "H",
            code: "HD",
            partOfSpeech: "Adverb",
            qualifier: null,
            tense: null,
            person: null,
            gender: null,
            number: null,
            state: null,
        });
        expect(parseHebrewMorphology("HD").summary).toBe("Adverb");
    });

    it("decodes an Open Scriptures Hiphil jussive verb", () => {
        expect(parseHebrewMorphology("HVhj3fs")).toMatchObject({
            language: "H",
            partOfSpeech: "Verb",
            qualifier: "Hiphil",
            form: "Jussive",
            mood: "Jussive",
            person: "3rd",
            gender: "Feminine",
            number: "Singular",
            state: null,
            tense: null,
        });
    });

    it("decodes the next Genesis 2 Open Scriptures preposition/article/both-gender noun composite", () => {
        const parsed = parseHebrewMorphology("HRd/Ncbsa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HRd",
            partOfSpeech: "Preposition",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcbsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Both",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Preposition · Definite article");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Singular · Both",
        );
    });

    it("decodes a preposition plus feminine singular construct noun", () => {
        const parsed = parseHebrewMorphology("HR/Ncfsc");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcfsc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Feminine",
            number: "Singular",
            state: "Construct",
        });
    });

    it("decodes the next Genesis 2 Open Scriptures Niphal infinitive-suffix composite", () => {
        const parsed = parseHebrewMorphology("HR/VNc/Sp3mp");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVNc",
            partOfSpeech: "Verb",
            qualifier: "Niphal",
            form: "Infinitive construct",
            person: null,
            gender: null,
            number: null,
            state: null,
            tense: null,
            mood: null,
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HSp3mp",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Masculine",
            number: "Plural",
        });
        expect(parsed.summary).toContain("Preposition");
        expect(parsed.summary).toContain(
            "Verb · Niphal · Infinitive construct",
        );
        expect(parsed.summary).toContain(
            "Suffix · Pronominal · 3rd person · Plural · Masculine",
        );
    });

    it("decodes a preposition plus Qal infinitive-construct composite", () => {
        const parsed = parseHebrewMorphology("HR/Vqc");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVqc",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Infinitive construct",
            person: null,
            gender: null,
            number: null,
            state: null,
            tense: null,
        });
    });

    it("decodes a preposition plus Hiphil infinitive-construct composite", () => {
        const parsed = parseHebrewMorphology("HR/Vhc");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVhc",
            partOfSpeech: "Verb",
            qualifier: "Hiphil",
            form: "Infinitive construct",
            person: null,
            gender: null,
            number: null,
            state: null,
        });
    });

    it("decodes a definite-article inseparable-preposition composite", () => {
        const parsed = parseHebrewMorphology("HTp/Ncmsa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTp",
            partOfSpeech: "Particle",
            qualifier: "Definite article with inseparable preposition",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
    });

    it("decodes a preposition plus third-person plural pronominal suffix", () => {
        const parsed = parseHebrewMorphology("HR/Sp3mp");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HSp3mp",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Masculine",
            number: "Plural",
        });
    });

    it("decodes the next Genesis 2 Open Scriptures dual-construct noun and suffix composite", () => {
        const parsed = parseHebrewMorphology("HR/Ncmdc/Sp3ms");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmdc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Masculine",
            number: "Dual",
            state: "Construct",
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HSp3ms",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
        });
        expect(parsed.summary).toContain("Preposition");
        expect(parsed.summary).toContain(
            "Noun · Common · Construct · Dual · Masculine",
        );
        expect(parsed.summary).toContain(
            "Suffix · Pronominal · 3rd person · Singular · Masculine",
        );
    });

    it("decodes a preposition plus plural construct noun and pronominal suffix composite", () => {
        const parsed = parseHebrewMorphology("HR/Ncmpc/Sp3mp");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmpc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Masculine",
            number: "Plural",
            state: "Construct",
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HSp3mp",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Masculine",
            number: "Plural",
        });
    });

    it("decodes a preposition/noun/pronominal-suffix composite", () => {
        const parsed = parseHebrewMorphology("HR/Ncmsc/Sp3ms");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmsc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Masculine",
            number: "Singular",
            state: "Construct",
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HSp3ms",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
        });
    });

    it("decodes the next Genesis 2 Open Scriptures conjunction/article/noun composite", () => {
        const parsed = parseHebrewMorphology("HC/Td/Ncbsa");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HC",
            partOfSpeech: "Conjunction",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HNcbsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Both",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Conjunction");
        expect(parsed.summary).toContain("Particle · Definite article");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Singular · Both",
        );
    });

    it("decodes a three-part conjunction/article/noun composite", () => {
        const parsed = parseHebrewMorphology("HCc/Td/Ncfsa");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HNcfsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Feminine",
            number: "Singular",
            state: "Absolute",
        });
    });

    it("decodes a composite Hebrew word code", () => {
        const parsed = parseHebrewMorphology("HCv/Vqw3ms");

        expect(parsed).toMatchObject({
            language: "H",
            code: "HCv/Vqw3ms",
        });
        expect(parsed.summary).toContain("Conjunction");
        expect(parsed.summary).toContain("Verb · Qal · Sequential imperfect");
        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]?.summary).toBe("Conjunction · Vav consecutive");
        expect(parsed.segments?.[1]?.summary).toContain(
            "Verb · Qal · Sequential imperfect · 3rd person · Singular · Masculine",
        );
    });

    it("decodes an article plus feminine adjective composite", () => {
        const parsed = parseHebrewMorphology("HTd/Aafsa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HAafsa",
            partOfSpeech: "Adjective",
            qualifier: "Adjective · Absolute",
            gender: "Feminine",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain(
            "Adjective · Absolute · Singular · Feminine",
        );
    });

    it("decodes an article plus masculine dual noun composite", () => {
        const parsed = parseHebrewMorphology("HTd/Ncmda");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmda",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Dual",
            state: "Absolute",
        });
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Dual · Masculine",
        );
    });

    it("decodes a conjunction plus both-gender singular construct noun", () => {
        const parsed = parseHebrewMorphology("HCc/Ncbsc");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcbsc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Both",
            number: "Singular",
            state: "Construct",
        });
        expect(parsed.summary).toContain("Conjunction · Conjunctive");
        expect(parsed.summary).toContain(
            "Noun · Common · Construct · Singular · Both",
        );
    });

    it("decodes an inseparable-preposition article plus plural noun composite", () => {
        const parsed = parseHebrewMorphology("HTp/Ncmpa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTp",
            partOfSpeech: "Particle",
            qualifier: "Definite article with inseparable preposition",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmpa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Plural",
            state: "Absolute",
        });
    });

    it("decodes a conjunction plus inseparable-preposition article and noun composite", () => {
        const parsed = parseHebrewMorphology("HCc/Tp/Ncfsa");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HTp",
            partOfSpeech: "Particle",
            qualifier: "Definite article with inseparable preposition",
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HNcfsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Feminine",
            number: "Singular",
            state: "Absolute",
        });
    });

    it("decodes a conjunction plus interjection composite", () => {
        const parsed = parseHebrewMorphology("HCc/Tj");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HTj",
            partOfSpeech: "Particle",
            qualifier: "Interjection",
        });
        expect(parsed.summary).toBe(
            "Conjunction · Conjunctive · Particle · Interjection",
        );
    });

    it("decodes a two-preposition composite", () => {
        const parsed = parseHebrewMorphology("HR/R");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.summary).toBe("Preposition · Preposition");
    });

    it("decodes a conjunction plus preposition and plural-noun composite", () => {
        const parsed = parseHebrewMorphology("HCc/R/Ncmpa");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HNcmpa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Plural",
            state: "Absolute",
        });
    });

    it("decodes a preposition plus second-person masculine plural suffix", () => {
        const parsed = parseHebrewMorphology("HR/Sp2mp");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HSp2mp",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "2nd",
            gender: "Masculine",
            number: "Plural",
        });
    });

    it("decodes a conjunction plus construct noun and pronominal-suffix composite", () => {
        const parsed = parseHebrewMorphology("HCc/Ncfsc/Sp3ms");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcfsc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Feminine",
            number: "Singular",
            state: "Construct",
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HSp3ms",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
        });
    });

    it("decodes a conjunctive conjunction plus Qal jussive composite", () => {
        const parsed = parseHebrewMorphology("HCc/Vqj3mp");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVqj3mp",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Jussive",
            mood: "Jussive",
            person: "3rd",
            gender: "Masculine",
            number: "Plural",
            state: null,
            tense: null,
        });
    });

    it("decodes a conjunction plus imperative and pronominal-suffix composite", () => {
        const parsed = parseHebrewMorphology("HCc/Vqv2mp/Sp3fs");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVqv2mp",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Imperative",
            mood: "Imperative",
            person: "2nd",
            gender: "Masculine",
            number: "Plural",
            state: null,
            tense: null,
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HSp3fs",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Feminine",
            number: "Singular",
        });
    });

    it("decodes a vav-consecutive plus sequential-perfect composite", () => {
        const parsed = parseHebrewMorphology("HCv/Vqq3cp");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCv",
            partOfSpeech: "Conjunction",
            qualifier: "Vav consecutive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVqq3cp",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Sequential perfect",
            person: "3rd",
            gender: "Common",
            number: "Plural",
            state: null,
            tense: null,
        });
        expect(parsed.summary).toContain("Conjunction · Vav consecutive");
        expect(parsed.summary).toContain(
            "Verb · Qal · Sequential perfect · 3rd person · Plural · Common",
        );
    });

    it("decodes an article plus masculine plural adjective composite", () => {
        const parsed = parseHebrewMorphology("HTd/Aampa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HAampa",
            partOfSpeech: "Adjective",
            qualifier: "Adjective · Absolute",
            gender: "Masculine",
            number: "Plural",
            state: "Absolute",
        });
    });

    it("decodes an article plus explicit feminine active participle composite", () => {
        const parsed = parseHebrewMorphology("HTd/Vqrfs");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVqrfs",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Participle active",
            person: null,
            gender: "Feminine",
            number: "Singular",
            state: null,
            tense: null,
        });
        expect(parsed.summary).toContain("Particle · Definite article");
        expect(parsed.summary).toContain(
            "Verb · Qal · Participle active · Singular · Feminine",
        );
    });

    it("decodes an article plus feminine active participle composite", () => {
        const parsed = parseHebrewMorphology("HTd/Vqrxfs");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVqrxfs",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Participle active",
            person: null,
            gender: "Feminine",
            number: "Singular",
            state: null,
            tense: null,
        });
        expect(parsed.summary).toContain("Particle · Definite article");
        expect(parsed.summary).toContain(
            "Verb · Qal · Participle active · Singular · Feminine",
        );
    });

    it("decodes Open Scriptures composite article/noun patterns", () => {
        const parsed = parseHebrewMorphology("HTd/Ncmpa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmpa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Plural",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Particle · Definite article");
        expect(parsed.summary).toContain("Noun · Common · Absolute · Plural · Masculine");
    });

    it("decodes an article plus feminine singular absolute noun composite", () => {
        const parsed = parseHebrewMorphology("HTd/Ncfsa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcfsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Feminine",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Particle · Definite article");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Singular · Feminine",
        );
    });

    it("decodes an article plus masculine singular absolute noun composite", () => {
        const parsed = parseHebrewMorphology("HTd/Ncmsa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Particle · Definite article");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Singular · Masculine",
        );
    });

    it("decodes the next Genesis 2 Open Scriptures conjunction/plural-noun composite", () => {
        const parsed = parseHebrewMorphology("HC/Ncmpa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HC",
            partOfSpeech: "Conjunction",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmpa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Plural",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Conjunction");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Plural · Masculine",
        );
    });

    it("decodes the next Genesis 2 Open Scriptures conjunction/singular-noun composite", () => {
        const parsed = parseHebrewMorphology("HC/Ncmsa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HC",
            partOfSpeech: "Conjunction",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Conjunction");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Singular · Masculine",
        );
    });

    it("decodes a conjunction plus masculine singular absolute noun composite", () => {
        const parsed = parseHebrewMorphology("HCc/Ncmsa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Conjunction · Conjunctive");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Singular · Masculine",
        );
    });

    it("decodes a conjunction plus Qal imperative plural composite", () => {
        const parsed = parseHebrewMorphology("HCc/Vqv2mp");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVqv2mp",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Imperative",
            mood: "Imperative",
            person: "2nd",
            gender: "Masculine",
            number: "Plural",
            state: null,
            tense: null,
        });
        expect(parsed.summary).toContain("Conjunction · Conjunctive");
        expect(parsed.summary).toContain(
            "Verb · Qal · Imperative · Imperative · 2nd person · Plural · Masculine",
        );
    });

    it("decodes the next Genesis 2 Open Scriptures conjunction/construct-noun composite", () => {
        const parsed = parseHebrewMorphology("HC/Ncmsc");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HC",
            partOfSpeech: "Conjunction",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmsc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Masculine",
            number: "Singular",
            state: "Construct",
        });
        expect(parsed.summary).toContain("Conjunction");
        expect(parsed.summary).toContain(
            "Noun · Common · Construct · Singular · Masculine",
        );
    });

    it("decodes the next Genesis 2 Open Scriptures preposition/article/noun composite", () => {
        const parsed = parseHebrewMorphology("HRd/Ncmsa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HRd",
            partOfSpeech: "Preposition",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Preposition · Definite article");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Singular · Masculine",
        );
    });

    it("decodes a preposition plus masculine singular construct noun composite", () => {
        const parsed = parseHebrewMorphology("HR/Ncmsc");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmsc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Masculine",
            number: "Singular",
            state: "Construct",
        });
        expect(parsed.summary).toContain("Preposition");
        expect(parsed.summary).toContain(
            "Noun · Common · Construct · Singular · Masculine",
        );
    });

    it("decodes a conjunction plus preposition composite", () => {
        const parsed = parseHebrewMorphology("HCc/R");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.summary).toBe("Conjunction · Conjunctive · Preposition");
    });

    it("decodes a preposition plus third-person masculine singular pronominal suffix composite", () => {
        const parsed = parseHebrewMorphology("HR/Sp3ms");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HSp3ms",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
        });
        expect(parsed.summary).toContain("Preposition");
        expect(parsed.summary).toContain(
            "Suffix · Pronominal · 3rd person · Singular · Masculine",
        );
    });

    it("decodes a preposition plus construct noun and third-person feminine suffix composite", () => {
        const parsed = parseHebrewMorphology("HR/Ncmsc/Sp3fs");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmsc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Masculine",
            number: "Singular",
            state: "Construct",
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HSp3fs",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Feminine",
            number: "Singular",
        });
        expect(parsed.summary).toContain("Preposition");
        expect(parsed.summary).toContain("Noun · Common · Construct · Singular · Masculine");
        expect(parsed.summary).toContain("Suffix · Pronominal · 3rd person · Singular · Feminine");
    });

    it("decodes the next Genesis 2 Open Scriptures Piel sequential-imperfect composite", () => {
        const parsed = parseHebrewMorphology("HC/Vpw3ms");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HC",
            partOfSpeech: "Conjunction",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVpw3ms",
            partOfSpeech: "Verb",
            qualifier: "Piel",
            form: "Sequential imperfect",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
            mood: null,
        });
        expect(parsed.summary).toContain("Conjunction");
        expect(parsed.summary).toContain(
            "Verb · Piel · Sequential imperfect · 3rd person · Singular · Masculine",
        );
    });

    it("decodes a vav-consecutive plus Piel sequential-imperfect composite", () => {
        const parsed = parseHebrewMorphology("HCv/Vpw3ms");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCv",
            partOfSpeech: "Conjunction",
            qualifier: "Vav consecutive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVpw3ms",
            partOfSpeech: "Verb",
            qualifier: "Piel",
            form: "Sequential imperfect",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
        });
        expect(parsed.summary).toContain("Conjunction · Vav consecutive");
        expect(parsed.summary).toContain(
            "Verb · Piel · Sequential imperfect · 3rd person · Singular · Masculine",
        );
    });

    it("decodes the first Genesis 2 Open Scriptures Pual sequential-imperfect composite", () => {
        const parsed = parseHebrewMorphology("HC/VPw3mp");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HC",
            partOfSpeech: "Conjunction",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVPw3mp",
            partOfSpeech: "Verb",
            qualifier: "Pual",
            form: "Sequential imperfect",
            person: "3rd",
            gender: "Masculine",
            number: "Plural",
            state: null,
            tense: null,
            mood: null,
        });
        expect(parsed.summary).toContain("Conjunction");
        expect(parsed.summary).toContain(
            "Verb · Pual · Sequential imperfect · 3rd person · Plural · Masculine",
        );
    });

    it("decodes the next Genesis 2 Open Scriptures Qal sequential-imperfect composite", () => {
        const parsed = parseHebrewMorphology("HC/Vqw3ms");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HC",
            partOfSpeech: "Conjunction",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVqw3ms",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Sequential imperfect",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
            mood: null,
        });
        expect(parsed.summary).toContain("Conjunction");
        expect(parsed.summary).toContain(
            "Verb · Qal · Sequential imperfect · 3rd person · Singular · Masculine",
        );
    });

    it("decodes a vav-consecutive plus Hiphil sequential-imperfect composite", () => {
        const parsed = parseHebrewMorphology("HCv/Vhw3ms");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCv",
            partOfSpeech: "Conjunction",
            qualifier: "Vav consecutive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVhw3ms",
            partOfSpeech: "Verb",
            qualifier: "Hiphil",
            form: "Sequential imperfect",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
        });
        expect(parsed.summary).toContain("Conjunction · Vav consecutive");
        expect(parsed.summary).toContain(
            "Verb · Hiphil · Sequential imperfect · 3rd person · Singular · Masculine",
        );
    });

    it("decodes a preposition plus masculine plural absolute noun composite", () => {
        const parsed = parseHebrewMorphology("HR/Ncmpa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmpa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Plural",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Preposition");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Plural · Masculine",
        );
    });

    it("decodes an inseparable-preposition article plus feminine singular absolute noun composite", () => {
        const parsed = parseHebrewMorphology("HTp/Ncfsa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTp",
            partOfSpeech: "Particle",
            qualifier: "Definite article with inseparable preposition",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcfsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Feminine",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain(
            "Particle · Definite article with inseparable preposition",
        );
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Singular · Feminine",
        );
    });

    it("decodes the next Genesis 2 Open Scriptures both-gender noun and plural suffix composite", () => {
        const parsed = parseHebrewMorphology("HNcbsc/Sp3mp");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HNcbsc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Both",
            number: "Singular",
            state: "Construct",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HSp3mp",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Masculine",
            number: "Plural",
        });
        expect(parsed.summary).toContain(
            "Noun · Common · Construct · Singular · Both",
        );
        expect(parsed.summary).toContain(
            "Suffix · Pronominal · 3rd person · Plural · Masculine",
        );
    });

    it("decodes a construct noun plus third-person masculine singular suffix composite", () => {
        const parsed = parseHebrewMorphology("HNcmsc/Sp3ms");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HNcmsc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Masculine",
            number: "Singular",
            state: "Construct",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HSp3ms",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
        });
        expect(parsed.summary).toContain(
            "Noun · Common · Construct · Singular · Masculine",
        );
        expect(parsed.summary).toContain(
            "Suffix · Pronominal · 3rd person · Singular · Masculine",
        );
    });

    it("decodes an article plus masculine singular absolute adjective composite", () => {
        const parsed = parseHebrewMorphology("HTd/Aamsa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HAamsa",
            partOfSpeech: "Adjective",
            qualifier: "Adjective · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Particle · Definite article");
        expect(parsed.summary).toContain(
            "Adjective · Absolute · Singular · Masculine",
        );
    });

    it("decodes a conjunction plus Qal jussive composite", () => {
        const parsed = parseHebrewMorphology("HCc/Vqj3ms");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVqj3ms",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Jussive",
            mood: "Jussive",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
        });
        expect(parsed.summary).toContain("Conjunction · Conjunctive");
        expect(parsed.summary).toContain(
            "Verb · Qal · Jussive · Jussive · 3rd person · Singular · Masculine",
        );
    });

    it("decodes a conjunction plus Niphal jussive composite", () => {
        const parsed = parseHebrewMorphology("HCc/VNj3fs");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVNj3fs",
            partOfSpeech: "Verb",
            qualifier: "Niphal",
            form: "Jussive",
            mood: "Jussive",
            person: "3rd",
            gender: "Feminine",
            number: "Singular",
            state: null,
            tense: null,
        });
        expect(parsed.summary).toContain("Conjunction · Conjunctive");
        expect(parsed.summary).toContain(
            "Verb · Niphal · Jussive · Jussive · 3rd person · Singular · Feminine",
        );
    });

    it("decodes a vav-consecutive plus Hiphil feminine sequential-imperfect composite", () => {
        const parsed = parseHebrewMorphology("HCv/Vhw3fs");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCv",
            partOfSpeech: "Conjunction",
            qualifier: "Vav consecutive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVhw3fs",
            partOfSpeech: "Verb",
            qualifier: "Hiphil",
            form: "Sequential imperfect",
            person: "3rd",
            gender: "Feminine",
            number: "Singular",
            state: null,
            tense: null,
        });
        expect(parsed.summary).toContain("Conjunction · Vav consecutive");
        expect(parsed.summary).toContain(
            "Verb · Hiphil · Sequential imperfect · 3rd person · Singular · Feminine",
        );
    });

    it("decodes a preposition plus both-gender plural absolute noun composite", () => {
        const parsed = parseHebrewMorphology("HR/Ncbpa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcbpa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Both",
            number: "Plural",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Preposition");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Plural · Both",
        );
    });

    it("decodes a conjunction plus feminine plural absolute noun composite", () => {
        const parsed = parseHebrewMorphology("HCc/Ncfpa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcfpa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Feminine",
            number: "Plural",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Conjunction · Conjunctive");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Plural · Feminine",
        );
    });

    it("decodes a conjunction plus preposition and Hiphil infinitive-construct composite", () => {
        const parsed = parseHebrewMorphology("HCc/R/Vhc");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HVhc",
            partOfSpeech: "Verb",
            qualifier: "Hiphil",
            form: "Infinitive construct",
            person: null,
            gender: null,
            number: null,
            state: null,
            tense: null,
        });
        expect(parsed.summary).toContain("Conjunction · Conjunctive");
        expect(parsed.summary).toContain(
            "Verb · Hiphil · Infinitive construct",
        );
    });

    it("decodes a conjunction plus article and masculine noun composite", () => {
        const parsed = parseHebrewMorphology("HCc/Td/Ncmsa");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HNcmsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Conjunction · Conjunctive");
        expect(parsed.summary).toContain("Particle · Definite article");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Singular · Masculine",
        );
    });

    it("decodes a preposition plus masculine construct noun and first-person plural suffix composite", () => {
        const parsed = parseHebrewMorphology("HR/Ncmsc/Sp1cp");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcmsc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Masculine",
            number: "Singular",
            state: "Construct",
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HSp1cp",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "1st",
            gender: "Common",
            number: "Plural",
        });
        expect(parsed.summary).toContain("Preposition");
        expect(parsed.summary).toContain(
            "Noun · Common · Construct · Singular · Masculine",
        );
        expect(parsed.summary).toContain(
            "Suffix · Pronominal · 1st person · Plural · Common",
        );
    });

    it("decodes a preposition plus feminine construct noun and first-person plural suffix composite", () => {
        const parsed = parseHebrewMorphology("HR/Ncfsc/Sp1cp");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcfsc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Feminine",
            number: "Singular",
            state: "Construct",
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HSp1cp",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "1st",
            gender: "Common",
            number: "Plural",
        });
        expect(parsed.summary).toContain("Preposition");
        expect(parsed.summary).toContain(
            "Noun · Common · Construct · Singular · Feminine",
        );
        expect(parsed.summary).toContain(
            "Suffix · Pronominal · 1st person · Plural · Common",
        );
    });

    it("decodes a definite article plus masculine singular Qal participle composite", () => {
        const parsed = parseHebrewMorphology("HTd/Vqrxms");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVqrxms",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Participle active",
            person: null,
            gender: "Masculine",
            number: "Singular",
            state: null,
            tense: null,
        });
        expect(parsed.summary).toContain("Particle · Definite article");
        expect(parsed.summary).toContain(
            "Verb · Qal · Participle active · Singular · Masculine",
        );
    });

    it("decodes a conjunction plus feminine singular absolute noun composite", () => {
        const parsed = parseHebrewMorphology("HCc/Ncfsa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HNcfsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Feminine",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Conjunction · Conjunctive");
        expect(parsed.summary).toContain(
            "Noun · Common · Absolute · Singular · Feminine",
        );
    });

    it("decodes a definite article plus masculine singular ordinal adjective composite", () => {
        const parsed = parseHebrewMorphology("HTd/Aomsa");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTd",
            partOfSpeech: "Particle",
            qualifier: "Definite article",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HAomsa",
            partOfSpeech: "Adjective",
            qualifier: "Ordinal number · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
        expect(parsed.summary).toContain("Particle · Definite article");
        expect(parsed.summary).toContain(
            "Adjective · Ordinal number · Absolute · Singular · Masculine",
        );
    });

    it("decodes a direct-object-marker plus pronominal-suffix composite", () => {
        const parsed = parseHebrewMorphology("HTo/Sp3ms");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTo",
            partOfSpeech: "Particle",
            qualifier: "Direct object marker",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HSp3ms",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Masculine",
            number: "Singular",
        });
    });

    it("decodes a direct-object-marker plus third-person plural pronominal suffix", () => {
        const parsed = parseHebrewMorphology("HTo/Sp3mp");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HTo",
            partOfSpeech: "Particle",
            qualifier: "Direct object marker",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HSp3mp",
            partOfSpeech: "Suffix",
            qualifier: "Pronominal",
            person: "3rd",
            gender: "Masculine",
            number: "Plural",
        });
    });

    it("decodes an Open Scriptures conjunction plus direct-object-marker composite", () => {
        const parsed = parseHebrewMorphology("HCc/To");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HTo",
            partOfSpeech: "Particle",
            qualifier: "Direct object marker",
        });
    });

    it("decodes the next Genesis 2 Open Scriptures relative particle", () => {
        expect(parseHebrewMorphology("HTr")).toMatchObject({
            language: "H",
            partOfSpeech: "Particle",
            qualifier: "Relative",
            person: null,
            gender: null,
            number: null,
            state: null,
            tense: null,
        });

        expect(parseHebrewMorphology("HTr").summary).toBe(
            "Particle · Relative",
        );
    });

    it("decodes an Open Scriptures interjection particle", () => {
        expect(parseHebrewMorphology("HTj")).toMatchObject({
            language: "H",
            partOfSpeech: "Particle",
            qualifier: "Interjection",
        });
    });

    it("decodes a conjunction plus inseparable-preposition article and masculine noun composite", () => {
        const parsed = parseHebrewMorphology("HCc/Tp/Ncmsa");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HTp",
            partOfSpeech: "Particle",
            qualifier: "Definite article with inseparable preposition",
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HNcmsa",
            partOfSpeech: "Noun",
            qualifier: "Common · Absolute",
            gender: "Masculine",
            number: "Singular",
            state: "Absolute",
        });
    });

    it("decodes a conjunction plus preposition and Qal infinitive-construct composite", () => {
        const parsed = parseHebrewMorphology("HCc/R/Vqc");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HVqc",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Infinitive construct",
            person: null,
            gender: null,
            number: null,
            state: null,
            tense: null,
        });
    });

    it("decodes a conjunction plus preposition and masculine construct noun composite", () => {
        const parsed = parseHebrewMorphology("HCc/R/Ncmsc");

        expect(parsed.segments).toHaveLength(3);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HCc",
            partOfSpeech: "Conjunction",
            qualifier: "Conjunctive",
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HR",
            partOfSpeech: "Preposition",
            qualifier: null,
        });
        expect(parsed.segments?.[2]).toMatchObject({
            code: "HNcmsc",
            partOfSpeech: "Noun",
            qualifier: "Common · Construct",
            gender: "Masculine",
            number: "Singular",
            state: "Construct",
        });
    });

    it("decodes an Aramaic verb using the same Open Scriptures code structure", () => {
        expect(parseHebrewMorphology("AVqp3ms")).toMatchObject({
            language: "A",
            partOfSpeech: "Verb",
            form: "Perfect",
            qualifier: "Peal",
        });
        expect(parseHebrewMorphology("AVqp3ms").summary).toContain(
            "Aramaic · Verb · Peal · Perfect",
        );
    });

    it("preserves Aramaic on composite morphology codes", () => {
        const parsed = parseHebrewMorphology("AC/AVqp3ms");

        expect(parsed.language).toBe("A");
        expect(parsed.segments?.[0]?.language).toBe("A");
        expect(parsed.segments?.[1]?.language).toBe("A");
        expect(parsed.summary).toContain("Aramaic");
    });

    it("rejects an empty code and an invalid language", () => {
        expect(() => parseHebrewMorphology("")).toThrow(/morphology code/i);
        expect(() => parseHebrewMorphology("GNcfsa")).toThrow(/H or A/i);
    });

    it("keeps an unknown form conservative", () => {
        expect(parseHebrewMorphology("HNpt").summary).toContain(
            "Noun · Proper name · Title",
        );
    });
});