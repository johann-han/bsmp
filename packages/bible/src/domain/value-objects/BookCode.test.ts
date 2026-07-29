import { describe, expect, it } from "vitest";

import { ValidationError } from "@bsmp/shared";

import { BookCode } from "./BookCode.js";

describe("BookCode", () => {

    describe("Construction", () => {

        it("creates a valid book code", () => {
            const code = BookCode.from("GEN");

            expect(code.value).toBe("GEN");
        });

        it("trims surrounding whitespace", () => {
            const code = BookCode.from("  GEN  ");

            expect(code.value).toBe("GEN");
        });

        it("converts input to uppercase", () => {
            const code = BookCode.from("gen");

            expect(code.value).toBe("GEN");
        });

        it("rejects an empty string", () => {
            expect(() => BookCode.from(""))
                .toThrow(ValidationError);
        });

        it("rejects codes shorter than three characters", () => {
            expect(() => BookCode.from("GE"))
                .toThrow(ValidationError);
        });

        it("rejects codes longer than five characters", () => {
            expect(() => BookCode.from("GENESIS"))
                .toThrow(ValidationError);
        });

        it("rejects non-alphabetic characters", () => {
            expect(() => BookCode.from("GE1"))
                .toThrow(ValidationError);

            expect(() => BookCode.from("G-E"))
                .toThrow(ValidationError);

            expect(() => BookCode.from("GEN!"))
                .toThrow(ValidationError);
        });

    });

    describe("Equality", () => {

        it("considers equal book codes equal", () => {
            const left = BookCode.from("GEN");
            const right = BookCode.from("gen");

            expect(left.equals(right)).toBe(true);
        });

        it("considers different book codes unequal", () => {
            const left = BookCode.from("GEN");
            const right = BookCode.from("EXO");

            expect(left.equals(right)).toBe(false);
        });

    });

    describe("Serialization", () => {

        it("serializes to JSON", () => {
            const code = BookCode.from("GEN");

            expect(code.toJSON()).toEqual({
                value: "GEN",
            });
        });

        it("returns the code as a string", () => {
            const code = BookCode.from("GEN");

            expect(code.toString()).toBe("GEN");
        });

    });

});