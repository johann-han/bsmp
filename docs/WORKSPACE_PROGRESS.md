# BSMP Workspace Progress

## Study Workspace

The `/workspace` route renders the integrated Study Workspace with the Bible passage, verse selection, observations, interpretations, evidence, applications, history, and persistence through the Study repository.

The Study remains the source of truth for passage-linked observations, interpretations, evidence, applications, and Biblical Theology.

When Sermon Exposition links back to an interpretation, the Workspace resolves the interpretation anchor to the visible Refine Interpretation / Evidence editor so the preacher can add missing evidence without manually searching the page.

Evidence creation and persistence are verified end-to-end against Supabase, including correct interpretation ID matching and rebuilt workspace packages.

The Observation Mentor now follows the canonical observation question sequence (Who, What, Where, When, Why, How), classifies student entries, supplies focused text-review cues, and lets the student save a mentor-highlighted text target as their own observation. The AI mentor is constrained to coach observation rather than replace the student's study.

Interpretations now require at least one supporting observation. The Interpretation Mentor evaluates whether a student's interpretation is adequately grounded in the selected observations and can focus the student back to the relevant observation without supplying a replacement interpretation.

Applications now have a responsible Application Mentor. It evaluates whether the student's principle, personal response, ministry response, and action follow from the selected interpretation, identifies the specific field that needs attention, and coaches the student without writing the application or adding new theology or preaching claims. The mentor API is protected by the signed-in Supabase session and the provider has automated tests for configuration, structured responses, focus limiting, and transient provider fallback.

## Biblical Theology

A first Biblical Theology stage is now present. A study can record a student-authored theological synthesis with a theme and a required set of supporting interpretations. Biblical Theology entries persist in Supabase with user-scoped row-level security and can be created, edited, and deleted from `/biblical-theology?studyId=...`.

The stage deliberately preserves the sequence from interpretation into theological synthesis: the synthesis is traceable to existing interpretations rather than generated as an authoritative AI conclusion. Sermon Preparation surfaces the number of Biblical Theology syntheses available, and each sermon outline point displays Biblical Theology themes related to its selected Meaning interpretations. The Sermon Study Source panel exposes the Biblical Theology chain and links back to the theological synthesis workspace.

The Biblical Theology workspace now links directly to the Teaching stage after a synthesis has been recorded.

## Teaching

The new `/teaching?studyId=...` workspace provides a distinct student-authored Teaching stage between Biblical Theology and Sermon Preparation. A teaching plan records audience, central truth, teaching aim, explanation, key teaching points, discussion questions, response prompt, and explicit supporting interpretation/Biblical Theology IDs.

Teaching plans persist in the connected Supabase project through `public.teaching_plans`, which is user-scoped with row-level security and indexed by user and study. The table also maintains `updated_at` through a database trigger.

The Teaching Mentor evaluates whether the student's teaching plan faithfully communicates the selected interpretation and Biblical Theology without replacing the lesson or introducing new theology. It can classify the plan as grounded, mixed, unclear, or overstated and focuses the student on specific fields for review. The mentor route requires a valid signed-in Supabase session and its provider has automated tests covering configuration, structured response parsing, focus limiting, and transient Gemini fallback.

The Global Navigation now exposes Biblical Theology and Teaching as first-class stages, and `/teaching` is included in the authenticated route set.

## Sermon Preparation

The `/preaching` workspace creates an expository sermon preparation record from a Study and provides sermon title, Big Idea, Purpose, outline construction, editing, deletion, ordering, and links to Study source material.

A completed Teaching Plan can now be explicitly linked to the sermon. The link is persisted on `expository_sermons.teaching_plan_id`, displayed in a dedicated Teaching Foundation bridge on Sermon Preparation, and only completed Teaching Plans may be attached. This establishes a direct Study → Biblical Theology → Teaching → Sermon relationship without copying the student's teaching content into the sermon record.

Each outline point can be supported by Study observations, interpretations, evidence, applications, and now directly selected Biblical Theology syntheses.

## Sermon Framework

The framework stage provides Introduction, Context / Setting, and Conclusion. These three framework sections can now be addressed directly by traceability anchors from the final-drafting workflow.

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

The final draft workspace also provides a Source Traceability section for every sermon outline point. From there, the preacher can navigate directly back to its recorded observations, interpretations, evidence, applications, and Biblical Theology syntheses, as well as open the Study Workspace, Biblical Theology workspace, or Sermon Exposition. Study Workspace links preserve a return path to the final draft.

The final draft and delivery pages now also surface the linked Teaching Plan as a read-only Teaching Foundation. The traceability view shows the plan title, central truth, teaching aim, and counts of supporting interpretations and Biblical Theology entries, with direct navigation back to the Teaching workspace and Sermon Preparation. This keeps the Study → Biblical Theology → Teaching → Sermon → Delivery relationship visible without copying Teaching content into the sermon manuscript.

The manuscript now supports an optional section-aware drafting mode. Traceable manuscript sections are persisted separately from the legacy manuscript text, each section can be tied directly to a sermon outline point, and the editor exposes the same Study foundation links beside the corresponding authored section. The final manuscript text is still preacher-authored and remains the printable/deliverable document.

The structured-draft builder is a starting point only. Traceable sections are generated from the completed sermon preparation and exposition so the preacher can revise each section rather than treating generated structure as the final message.

Manuscript section tests now cover section generation, point-level provenance, composition of revised authored content, preservation of provenance when outline points are reordered, and removal of sections linked to deleted outline points.

## Sermon Delivery

The `/preaching/delivery` workspace provides a focused delivery view of the saved manuscript and delivery notes. It is intentionally read-focused so the preacher can review the message without the editing controls competing for attention.

The delivery view provides:

- focused manuscript reading
- Big Idea context
- manuscript word count
- estimated preaching duration at 130 words per minute
- Print / Save PDF support
- direct return to Final Draft
- linked Teaching Foundation traceability

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
- `feat/final-sermon-drafting` continues directly from that integrated baseline and now includes final drafting, delivery, print/PDF support, scheduling/history, authentication, responsible AI mentoring, Study → Sermon traceability, the first Biblical Theology stage, and the first Teaching stage with Teaching → Sermon inheritance.

## Verification

Repository CI is defined in `.github/workflows/ci.yml` for feature branches and pull requests. The workflow now relies on the repository `packageManager` field for the pnpm version instead of declaring a conflicting second version in the action configuration.

The latest CI run for the Teaching traceability fix, run `33885564111`, completed successfully through dependency installation, typecheck, tests, and production build.

The final-drafting migration has been applied successfully to the connected BSMP Supabase project. The `manuscript` and `delivery_notes` columns are present on `public.expository_sermons`.

The scheduling migration has been applied successfully to the connected Supabase project and browser persistence has been verified.

The Biblical Theology migration has been applied successfully to the connected Supabase project. The new `public.biblical_theology_entries` table is RLS-protected for the signed-in user.

The Sermon Biblical Theology support migration has also been applied successfully to the connected Supabase project. `public.sermon_outline_points` now persists `supporting_biblical_theology_ids` with an empty-array default for existing rows.

The Biblical Theology `user_id` foreign-key index recommendation has now been addressed. The connected Supabase project contains `idx_biblical_theology_entries_user_id`, and migration `20260902185121_add_biblical_theology_user_id_index` is recorded as applied.

The sermon manuscript sections migration has now been applied to the connected Supabase project. `public.expository_sermons` persists `manuscript_sections` as JSONB with an empty-array default for existing sermons.

The missing `@bsmp/inductive` workspace importer has now been synchronized into `pnpm-lock.yaml` so `pnpm install --frozen-lockfile` matches `apps/web/package.json` again.

The final-draft Source Traceability change is committed as `6e2c7e01b756ac1e4df60ba26f496c76b11daf9f`. Its UI provides per-outline-point navigation back to recorded Study foundations. Browser verification was not performed for that specific change in this environment.

The Biblical Theology index migration is committed as `2b0e825839ba574739ac5fdc096d50d452fbc02e` and has passed repository CI.

The section-aware manuscript work is committed on `feat/final-sermon-drafting`. Repository CI is green. Authenticated browser verification remains pending for the new final-draft section editor and the complete Study → Biblical Theology → Sermon → Delivery walkthrough.

The Application Mentor integration is committed on `feat/final-sermon-drafting`. CI run `33878617356` completed successfully through dependency installation, typecheck, tests, and production build, including the new provider tests.

The Teaching migration has been applied successfully to the connected BSMP Supabase project. `public.teaching_plans` now exists with user/study indexes, row-level security, and an `updated_at` trigger.

The Teaching workspace, persistence layer, protected Teaching Mentor API, and Teaching Mentor provider tests are committed on `feat/final-sermon-drafting` and the corrected Teaching Mentor API passed CI through typecheck, tests, and production build.

The Teaching → Sermon migration `20260904143000_link_teaching_plan_to_sermon.sql` has been applied successfully to the connected Supabase project. `public.expository_sermons.teaching_plan_id` is nullable, foreign-keyed to `public.teaching_plans(id)` with `ON DELETE SET NULL`, and indexed.

The Teaching → Sermon bridge, domain linkage, persistence updates, and regression test are committed on `feat/final-sermon-drafting`. A completed Teaching Plan is required before the bridge will save it onto a sermon.

The final-draft and delivery Teaching Foundation traceability surface is committed on `feat/final-sermon-drafting`. It reads the persisted linked Teaching Plan from the study and exposes a read-only source summary with navigation back to Teaching and Sermon Preparation. Authenticated browser verification has not yet been performed for this latest UI change.

A Supabase security-advisor warning for the Teaching `updated_at` trigger's mutable `search_path` was identified and remediated. The connected database function now has `search_path = public`. The separate leaked-password protection warning remains because that Auth feature is unavailable on the connected project plan.

Supabase confirms the current application tables are RLS-enabled, including `studies`, `expository_sermons`, `sermon_outline_points`, `biblical_theology_entries`, and `teaching_plans`; the Teaching → Sermon foreign key is present from `expository_sermons.teaching_plan_id` to `teaching_plans.id`. 

## Next Work

1. Complete authenticated browser verification of Teaching, Teaching Mentor, Teaching → Sermon inheritance, and refresh persistence.
2. Complete authenticated browser verification of the traceable manuscript section editor and the full Study → Biblical Theology → Teaching → Sermon → Delivery walkthrough.
3. Continue production-hardening review of permissions, source traceability, and delivery/read-only presentation as the workflow expands.
