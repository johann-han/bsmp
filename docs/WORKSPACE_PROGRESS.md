# BSMP Workspace Progress

## Study Workspace

The `/workspace` route renders the integrated Study Workspace with the Bible passage, verse selection, observations, interpretations, evidence, applications, history, and persistence through the Study repository.

The Study remains the source of truth for passage-linked observations, interpretations, evidence, applications, and Biblical Theology.

When Sermon Exposition links back to an interpretation, the Workspace resolves the interpretation anchor to the visible Refine Interpretation / Evidence editor so the preacher can add missing evidence without manually searching the page.

Evidence creation and persistence are verified end-to-end against Supabase, including correct interpretation ID matching and rebuilt workspace packages.

The Observation Mentor now follows the canonical observation question sequence (Who, What, Where, When, Why, How), classifies student entries, supplies focused text-review cues, and lets the student save a mentor-highlighted text target as their own observation. The AI mentor is constrained to coach observation rather than replace the student's study.

Interpretations now require at least one supporting observation. The Interpretation Mentor evaluates whether a student's interpretation is adequately grounded in the selected observations and can focus the student back on the relevant observation without supplying a replacement interpretation.

## Biblical Theology

A first Biblical Theology stage is now present. A study can record a student-authored theological synthesis with a theme and a required set of supporting interpretations. Biblical Theology entries persist in Supabase with user-scoped row-level security and can be created, edited, and deleted from `/biblical-theology?studyId=...`.

The stage deliberately preserves the sequence from interpretation into theological synthesis: the synthesis is traceable to existing interpretations rather than generated as an authoritative AI conclusion. Sermon Preparation surfaces the number of Biblical Theology syntheses available, and each sermon outline point displays Biblical Theology themes related to its selected Meaning interpretations. The Sermon Study Source panel exposes the Biblical Theology chain and links back to the theological synthesis workspace.

## Sermon Preparation

The `/preaching` workspace creates an expository sermon preparation record from a Study and provides sermon title, Big Idea, Purpose, outline construction, editing, deletion, ordering, and links to Study source material.

Each outline point can be supported by Study observations, interpretations, evidence, applications, and now directly selected Biblical Theology syntheses.

## Sermon Framework

The framework stage provides Introduction, Context / Setting, and Conclusion.

## Sermon Exposition

Each outline point can be developed through Text, Meaning / explanation, Illustration, Application, and Transition, with explicit links to the relevant Study foundations. Exposition includes explicit foundation mappings for Text observations, Meaning interpretations, Meaning evidence, Response applications, and optional Biblical Theology syntheses, plus readiness guidance for each outline point.

Biblical Theology choices are persisted on the sermon outline point. The UI prioritizes syntheses connected to the point's selected Meaning interpretations, while still allowing other student-authored syntheses to be selected. The theological synthesis remains a supporting layer; the underlying interpretation is still explicitly traceable.

Editing an outline point without changing its Biblical Theology foundation now preserves the existing theology links rather than clearing them.

The Sermon Study Source panel exposes the source chain behind applications: application → interpretation → supporting observations and evidence, with links back into the Study Workspace. It also exposes Biblical Theology syntheses and their supporting interpretation chain.

## Final Sermon Drafting

The `/preaching/final` workspace provides:

- Final Manuscript
- Delivery Notes
- manuscript word count
- estimated preaching duration at 130 words per minute
- deterministic structured-draft assembly from the completed framework and outline
- persistent Supabase storage
- Print / Save PDF support using the browser print dialog

The final draft workspace now also provides a Source Traceability section for every sermon outline point. From there, the preacher can navigate directly back to its recorded observations, interpretations, evidence, applications, and Biblical Theology syntheses, as well as open the Study Workspace, Biblical Theology workspace, or Sermon Exposition. Study Workspace links preserve a return path to the final draft.

The structured-draft builder is a starting point only. It preserves the distinction between source study material and the preacher's final authored manuscript. Source Traceability is navigation/provenance tooling and is excluded from the printed manuscript output.

## Sermon Delivery

The `/preaching/delivery` workspace provides a focused delivery view of the saved manuscript and delivery notes. It is intentionally read-focused so the preacher can review the message without the editing controls competing for attention.

The delivery view provides:

- focused manuscript reading
- Big Idea context
- manuscript word count
- estimated preaching duration at 130 words per minute
- Print / Save PDF support
- direct return to Final Draft

## Sermon Scheduling & Preaching History

The `/preaching/history` workspace now manages repeatable preaching occurrences for a sermon rather than storing a single preaching date on the sermon itself.

Each occurrence stores:

- scheduled date and time
- service name
- venue
- occurrence notes
- scheduled / completed / cancelled status
- actual preached time when completed

The occurrence model and Supabase persistence use row-level security scoped to the signed-in user. This allows one sermon to have multiple scheduled or completed preaching occasions while keeping the manuscript and sermon content unchanged.

Browser verification is complete, including scheduling an occurrence, marking it preached, refreshing to confirm persistence, and creating multiple independent occurrences for the same sermon.

## Authentication

BSMP now provides:

- visible Sign in / Sign out controls in the global navigation
- protected application routes for authenticated users
- safe return to the originally requested protected route after sign-in
- password change from Settings
- password recovery via email and Reset Password flow
- user-scoped Supabase RLS for study, sermon, and preaching occurrence data

Browser verification is complete for sign-in, sign-out, protected routes, password change, and password recovery.

Leaked-password protection remains deferred because the connected Supabase project plan does not expose the Have I Been Pwned password protection feature.

## Current Branches

- `feat/observation-workspace-ui-next` is the earlier workspace UI iteration.
- `feat/observation-workspace-route` is the integrated Study Workspace/Sermon Preparation baseline.
- `feat/final-sermon-drafting` continues directly from that integrated baseline and now includes final drafting, delivery, print/PDF support, scheduling/history, authentication, responsible AI mentoring, Study → Sermon traceability, and the first Biblical Theology stage.

## Verification

Repository CI is defined in `.github/workflows/ci.yml` for feature branches and pull requests. The workflow now relies on the repository `packageManager` field for the pnpm version instead of declaring a conflicting second version in the action configuration.

The final-drafting migration has been applied successfully to the connected BSMP Supabase project. The `manuscript` and `delivery_notes` columns are present on `public.expository_sermons`.

The scheduling migration has been applied successfully to the connected Supabase project and browser persistence has been verified.

The Biblical Theology migration has been applied successfully to the connected Supabase project. The new `public.biblical_theology_entries` table is RLS-protected for the signed-in user.

The Sermon Biblical Theology support migration has also been applied successfully to the connected Supabase project. `public.sermon_outline_points` now persists `supporting_biblical_theology_ids` with an empty-array default for existing rows.

The missing `@bsmp/inductive` workspace importer has now been synchronized into `pnpm-lock.yaml` so `pnpm install --frozen-lockfile` matches `apps/web/package.json` again.

The earlier CI attempts failed during dependency installation because the lockfile was missing the newly declared `@bsmp/inductive` workspace dependency in the `apps/web` importer. The temporary lockfile-repair workflow regenerated and committed the lockfile successfully.

A fresh full CI run for commit `491fdcf76fc0050b22f2ebd9bf579e94e53d23b0` completed successfully: typecheck, test, and production build all passed. The regression test covering preservation of Biblical Theology support during normal outline edits also passed.

The later final-draft Source Traceability change is committed as `6e2c7e01b756ac1e4df60ba26f496c76b11daf9f`. This change has been reviewed at the repository commit level; a new CI run for this commit should be treated as the verification checkpoint for the traceability UI itself. Browser verification was not performed for that specific change in this environment.

Supabase security advisors previously reported the known leaked-password protection limitation; the Biblical Theology and sermon-support tables are protected by RLS. Performance advisors also reported an index recommendation on the new Biblical Theology table's `user_id` foreign key, which should be addressed in a later database-hardening pass.

## Next Work

1. Run a fresh CI cycle for the final-draft Source Traceability change and perform authenticated browser verification of the complete Study → Biblical Theology → Sermon → Delivery workflow.
2. Strengthen the final manuscript itself with finer-grained source anchors so authored manuscript sections can be traced back to the relevant sermon points and Study foundations without relying only on the separate Source Traceability panel.
3. Continue the inductive-study experience toward the broader responsible AI mentor workflow described in the product vision.
