# BSMP Workspace Progress

## Authoritative development line

The current integrated Study Workspace and Sermon Preparation implementation lives on `feat/observation-workspace-route`. The older `feat/observation-workspace-ui-next` branch is historical and should not be used as the development baseline.

## Study Workspace

The Study Workspace now provides:

- Bible passage context and verse selection
- observation methodology tools
- verse-linked observations
- observation editing/history
- interpretation creation and editing
- categorized interpretation evidence
- applications with Principle, Personal, Ministry, and Action fields
- Supabase-backed persistence with authenticated repository access
- navigation targets allowing preaching work to return to source study material

## Sermon Preparation

The preaching workspace now provides:

- Study source selection
- sermon creation from a StudySession
- sermon title, Big Idea, and Purpose
- sermon introduction, context/setting, and conclusion
- outline creation, editing, deletion, and reordering
- links from outline points to source observations, interpretations, evidence, and applications
- outline exposition with Text, Explanation, Illustration, Application, and Transition
- explicit text/meaning/response support mappings
- sermon overview and readiness tracking

## Final Sermon Draft

The final manuscript and delivery preparation stage now provides:

- persistent final manuscript field
- persistent delivery notes field
- `/preaching/final` workspace
- overview readiness and navigation into the final draft

## Remaining verification

GitHub Actions has not produced CI status for the current final-drafting branch. The repository still requires local `pnpm install`, then `pnpm typecheck`, `pnpm test`, and `pnpm build`. The new final-drafting migration must also be applied to the connected Supabase project before the final-drafting persistence is used in production.
