import { describe, expect, it } from "vitest";

import { BookRegistry } from "./BookRegistry.js";
import { BookCode } from "../value-objects/BookCode.js";

describe("BookRegistry", () => {

    it("returns the correct name", () => {

        expect(
            BookRegistry.nameFor(
                BookCode.from("GEN"),
            ),
        ).toBe("Genesis");

    });

    it("returns the canonical order", () => {

        expect(
            BookRegistry.orderFor(
                BookCode.from("EXO"),
            ),
        ).toBe(2);

    });

});