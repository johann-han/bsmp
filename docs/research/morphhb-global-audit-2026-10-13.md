# Open Scriptures MorphHB: Global Old Testament Morphology Audit

Audit date: 2026-10-13

## Source and method

- Source repository: https://github.com/openscriptures/morphhb
- Source snapshot: `3d15126fb1ef74867fc1434be1942e837932691f` (the `master` ref at audit time)
- Source data: all canonical book XML files under `wlc/`; `VerseMap.xml` excluded because it is a cross-reference map, not a Bible book.
- BSMP baseline: `0aa9555d6b24a9eb39d91b131d8fb654f85a8f71` on `feat/biblical-research-sources`
- BSMP parser/test files: `apps/web/src/lib/strongsHebrewMorphology.ts` and `apps/web/src/lib/strongsHebrewMorphology.test.ts`

The scan traversed every `<w>` element in canonical Old Testament book order, tracked verse-local word ordinal, and read the complete `morph` attribute. Frequencies and coverage refer to the exact full attribute value (including slash-separated composites), not the individual slash segments. Exact-code test coverage means the full code appears as a literal input to `parseHebrewMorphology()` or in a source-location-specific global morphology test. Parser status checks the current parser's part-of-speech and feature mapping tables; `Partial` indicates at least one feature or form requires review, not that the MorphHB source itself is invalid.

## Summary

| Measure | Result |
|---|---:|
| Canonical book XML files processed | 39 |
| Word tokens (`<w>`) | 306,785 |
| Word tokens with `morph` | 306,785 |
| Word tokens missing `morph` | 0 |
| Distinct exact morphology attribute strings | 3,464 |
| Distinct slash-segment codes | 752 |
| Exact codes represented by BSMP tests | 389 (11.23%) |
| Exact codes without an exact-code test | 3,075 |
| Word occurrences whose exact code is test-covered | 267,732 (87.27%) |
| Word occurrences whose exact code is not test-covered | 39,053 |
| Uncovered codes recognized by current parser mappings | 3,045 |
| Uncovered codes needing parser mapping/shape review | 30 (30 partial; 0 unsupported) |

All scanned word tokens in this source snapshot have a `morph` attribute. The count is verified by this scan and is not a guarantee about other MorphHB revisions.

## Highest-priority uncovered exact codes

Sorted by source occurrences descending; first occurrence is in canonical Old Testament order. The complete inventory, including covered codes, is in the companion CSV.

| Rank | Morphology code | OT occurrences | First occurrence | Parser status | Recommended next action |
|---:|---|---:|---|---|---|
| 1 | `HC/Ti` | 197 | Genesis 16:8 word 8 | Supported | Regression test only |
| 2 | `HC/Vqrmsa` | 196 | Genesis 4:12 word 11 | Supported | Regression test only |
| 3 | `HRd/Np` | 186 | Genesis 23:17 word 5 | Supported | Regression test only |
| 4 | `HC/R/Ncmsa` | 184 | Genesis 2:20 word 11 | Supported | Regression test only |
| 5 | `HVprmsa` | 182 | Genesis 21:9 word 10 | Supported | Regression test only |
| 6 | `HAamsc` | 181 | Genesis 10:9 word 3 | Supported | Regression test only |
| 7 | `HVhv2mp` | 179 | Genesis 24:49 word 9 | Supported | Regression test only |
| 8 | `HVpp3cp` | 177 | Genesis 24:19 word 9 | Supported | Regression test only |
| 9 | `HC/R/Vqc` | 176 | Genesis 1:18 word 1 | Supported | Regression test only |
| 10 | `HC/Td/Ncfsa` | 170 | Genesis 19:6 word 5 | Supported | Regression test only |
| 11 | `HTd/Ncbpa` | 167 | Genesis 26:3 word 13 | Supported | Regression test only |
| 12 | `HTo/Sp3fs` | 166 | Genesis 6:14 word 11 | Supported | Regression test only |
| 13 | `HVha` | 166 | Genesis 3:16 word 4 | Supported | Regression test only |
| 14 | `HVhp1cs` | 166 | Genesis 9:17 word 9 | Supported | Regression test only |
| 15 | `HC/Vqi3mp` | 164 | Genesis 34:21 word 6 | Supported | Regression test only |
| 16 | `HC/Ncbsc` | 160 | Genesis 1:2 word 9 | Supported | Regression test only |
| 17 | `HAcmda` | 157 | Genesis 6:19 word 5 | Supported | Regression test only |
| 18 | `HC/Vpw3mp` | 155 | Genesis 9:23 word 12 | Supported | Regression test only |
| 19 | `HNcmsa/Sd` | 155 | Genesis 14:10 word 13 | Supported | Regression test only |
| 20 | `HVpv2ms` | 155 | Genesis 19:22 word 1 | Supported | Regression test only |
| 21 | `HNcbpc/Sp1cs` | 153 | Genesis 26:5 word 9 | Supported | Regression test only |
| 22 | `HR/Ncbpc/Sp2ms` | 151 | Genesis 13:9 word 4 | Supported | Regression test only |
| 23 | `HVNi3mp` | 150 | Genesis 20:9 word 22 | Supported | Regression test only |
| 24 | `HVqsmpa` | 148 | Genesis 39:20 word 14 | Supported | Regression test only |
| 25 | `HNcmsc/Sp2mp` | 147 | Genesis 9:5 word 3 | Supported | Regression test only |
| 26 | `HC/Ncmpc/Sp3mp` | 145 | Genesis 32:16 word 3 | Supported | Regression test only |
| 27 | `HC/VNw3mp` | 145 | Genesis 7:23 word 17 | Supported | Regression test only |
| 28 | `HNcfpc/Sp3mp` | 145 | Genesis 34:21 word 16 | Supported | Regression test only |
| 29 | `HRd/Ncfpa` | 145 | Genesis 18:11 word 10 | Supported | Regression test only |
| 30 | `HC/Ncfsc/Sp3ms` | 143 | Genesis 2:25 word 5 | Supported | Regression test only |
| 31 | `HVpv2mp` | 140 | Genesis 40:8 word 14 | Supported | Regression test only |
| 32 | `HC/Vpq3ms` | 139 | Genesis 41:30 word 11 | Supported | Regression test only |
| 33 | `HD/Sd` | 138 | Genesis 14:10 word 11 | Supported | Regression test only |
| 34 | `HVNp3fs` | 138 | Genesis 6:12 word 6 | Supported | Regression test only |
| 35 | `HC/R/Ncmpc` | 137 | Genesis 25:6 word 1 | Supported | Regression test only |
| 36 | `ANcmsc` | 136 | Ezra 4:8 word 2 | Supported | Regression test only |
| 37 | `HC/Vqi3ms` | 134 | Genesis 1:6 word 7 | Supported | Regression test only |
| 38 | `HVNi3fs` | 134 | Genesis 41:36 word 13 | Supported | Regression test only |
| 39 | `ANcmsa` | 134 | Ezra 4:8 word 3 | Supported | Regression test only |
| 40 | `HR/Ncfpa` | 131 | Genesis 34:21 word 19 | Supported | Regression test only |
| 41 | `HR/Ncbpc/Sp3mp` | 128 | Genesis 6:13 word 13 | Supported | Regression test only |
| 42 | `HTd/Ncmsa/Sd` | 128 | Genesis 12:8 word 3 | Supported | Regression test only |
| 43 | `HR/Vqc/Sp3mp` | 126 | Genesis 4:8 word 7 | Supported | Regression test only |
| 44 | `HVpi2ms` | 126 | Genesis 31:24 word 13 | Supported | Regression test only |
| 45 | `HVhp2ms` | 125 | Genesis 12:18 word 11 | Supported | Regression test only |
| 46 | `HVqsfsa` | 123 | Genesis 3:17 word 16 | Supported | Regression test only |
| 47 | `ANcmpd/Td` | 123 | Ezra 4:9 word 9 | Supported | Regression test only |
| 48 | `HC/R/Ncfsa` | 122 | Exodus 6:9 word 13 | Supported | Regression test only |
| 49 | `HVqj2mp` | 121 | Genesis 19:8 word 22 | Supported | Regression test only |
| 50 | `HVqp2fs` | 121 | Genesis 3:13 word 7 | Supported | Regression test only |

## How to use the inventory

- Start with rank 1 in the CSV's `gap_priority_rank` field.
- Where `parser_status=Supported`, add a focused exact-code regression test only.
- Where `parser_status=Partial` or `Unsupported`, review parser behavior before deciding whether a parser change is required; keep each implementation PR narrowly scoped.
- After each merged test or parser fix, refresh the inventory against a new canonical tip and continue with the next uncovered case.
