# Open Scriptures MorphHB — Global Old Testament Morphology Audit

## Provenance

- Source: https://github.com/openscriptures/morphhb/tree/master/wlc
- Attribution: Original work of the Open Scriptures Hebrew Bible available at https://github.com/openscriptures/morphhb. The morphology annotations are licensed CC BY 4.0.
- MorphHB commit: 3d15126fb1ef74867fc1434be1942e837932691f.
- BSMP commit audited: cb741ea11a3484891f7827b463ce5d1a7fdb6589.
- Test coverage means a complete source morphology code appears as a literal argument to parseHebrewMorphology(...) in the current BSMP test file. Segment-only expectations do not count as exact-code coverage.
- Parser status is checked against the current parser's part-of-speech dispatch and lookup maps. The OSHM code reference defines x as a placeholder for unknown or unnecessary values when another required value follows; PERSON=x is therefore treated as supported because the parser uses its nullable person field for that placeholder. Partial means a needed code dimension is not handled or mapped; Unsupported means a segment uses an unknown POS or the overall code prefix is invalid. Code reference: https://hb.openscriptures.org/parsing/HebrewMorphologyCodes.html.

## Coverage summary

| Measure | Result |
|---|---:|
| XML files in wlc directory | 40 |
| Canonical OT book XML files parsed | 39 |
| Total OT word tokens (all w elements) | 306,785 |
| Hebrew-prefixed tokens (morphology H) | 301,837 |
| Aramaic-prefixed tokens (morphology A) | 4,948 |
| Other language-prefix tokens | 0 |
| Word tokens with non-empty morphology | 306,785 |
| Word tokens without morphology | 0 |
| Distinct exact morphology codes | 3,464 |
| Exact codes directly covered by tests | 359 (10.36%) |
| Exact codes not directly covered | 3,105 |
| Source occurrences covered by exact-code tests | 260,686 / 306,785 (84.97%) |
| Source occurrences belonging to uncovered exact codes | 46,099 |
| Codes flagged for parser review | 0 (0 occurrences) |
| Whole-code literals found in direct test calls | 422 |

## Master gap list — highest-frequency uncovered codes

The complete inventory of all exact source codes, frequency, first occurrence, parser status and test status is in the full CSV file: morphhb-global-morphology-codes.csv. Gaps below are ordered by total Old Testament occurrences, descending, for focused follow-up PRs.

| Rank | Morphology code | OT occurrences | First occurrence | Parser status | Next action |
|---:|---|---:|---|---|---|
| 1 | HVqsmsa | 292 | Genesis 3:14, word 9 | Supported | Add exact-code regression only |
| 2 | HVhp3cp | 287 | Genesis 19:11, word 6 | Supported | Add exact-code regression only |
| 3 | HTd/Pdxcp | 284 | Genesis 15:1, word 3 | Supported | Add exact-code regression only |
| 4 | ATr | 278 | Ezra 4:10, word 3 | Supported | Add exact-code regression only |
| 5 | HTi/Tn | 277 | Genesis 4:7, word 1 | Supported | Add exact-code regression only |
| 6 | HC/Ncfsc | 271 | Genesis 1:24, word 10 | Supported | Add exact-code regression only |
| 7 | HTd/Pdxfs | 271 | Genesis 12:7, word 10 | Supported | Add exact-code regression only |
| 8 | HC/Vqv2mp | 263 | Genesis 1:22, word 6 | Supported | Add exact-code regression only |
| 9 | HC/Ncmpc/Sp3ms | 261 | Genesis 7:7, word 3 | Supported | Add exact-code regression only |
| 10 | HPdxfs | 255 | Genesis 2:23, word 3 | Supported | Add exact-code regression only |
| 11 | HVqp2mp | 244 | Genesis 18:5, word 11 | Supported | Add exact-code regression only |
| 12 | HR/Ncbsc/Sp3ms | 238 | Genesis 9:4, word 3 | Supported | Add exact-code regression only |
| 13 | HNcfpc/Sp3ms | 233 | Genesis 19:14, word 7 | Supported | Add exact-code regression only |
| 14 | HC/Td/Ncmpa | 231 | Genesis 7:19, word 1 | Supported | Add exact-code regression only |
| 15 | HC/Rd/Ncmsa | 224 | Genesis 1:5, word 5 | Supported | Add exact-code regression only |
| 16 | HVqi1cp | 221 | Genesis 1:26, word 3 | Supported | Add exact-code regression only |
| 17 | HVpp1cs | 217 | Genesis 17:20, word 4 | Supported | Add exact-code regression only |
| 18 | HR/Ncfpc | 216 | Genesis 13:12, word 7 | Supported | Add exact-code regression only |
| 19 | ANp | 214 | Genesis 31:47, word 4 | Supported | Add exact-code regression only |
| 20 | HC/Acmsa | 214 | Genesis 4:24, word 7 | Supported | Add exact-code regression only |
| 21 | HC/Ncbsa | 214 | Genesis 11:4, word 6 | Supported | Add exact-code regression only |
| 22 | HC/Pp3ms | 214 | Genesis 3:16, word 14 | Supported | Add exact-code regression only |
| 23 | HR/Ncmsc/Sp3mp | 213 | Genesis 1:21, word 14 | Supported | Add exact-code regression only |
| 24 | HVqp1cp | 206 | Genesis 26:28, word 3 | Supported | Add exact-code regression only |
| 25 | HVqrfsa | 205 | Genesis 15:12, word 12 | Supported | Add exact-code regression only |
| 26 | AR | 203 | Ezra 4:8, word 9 | Supported | Add exact-code regression only |
| 27 | HVqrmsc | 202 | Genesis 4:2, word 9 | Supported | Add exact-code regression only |
| 28 | HC/Vqp3ms | 200 | Genesis 2:10, word 9 | Supported | Add exact-code regression only |
| 29 | HC/Pp2ms | 199 | Genesis 3:15, word 13 | Supported | Add exact-code regression only |
| 30 | HR/Vqc/Sp3ms | 199 | Genesis 12:4, word 16 | Supported | Add exact-code regression only |
| 31 | HC/Ti | 197 | Genesis 16:8, word 8 | Supported | Add exact-code regression only |
| 32 | HC/Vqrmsa | 196 | Genesis 4:12, word 11 | Supported | Add exact-code regression only |
| 33 | HRd/Np | 186 | Genesis 23:17, word 5 | Supported | Add exact-code regression only |
| 34 | HC/R/Ncmsa | 184 | Genesis 2:20, word 11 | Supported | Add exact-code regression only |
| 35 | HVprmsa | 182 | Genesis 21:9, word 10 | Supported | Add exact-code regression only |
| 36 | HAamsc | 181 | Genesis 10:9, word 3 | Supported | Add exact-code regression only |
| 37 | HVhv2mp | 179 | Genesis 24:49, word 9 | Supported | Add exact-code regression only |
| 38 | HVpp3cp | 177 | Genesis 24:19, word 9 | Supported | Add exact-code regression only |
| 39 | HC/R/Vqc | 176 | Genesis 1:18, word 1 | Supported | Add exact-code regression only |
| 40 | HC/Td/Ncfsa | 170 | Genesis 19:6, word 5 | Supported | Add exact-code regression only |
| 41 | HTd/Ncbpa | 167 | Genesis 26:3, word 13 | Supported | Add exact-code regression only |
| 42 | HTo/Sp3fs | 166 | Genesis 6:14, word 11 | Supported | Add exact-code regression only |
| 43 | HVha | 166 | Genesis 3:16, word 4 | Supported | Add exact-code regression only |
| 44 | HVhp1cs | 166 | Genesis 9:17, word 9 | Supported | Add exact-code regression only |
| 45 | HC/Vqi3mp | 164 | Genesis 34:21, word 6 | Supported | Add exact-code regression only |
| 46 | HC/Ncbsc | 160 | Genesis 1:2, word 9 | Supported | Add exact-code regression only |
| 47 | HAcmda | 157 | Genesis 6:19, word 5 | Supported | Add exact-code regression only |
| 48 | HC/Vpw3mp | 155 | Genesis 9:23, word 12 | Supported | Add exact-code regression only |
| 49 | HNcmsa/Sd | 155 | Genesis 14:10, word 13 | Supported | Add exact-code regression only |
| 50 | HVpv2ms | 155 | Genesis 19:22, word 1 | Supported | Add exact-code regression only |
| 51 | HNcbpc/Sp1cs | 153 | Genesis 26:5, word 9 | Supported | Add exact-code regression only |
| 52 | HR/Ncbpc/Sp2ms | 151 | Genesis 13:9, word 4 | Supported | Add exact-code regression only |
| 53 | HVNi3mp | 150 | Genesis 20:9, word 22 | Supported | Add exact-code regression only |
| 54 | HVqsmpa | 148 | Genesis 39:20, word 14 | Supported | Add exact-code regression only |
| 55 | HNcmsc/Sp2mp | 147 | Genesis 9:5, word 3 | Supported | Add exact-code regression only |
| 56 | HC/Ncmpc/Sp3mp | 145 | Genesis 32:16, word 3 | Supported | Add exact-code regression only |
| 57 | HC/VNw3mp | 145 | Genesis 7:23, word 17 | Supported | Add exact-code regression only |
| 58 | HNcfpc/Sp3mp | 145 | Genesis 34:21, word 16 | Supported | Add exact-code regression only |
| 59 | HRd/Ncfpa | 145 | Genesis 18:11, word 10 | Supported | Add exact-code regression only |
| 60 | HC/Ncfsc/Sp3ms | 143 | Genesis 2:25, word 5 | Supported | Add exact-code regression only |

## Parser-review inventory

These codes are flagged because the parser either lacks a dispatch branch or one or more code dimensions do not match the parser lookup tables. This inventory includes already-tested codes as well as exact-code gaps.

| Code | OT occurrences | First occurrence | Parser status | Detail | Exact-code test |
|---|---:|---|---|---|---|

## XML inventory note

The source directory contains 40 XML files. The 39 canonical book files above were parsed for word and morphology counts. Non-book XML files: VerseMap.xml. VerseMap.xml is an auxiliary WLC/KJV versification mapping file, not an OT book text, and is excluded from morphology counts.

## Book-by-book inventory

| Book | XML file | Word tokens | Morphology-tagged tokens |
|---|---|---:|---:|
| Genesis | Gen.xml | 20,629 | 20,629 |
| Exodus | Exod.xml | 16,726 | 16,726 |
| Leviticus | Lev.xml | 11,955 | 11,955 |
| Numbers | Num.xml | 16,422 | 16,422 |
| Deuteronomy | Deut.xml | 14,320 | 14,320 |
| Joshua | Josh.xml | 10,083 | 10,083 |
| Judges | Judg.xml | 9,905 | 9,905 |
| Ruth | Ruth.xml | 1,306 | 1,306 |
| 1 Samuel | 1Sam.xml | 13,335 | 13,335 |
| 2 Samuel | 2Sam.xml | 11,130 | 11,130 |
| 1 Kings | 1Kgs.xml | 13,186 | 13,186 |
| 2 Kings | 2Kgs.xml | 12,354 | 12,354 |
| 1 Chronicles | 1Chr.xml | 10,790 | 10,790 |
| 2 Chronicles | 2Chr.xml | 13,354 | 13,354 |
| Ezra | Ezra.xml | 3,791 | 3,791 |
| Nehemiah | Neh.xml | 5,336 | 5,336 |
| Esther | Esth.xml | 3,057 | 3,057 |
| Job | Job.xml | 8,399 | 8,399 |
| Psalms | Ps.xml | 19,657 | 19,657 |
| Proverbs | Prov.xml | 6,984 | 6,984 |
| Ecclesiastes | Eccl.xml | 2,999 | 2,999 |
| Song of Songs | Song.xml | 1,255 | 1,255 |
| Isaiah | Isa.xml | 16,988 | 16,988 |
| Jeremiah | Jer.xml | 21,976 | 21,976 |
| Lamentations | Lam.xml | 1,564 | 1,564 |
| Ezekiel | Ezek.xml | 18,866 | 18,866 |
| Daniel | Dan.xml | 6,035 | 6,035 |
| Hosea | Hos.xml | 2,386 | 2,386 |
| Joel | Joel.xml | 958 | 958 |
| Amos | Amos.xml | 2,045 | 2,045 |
| Obadiah | Obad.xml | 292 | 292 |
| Jonah | Jonah.xml | 688 | 688 |
| Micah | Mic.xml | 1,400 | 1,400 |
| Nahum | Nah.xml | 562 | 562 |
| Habakkuk | Hab.xml | 672 | 672 |
| Zephaniah | Zeph.xml | 769 | 769 |
| Haggai | Hag.xml | 601 | 601 |
| Zechariah | Zech.xml | 3,134 | 3,134 |
| Malachi | Mal.xml | 876 | 876 |

## Definitions

- A morphology code is the complete raw morph attribute of a MorphHB word token, including slash-separated composite segments.
- Both distinct-code coverage and occurrence-weighted coverage are reported. Exact-code coverage means the whole source code is directly passed as a test literal to the BSMP parser.
- The CSV is the master list of every exact code, not merely the high-frequency shortlist. Any Partial or Unsupported parser status needs review before treating the item as test-only.
- Word index is the 1-based ordinal of word elements within the source verse; markup segments such as maqaf and paseq are not counted as word tokens.
