import { DomainError } from "./DomainError.js";

/**
 * Thrown when a value object receives invalid input.
 */
export class ValidationError extends DomainError {
    constructor(message: string) {
        super(message);
    }
}