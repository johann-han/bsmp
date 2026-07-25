import { describe, expect, it } from "vitest";

import { BookName } from "./BookName.js";

describe("BookName", () => {
    it("creates a valid book name", () => {
        expect(BookName.from("Genesis").value).toBe("Genesis");
    });

    it("trims surrounding whitespace", () => {
        expect(BookName.from("  Genesis  ").value).toBe("Genesis");
    });

    it("rejects empty strings", () => {
        expect(() => BookName.from("")).toThrow();
    });

    it("rejects whitespace only", () => {
        expect(() => BookName.from("   ")).toThrow();
    });

    it("supports equality", () => {
        expect(
            BookName.from("Genesis").equals(
                BookName.from("Genesis"),
            ),
        ).toBe(true);
    });

    it("supports serialization", () => {
        expect(BookName.from("Genesis").toJSON()).toBe("Genesis");
    });

    it("supports string conversion", () => {
        expect(BookName.from("Genesis").toString()).toBe("Genesis");
    });
});