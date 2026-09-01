# BSMP Workspace Progress

## Study Workspace

The `/workspace` route renders the integrated Study Workspace with the Bible passage, verse selection, observations, interpretations, evidence, applications, history, and persistence through the Study repository.

The Study remains the source of truth for passage-linked observations, interpretations, evidence, and applications.

## Sermon Preparation

The `/preaching` workspace creates one expository sermon preparation record from a Study and provides:

- sermon title
- Big Idea
- Purpose
- outline construction, editing, deletion, and ordering
- links from outline points to Study observations, interpretations, evidence, and applications

## Sermon Framework

The framework stage provides:

- Introduction
- Context / Setting
- Conclusion

## Sermon Exposition

Each outline point can be developed through:

- Text
- Meaning / explanation
- Illustration
- Application
- Transition
- explicit links back to observation, interpretation, evidence, and application foundations

The Sermon Overview tracks readiness and directs the preacher to the next incomplete stage.

## Final Sermon Drafting

The `/preaching/final` workspace now provides:

- Final Manuscript
- Delivery Notes
- manuscript word count
- estimated preaching duration at 130 words per minute
- deterministic structured-draft assembly from the completed framework and outline
- persistent Supabase storage

The structured-draft builder is a starting point only. It intentionally preserves the distinction between source study material and the preacher's final authored manuscript.

## Current Branch

The integrated development baseline is `feat/observation-workspace-route`.

The current continuation is `feat/final-sermon-drafting`, reviewed through PR #3.

## Verification

Repository CI is now defined in `.github/workflows/ci.yml` for feature branches and pull requests. GitHub has not yet reported a workflow run for the latest branch commits, so local validation remains required before merging.

The final-drafting migration is:

`supabase/migrations/20260901100000_sermon_final_drafting.sql`

It must be applied to the connected Supabase project before final manuscript and delivery-note persistence can be used there.

## Next Work

1. Validate the integrated branch locally with `pnpm install`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
2. Apply and verify the final-drafting Supabase migration.
3. Add authenticated browser verification across Study → Sermon Preparation → Framework → Exposition → Final Draft.
4. Continue with sermon delivery tooling after the final drafting stage is stable.
