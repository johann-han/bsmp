# Branch Reconciliation — `feat/final-sermon-drafting`

## Audit result

The feature branch and `main` have diverged from merge base `38861a7be949c563fc0ce2046b240acdb214ce25`.

At the time of this audit:

- `main` is 14 commits ahead of the merge base.
- `feat/final-sermon-drafting` contains the later integrated Study, Biblical Theology, Teaching, Sermon Preparation, Final Draft, Delivery, authentication, mentoring, persistence, and production-hardening work.
- A direct merge or rebase would therefore combine a large historical refactor with a later, substantially evolved application and would create unnecessary conflict risk.

## Main-only changes reviewed

The changes on `main` after the merge base are predominantly earlier foundation work around the Study/Inductive model and the first version of the preaching domain. They include older versions of:

- `packages/preaching/src/domain/ExpositorySermon.ts`
- `packages/preaching/src/index.ts`
- `packages/preaching/tsconfig.json`
- `packages/preaching/package.json`
- `apps/web/src/features/preaching/SermonExpositionWorkspace.tsx`
- `apps/web/app/workspace/page.tsx`
- observation history/tooling files
- `packages/inductive` observation-question query files

These implementations have been superseded on `feat/final-sermon-drafting` by the integrated versions used by the current application. The feature branch's sermon aggregate includes the later framework, exposition, manuscript, delivery, traceability, and Teaching linkage capabilities, so the older `main` implementations should not be cherry-picked over them.

The current `main` tree also contains an empty `apps/web/src/features/preaching/SermonPreparationOverview.tsx` entry in its latest commit history, while the feature branch contains the implemented overview/readiness workflow. This confirms that replacing the feature branch file with the `main` version would be a regression.

## Reconciliation decision

Do **not** merge or rebase `main` into `feat/final-sermon-drafting` as a blanket operation.

The safe path is to retain the feature branch as the source for the current application and only port a specific `main` change later when a concrete regression or missing capability is identified and the change can be applied deliberately.

Before final merge, review the final branch against the intended production baseline rather than attempting to make the commit histories artificially identical.
