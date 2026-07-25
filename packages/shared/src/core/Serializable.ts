/**
 * Represents an object that can be serialized to JSON.
 */
export interface Serializable<T = unknown> {
    toJSON(): T;
}