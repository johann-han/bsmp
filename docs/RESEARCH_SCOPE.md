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

## Contextual research

Contextual modes are intended to investigate background information that may illuminate a passage without silently turning that information into the student's interpretation.

Geographical research can cover places, routes, terrain, regions, climate, distances, and political boundaries.

Customs and culture research can cover social practices, family life, hospitality, honor and shame, food, clothing, marriage, burial, festivals, agriculture, and other relevant conventions.

Historical and chronological research can cover approximate dating, rulers, empires, events, conflicts, and developments surrounding the passage.

Social and political research can cover authorities, institutions, citizenship, taxation, patronage, social classes, ethnic relations, and power structures.

Religious-context research can cover worship, temple or synagogue life, festivals, purity, priesthood, and surrounding religious practices and beliefs.

Literary and historical setting can cover genre, audience, occasion, rhetorical situation, authorship, provenance, and the passage's place in the book.

Archaeological and material research can cover sites, inscriptions, artifacts, architecture, roads, household structures, tools, coins, agriculture, and other material evidence.

Language and terminology research can investigate significant Hebrew, Aramaic, or Greek terms, idioms, semantic range, translation issues, and relevant ancient usage.

## Source boundary

External research is supplementary. Retrieved material is displayed separately as **Retrieved Sources** and is not written automatically into Study observations, interpretations, Biblical Theology, Teaching, or sermon records.

When external evidence is used, the application should show the returned source URLs and avoid presenting an uncited claim as verified. The current implementation uses Gemini's built-in Google Search and URL Context tools rather than directly fetching user-supplied URLs from the application server.

## Verification

Automated repository CI must pass before the external-source slice is merged. Authenticated browser verification must confirm that contextual research can be run from a real Study, that retrieved sources remain visibly separate from Study evidence, and that navigation back to the Study, Biblical Theology, and Teaching stages preserves the selected study.
