import { describe, expect, it } from "vitest";

import { InterpretationId } from "./InterpretationId.js";

describe("InterpretationId", () => {

    it("creates a unique identifier", () => {

        const id = InterpretationId.create();

        expect(id).toBeDefined();

    });

    it("creates an identifier from a string", () => {

        const id = InterpretationId.from(
            "interpretation-1",
        );

        expect(id.value).toBe(
            "interpretation-1",
        );

    });

});