# Study Workspace Progress

## Current Integration

The `/workspace` route renders the `ObservationWorkspace` feature instead of the temporary placeholder.

The workspace presents a Bible-backed study passage beside the existing observation tools. The development passage is loaded through `@bsmp/study` and `@bsmp/bible` rather than hard-coded in the React component.

The passage supports verse focus. Selecting a verse updates the workspace focus state.

The workspace now provides an observation editor. A submitted observation is created through the Study application command, anchored to the selected Scripture verse, added to the current `StudySession`, and saved through the study repository.

## Current Architecture

- `apps/web/app/workspace/page.tsx` hosts the Study Workspace route.
- `apps/web/src/features/observation/ObservationWorkspace.tsx` loads the workspace and Bible passage services and owns focused-verse state.
- `apps/web/src/features/observation/StudyPassage.tsx` renders passage context and supports verse selection.
- `apps/web/src/features/observation/ObservationComposer.tsx` captures and saves verse-linked observations.
- `packages/study` provides `StudyPassageService`, `ObservationWorkspaceService`, `AddObservation`, and study bootstrap wiring.
- `packages/study` anchors `Observation` entities explicitly to an `ObservationVerseReference`.
- `packages/inductive` provides observation questions and connecting words through application queries and repositories.
- `packages/ui` renders the observation panel.
- `packages/bible` provides `ReadPassage` and `BibleRepository`, with the passage query exported through the public package API.

## Next Work

1. Move the development Bible fixture behind a dedicated Bible-source/repository configuration.
2. Add an observation list/history to the workspace so saved observations are visible by verse.
3. Add observation-question selection and connect it to observation records.
4. Build interpretation on top of completed observation data.
