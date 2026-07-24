/**
 * Base class for all domain-level errors.
 *
 * Domain errors represent violations of business rules or invariants.
 */
export abstract class DomainError extends Error {
    protected constructor(message: string) {
        super(message);

        this.name = new.target.name;

        // Restore prototype chain.
        Object.setPrototypeOf(this, new.target.prototype);
    }
}