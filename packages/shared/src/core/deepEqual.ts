/**
 * Deep structural equality.
 *
 * Internal to the Shared Kernel.
 */
export function deepEqual(
    left: unknown,
    right: unknown,
): boolean {

    if (Object.is(left, right)) {
        return true;
    }

    if (left == null || right == null) {
        return false;
    }

    if (typeof left !== typeof right) {
        return false;
    }

    if (Array.isArray(left) && Array.isArray(right)) {

        if (left.length !== right.length) {
            return false;
        }

        return left.every((value, index) =>
            deepEqual(value, right[index]),
        );
    }

    if (
        typeof left === "object" &&
        typeof right === "object"
    ) {

        const leftRecord = left as Record<string, unknown>;
        const rightRecord = right as Record<string, unknown>;

        const leftKeys = Object.keys(leftRecord);
        const rightKeys = Object.keys(rightRecord);

        if (leftKeys.length !== rightKeys.length) {
            return false;
        }

        return leftKeys.every(key =>
            deepEqual(
                leftRecord[key],
                rightRecord[key],
            ),
        );
    }

    return false;
}