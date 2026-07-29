import { describe, expect, it } from "vitest";

import { deepEqual } from "../../src/core/deepEqual.js";

describe("deepEqual", () => {

    describe("primitives", () => {

        it("returns true for equal strings", () => {
            expect(deepEqual("Genesis", "Genesis")).toBe(true);
        });

        it("returns false for different strings", () => {
            expect(deepEqual("Genesis", "Exodus")).toBe(false);
        });

        it("returns true for equal numbers", () => {
            expect(deepEqual(1, 1)).toBe(true);
        });

        it("returns false for different types", () => {
            expect(deepEqual("1", 1)).toBe(false);
        });

    });

    describe("null and undefined", () => {

        it("handles null correctly", () => {
            expect(deepEqual(null, null)).toBe(true);
            expect(deepEqual(null, {})).toBe(false);
        });

        it("handles undefined correctly", () => {
            expect(deepEqual(undefined, undefined)).toBe(true);
            expect(deepEqual(undefined, 1)).toBe(false);
        });

    });

    describe("arrays", () => {

        it("compares equal arrays", () => {
            expect(
                deepEqual(
                    ["Gen", "Ex"],
                    ["Gen", "Ex"],
                ),
            ).toBe(true);
        });

        it("compares different arrays", () => {
            expect(
                deepEqual(
                    ["Gen"],
                    ["Ex"],
                ),
            ).toBe(false);
        });

        it("detects different array lengths", () => {
            expect(
                deepEqual(
                    ["Gen"],
                    ["Gen", "Ex"],
                ),
            ).toBe(false);
        });

    });

    describe("objects", () => {

        it("compares equal objects", () => {
            expect(
                deepEqual(
                    { chapter: 1, verse: 1 },
                    { chapter: 1, verse: 1 },
                ),
            ).toBe(true);
        });

        it("detects different values", () => {
            expect(
                deepEqual(
                    { chapter: 1 },
                    { chapter: 2 },
                ),
            ).toBe(false);
        });

        it("detects different keys", () => {
            expect(
                deepEqual(
                    { chapter: 1 },
                    { verse: 1 },
                ),
            ).toBe(false);
        });

        it("compares nested objects", () => {
            expect(
                deepEqual(
                    {
                        ref: {
                            chapter: 1,
                            verse: 1,
                        },
                    },
                    {
                        ref: {
                            chapter: 1,
                            verse: 1,
                        },
                    },
                ),
            ).toBe(true);
        });

    });

});