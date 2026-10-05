    });

    it("decodes the next Exodus 3 Open Scriptures conjunction plus Qal sequential imperfect 1cs", () => {
        const parsed = parseHebrewMorphology("HC/Vqw1cs");

        expect(parsed.segments).toHaveLength(2);
        expect(parsed.segments?.[0]).toMatchObject({
            code: "HC",
            partOfSpeech: "Conjunction",
            qualifier: null,
        });
        expect(parsed.segments?.[1]).toMatchObject({
            code: "HVqw1cs",
            partOfSpeech: "Verb",
            qualifier: "Qal",
            form: "Sequential imperfect",
            person: "1st",
            gender: "Common",
            number: "Singular",
            state: null,
            tense: null,
            mood: null,
        });
        expect(parsed.summary).toContain("Conjunction");
        expect(parsed.summary).toContain(
            "Verb · Qal · Sequential imperfect · 1st person · Singular · Common",
        );
    });