import { describe, expect, it } from "vitest";

import { BookMetadata } from "./BookMetadata.js";
import { BookName } from "./BookName.js";

describe("BookMetadata", () => {
    it("creates valid metadata", () => {
        const metadata = BookMetadata.create({
            canonicalName: BookName.from("Genesis"),
            shortName: BookName.from("Gen"),
            code: BookName.from("Gen"),
        });

        expect(metadata.canonicalName.value).toBe("Genesis");
        expect(metadata.shortName.value).toBe("Gen");
        expect(metadata.code.value).toBe("Gen");
    });

    it("supports equality", () => {
        const first = BookMetadata.create({
            canonicalName: BookName.from("Genesis"),
            shortName: BookName.from("Gen"),
            code: BookName.from("Gen"),
        });

        const second = BookMetadata.create({
            canonicalName: BookName.from("Genesis"),
            shortName: BookName.from("Gen"),
            code: BookName.from("Gen"),
        });

        expect(first.equals(second)).toBe(true);
    });
});