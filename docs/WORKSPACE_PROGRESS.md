# Study Workspace Progress

## Current Integration

The `/workspace` route now renders the existing `ObservationWorkspace` feature instead of the temporary placeholder.

The workspace presents a study passage pane beside the existing observation tools. The current passage content remains a UI-level prototype and is intentionally isolated from Bible loading until the Bible application query is exported and wired through the web bootstrap.

The passage pane now supports verse focus. Selecting a verse updates the workspace focus state so the next observation-record feature can attach study data to a specific verse.

## Current Architecture

- `apps/web/app/workspace/page.tsx` hosts the Study Workspace route.
- `apps/web/src/features/observation/ObservationWorkspace.tsx` loads workspace data from `@bsmp/study` and owns focused-verse state.
- `apps/web/src/features/observation/StudyPassage.tsx` renders passage context and supports verse selection.
- `packages/study` provides `ObservationWorkspaceService` and bootstrap wiring.
- `packages/inductive` provides observation questions and connecting words through application queries and repositories.
- `packages/ui` renders the observation panel.
- `packages/bible` already provides `ReadPassage` and `BibleRepository`, but the current public package entry point does not yet export the application query.

## Next Work

1. Export the Bible passage-reading application API cleanly.
2. Replace the prototype passage data with Bible application loading.
3. Add persistent observation records tied to study, passage, and verse.
4. Build interpretation on top of completed observation data.
