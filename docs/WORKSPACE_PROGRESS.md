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

## Biblical Research

The `/research?studyId=...` workspace is a first-class authenticated Research stage linked to the selected Study. It displays the Study title, passage, observation/interpretation/Biblical Theology counts, a focused research-question editor, grounded research guidance, textual basis, further-study questions, cautions, and direct links back to Study Workspace, Biblical Theology, and Teaching.

The first Research slice is deliberately Study-grounded. The protected `/api/ai/biblical-research` route requires a valid Supabase bearer session, verifies the selected Study belongs to the signed-in user, then loads that user's observations, interpretations, and Biblical Theology entries for the selected Study before invoking the research provider. The provider is explicitly constrained not to invent quotations, sources, historical facts, Greek/Hebrew claims, or cross-references and to acknowledge insufficient context.

Automated provider tests cover missing configuration, structured-result parsing, preservation of Study context in the prompt, and response-list bounds. Repository CI passed typecheck, tests, lint, and production build for the Research slice, and authenticated browser verification has been completed successfully for the workflow: Study → Research → focused question → grounded response → links back to Study Workspace, Biblical Theology, and Teaching.

No external source discovery or citation retrieval is included in this first slice. This is intentional: the current Research assistant distinguishes Study-grounded synthesis from later source-retrieval functionality rather than implying that external sources were actually consulted.

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
- Manuscript / Delivery Notes focus switching
- adjustable reading size with keyboard shortcuts
- section navigation with active-section tracking
- distraction-free fullscreen Focus Mode
- local recovery of section, focus, reading size, and focus-mode preferences
- screen wake-lock support where the browser permits it
- a preacher-set “My Place” line that can be restored after navigation or interruption
- responsive phone controls, including narrow-phone layout handling

The delivery workspace also defensively normalizes persisted text values so missing or malformed section text does not crash the delivery screen.

Delivery recovery now validates saved “My Place” section references against the loaded manuscript sections. When a section has been deleted or otherwise becomes unavailable, the stale local marker is removed silently rather than producing a broken recovery target. Local recovery remains a convenience only and cannot block delivery when browser storage is malformed, inaccessible, or inconsistent.

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
- `feat/observation-workspace-route` is the integrated Study Workspace, Research, Biblical Theology, Teaching, Sermon Preparation, Sermon Delivery, scheduling/history, and authentication baseline.
- `feat/final-sermon-drafting` contains the earlier final-drafting development history that was merged into the integrated baseline.
- `feat/research-source-planning` is the documentation/roadmap branch for the next Research increment. `main` remains untouched.

## Verification

Repository CI is defined in `.github/workflows/ci.yml` for feature branches and pull requests. The workflow now relies on the repository `packageManager` field for the pnpm version instead of declaring a conflicting second version in the action configuration.

The integrated Study → Sermon → Delivery baseline has green repository CI and authenticated browser verification as recorded above.

Research CI run `35121312369` (run `937`) completed successfully through dependency installation, typecheck, tests, lint, and production build for PR #4.

Research PR #4 was merged into `feat/observation-workspace-route` as merge commit `59d2f6b6285bacb86d87964e718af3250189f704` after successful authenticated browser verification. `main` was not modified.

The Research implementation uses no new Supabase tables or migrations. Existing user-scoped tables remain the source of Research context, and the Research API enforces the signed-in user's Study ownership before reading that context.

Supabase security-advisor status remains unchanged: the only outstanding advisory is leaked-password protection, which is unavailable on the connected project plan.

Research source planning is documented in PR #5. The next external-source layer is explicitly separated from student-authored Study context and requires source URLs, retrieval timestamps, provenance, unsupported-source handling, and authenticated browser verification before source-derived material influences sermon stages.

## Next Work

1. Add the external-source retrieval layer behind a distinct source/provenance boundary.
2. Persist or expose citation metadata only when a source was actually retrieved and verified.
3. Define safe retrieval constraints, including supported source types and protection against untrusted or unsupported destinations.
4. Keep source-derived evidence separate from student-authored Study evidence so traceability remains explicit.
5. Verify external research in an authenticated browser before allowing source-derived material to flow into sermon stages.
