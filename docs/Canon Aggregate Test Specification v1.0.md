Phase 2 — Canon Aggregate Test Specification

Document: Canon Aggregate Test Specification v1.0

This document defines what the Canon aggregate must do, not how it does it.

1. Aggregate Creation
CA-001 — Create a valid canon

Given

a valid CanonId
valid CanonMetadata
66 valid BibleBook instances

When

A Canon is created

Then

creation succeeds
the canon contains 66 books
all invariants are satisfied
CA-002 — Empty canon

Determine whether an empty canon is allowed.

Decision

No.

A biblical canon without books is not a canon.

Therefore:

Creating a canon with zero books must throw a ValidationError.

CA-003 — Duplicate Book IDs

Creating a canon with duplicate BibleBookIds must fail.

Expected:

ValidationError
Duplicate BibleBookId detected.
CA-004 — Duplicate Canonical Orders

Duplicate order numbers must fail.

Example:

Genesis = 1

Exodus = 1

↓

Exception.

CA-005 — Duplicate Book Names

Duplicate names must fail.

CA-006 — Duplicate Book Codes

Duplicate codes must fail.

2. Membership
CA-101

Given Genesis exists

canon.contains(genesisId)

returns

true
CA-102

Unknown book

returns

false
3. Lookup
CA-201

Find by ID

canon.book(genesisId)

returns Genesis.

CA-202

Find by Code

canon.bookByCode("GEN")

returns Genesis.

CA-203

Find by Name

canon.bookByName("Genesis")

returns Genesis.

CA-204

Find by Canonical Order

canon.bookByCanonicalOrder(1)

returns Genesis.

CA-205

Unknown lookup

returns

undefined

rather than throwing.

This makes the API easier to consume.

4. Navigation
CA-301
canon.firstBook()

↓

Genesis

CA-302
canon.lastBook()

↓

Revelation

CA-303
canon.nextBook(Genesis)

↓

Exodus

CA-304
canon.previousBook(Exodus)

↓

Genesis

CA-305

Previous of Genesis

↓

undefined
CA-306

Next of Revelation

↓

undefined
5. Classification
CA-401

Books in Old Testament

returns

39 books.

CA-402

Books in New Testament

returns

27 books.

CA-403

Books in Pentateuch

returns

Genesis

Exodus

Leviticus

Numbers

Deuteronomy

CA-404

Books in Gospels

returns

Matthew

Mark

Luke

John

6. Enumeration

The aggregate should support safe iteration.

CA-501
canon.books()

returns

ReadonlyArray<BibleBook>
CA-502

External mutation

canon.books().push(...)

must be impossible.

7. Integrity
CA-601

Books are always returned in canonical order.

Never insertion order.

CA-602

Canonical order never changes.

CA-603

Every returned book belongs to the canon.

8. Metadata
CA-701
canon.id()

returns the CanonId.

CA-702
canon.metadata()

returns metadata.

CA-703

Metadata is immutable.

9. Performance

Although performance isn't usually part of a domain specification, we can define expected characteristics:

Operation	Expected Complexity
Find by ID	O(1)
Find by Code	O(1)
Find by Name	O(1)
Find by Canonical Order	O(1)
First Book	O(1)
Last Book	O(1)
Next Book	O(1)
Previous Book	O(1)

These expectations will guide the implementation toward maintaining internal indexes without exposing those implementation details.

10. Acceptance Criteria

The Canon aggregate is considered complete when:

All construction rules are enforced.
All invariants are protected.
All lookups behave correctly.
Navigation is correct.
Classification returns accurate results.
Collections are immutable.
All tests pass.
The public API expresses the biblical domain clearly.