import { describe, expect, it } from "vitest";

import { ValueObject } from "../../src/core/ValueObject.js";

class TestValueObject extends ValueObject<{ value: string }> {
    constructor(value: string) {
        super({ value });
    }

    public get value(): string {
        return this.get("value");
    }
}

class AnotherTestValueObject extends ValueObject<{ value: string }> {
    constructor(value: string) {
        super({ value });
    }
}

describe("ValueObject", () => {

    it("creates a value object", () => {
        const vo = new TestValueObject("Genesis");

        expect(vo.value).toBe("Genesis");
    });

    it("considers equal value objects equal", () => {
        const a = new TestValueObject("Genesis");
        const b = new TestValueObject("Genesis");

        expect(a.equals(b)).toBe(true);
    });

    it("considers different value objects unequal", () => {
        const a = new TestValueObject("Genesis");
        const b = new TestValueObject("Exodus");

        expect(a.equals(b)).toBe(false);
    });

    it("does not consider different subclasses equal", () => {
        const a = new TestValueObject("Genesis");
        const b = new AnotherTestValueObject("Genesis");

        expect(a.equals(b)).toBe(false);
    });

    it("is reflexively equal", () => {
        const a = new TestValueObject("Genesis");

        expect(a.equals(a)).toBe(true);
    });

    it("returns false when compared with null", () => {
        const a = new TestValueObject("Genesis");

        expect(a.equals(null)).toBe(false);
    });

    it("returns false when compared with undefined", () => {
        const a = new TestValueObject("Genesis");

        expect(a.equals(undefined)).toBe(false);
    });

    it("returns false when compared with an arbitrary object", () => {
        const a = new TestValueObject("Genesis");

        expect(a.equals({})).toBe(false);
    });

    it("serializes to JSON", () => {
        const vo = new TestValueObject("Genesis");

        expect(vo.toJSON()).toEqual({
            value: "Genesis",
        });
    });

    it("returns a copy from toJSON", () => {
        const vo = new TestValueObject("Genesis");

        const json = vo.toJSON();

        expect(json).not.toBe(vo.toJSON());
        expect(json).toEqual({
            value: "Genesis",
        });
    });

});