import { Entity } from "./Entity.js";
import { Identifier } from "./Identifier.js";

/**
 * Base class for aggregate roots.
 */
export abstract class AggregateRoot<
    TId extends Identifier<unknown>,
> extends Entity<TId> { }