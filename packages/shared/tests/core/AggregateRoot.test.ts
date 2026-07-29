import { describe, expect, it } from "vitest";

import { AggregateRoot } from "../../src/core/AggregateRoot.js";
import { Identifier } from "../../src/core/Identifier.js";

class TestIdentifier extends Identifier<string> {
    public constructor(value: string) {
        super(value);
    }
}

class TestAggregateRoot extends AggregateRoot<TestIdentifier> {
    public constructor(id: TestIdentifier) {
        super(id);
    }
}

describe("AggregateRoot", () => {

    it("exposes its identifier", () => {
        const id = new TestIdentifier("GEN");
        const aggregate = new TestAggregateRoot(id);

        expect(aggregate.id).toBe(id);
    });

    it("compares equal when identifiers are equal", () => {
        const left = new TestAggregateRoot(
            new TestIdentifier("GEN"),
        );

        const right = new TestAggregateRoot(
            new TestIdentifier("GEN"),
        );

        expect(left.equals(right)).toBe(true);
    });

    it("compares unequal when identifiers differ", () => {
        const left = new TestAggregateRoot(
            new TestIdentifier("GEN"),
        );

        const right = new TestAggregateRoot(
            new TestIdentifier("EXO"),
        );

        expect(left.equals(right)).toBe(false);
    });

});