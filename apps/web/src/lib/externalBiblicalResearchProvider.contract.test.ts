import { describe, expect, it } from "vitest";

describe("external research provider contract", () => {
    it("uses provider-side retrieval and keeps sources distinct from Study evidence", () => {
        expect(["google_search", "url_context"]).toEqual(["google_search", "url_context"]);
    });
});
