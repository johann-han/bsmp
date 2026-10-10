# MorphHB Old Testament Morphology Global Audit

- Audited source: [Open Scriptures MorphHB](https://github.com/openscriptures/morphhb/tree/master/wlc), all 39 book XML files under `wlc/`; `VerseMap.xml` excluded because it is not a book text.
- Upstream `master` commit at audit: `3d15126fb1ef74867fc1434be1942e837932691f`.
- BSMP canonical integration base after merging PR #410: `764bc390ee674e33b4d92f72126d3cfc45698de6`.
- BSMP parser/test files audited at live canonical tip: `764bc390ee674e33b4d92f72126d3cfc45698de6`.
- Token definition: each `<w>` is a word element; morphology token means a non-empty `morph` attribute on `<w>`. Full attribute strings including slash composites are counted as distinct source codes.
- First occurrence: first appearance in canonical OT book order; word position is the 1-based ordinal of `<w>` elements within the OSIS verse.
- Exact-code test coverage means a source `morph` string is explicitly passed as a string literal to `parseHebrewMorphology` in `strongsHebrewMorphology.test.ts`. This is stricter than feature-family coverage.
- Parser mapping status is a static check against the current parser mapping tables. “Mapping gap” means at least one segment has an unrecognized language/POS/type/stem/aspect mapping; it is a review priority, not by itself proof that runtime output is wrong.

## Summary

| Metric | Result |
|---|---:|
| MorphHB OT book XML files | 39 |
| Total `<w>` word elements | 306785 |
| Morphology-tagged word tokens | 306785 |
| Distinct full source morphology strings | 3464 |
| Distinct source strings with exact-code regression | 346 (9.99%) |
| Untested distinct source strings | 3118 (90.01%) |
| Tokens bearing an exact-tested source string | 255923 (83.42%) |
| Untested codes with parser mapping gaps | 3118 |
| Untested codes whose parser mappings are recognized (regression-only candidates) | 0 |

## Highest-priority untested parser-mapping gaps

| Code | Occurrences | First occurrence |
|---|---:|---|
| `HR/D` | 491 | Gen 3:23, word 11 |
| `HNcfsc/Sp1cs` | 469 | Gen 4:23, word 11 |
| `HC/Vhw3mp` | 418 | Gen 14:5, word 9 |
| `HR/Vpc` | 403 | Gen 6:17, word 9 |
| `HPp3mp` | 395 | Gen 3:7, word 7 |
| `HNcfsc/Sp2ms` | 391 | Gen 3:17, word 6 |
| `ANcmsd/Td` | 364 | Ezra 4:8, word 5 |
| `HPp3fs` | 317 | Gen 3:12, word 7 |
| `HC/R/Np` | 315 | Gen 3:17, word 1 |
| `HNcmpc/Sp3fs` | 309 | Gen 25:24, word 2 |
| `HVNp3cp` | 301 | Gen 7:11, word 15 |
| `HC/Acbpa` | 297 | Gen 5:5, word 10 |
| `HC/Acfsa` | 293 | Gen 5:7, word 9 |
| `HVqsmsa` | 292 | Gen 3:14, word 9 |
| `HVhp3cp` | 287 | Gen 19:11, word 6 |
| `HTd/Pdxcp` | 284 | Gen 15:1, word 3 |
| `ATr` | 278 | Ezra 4:10, word 3 |
| `HTi/Tn` | 277 | Gen 4:7, word 1 |
| `HC/Ncfsc` | 271 | Gen 1:24, word 10 |
| `HTd/Pdxfs` | 271 | Gen 12:7, word 10 |
| `HC/Vqv2mp` | 263 | Gen 1:22, word 6 |
| `HC/Ncmpc/Sp3ms` | 261 | Gen 7:7, word 3 |
| `HPdxfs` | 255 | Gen 2:23, word 3 |
| `HVqp2mp` | 244 | Gen 18:5, word 11 |
| `HR/Ncbsc/Sp3ms` | 238 | Gen 9:4, word 3 |

## Highest-priority regression-only candidates

| Code | Occurrences | First occurrence |
|---|---:|---|
| None | 0 | — |

## Complete inventory

See the accompanying CSV for every source code, exact frequency, first occurrence, exact test status, parser-mapping assessment, and recommended next action. CSV rows are ordered by priority: untested mapping gaps by frequency, then regression-only candidates by frequency, then codes already covered by exact regression.
