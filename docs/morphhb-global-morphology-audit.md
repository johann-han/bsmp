# Open Scriptures MorphHB — Global Old Testament Morphology Audit

## Provenance

- Source: https://github.com/openscriptures/morphhb/tree/master/wlc
- Attribution: Original work of the Open Scriptures Hebrew Bible available at https://github.com/openscriptures/morphhb. The morphology annotations are licensed CC BY 4.0.
- MorphHB commit: 3d15126fb1ef74867fc1434be1942e837932691f.
- BSMP commit audited: 5a3926d072d2fbb3b8c5402021d17c1d114f46a2.
- Test-file blob SHA: dc09a39f638568729d4410f40deeedcc97aaad70.
- Test coverage means a complete source morphology code appears as a literal argument to parseHebrewMorphology(...) in the current BSMP test file. Segment-only expectations do not count as exact-code coverage. This audit was regenerated from the current test suite, whose source blob is recorded in the report.
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
| Exact codes directly covered by tests | 441 (12.73%) |
| Exact codes not directly covered | 3,023 |
| Source occurrences covered by exact-code tests | 275,484 / 306,785 (89.80%) |
| Source occurrences belonging to uncovered exact codes | 31,301 |
| Codes flagged for parser review | 0 (0 occurrences) |
| Whole-code literals found in direct test calls | 504 |

## Master gap list — highest-frequency uncovered codes

The complete inventory of all exact source codes, frequency, first occurrence, parser status and test status is in the full CSV file: morphhb-global-morphology-codes.csv. Gaps below are ordered by total Old Testament occurrences, descending, for focused follow-up PRs.

| Rank | Morphology code | OT occurrences | First occurrence | Parser status | Next action |
|---:|---|---:|---|---|---|
| 1 | HNcbdc/Sp3ms | 117 | Genesis 13:10, word 4 | Supported | Add exact-code regression only |
| 2 | HR/Ncmpc/Sp2ms | 117 | Genesis 15:4, word 13 | Supported | Add exact-code regression only |
| 3 | HTd/Acmsa | 117 | Genesis 2:11, word 2 | Supported | Add exact-code regression only |
| 4 | HTo/Sp1cs | 117 | Genesis 4:14, word 3 | Supported | Add exact-code regression only |
| 5 | HVhrmpa | 117 | Genesis 19:13, word 2 | Supported | Add exact-code regression only |
| 6 | HR/Acmsa | 116 | Genesis 2:10, word 10 | Supported | Add exact-code regression only |
| 7 | HR/VNc | 116 | Genesis 19:19, word 18 | Supported | Add exact-code regression only |
| 8 | HNcmpc/Sp2fs | 114 | Joshua 2:18, word 20 | Supported | Add exact-code regression only |
| 9 | HNcmsc/Sp1cp | 114 | Genesis 19:31, word 5 | Supported | Add exact-code regression only |
| 10 | HVpp2ms | 112 | Genesis 4:14, word 2 | Supported | Add exact-code regression only |
| 11 | HC/Tr | 108 | Genesis 7:23, word 23 | Supported | Add exact-code regression only |
| 12 | HR/Ncbpc/Sp1cs | 104 | Genesis 6:13, word 8 | Supported | Add exact-code regression only |
| 13 | HVqi3mp/Sn | 104 | Genesis 18:28, word 2 | Supported | Add exact-code regression only |
| 14 | HR/Ncmpc/Sp2mp | 102 | Genesis 17:12, word 8 | Supported | Add exact-code regression only |
| 15 | HTd/VNrmpa | 101 | Genesis 45:1, word 6 | Supported | Add exact-code regression only |
| 16 | HNcfda | 100 | Genesis 4:15, word 8 | Supported | Add exact-code regression only |
| 17 | HC/Ncmsc/Sp1cs | 98 | Genesis 18:12, word 10 | Supported | Add exact-code regression only |
| 18 | HC/Pp3mp | 98 | Genesis 14:13, word 15 | Supported | Add exact-code regression only |
| 19 | HC/R/Ncbsc | 98 | Genesis 9:5, word 10 | Supported | Add exact-code regression only |
| 20 | HNcbpc/Sp2ms | 98 | Genesis 4:6, word 10 | Supported | Add exact-code regression only |
| 21 | HNcfsc/Sp2fs | 98 | Genesis 3:16, word 13 | Supported | Add exact-code regression only |
| 22 | HVHi3ms | 98 | Genesis 4:15, word 9 | Supported | Add exact-code regression only |
| 23 | AC | 97 | Ezra 4:13, word 6 | Supported | Add exact-code regression only |
| 24 | HC/R/Sp3ms | 95 | Genesis 33:1, word 8 | Supported | Add exact-code regression only |
| 25 | HR/Tn | 95 | Leviticus 15:25, word 8 | Supported | Add exact-code regression only |
| 26 | HR/Ncbsc/Sp1cs | 94 | Genesis 21:30, word 7 | Supported | Add exact-code regression only |
| 27 | HC/Vhw3ms/Sp3mp | 93 | Genesis 3:21, word 8 | Supported | Add exact-code regression only |
| 28 | HC/Vpq1cs | 93 | Genesis 17:16, word 1 | Supported | Add exact-code regression only |
| 29 | HC/Vqp3cp | 92 | Genesis 12:12, word 6 | Supported | Add exact-code regression only |
| 30 | HR/Ncfsc/Sp2ms | 92 | Genesis 49:18, word 1 | Supported | Add exact-code regression only |
| 31 | HC/R/Ncfsc | 90 | Genesis 33:14, word 13 | Supported | Add exact-code regression only |
| 32 | HC/Vhq2ms | 90 | Genesis 26:10, word 13 | Supported | Add exact-code regression only |
| 33 | HVNp1cs | 90 | Genesis 6:7, word 20 | Supported | Add exact-code regression only |
| 34 | HVqi2fs | 90 | Genesis 3:16, word 9 | Supported | Add exact-code regression only |
| 35 | HNcfpc/Sp1cs | 89 | Genesis 26:5, word 8 | Supported | Add exact-code regression only |
| 36 | HR/Pdxms | 89 | Genesis 16:8, word 6 | Supported | Add exact-code regression only |
| 37 | HTd/Aofsa | 89 | Genesis 4:19, word 10 | Supported | Add exact-code regression only |
| 38 | HC/Aampa | 88 | Genesis 13:13, word 4 | Supported | Add exact-code regression only |
| 39 | HC/Rd/Ncmpa | 88 | Exodus 7:19, word 32 | Supported | Add exact-code regression only |
| 40 | HVprmpa | 88 | Genesis 37:7, word 3 | Supported | Add exact-code regression only |
| 41 | HC/Vqw3ms/Sp3mp | 87 | Genesis 14:15, word 7 | Supported | Add exact-code regression only |
| 42 | HR/Ncbsc/Sp3mp | 87 | Genesis 35:4, word 9 | Supported | Add exact-code regression only |
| 43 | HC/Ncmsc/Sp2ms | 85 | Genesis 17:9, word 10 | Supported | Add exact-code regression only |
| 44 | HC/Vqa | 83 | Genesis 8:3, word 6 | Supported | Add exact-code regression only |
| 45 | AVqrmsa | 82 | Ezra 4:15, word 20 | Supported | Add exact-code regression only |
| 46 | HC/Vqw3fp | 82 | Genesis 19:36, word 1 | Supported | Add exact-code regression only |
| 47 | HNcfdc/Sp3ms | 81 | Genesis 24:32, word 12 | Supported | Add exact-code regression only |
| 48 | HR/Ncbdc/Sp2ms | 81 | Genesis 18:3, word 7 | Supported | Add exact-code regression only |
| 49 | HR/Ncfsc/Sp1cs | 81 | Genesis 4:23, word 17 | Supported | Add exact-code regression only |
| 50 | HC/Vqj3ms | 80 | Genesis 9:26, word 6 | Supported | Add exact-code regression only |
| 51 | HR/Vqc/Sp1cs | 80 | Genesis 29:19, word 7 | Supported | Add exact-code regression only |
| 52 | HC/Td/Ncfpa | 79 | Exodus 28:21, word 1 | Supported | Add exact-code regression only |
| 53 | HC/VNq3cp | 79 | Genesis 3:5, word 8 | Supported | Add exact-code regression only |
| 54 | HR/C | 79 | Genesis 3:11, word 12 | Supported | Add exact-code regression only |
| 55 | HC/Td/Ngmpa | 78 | Genesis 37:36, word 1 | Supported | Add exact-code regression only |
| 56 | HC/Vqi1cs | 78 | Genesis 24:14, word 9 | Supported | Add exact-code regression only |
| 57 | HC/Vqw2ms | 78 | Genesis 3:17, word 7 | Supported | Add exact-code regression only |
| 58 | HTd/Vhrmsa | 78 | Genesis 36:35, word 8 | Supported | Add exact-code regression only |
| 59 | HVhv2ms/Sh | 78 | Genesis 27:7, word 1 | Supported | Add exact-code regression only |
| 60 | HC/Ncfsc/Sp2ms | 77 | Genesis 6:18, word 10 | Supported | Add exact-code regression only |

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
