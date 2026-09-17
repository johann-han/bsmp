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

## Source boundary

External research is supplementary. Retrieved material is displayed separately as **Retrieved Sources** and is not written automatically into Study observations, interpretations, Biblical Theology, Teaching, or sermon records.

When external evidence is used, the application should show the returned source URLs and avoid presenting an uncited claim as verified. The current implementation uses provider-side retrieval and does not directly fetch arbitrary user-supplied URLs from the application server.

## Verification

Automated repository CI must pass before the research-source slice is merged. Authenticated browser verification must confirm that contextual research automatically enables external retrieval, that a research-question suggestion populates the editable question field, that retrieved sources remain visibly separate from Study evidence, that a successful research run saves reusable sources, that saved sources can be selected in a later request, that a saved source can be removed, and that navigation back to the Study, Biblical Theology, and Teaching stages preserves the selected study.
