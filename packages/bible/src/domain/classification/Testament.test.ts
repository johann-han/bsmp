import { describe, expect, it } from "vitest";

import { Testament } from "./Testament.js";

describe("Testament", () => {
    it("contains the Old Testament", () => {
        expect(Testament.Old).toBe("OLD");
    });

    it("contains the New Testament", () => {
        expect(Testament.New).toBe("NEW");
    });

    it("contains exactly two values", () => {
        expect(Object.values(Testament)).toEqual(["OLD", "NEW"]);
    });
});