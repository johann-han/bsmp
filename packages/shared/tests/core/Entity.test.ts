import { describe, expect, it } from "vitest";

import { Entity } from "../../src/core/Entity.js";
import { Identifier } from "../../src/core/Identifier.js";

class TestIdentifier extends Identifier<string> {
    public constructor(value: string) {
        super(value);
    }
}

class TestEntity extends Entity<TestIdentifier> {
    public constructor(id: TestIdentifier) {
        super(id);
    }
}

describe("Entity", () => {

    it("exposes its identifier", () => {
        const id = new TestIdentifier("GEN");

        const entity = new TestEntity(id);

        expect(entity.id).toBe(id);
    });

    it("considers entities with the same identifier equal", () => {
        const left = new TestEntity(
            new TestIdentifier("GEN"),
        );

        const right = new TestEntity(
            new TestIdentifier("GEN"),
        );

        expect(left.equals(right)).toBe(true);
    });

    it("considers entities with different identifiers unequal", () => {
        const left = new TestEntity(
            new TestIdentifier("GEN"),
        );

        const right = new TestEntity(
            new TestIdentifier("EXO"),
        );

        expect(left.equals(right)).toBe(false);
    });

    it("is equal to itself", () => {
        const entity = new TestEntity(
            new TestIdentifier("GEN"),
        );

        expect(entity.equals(entity)).toBe(true);
    });

});