# BSMP Workspace Progress

## Study Workspace

The `/workspace` route renders the integrated Study Workspace with the Bible passage, verse selection, observations, interpretations, evidence, applications, history, and persistence through the Study repository.

The Study remains the source of truth for passage-linked observations, interpretations, evidence, and applications.

## Sermon Preparation

The `/preaching` workspace creates an expository sermon preparation record from a Study and provides sermon title, Big Idea, Purpose, outline construction, editing, deletion, ordering, and links to Study source material.

Each outline point can be supported by Study observations, interpretations, evidence, and applications.

## Sermon Framework

The framework stage provides Introduction, Context / Setting, and Conclusion.

## Sermon Exposition

Each outline point can be developed through Text, Meaning / explanation, Illustration, Application, and Transition, with explicit links to the relevant Study foundations. Sermon Overview readiness directs the preacher to the next incomplete stage.

## Final Sermon Drafting

The `/preaching/final` workspace provides:

- Final Manuscript
- Delivery Notes
- manuscript word count
- estimated preaching duration at 130 words per minute
- deterministic structured-draft assembly from the completed framework and outline
- persistent Supabase storage

The structured-draft builder is a starting point only. It preserves the distinction between source study material and the preacher's final authored manuscript.

## Sermon Delivery

The `/preaching/delivery` workspace provides a focused delivery view of the saved manuscript and delivery notes. It is intentionally read-focused so the preacher can review the message without the editing controls competing for attention.

The delivery view provides:

- focused manuscript reading
- Big Idea context
- manuscript word count
- estimated preaching duration at 130 words per minute
- separate Delivery Notes view
- direct return to Final Draft

## Current Branches

- `feat/observation-workspace-ui-next` is the earlier workspace UI iteration.
- `feat/observation-workspace-route` is the integrated Study Workspace/Sermon Preparation baseline.
- `feat/final-sermon-drafting` continues directly from that integrated baseline and now includes the final drafting and delivery stages.

## Verification

Repository CI is defined in `.github/workflows/ci.yml` for feature branches and pull requests. GitHub has not yet reported a workflow run for the latest commits, so local validation remains required before merging.

The final-drafting migration is:

`supabase/migrations/20260901100000_sermon_final_drafting.sql`

The migration has been applied successfully to the connected BSMP Supabase project. The `manuscript` and `delivery_notes` columns are present on `public.expository_sermons`.

Supabase security advisors currently report one pre-existing Auth warning: leaked-password protection is disabled. This is separate from the final-drafting schema change and should be addressed as an Auth hardening task.

## Next Work

1. Run `pnpm install`, `pnpm typecheck`, `pnpm test`, and `pnpm build` locally on `feat/final-sermon-drafting`.
2. Perform authenticated browser verification across Study → Sermon Preparation → Framework → Exposition → Final Draft → Delivery Mode.
3. Add export/print support for the final manuscript and delivery view.
4. Add sermon scheduling and preaching history after the delivery workflow is stable.
5. Harden Supabase Auth by enabling leaked-password protection.
