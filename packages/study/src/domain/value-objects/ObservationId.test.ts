import { describe, expect, it } from "vitest";

import { ObservationId } from "./ObservationId.js";

describe("ObservationId", () => {

    it("creates a unique identifier", () => {

        const id = ObservationId.create();

        expect(id).toBeDefined();

    });

    it("creates an identifier from a string", () => {

        const id = ObservationId.from(
            "observation-1",
        );

        expect(id.value).toBe(
            "observation-1",
        );

    });

});