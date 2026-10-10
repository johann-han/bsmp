# Global Old Testament MorphHB morphology coverage audit

**Audit date:** 2026-10-10  
**BSMP canonical baseline:** `feat/biblical-research-sources` at `4d5fa37170d674c098be0f5bc4e202f463e05bef`  
**BSMP parser blob:** `618d81179e91529c24dbf20350445891d6b8bac8`  
**BSMP test blob at baseline:** `2e9dd1e96b9af921010848f0f157f05fd85cf9f5`  
**Upstream:** [Open Scriptures MorphHB](https://github.com/openscriptures/morphhb), `master` at `3d15126fb1ef74867fc1434be1942e837932691f`.

## Findings

| Measure | Global baseline | After this PR's one regression |
|---|---:|---:|
| MorphHB WLC book XML files scanned | 39 | 39 |
| Word tokens (`<w>`) | 306,785 | 306,785 |
| Hebrew tokens | 301,837 | 301,837 |
| Aramaic tokens | 4,948 | 4,948 |
| Tokens carrying a morphology attribute | 306,785 | 306,785 |
| Distinct full morphology strings | 3,464 | 3,464 |
| Distinct source strings with an exact test invocation | 335 (9.67%) | 336 (9.70%) |
| Token occurrences whose exact full code has a test | 247,474 (80.67%) | 248,701 (81.07%) |
| Distinct strings still needing a regression test | 3,129 | 3,128 |
| Token occurrences in strings still needing a regression test | 59,311 | 58,084 |

The existing test file contains 399 distinct literal full-code arguments, of which 335 occur in the source corpus. Coverage here means exact full morphology-string coverage, not simply a shared part-of-speech or feature combination.

### Parser mapping assessment

A static comparison of every slash-delimited segment in the 3,464 source strings against the current parser's part-of-speech, subtype, verb-stem, aspect, gender, number, state, and person tables found no unmapped symbols. Accordingly, the uncovered rows are classified as **regression-test gaps** rather than known parser-table implementation gaps.

This is a static table audit, not a claim that each code has already been executed by the TypeScript parser. The ranked list is intended to drive incremental runtime regressions. If a new test reveals an incorrect decoded value, that specific case should be reclassified as an implementation fix.

## First focused regression in this PR

- **Code:** `HNcfpa`
- **Occurrences:** 1,227
- **First occurrence:** Gen 3:7 (word 13)
- **Interpretation:** common feminine plural absolute noun
- **Change:** test-only; the current parser tables already contain the needed noun, gender, number, and state mappings.

## Highest-priority remaining gaps after this PR

| Code | Occurrences | First occurrence | Next action |
|---|---:|---|---|
| `HAampa` | 1,078 | Gen 2:25 (word 3) | Regression test only |
| `HAcfsa` | 1,001 | Gen 2:21 (word 9) | Regression test only |
| `HNcmpc/Sp1cs` | 811 | Gen 15:2 (word 3) | Regression test only |
| `HNcmpc/Sp2ms` | 766 | Gen 3:14 (word 23) | Regression test only |
| `HC/Ncfsa` | 652 | Gen 1:27 (word 11) | Regression test only |
| `HVqi3fs` | 638 | Gen 9:2 (word 14) | Regression test only |
| `HVqp2ms` | 599 | Gen 3:11 (word 15) | Regression test only |
| `HTd/Ncfpa` | 577 | Gen 14:16 (word 13) | Regression test only |
| `HNcmsc/Sp3mp` | 551 | Gen 5:2 (word 8) | Regression test only |
| `HR/Tr` | 549 | Gen 7:9 (word 10) | Regression test only |
| `HR/D` | 491 | Gen 3:23 (word 11) | Regression test only |
| `HNcfsc/Sp1cs` | 469 | Gen 4:23 (word 11) | Regression test only |
| `HC/Vhw3mp` | 418 | Gen 14:5 (word 9) | Regression test only |
| `HR/Vpc` | 403 | Gen 6:17 (word 9) | Regression test only |
| `HPp3mp` | 395 | Gen 3:7 (word 7) | Regression test only |
| `HNcfsc/Sp2ms` | 391 | Gen 3:17 (word 6) | Regression test only |
| `ANcmsd/Td` | 364 | Ezra 4:8 (word 5) | Regression test only |
| `HPp3fs` | 317 | Gen 3:12 (word 7) | Regression test only |
| `HC/R/Np` | 315 | Gen 3:17 (word 1) | Regression test only |
| `HNcmpc/Sp3fs` | 309 | Gen 25:24 (word 2) | Regression test only |
| `HVNp3cp` | 301 | Gen 7:11 (word 15) | Regression test only |
| `HC/Acbpa` | 297 | Gen 5:5 (word 10) | Regression test only |
| `HC/Acfsa` | 293 | Gen 5:7 (word 9) | Regression test only |
| `HVqsmsa` | 292 | Gen 3:14 (word 9) | Regression test only |
| `HVhp3cp` | 287 | Gen 19:11 (word 6) | Regression test only |

The complete 3,464-row inventory, sorted by occurrence count descending (then code), is in [`morphhb-global-morphology-gap-list.csv`](./morphhb-global-morphology-gap-list.csv). It includes already-tested rows as well as gaps, so frequency, first occurrence, baseline test coverage, parser-table mapping status, and recommended action can be filtered together.

## Method

1. Scanned every book XML in upstream `wlc/` and excluded only the auxiliary `VerseMap.xml`.
2. Counted every `<w>` element as a word token and used its exact `morph` attribute as the full morphology string. All 306,785 word tokens in these files carried a `morph` attribute.
3. Tracked first occurrence in canonical Old Testament book order, then chapter, verse, and `<w>` order within the verse.
4. Compared exact full strings with literal inputs to `parseHebrewMorphology(...)` in the canonical-branch test file.
5. Compared all source-segment symbols with the mapping tables in the canonical-branch parser file. The coverage percentage is reported in two ways: distinct code strings and token occurrences.

## Source inventory

The 39 source files scanned were: Gen.xml, Exod.xml, Lev.xml, Num.xml, Deut.xml, Josh.xml, Judg.xml, Ruth.xml, 1Sam.xml, 2Sam.xml, 1Kgs.xml, 2Kgs.xml, 1Chr.xml, 2Chr.xml, Ezra.xml, Neh.xml, Esth.xml, Job.xml, Ps.xml, Prov.xml, Eccl.xml, Song.xml, Isa.xml, Jer.xml, Lam.xml, Ezek.xml, Dan.xml, Hos.xml, Joel.xml, Amos.xml, Obad.xml, Jonah.xml, Mic.xml, Nah.xml, Hab.xml, Zeph.xml, Hag.xml, Zech.xml, Mal.xml.

| Upstream book file | Word tokens | Git blob SHA from the upstream contents listing |
|---|---:|---|
| Gen.xml | 20629 | `09ac9cab0a47c5fae8d747c2868f1cf50d6d1131` |
| Exod.xml | 16726 | `9397e001f25d14353793a3924d4e9c605cecfc6c` |
| Lev.xml | 11955 | `71dca6003694912dd283b5d4f7e98d0790a123f6` |
| Num.xml | 16422 | `15339e5a99c7900cf37810f8d6d7f18c59ad0aa0` |
| Deut.xml | 14320 | `6966deedd88043fbef5a124d50e346711f652efa` |
| Josh.xml | 10083 | `8530c301a0211e8c7cb19ee868ca07bdac3aa2ab` |
| Judg.xml | 9905 | `51062fc90a87e1cc2abedc78d8ec299cd154bbdf` |
| Ruth.xml | 1306 | `1f4a59a804900a13ace95054f60f854f15a53bb1` |
| 1Sam.xml | 13335 | `a098d99be40bc22a77a2abe646410b6f717fc788` |
| 2Sam.xml | 11130 | `ae33a1ca6871cbf2ce849b5bebb8056c26e3b495` |
| 1Kgs.xml | 13186 | `f28c90fa0604154a92629d578da88c1cddae0263` |
| 2Kgs.xml | 12354 | `2a7134748a7292c858c4ee913f6d5bfeb59d33fd` |
| 1Chr.xml | 10790 | `614ceb107774d9ed4010d3ecf33e46d189768a83` |
| 2Chr.xml | 13354 | `52ff350ffcffaaa35ab22940d8f1f0d996746345` |
| Ezra.xml | 3791 | `86c6763390817450141661d48ef3c177dcb97ee8` |
| Neh.xml | 5336 | `24319052ec0326b6ddaedb42f8607c2c21eb5b16` |
| Esth.xml | 3057 | `a644e4aedc0bcde6f609aff48bb17e3efa5d6fc1` |
| Job.xml | 8399 | `7145ccffb4bfe624c428acc90ecf3adf58974eab` |
| Ps.xml | 19657 | `2da40d4bfc7d1772eccb6f49cf027f460b8be4f4` |
| Prov.xml | 6984 | `c999b67fd1b44bb9474ee9a2b2d66c2453ffdd90` |
| Eccl.xml | 2999 | `8e071f175b233629e75b227da78e407f8fdb2d69` |
| Song.xml | 1255 | `1feee17dd05ab7e51e5f6b684d092ef70e9aa0bc` |
| Isa.xml | 16988 | `b64ca328892a998d0540b5a6bf89ac6a19b574b0` |
| Jer.xml | 21976 | `de440367b576a694094ab7c6e6a861481c8c7f0d` |
| Lam.xml | 1564 | `c971eb03fbe9562c19e206e013bf657cfba948e8` |
| Ezek.xml | 18866 | `2b9cdaab9f434201f69d5a0d747d8a567f4b9432` |
| Dan.xml | 6035 | `2d3ede0464a1f313152276f8d4e97a0cf9e2d356` |
| Hos.xml | 2386 | `4e737ff7ae7bdf9f21a9c85eaa6e023005ed51cd` |
| Joel.xml | 958 | `d1a160746190931dccd91014499558fae735586a` |
| Amos.xml | 2045 | `686510536da8691f7015ade8e472c17f8c50683f` |
| Obad.xml | 292 | `17496d001587f142484239a7337380c68a30e77e` |
| Jonah.xml | 688 | `158c18ecbf3026fa845105d34b8766d89bcd039e` |
| Mic.xml | 1400 | `91f1eb9525085bdf34d5554d93e38943ea350452` |
| Nah.xml | 562 | `dc0341e8b053449e92daae8197cd28240fd57d00` |
| Hab.xml | 672 | `f64d893d18e79842e85b6457ea643008a81a8f9c` |
| Zeph.xml | 769 | `db77292abc38d6c4655c892f080246883b8180a3` |
| Hag.xml | 601 | `f2334fa92e2229a8da8b68d3386335e9836a18ac` |
| Zech.xml | 3134 | `d2b0328e0611559396df3c1acbe9d8abe7238199` |
| Mal.xml | 876 | `cbc6a0ee566e2911b2c8c4a229d8ee4af82b587b` |

**Scope note:** this is a source-versioned audit snapshot. If the MorphHB source or BSMP parser/tests change, regenerate the CSV before treating its coverage columns as current.
