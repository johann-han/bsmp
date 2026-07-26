# BSMP Bible Package Architecture

## Overview

The Bible package is built using Domain-Driven Design (DDD) principles. The objective is to model the biblical domain as accurately and expressively as possible while maintaining a clean, testable, and extensible architecture.

The domain model is independent of the application, user interface, and infrastructure layers.

---

## Architectural Principles

### Domain First

The Bible itself is the core domain of BSMP.

Everything else—including Bible reading, inductive study, expository preaching, note-taking, and search—is built on top of this domain model.

---

### Rich Domain Model

The package favors rich domain objects over primitive values.

Examples include:

- BibleBookId
- CanonId
- CanonicalOrder
- CanonMetadata
- BibleBook
- CanonDefinition
- Canon

The goal is to eliminate primitive obsession and express the domain using meaningful types.

---

### Immutability

All Value Objects are immutable.

Entities expose behavior through methods and read-only properties rather than mutable state.

Collections returned from the domain are exposed as read-only or defensive copies.

---

### Validation

Validation occurs at creation time.

Factories and Value Objects fail fast when invalid data is supplied.

Once an object exists, it is guaranteed to satisfy its invariants.

---

### Separation of Responsibilities

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

#### Definition

Represents validated immutable data.

Examples:

- CanonDefinition
- StudyDefinition (planned)
- SermonDefinition (planned)

Responsibilities:

- Validate invariants
- Store immutable state
- No business behavior

---

#### Factory

Responsible for converting primitive values into rich domain objects.

Examples:

- createBook()
- createCanon() (planned)

Factories should remain thin and contain no business rules beyond object construction.

---

#### Aggregate

Represents the behavior of the domain.

Examples:

- Canon
- Study (planned)
- Sermon (planned)

Aggregates answer domain questions and coordinate behavior while preserving invariants.

---

## Bible Package Structure

```
packages/
└── bible/
    └── src/
        └── domain/
            ├── canon/
            │   ├── Canon.ts
            │   ├── CanonDefinition.ts
            │   ├── ProtestantCanon.ts
            │   └── index.ts
            │
            ├── classification/
            ├── entities/
            ├── factories/
            ├── value-objects/
            └── index.ts
```

---

## Development Workflow

Development follows an implementation-first approach.

```
Design
    ↓
Implement
    ↓
Compile
    ↓
Test
    ↓
Refactor (only when necessary)
    ↓
Commit
```

This workflow minimizes speculative abstractions and ensures the project remains in a working state throughout development.

---

## Sprint B1 Outcome

Sprint B1 established the canonical foundation of the Bible package.

Completed components:

### Value Objects

- CanonicalOrder
- CanonId
- CanonMetadata

### Entities

- BibleBook

### Factories

- createBook()

### Canon

- CanonDefinition
- Canon

Current status:

- Clean architecture
- Immutable domain model
- Strong typing throughout
- Full TypeScript compilation
- All tests passing