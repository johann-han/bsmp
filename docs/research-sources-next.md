# External Biblical Research — Next Slice

This slice keeps external research separate from student-authored Study evidence. External retrieval is performed by the AI provider's supported web tools rather than by a direct arbitrary server-side URL fetch.

## Current contract

- Study context is loaded and scoped to the signed-in user first.
- External research is explicitly requested by the student.
- Up to ten optional HTTPS source URLs may be supplied by the UI.
- Gemini external research uses Google Search and URL Context.
- Returned URL citations are surfaced as retrieved sources and remain distinct from Study observations, interpretations, and Biblical Theology.
- No external material is automatically written into the Study or sermon records in this slice.

## Verification requirements

Before this slice is merged, CI must pass typecheck, tests, lint, and production build. Authenticated browser verification must cover enabling external research, asking a focused question, receiving a response with source citations when available, following a retrieved source, and confirming that the existing Study/Biblical Theology/Teaching links remain intact.
