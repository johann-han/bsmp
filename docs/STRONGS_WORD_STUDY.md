# Strong's Word Study

BSMP now provides a focused Strong's word-study surface inside the Study Passage.

## Current behavior

Strong's word study is currently available when the Study Passage translation is **KJV**.

The user can enable **Word Study**, select an English word, and open a popover containing any Strong's numbers attached to that source word. The popover can show:

- Strong's number
- original-language lemma
- transliteration
- pronunciation when supplied by the lexicon
- Strong's definition
- KJV gloss
- derivation when supplied

Words without a Strong's tag remain selectable but report that no Strong's number is attached in the source data.

The feature does not write lexical definitions into Study observations or interpretations. Strong's information is presented as reference material for the student's own word study.

## Data sources

The KJV word-level tagging is read from the pinned \`kaiserlik/kjv\` repository commit:

\`323f79bc6f4c2749e77a23a71b7ca7772fad81a7\`

The Hebrew and Greek lexicon metadata is read from the pinned Open Scriptures Strong's repository commit:

\`0acd2f251c2d35ff8db2dece4e0593979d3ac223\`

Open Scriptures documents its digital Strong's dictionaries as CC BY-SA, while James Strong's original dictionary work is public domain. Attribution should be preserved for redistributed or derived lexicon data.

The KJV tagging repository README identifies its corpus as KJV JSON with embedded Strong's tags.

## Architecture

- \`apps/web/src/lib/strongsWordStudy.ts\` loads and normalizes the external KJV word-tag data and Strong's dictionaries.
- \`apps/web/app/api/bible/strongs/route.ts\` exposes a server-side lookup boundary.
- \`apps/web/src/features/observation/WordStudyPopover.tsx\` provides the user-facing popover.
- \`StudyPassage\` activates the lexical mode without changing the existing Word Markup behavior.

External source files are fetched server-side and cached for 24 hours. Source URLs are pinned to commit hashes rather than mutable branches.

## Deliberate boundary

Strong's numbers are an indexing and lexical-reference system. A Strong's entry should not be treated as a complete contextual definition or as a substitute for syntax, literary context, and the student's own interpretation.

The next lexical slices can build on this boundary with morphology, original-language display, and richer word-study navigation without coupling lexical reference data to Study evidence.
