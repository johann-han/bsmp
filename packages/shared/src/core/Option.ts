/**
 * Represents an optional value.
 *
 * A value is either present (Some)
 * or absent (None).
 */

export type Option<T> = Some<T> | None;

export interface Some<T> {
    readonly kind: "some";
    readonly value: T;
}

export interface None {
    readonly kind: "none";
}

export function some<T>(value: T): Some<T> {
    return {
        kind: "some",
        value,
    };
}

export function none(): None {
    return {
        kind: "none",
    };
}

export function isSome<T>(option: Option<T>): option is Some<T> {
    return option.kind === "some";
}

export function isNone<T>(option: Option<T>): option is None {
    return option.kind === "none";
}