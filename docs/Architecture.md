# BSMP Architecture

## Vision

The Bible Study Ministry Platform (BSMP) is a modular platform for:

- Inductive Bible Study
- Expository Sermon Preparation
- Bible Reading
- Ministry Resource Management

The platform follows Domain-Driven Design (DDD), Clean Architecture, and a TypeScript monorepo structure.

---

## Package Structure

packages/

- @bsmp/shared
- @bsmp/bible
- @bsmp/study
- @repo/ui

apps/

- web
- docs

---

## Dependency Graph

@bsmp/shared
↓

@bsmp/bible
↓

@bsmp/study
↓

@repo/ui

↓

apps/web

Packages only depend on lower-level packages.
Circular dependencies are not permitted.