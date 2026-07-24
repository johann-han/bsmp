import {
  Guard,
  Identifier,
  ValidationError,
} from "@bsmp/shared";

import {
  BIBLE_BOOK_CODES,
  type BibleBookCode,
} from "../constants/index.js";

/**
 * Represents the immutable identifier of a Bible book.
 */
export class BibleBookId extends Identifier<BibleBookCode> {
  private static readonly cache = new Map<
    BibleBookCode,
    BibleBookId
  >();

  private constructor(value: BibleBookCode) {
    super(value);
  }

  /**
   * Creates a BibleBookId from a string.
   */
  public static from(value: string): BibleBookId {
    if (!Guard.isNonEmptyString(value)) {
      throw new ValidationError(
        "Bible book code must be a non-empty string."
      );
    }

    const normalized = value.trim().toUpperCase();

    if (
      !BIBLE_BOOK_CODES.includes(
        normalized as BibleBookCode
      )
    ) {
      throw new ValidationError(
        `Invalid Bible book code: '${value}'.`
      );
    }

    const code = normalized as BibleBookCode;

    const existing = this.cache.get(code);

    if (existing) {
      return existing;
    }

    const id = new BibleBookId(code);

    this.cache.set(code, id);

    return id;
  }

  /**
   * Returns the OSIS code.
   */
  public get code(): BibleBookCode {
    return this.getValue();
  }
}