# BSMP Master Development Plan

## 1. Current Project State

**Project:** Bible Study & Ministry Platform (BSMP)

**Version:** 0.1.0 – Foundation

**Phase:** Active Engineering / Integrated Foundation

**Current integration branch:** `feat/observation-workspace-route`

**Current integration head:** `faebabda8aa0f6a8c258cbe2f5c60e9bfd62b18a`

`main` remains untouched by the active development workflow.

The platform now has an integrated preparation path:

**Inductive Study → Biblical Theology → Teaching → Sermon Framework → Exposition → Final Manuscript → Delivery → Preaching History**

The platform also includes focused Biblical Research, reusable research sources, AI mentor layers, authentication, subscription/entitlement foundations, and PayFast billing integration.

## 2. Integrated Capabilities

### Study / Inductive Study

The Study Workspace provides passage-centered observation, interpretation, evidence, application, history, persistence, verse targeting, and KJV word study.

Strong's Word Study currently supports KJV word tagging, lexical lookup, word-by-word navigation, Greek New Testament token morphology, and reference-only lexical data boundaries.

### Biblical Theology

Students can record theological syntheses linked to supporting interpretations. Biblical Theology entries are user-scoped, persisted in Supabase, and surfaced as support within sermon preparation.

### Teaching

The Teaching stage records audience, central truth, teaching aim, explanation, teaching points, discussion questions, response prompts, and explicit interpretation/Biblical Theology support.

Completed Teaching Plans can be linked to Sermon Preparation, preserving the Study → Biblical Theology → Teaching → Sermon chain.

### Sermon Preparation

Sermon Preparation creates expository sermon records from a Study and supports title, Big Idea, Purpose, framework, outline construction, exposition, source traceability, and Biblical Theology support.

### Final Sermon Draft

The Final Sermon Draft workspace supports preacher-authored manuscript editing, traceable manuscript sections, delivery notes, word count, estimated duration, source traceability, print/PDF output, and readiness checking.

Final Sermon Readiness rules are centralized in the preaching application layer and covered by automated tests.

### Sermon Delivery

Delivery Mode provides read-focused manuscript presentation, section navigation, adjustable reading size, Focus Mode, recovery state, My Place, screen wake-lock support, and print/PDF output.

Delivery now requires a saved Final Sermon Draft before the delivery workspace opens.

### Preaching History

A sermon may have multiple preaching occurrences with scheduled/completed/cancelled state, service, venue, notes, and actual preached time. Occurrences are user-scoped and persisted independently of the sermon manuscript.

### Biblical Research

The Research workspace provides Study-grounded research and external contextual research modes with a provider abstraction, Gemini primary retrieval, OpenRouter fallback, citations, source verification boundaries, Research Questions helper, Research History, and a reusable Research Source Library.

External research remains separate from Study observations, interpretations, Biblical Theology, Teaching, and sermons unless the student deliberately uses the information in later stages.

### AI Mentors

AI mentor layers exist for Observation, Interpretation, Application, Biblical Theology, Teaching, Sermon Exposition, Final Sermon Draft, Sermon Delivery, and Biblical Research.

The intended boundary is coaching rather than replacement: AI reviews or focuses the student's work without silently writing the student's study, interpretation, application, or sermon.

### Authentication

Authenticated routes, sign-in/out, password change, password recovery, protected Supabase data access, and user-scoped row-level security are implemented.

### AI Usage and Subscriptions

AI usage metering, quota enforcement foundations, subscription entitlements, subscription administration, lifecycle audit events, provider-neutral billing boundaries, and transactional provider-event synchronization are implemented.

PayFast is the current provider-specific billing integration. The hosted checkout, recurring subscriptions, ITN validation, amount verification, and cancellation handling are covered by automated tests and sandbox-oriented configuration.

## 3. Engineering Standards

Every feature branch must satisfy:

- typecheck passes
- tests pass
- lint passes
- production build passes
- documentation is updated when behavior or architecture changes
- public APIs remain intentional
- no TODO placeholder is introduced as a substitute for implementation
- authenticated browser verification is performed for meaningful user-facing workflow changes
- source, tests, documentation, and browser verification remain aligned

## 4. Development Order

The original package order remains the architectural dependency order:

**shared → bible → study → inductive → learning → resources → workflow → preaching → ai → web**

Later implementation has expanded the web application while preserving those domain boundaries.

## 5. Current Work Strategy

The project is now beyond the original foundation-only milestone plan. Development should proceed as focused vertical slices on top of the integrated branch rather than reopening earlier milestones.

Priority order for future work:

1. Complete any remaining runtime verification gaps in existing integrated workflows.
2. Strengthen domain/application contracts where rules are still duplicated in UI code.
3. Extend Biblical Research provenance/history without collapsing the boundary between external research and Study evidence.
4. Harden production billing and subscription operations using the provider-neutral boundary.
5. Expand lexical reference capability incrementally, keeping lexical data separate from Study interpretation.
6. Continue improving the integrated Study → Sermon → Delivery experience without redesigning completed workflows.

## 6. Definition of Ready

Before implementation:

- problem is understood
- existing functionality and branches are checked
- domain/package ownership is identified
- public API impact is understood
- acceptance criteria are explicit
- current integration branch is the base

## 7. Definition of Done

Before a feature is marked complete:

- code implemented
- tests written and passing
- typecheck/lint/build passing
- documentation updated
- browser workflow verified when applicable
- persistence and RLS verified when applicable
- PR merged into the current integration branch
- `main` remains unchanged unless deliberately released later

## 8. Permanent Engineering Principles

**Scripture First**

**Method Before Automation**

**Knowledge Before AI**

**Domain Before UI**

**Quality Before Speed**

**Everything Must Be Explainable**

**Every Feature Must Be Testable**

**Every Knowledge Object Must Be Versioned**

**Student-authored work remains distinct from AI-generated assistance**

## 9. Recent Integrated PRs

- PR #23 — Strong's word-study morphology — merged
- PR #24 — centralized Final Sermon Readiness — merged
- PR #25 — require saved Final Sermon Draft before Delivery — merged

These changes are now part of the integrated development branch.
