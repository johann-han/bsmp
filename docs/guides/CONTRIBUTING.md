# Contributing to BSMP

Welcome to the Bible Study Ministry Platform (BSMP).

BSMP is a long-term software project whose goal is to provide a world-class platform for Inductive Bible Study and Expository Preaching Preparation.

This document defines the engineering standards used throughout the project.

---

# Project Philosophy

The Bible is the core domain.

Everything else—including Bible reading, Bible study, preaching preparation, notes, search, AI assistance, and collaboration—is built on top of a rich Bible domain model.

The project favors correctness, maintainability, and clarity over short-term convenience.

---

# Core Principles

## Domain-Driven Design (DDD)

The domain model is the heart of the application.

Business logic belongs inside the domain—not inside controllers, pages, APIs, or UI components.

---

## Rich Domain Model

Avoid primitive obsession.

Prefer:

```ts
BibleBookId
CanonicalOrder
CanonId
ChapterNumber
VerseNumber
```

instead of:

```ts
string
number
```

---

## Immutability

Value Objects are immutable.

Entities expose behavior through methods rather than mutable public state.

Collections are returned as read-only or defensive copies.

---

## Fail Fast

Invalid domain objects should never exist.

Validation occurs during construction.

Objects are always valid after creation.

---

## Single Responsibility Principle

Every class has one reason to change.

Examples:

- BibleBook represents a biblical book.
- CanonDefinition validates a canon.
- Canon provides canonical behavior.
- createBook constructs BibleBook entities.

---

# Aggregate Pattern

Every aggregate follows the same structure.

```
Definition
    │
    ▼
Factory
    │
    ▼
Aggregate
```

## Definition

Responsible for immutable validated state.

Examples:

- CanonDefinition
- StudyDefinition
- SermonDefinition

---

## Factory

Responsible for constructing rich domain objects from primitive values.

Examples:

- createBook()
- createCanon()
- createStudy()

Factories should remain thin.

---

## Aggregate

Responsible for behavior.

Examples:

- Canon
- Study
- Sermon

Aggregates answer domain questions while preserving invariants.

---

# Package Structure

```
domain/

canon/

classification/

entities/

factories/

value-objects/
```

Each package should follow a consistent organization.

---

# Naming Conventions

## Classes

PascalCase

```
BibleBook
Canon
CanonDefinition
```

---

## Interfaces

Use descriptive names.

```
CanonDefinitionProps
BibleBookProps
```

Avoid unnecessary prefixes.

---

## Methods

camelCase

```
book()

contains()

next()

previous()
```

Methods should describe behavior.

---

## Getters

Expose state.

```
canon.books

canon.id

book.metadata
```

Avoid unnecessary getter methods like:

```
getBooks()
```

---

# Testing Standards

Every domain object should have focused tests.

Tests verify:

- valid creation
- invalid creation
- expected behavior

Avoid duplicating tests that belong to another class.

---

# Development Workflow

Every feature follows the same workflow.

```
Design
    ↓
Implement
    ↓
Compile
    ↓
Test
    ↓
Refactor (only when needed)
    ↓
Commit
```

The build should remain green throughout development.

---

# Import Standards

BSMP uses NodeNext.

All relative imports include the `.js` extension.

Correct:

```ts
import { Canon } from "./Canon.js";
```

Incorrect:

```ts
import { Canon } from "./Canon";
```

---

# Documentation

Major architectural decisions should be recorded in:

- ARCHITECTURE.md

Development milestones should be recorded in:

- DEVELOPMENT_LOG.md

Project planning belongs in:

- PROJECT.md

---

# Commit Guidelines

Each commit should represent a complete logical unit of work.

Examples:

```
feat(bible): implement Canon aggregate

refactor(bible): simplify BibleBook construction

test(canon): add CanonDefinition validation tests
```

Avoid mixing unrelated changes into a single commit.

---

# Code Review Checklist

Before committing:

- TypeScript compiles
- All tests pass
- No dead code
- No duplicated logic
- Documentation updated (if applicable)
- Public API reviewed
- Imports use `.js`
- Domain invariants preserved

---

# Long-Term Vision

BSMP is being built as a reusable ministry platform.

Future packages include:

- Bible
- Study
- Sermon
- AI
- Search
- Collaboration
- Library
- Notes
- Synchronization

All packages should follow the same architectural principles described in this document.

---

Soli Deo Gloria.