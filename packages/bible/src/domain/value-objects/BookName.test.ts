import { describe, expect, it } from "vitest";

import { BookName } from "./BookName.js";

describe("BookName", () => {
    it("creates a valid name", () => {
        expect(BookName.from("Genesis").value)
            .toBe("Genesis");
    });

    it("trims whitespace", () => {
        expect(BookName.from("  Genesis ").value)
            .toBe("Genesis");
    });

    it("rejects empty strings", () => {
        expect(() => BookName.from(""))
            .toThrow();
    });

    it("supports equality", () => {
        expect(
            BookName.from("Genesis")
                .equals(BookName.from("Genesis"))
        ).toBe(true);
    });
});