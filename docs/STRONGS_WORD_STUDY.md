# Strong's Word Study

BSMP now provides a focused Strong's word-study surface inside the Study Passage.

## Current behavior

Strong's word study is currently available when the Study Passage translation is **KJV**.

The user can enable **Word Study**, select an English word, and open a popover containing any Strong's numbers attached to that source word. The popover can show:

- Strong's number
- original-language lemma
- transliteration
- pronunciation when supplied by the lexicon
- the inflected original-language form when available
- token-level Greek morphology for New Testament words, including structured morphology details when supplied
- token-level Hebrew morphology for Old Testament words, including structured morphology details when supplied
- morpheme-by-morpheme Hebrew breakdowns for composite words (prefix/root/suffix segments)
- conservative prefix/root/suffix role labels derived from the TAHOT root marker and segment order
- structured grammatical state on Hebrew morphemes when the source code supplies it
- Strong’s references attached to individual TAHOT morphemes when supplied by the source
- Strong's definition
- KJV gloss
- derivation when supplied

Words without a Strong's tag remain selectable but report that no Strong's number is attached in the source data.

The feature does not write lexical definitions into Study observations or interpretations. Strong's information is presented as reference material for the student's own word study.

## Data sources

The KJV word-level tagging is read from the pinned `kaiserlik/kjv` repository commit:

`323f79bc6f4c2749e77a23a71b7ca7772fad81a7`

The Hebrew and Greek Strong's lexicon metadata is read from the pinned Open Scriptures Strong's repository commit:

`0acd2f251c2d35ff8db2dece4e0593979d3ac223`

Open Scriptures documents its digital Strong's dictionaries as CC BY-SA, while James Strong's original dictionary work is public domain. Attribution should be preserved for redistributed or derived lexicon data.

The Greek morphology source is STEPBible's pinned TAGNT dataset at commit:

`b99716b0cddb648ddb95cc786a197180f2f97d48`

TAGNT and its morphology coding reference are published by **STEP Bible** from work created at Tyndale House Cambridge under **CC BY 4.0**. The repository requests credit to "STEP Bible" with a link to `https://www.stepbible.org` and asks that any data changes be recorded. BSMP does not modify or redistribute the raw TAGNT files; it fetches the pinned source server-side and decodes the published morphology codes for display.

The morphology code definitions are based on STEPBible's **TEGMC — Translators Expansion of Greek Morphology Codes**, also CC BY 4.0.

The KJV tagging repository README identifies its corpus as KJV JSON with embedded Strong's tags.

Greek New Testament morphology and Hebrew Old Testament morphology are now both supported as separate source-driven slices because their tagging and parsing schemes differ.

## Architecture

- `apps/web/src/lib/strongsWordStudy.ts` loads and normalizes the external KJV word-tag data and Strong's dictionaries.
- `apps/web/src/lib/strongsMorphology.ts` decodes the published Greek morphology code into a small structured display model and permits composite segment metadata.
- `apps/web/src/lib/strongsHebrewMorphology.ts` decodes the published Hebrew/Aramaic morphology code into the same structured display model, retaining each composite segment.
- `apps/web/src/lib/strongsHebrewData.ts` loads pinned STEPBible TAHOT data, aligns the selected Hebrew/Aramaic segment to the KJV Strong's occurrence, and returns the complete morpheme sequence for that TAHOT word.
- `apps/web/app/api/bible/strongs/route.ts` exposes a server-side lookup boundary.
- `apps/web/src/features/observation/WordStudyPopover.tsx` provides the user-facing popover.
- `StudyPassage` activates the lexical mode without changing the existing Word Markup behavior.

External source files are fetched server-side and cached for 24 hours. Source URLs are pinned to commit hashes rather than mutable branches.

## Deliberate boundary

Strong's numbers are an indexing and lexical-reference system. A Strong's entry should not be treated as a complete contextual definition or as a substitute for syntax, literary context, and the student's own interpretation.

Morphology describes the form of an individual original-language token. It does not, by itself, determine the meaning or grammatical function of the whole clause.

## Word-study navigation

When Word Study is active, the selected word is treated as a lexical sub-focus inside the current passage context. The popover provides **Previous** and **Next** controls so the student can move through adjacent words without closing the study surface. Navigation crosses verse boundaries when the passage contains multiple verses.

The left and right arrow keys perform the same navigation while the word-study popover is open. The verse remains the contextual focus; navigation changes only the lexical word target.

## Greek morphology

For Greek New Testament words, BSMP supplements the Strong's dictionary entry with the token's original-language form and morphology from STEPBible TAGNT. The display includes the published morphology code and a decoded summary such as part of speech, tense, voice, mood, person, case, number, and gender where those fields are present in the source code.

The decoder covers the common TAGNT/Robinson pattern families used by the current source, including second-form verbs such as `V-2AAI-3S` and `V-2RAI-3P`, pluperfect forms such as `V-LAI-3S`, participles, infinitives, personal pronouns, demonstratives, correlatives, and uninflected categories such as `CONJ`, `PREP`, `ADV`, and `PRT-N`. Unknown or unsupported source forms retain their raw code rather than being assigned an invented interpretation.

The alignment is deliberately token-level rather than Strong's-number-only. Strong's numbers can occur multiple times in a verse, so BSMP uses the KJV tag position and STEPBible's `sStrong+Instance` convention to select the corresponding Greek token. When the source does not provide a defensible match, the Strong's lexical entry remains available without inventing morphology.

## Hebrew morphology

For Hebrew Old Testament words, BSMP supplements the Strong's dictionary entry with the selected original-language segment and morphology from STEPBible TAHOT. The implementation follows the TAHOT structure in which prefixes, roots, and suffixes can be separated with `/`, the lexical root is marked with `{curly braces}`, and the Grammar column carries an Open Scriptures-style morphology code. The selected KJV Strong's number is aligned to the corresponding TAHOT segment by occurrence within the verse. When the source structure is not unambiguous, BSMP leaves the lexical entry available without inventing a morphology result.

The Hebrew decoder is based on the published Open Scriptures morphology scheme and the STEPBible TEHMC vocabulary. It covers common nouns, adjectives, pronouns, prefixes/articles, prepositions, particles, suffixes, and verb stem/aspect forms, while preserving the raw code for unsupported combinations. Composite codes such as `HTd/Ncmpa` are retained as ordered segments so the UI can show the article and lexical stem separately. The existing word-study popover also exposes the decoder's structured fields—such as part of speech, form/aspect, person, gender, number, state, and qualifier—alongside the decoded summary and raw code. Hebrew grammatical state is retained separately from the qualifier (Absolute, Construct, or Determined) so downstream displays do not need to infer it from summary text. When TAHOT identifies a lexical root, BSMP labels segments before it as prefixes and segments after it as suffixes; when the source does not expose a defensible root position, the segments remain neutrally labeled. Each morpheme also retains the Strong’s tag list attached to its TAHOT dStrongs segment, preserving source-level lexical references even for composite words. Hebrew and Aramaic source codes are both represented in the same morphology model, with the language code preserved (`H` for Hebrew and `A` for Aramaic) and Aramaic identified in the decoded summary.

TAHOT source data is pinned to commit `b99716b0cddb648ddb95cc786a197180f2f97d48`. STEPBible describes TAHOT as a Leningrad-based Hebrew OT with full morphological and semantic tags for words, prefixes, and suffixes, with morphology based on ETCBC converted to the Open Scriptures format. The source is CC BY 4.0 and requests attribution to STEP Bible. citeturn395373search1

The Hebrew slice preserves the same lexical-reference boundary as the Greek slice: morphology is reference information for word study and does not populate Study observations or interpretations.


## Future lexical slices

Future lexical slices can build on this boundary with richer original-language display and additional lexical or syntactic references without coupling lexical reference data to Study evidence.
