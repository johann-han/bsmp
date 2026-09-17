# BSMP Biblical Research Scope

The Biblical Research workspace is designed as a research aid around a selected Study. The Study remains the source of truth for student-authored observations, interpretations, Biblical Theology, Teaching, and sermon work.

## Research modes

The workspace provides focused modes for:

- General Biblical Research
- Geographical Setting
- Customs & Culture
- Historical / Time Period
- Social & Political Setting
- Religious Context
- Literary & Historical Setting
- Archaeology & Material Context
- Language & Terminology

General Biblical Research remains study-grounded unless the student explicitly enables external research. Contextual modes automatically use external research because claims about geography, culture, history, archaeology, language, and similar background should be checked against external evidence rather than inferred solely from the student's Study notes.

## Research Questions helper

Each research mode presents a curated set of suggested research questions. The student can select a suggestion to populate the research-question field, then edit it before submitting the research request.

The question bank is deterministic and transparent; it does not silently generate or submit a question. The suggestions are intended as starting points for disciplined investigation and do not replace the student's own observations, interpretation, or theological judgment.

## Reusable Research Source Library

External sources can be retained as user-owned **Research Sources** for future investigation. A saved source stores its HTTPS URL, title, source type, associated Study when first saved, creation/update timestamps, and last-used timestamp.

Sources are reusable across Studies while remaining owned and isolated by the signed-in user. The Research workspace can select saved sources and add them to a future research request. Sources are not copied into Study observations, interpretations, Biblical Theology, Teaching, or sermon records automatically.

Successful external research saves returned source citations when available. When an external provider returns no citation annotations but the student supplied valid HTTPS URLs, those supplied URLs are saved with a hostname-based title so they remain reusable.

## Research History and provenance

Every completed research request is retained as a **Research Run** associated with the Study and the signed-in user. A run stores the research question, focus, answer, textual basis, further questions, cautions, provider, model, and supplied/cited source information.

The normalized `research_run_sources` records connect each source to the specific Research Run that used it. Each relationship records whether the source was a **Provider citation** or a **Supplied URL**, whether a formal citation annotation was returned, and the relevant reusable Research Source record when one exists.

Research History is available as its own workspace at `/research/history`. It can be scoped to a Study with `studyId`, filtered by research focus, and used to inspect the saved answer and its source provenance. Deleting a Research Run also removes its run-specific provenance records through the database foreign-key cascade; it does not delete the reusable Research Source Library record itself.

The provenance layer is deliberately normalized rather than stored only inside JSON. This provides a reliable audit trail for future work such as retrieval timestamps, provider usage accounting, AI cost metering, quotas, and subscription entitlements without coupling those concerns to Study evidence.

## Source boundary

External research is supplementary. Retrieved material is displayed separately as **Retrieved Sources** and is not written automatically into Study observations, interpretations, Biblical Theology, Teaching, or sermon records.

When external evidence is used, the application should show the returned source URLs and avoid presenting an uncited claim as verified. The current implementation uses provider-side retrieval and does not directly fetch arbitrary user-supplied URLs from the application server.

## Verification

Automated repository CI must pass before each research slice is merged. Authenticated browser verification must confirm that contextual research automatically enables external retrieval, that a research-question suggestion populates the editable question field, that retrieved sources remain visibly separate from Study evidence, that a successful research run saves reusable sources, that saved sources can be selected in a later request, that a saved source can be removed, that a completed research result survives refresh, that Research History can reopen saved runs, and that source provenance remains attached to the correct run.
