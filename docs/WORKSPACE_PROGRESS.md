# Study Workspace Progress

## Current Integration

The `/workspace` route now renders the existing `ObservationWorkspace` feature instead of the temporary placeholder.

The workspace presents a study passage pane beside the existing observation tools. The passage pane remains a UI-level development fixture while the Bible application boundary is being wired.

The passage pane supports verse focus. Selecting a verse updates the workspace focus state so the next observation-record feature can attach study data to a specific verse.

The Bible package now exposes its `ReadPassage` application query through the public package API. Production passage loading is the next integration step.

## Current Architecture

- `apps/web/app/workspace/page.tsx` hosts the Study Workspace route.
- `apps/web/src/features/observation/ObservationWorkspace.tsx` loads workspace data from `@bsmp/study` and owns focused-verse state.
- `apps/web/src/features/observation/StudyPassage.tsx` renders passage context and supports verse selection.
- `packages/study` provides `ObservationWorkspaceService` and bootstrap wiring.
- `packages/inductive` provides observation questions and connecting words through application queries and repositories.
- `packages/ui` renders the observation panel.
- `packages/bible` provides `ReadPassage` and `BibleRepository`, with the passage query now exported through the public package API.

## Next Work

1. Wire a Bible repository into the web/study bootstrap.
2. Replace the development passage fixture with Bible application loading.
3. Add persistent observation records tied to study, passage, and verse.
4. Build interpretation on top of completed observation data.
