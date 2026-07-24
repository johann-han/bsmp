# Bible Domain Model

**Project:** Bible Study & Ministry Platform (BSMP)

**Version:** 1.0

**Status:** Draft

---

# 1. Purpose

The Bible domain provides the canonical representation of Scripture for the Bible Study & Ministry Platform.

Its responsibility is to model biblical concepts independently of:

- User interface
- Database
- File format
- API
- Bible translation
- Programming framework

The Bible domain is the foundation upon which every other domain within BSMP is built.

---

# 2. Vision

The Bible domain should accurately model Scripture in a way that is:

- Rich
- Explicit
- Extensible
- Type-safe
- Translation independent
- Canon aware

The objective is not merely to retrieve Bible text, but to model the structure and relationships of Scripture itself.

---

# 3. Architectural Principles

## Source Agnostic

The domain must never assume where Bible text comes from.

Possible sources include:

- Database
- JSON
- SQLite
- API
- XML
- USFM
- OSIS
- SWORD modules

The domain should remain unchanged regardless of storage.

---

## Translation Agnostic

A Bible reference exists independently of any translation.

Example:

John 3:16

is the same reference regardless of whether the text comes from:

- KJV
- ESV
- WEB
- NASB
- Afrikaans
- Greek
- Hebrew

---

## Canon Aware

Different Christian traditions recognise different biblical canons.

The domain must support:

- Protestant Canon
- Catholic Canon
- Orthodox Canon
- Hebrew Bible (Tanakh)
- Septuagint

without redesign.

---

## Strong Typing

Avoid primitive values where richer domain concepts exist.

Prefer:

ChapterNumber

instead of

int

Prefer:

BibleBookId

instead of

string

---

## Rich Domain Model

Objects should model biblical concepts rather than database tables.

---

## Immutable Value Objects

Where practical, value objects should be immutable.

Examples:

- ChapterNumber
- VerseNumber
- BibleReference

---

# 4. Core Domain Concepts

## BibleCanon

Represents a recognised collection of biblical books.

Examples:

- Protestant Canon
- Catholic Canon
- Orthodox Canon
- Tanakh

Responsibilities:

- Maintain canonical order
- Provide access to books
- Identify supported divisions

---

## Testament

Represents one of the major divisions of Scripture.

Values:

- Old Testament
- New Testament

---

## BibleDivision

Represents groupings of books.

Examples:

- Law
- History
- Wisdom
- Major Prophets
- Minor Prophets
- Gospels
- Acts
- Pauline Epistles
- General Epistles
- Apocalypse

---

## BibleBook

Represents one canonical biblical book.

Properties include:

- Identity
- Canonical name
- Testament
- Division
- Chapter count
- Abbreviations
- Localised names
- Metadata

BibleBook does not contain Bible text.

---

## BibleReference

Represents a location in Scripture.

Components:

- BibleBook
- ChapterNumber
- VerseNumber

A BibleReference identifies a passage but does not contain its text.

---

## ChapterNumber

Represents a chapter within a biblical book.

Rules:

- Positive integer
- Valid within its book

---

## VerseNumber

Represents a verse within a chapter.

Rules:

- Positive integer
- Valid within its chapter

---

## Translation

Represents a textual rendering of Scripture.

Examples:

- KJV
- WEB
- NASB
- Afrikaans 1983

Translations provide text but never change the identity of a reference.

---

## Versification

Represents the chapter and verse numbering system used by a translation or canon.

The model must accommodate different versification traditions.

---

# 5. Relationships

BibleCanon

contains

BibleBook

BibleBook

belongs to

Testament

BibleBook

belongs to

BibleDivision

BibleReference

references

BibleBook

BibleReference

contains

ChapterNumber

BibleReference

contains

VerseNumber

Translation

provides text for

BibleReference

---

# 6. Domain Invariants

The following rules must always hold:

- Every BibleBook belongs to exactly one BibleCanon.
- Every BibleBook belongs to exactly one Testament.
- Every BibleReference identifies exactly one location.
- Chapter numbers begin at 1.
- Verse numbers begin at 1.
- References remain valid regardless of translation.
- Bible text never belongs inside BibleReference.

---

# 7. Non-Goals

The Bible domain is not responsible for:

- UI rendering
- Searching
- AI
- Notes
- Highlighting
- Preaching
- Lesson preparation
- Persistence

These belong to other domains.

---

# 8. Future Extensions

The architecture should support:

- Multiple canons
- Multiple versifications
- Strong's Numbers
- Morphology
- Cross References
- Footnotes
- Study Notes
- Parallel Passages
- Maps
- Timelines
- Archaeological Data
- Original Languages
- Interlinear Bibles

without requiring redesign.

---

# 9. Initial Implementation Order

1. Testament
2. BibleBookId
3. BibleDivision
4. ChapterNumber
5. VerseNumber
6. BibleBook
7. BibleReference
8. BibleCanon
9. Translation
10. Repository Interfaces
11. Domain Services