/**
 * Represents the result of an operation.
 * A Result is either successful and contains data,
 * or unsuccessful and contains an error.
 */

export type Result<T, E = Error> =
    | Success<T>
    | Failure<E>;

export interface Success<T> {
    success: true;
    data: T;
}

export interface Failure<E> {
    success: false;
    error: E;
}

/**
 * Creates a successful result.
 */
export function ok<T>(data: T): Success<T> {
    return {
        success: true,
        data,
    };
}

/**
 * Creates a failed result.
 */
export function fail<E>(error: E): Failure<E> {
    return {
        success: false,
        error,
    };
}