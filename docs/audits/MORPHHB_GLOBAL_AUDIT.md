# MorphHB Old Testament Morphology Global Audit

- Source: [Open Scriptures MorphHB `wlc/`](https://github.com/openscriptures/morphhb/tree/master/wlc), pinned by the individual XML blob IDs listed from upstream `master` commit `3d15126fb1ef74867fc1434be1942e837932691f`.
- BSMP canonical branch base after PR #410: `764bc390ee674e33b4d92f72126d3cfc45698de6`.
- Scope: all 39 book XML files in `wlc/`; `VerseMap.xml` excluded because it is not a book text.
- Token definition: a morphology token is a non-empty `morph` attribute on a `<w>` element. Full attribute strings, including slash composites, are counted as exact morphology codes.
- First occurrence: the first appearance in canonical OT book order; word number is the 1-based ordinal of `<w>` elements within the OSIS verse.
- Exact-code regression coverage means the full source code string appears as a string literal in a direct `parseHebrewMorphology(...)` test call. This is stricter than grammar-feature coverage.
- Parser mapping status is computed from the current parser's POS, subtype, verb-stem, and aspect maps. A reported mapping gap is a candidate for review, not proof of incorrect runtime output.

## Summary

| Metric | Result |
|---|---:|
| Old Testament book XML files | 39 |
| `<w>` word elements | 306,785 |
| Morphology-tagged word tokens | 306,785 |
| Distinct exact source morphology strings | 3,464 |
| Exact-tested source strings | 346 (9.99%) |
| Untested source strings | 3,118 (90.01%) |
| Tokens using an exact-tested code | 255,923 (83.42%) |
| Untested parser-mapping gap candidates | 0 |
| Untested codes with recognized mappings (regression-only candidates) | 3,118 |
| Distinct tested strings in the test file (including strings outside the MorphHB OT source) | 410 |

## Highest-priority untested parser-mapping candidates

| Code | Occurrences | First occurrence |
|---|---:|---|
| None | 0 | — |

## Highest-priority regression-only candidates

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

## Complete inventory

The accompanying CSV contains one row for every source morphology string, ordered by priority: untested mapping-gap candidates by occurrence count, then regression-only candidates by occurrence count, then codes already covered by exact regression. Each row includes frequency, first occurrence, exact-test status, parser-map status, and a recommended next action.
