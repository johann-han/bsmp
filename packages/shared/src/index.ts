/**
 * BSMP Shared Package
 *
 * Public exports for shared functionality.
 */

export * from "./core/index.js";
export { Identifier } from "./core/Identifier.js";
export { AggregateRoot } from "./core/AggregateRoot.js";
export { Entity } from "./core/Entity.js";
export { NonEmptyStringValueObject } from "./core/NonEmptyStringValueObject.js";
export { PositiveIntegerValueObject } from "./core/PositiveIntegerValueObject.js";
export { ValueObject } from "./core/ValueObject.js";
export * from "./errors/index.js";
export * from "./validation/index.js";
export * from "./result/Result.js"; // adjust to your actual structure
export * from "./result/index.js";
