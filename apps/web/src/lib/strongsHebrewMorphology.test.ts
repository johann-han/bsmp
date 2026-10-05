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