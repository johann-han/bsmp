import { Identifier } from "./Identifier.js";

/**
 * Base class for all domain entities.
 */
export abstract class Entity<TId extends Identifier<unknown>> {
    protected constructor(public readonly id: TId) { }

    public equals(other: Entity<TId>): boolean {
        return this.id.equals(other.id);
    }
}