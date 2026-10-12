#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const BOOK_ORDER = [
  ["Gen", "Genesis"], ["Exod", "Exodus"], ["Lev", "Leviticus"], ["Num", "Numbers"],
  ["Deut", "Deuteronomy"], ["Josh", "Joshua"], ["Judg", "Judges"], ["Ruth", "Ruth"],
  ["1Sam", "1 Samuel"], ["2Sam", "2 Samuel"], ["1Kgs", "1 Kings"], ["2Kgs", "2 Kings"],
  ["1Chr", "1 Chronicles"], ["2Chr", "2 Chronicles"], ["Ezra", "Ezra"], ["Neh", "Nehemiah"],
  ["Esth", "Esther"], ["Job", "Job"], ["Ps", "Psalms"], ["Prov", "Proverbs"],
  ["Eccl", "Ecclesiastes"], ["Song", "Song of Songs"], ["Isa", "Isaiah"], ["Jer", "Jeremiah"],
  ["Lam", "Lamentations"], ["Ezek", "Ezekiel"], ["Dan", "Daniel"], ["Hos", "Hosea"],
  ["Joel", "Joel"], ["Amos", "Amos"], ["Obad", "Obadiah"], ["Jonah", "Jonah"],
  ["Mic", "Micah"], ["Nah", "Nahum"], ["Hab", "Habakkuk"], ["Zeph", "Zephaniah"],
  ["Hag", "Haggai"], ["Zech", "Zechariah"], ["Mal", "Malachi"],
];
const BOOK_NAMES = new Map(BOOK_ORDER);
const ORDER_INDEX = new Map(BOOK_ORDER.map(([code], index) => [code, index]));

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}
const sourceDir = arg("--source", "morphhb/wlc");
const parserPath = arg("--parser", "apps/web/src/lib/strongsHebrewMorphology.ts");
const testPath = arg("--tests", "apps/web/src/lib/strongsHebrewMorphology.test.ts");
const outMd = arg("--out-md", "docs/morphhb-global-morphology-audit.md");
const outCsv = arg("--out-csv", "docs/morphhb-global-morphology-codes.csv");

function attribute(attrs, name) {
  const match = attrs.match(new RegExp("(?:^|\\s)" + name + "\\s*=\\s*[\"']([^\"']*)[\"']"));
  return match?.[1] ?? null;
}
function pct(n, d) {
  return d ? (100 * n / d).toFixed(2) + "%" : "0.00%";
}
function csv(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}
function escMarkdown(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

const parserSource = fs.readFileSync(parserPath, "utf8");
const tests = fs.readFileSync(testPath, "utf8");

function mapKeys(name) {
  const match = parserSource.match(new RegExp("const\\s+" + name + "\\s*:\\s*Record<string,\\s*string>\\s*=\\s*\\{([\\s\\S]*?)\\n\\};"));
  if (!match) throw new Error("Could not find parser map " + name);
  const keys = new Set();
  const keyPattern = /^\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9]+))\s*:/gm;
  for (const m of match[1].matchAll(keyPattern)) keys.add(m[1] ?? m[2] ?? m[3]);
  return keys;
}
const maps = Object.fromEntries([
  "PART_OF_SPEECH", "CONJUNCTION_TYPE", "ADJECTIVE_TYPE", "NOUN_TYPE", "PRONOUN_TYPE",
  "PREPOSITION_TYPE", "SUFFIX_TYPE", "PARTICLE_TYPE", "HEBREW_VERB_STEM",
  "ARAMAIC_VERB_STEM", "VERB_ASPECT", "GENDER", "NUMBER", "STATE", "PERSON",
].map(name => [name, mapKeys(name)]));
const switchBlock = parserSource.match(/switch\s*\(posCode\)\s*\{([\s\S]*?)\n\s*default:/)?.[1] ?? "";
const handledPos = new Set([...switchBlock.matchAll(/case\s+"([^"]+)"\s*:/g)].map(m => m[1]));

function classifyMorphology(raw) {
  const normalized = raw.trim();
  const language = normalized[0];
  if (language !== "H" && language !== "A") {
    return { status: "Unsupported", detail: "code does not begin with H or A" };
  }
  const segments = normalized.slice(1).split("/").map(s => s.trim()).filter(Boolean);
  if (!segments.length) return { status: "Unsupported", detail: "no morphology segments" };
  const problems = [];
  let unknownPos = false;
  for (const segment of segments) {
    const pos = segment[0] ?? "";
    if (!maps.PART_OF_SPEECH.has(pos)) {
      unknownPos = true;
      problems.push("unknown POS " + (pos || "(empty)"));
      continue;
    }
    if (!handledPos.has(pos)) {
      problems.push("no parser switch for POS " + pos);
      continue;
    }
    const check = (map, index, label) => {
      const ch = segment[index];
      if (ch !== undefined && ch !== "" && !maps[map].has(ch)) problems.push(label + " code " + ch);
    };
    switch (pos) {
      case "C":
      case "c":
        check("CONJUNCTION_TYPE", 1, "conjunction type");
        break;
      case "A":
        check("ADJECTIVE_TYPE", 1, "adjective type");
        if (segment.length > 2) {
          check("GENDER", 2, "gender");
          check("NUMBER", 3, "number");
          check("STATE", 4, "state");
        }
        break;
      case "N": {
        check("NOUN_TYPE", 1, "noun type");
        if (segment.length > 2 && !(segment[1] === "p" && segment[2] === "t")) {
          check("GENDER", 2, "gender");
          check("NUMBER", 3, "number");
          check("STATE", 4, "state");
        }
        break;
      }
      case "P":
        check("PRONOUN_TYPE", 1, "pronoun type");
        check("PERSON", 2, "person");
        check("GENDER", 3, "gender");
        check("NUMBER", 4, "number");
        break;
      case "R":
        check("PREPOSITION_TYPE", 1, "preposition type");
        break;
      case "S":
        check("SUFFIX_TYPE", 1, "suffix type");
        check("PERSON", 2, "person");
        check("GENDER", 3, "gender");
        check("NUMBER", 4, "number");
        break;
      case "T":
        check("PARTICLE_TYPE", 1, "particle type");
        break;
      case "V": {
        check(language === "H" ? "HEBREW_VERB_STEM" : "ARAMAIC_VERB_STEM", 1, "verb stem");
        check("VERB_ASPECT", 2, "verb form");
        const aspect = segment[2] ?? "";
        if (aspect === "r" || aspect === "s") {
          let start = 3;
          if (segment.slice(start).startsWith("x")) start += 1;
          check("GENDER", start, "participle gender");
          check("NUMBER", start + 1, "participle number");
          check("STATE", start + 2, "participle state");
        } else if (aspect !== "a" && aspect !== "c") {
          const start = segment[3] === "j" && ["1", "2", "3"].includes(segment[4] ?? "") ? 4 : 3;
          check("PERSON", start, "verb person");
          check("GENDER", start + 1, "verb gender");
          check("NUMBER", start + 2, "verb number");
        }
        break;
      }
    }
  }
  if (unknownPos) return { status: "Unsupported", detail: problems.join("; ") };
  if (problems.length) return { status: "Partial", detail: problems.join("; ") };
  return { status: "Supported", detail: "" };
}

// Count whole-code literal arguments, not segment-only expected-output labels.
const testedCodes = new Set();
const directCall = /parseHebrewMorphology\s*\(\s*(?:"([^"]+)"|'([^']+)')/g;
for (const match of tests.matchAll(directCall)) {
  const code = (match[1] ?? match[2] ?? "").trim();
  if (/^[HA][A-Za-z0-9/]+$/.test(code)) testedCodes.add(code);
}

const entries = fs.readdirSync(sourceDir)
  .filter(file => file.endsWith(".xml") && ORDER_INDEX.has(file.slice(0, -4)))
  .sort((a, b) => ORDER_INDEX.get(a.slice(0, -4)) - ORDER_INDEX.get(b.slice(0, -4)));
const stats = new Map();
let wordTokens = 0;
let morphTokens = 0;
const bookSummaries = [];

for (const filename of entries) {
  const bookCode = filename.slice(0, -4);
  const bookName = BOOK_NAMES.get(bookCode) ?? bookCode;
  const xml = fs.readFileSync(path.join(sourceDir, filename), "utf8");
  let currentVerse = null;
  let wordInVerse = 0;
  let bookWords = 0;
  let bookMorphs = 0;
  const tags = /<(verse|w)\b([^>]*)>/g;
  for (const match of xml.matchAll(tags)) {
    const tag = match[1];
    const attrs = match[2];
    if (tag === "verse") {
      const id = attribute(attrs, "osisID") ?? attribute(attrs, "sID");
      if (id) {
        const parts = id.split(".");
        if (parts.length >= 3) currentVerse = { book: parts[0], chapter: parts[1], verse: parts[2] };
        else currentVerse = null;
        wordInVerse = 0;
      }
      continue;
    }
    wordTokens += 1;
    bookWords += 1;
    wordInVerse += 1;
    const morph = attribute(attrs, "morph");
    if (morph === null || !morph.trim()) continue;
    morphTokens += 1;
    bookMorphs += 1;
    const code = morph.trim();
    if (!stats.has(code)) {
      const locBookCode = currentVerse?.book ?? bookCode;
      const locBookName = BOOK_NAMES.get(locBookCode) ?? bookName;
      const firstOccurrence = currentVerse
        ? locBookName + " " + currentVerse.chapter + ":" + currentVerse.verse + ", word " + wordInVerse
        : locBookName + " (verse location unavailable)";
      stats.set(code, {
        code,
        count: 0,
        firstOccurrence,
        firstBook: locBookName,
        firstChapter: currentVerse?.chapter ?? "",
        firstVerse: currentVerse?.verse ?? "",
        firstWord: currentVerse ? wordInVerse : "",
      });
    }
    stats.get(code).count += 1;
  }
  bookSummaries.push({book: bookName, file: filename, wordTokens: bookWords, morphTokens: bookMorphs});
}

if (!entries.length) throw new Error("No canonical Old Testament book XML files found in " + sourceDir);

const rows = [...stats.values()].map(item => {
  const parser = classifyMorphology(item.code);
  const tested = testedCodes.has(item.code);
  const priority = item.count >= 1000 ? "P1" : item.count >= 100 ? "P2" : item.count >= 10 ? "P3" : "P4";
  const action = tested
    ? (parser.status === "Supported" ? "Already covered by exact-code test" : "Review parser behavior despite existing exact-code test")
    : parser.status === "Supported"
      ? "Add exact-code regression only"
      : "Parser review/change plus exact-code regression";
  return {...item, parserStatus: parser.status, parserDetail: parser.detail, tested, priority, action};
});
const gaps = rows.filter(r => !r.tested).sort((a,b) => b.count - a.count || a.code.localeCompare(b.code));
const parserIssues = rows.filter(r => r.parserStatus !== "Supported").sort((a,b) => b.count - a.count || a.code.localeCompare(b.code));
const testedOccurrences = rows.filter(r => r.tested).reduce((sum,r) => sum + r.count, 0);
const coveredDistinct = rows.filter(r => r.tested).length;
const summary = {
  morphhbCommit: process.env.MORPHHB_COMMIT ?? "unknown",
  bsmpAuditCommit: process.env.BSMP_AUDIT_COMMIT ?? "unknown",
  books: entries.length,
  bookFiles: entries.map(f => f),
  wordTokens,
  morphologyTaggedTokens: morphTokens,
  tokensWithoutMorphology: wordTokens - morphTokens,
  distinctMorphologyCodes: rows.length,
  exactCodeTestCoveredDistinct: coveredDistinct,
  uncoveredDistinct: rows.length - coveredDistinct,
  distinctCodeCoveragePercent: pct(coveredDistinct, rows.length),
  occurrencesCoveredByExactCodeTests: testedOccurrences,
  occurrenceCoveragePercent: pct(testedOccurrences, morphTokens),
  uncoveredOccurrences: morphTokens - testedOccurrences,
  parserIssueCodes: parserIssues.length,
  parserIssueOccurrences: parserIssues.reduce((sum,r) => sum + r.count, 0),
  directLiteralCodesFoundInTests: testedCodes.size,
};

const report = [
  "# Open Scriptures MorphHB — Global Old Testament Morphology Audit",
  "",
  "## Provenance",
  "",
  "- Source: https://github.com/openscriptures/morphhb/tree/master/wlc",
  "- MorphHB commit: " + summary.morphhbCommit + ".",
  "- BSMP commit audited: " + summary.bsmpAuditCommit + ".",
  "- Test coverage means a complete source morphology code appears as a literal argument to parseHebrewMorphology(...) in the current BSMP test file. Segment-only expectations do not count as exact-code coverage.",
  "- Parser status is checked against the current parser's part-of-speech dispatch and lookup maps. Partial means the POS is recognized but at least one code dimension is not handled or mapped; Unsupported means a segment uses an unknown POS or the overall code prefix is invalid.",
  "",
  "## Coverage summary",
  "",
  "| Measure | Result |",
  "|---|---:|",
  "| Canonical OT book XML files | " + summary.books + " |",
  "| Total word tokens (all w elements) | " + summary.wordTokens.toLocaleString("en-US") + " |",
  "| Word tokens with non-empty morphology | " + summary.morphologyTaggedTokens.toLocaleString("en-US") + " |",
  "| Word tokens without morphology | " + summary.tokensWithoutMorphology.toLocaleString("en-US") + " |",
  "| Distinct exact morphology codes | " + summary.distinctMorphologyCodes.toLocaleString("en-US") + " |",
  "| Exact codes directly covered by tests | " + summary.exactCodeTestCoveredDistinct.toLocaleString("en-US") + " (" + summary.distinctCodeCoveragePercent + ") |",
  "| Exact codes not directly covered | " + summary.uncoveredDistinct.toLocaleString("en-US") + " |",
  "| Source occurrences covered by exact-code tests | " + summary.occurrencesCoveredByExactCodeTests.toLocaleString("en-US") + " / " + summary.morphologyTaggedTokens.toLocaleString("en-US") + " (" + summary.occurrenceCoveragePercent + ") |",
  "| Source occurrences belonging to uncovered exact codes | " + summary.uncoveredOccurrences.toLocaleString("en-US") + " |",
  "| Codes flagged for parser review | " + summary.parserIssueCodes + " (" + summary.parserIssueOccurrences.toLocaleString("en-US") + " occurrences) |",
  "| Whole-code literals found in direct test calls | " + summary.directLiteralCodesFoundInTests + " |",
  "",
  "## Master gap list — highest-frequency uncovered codes",
  "",
  "The complete inventory of all exact source codes, frequency, first occurrence, parser status and test status is in the full CSV file: morphhb-global-morphology-codes.csv. Gaps below are ordered by total Old Testament occurrences, descending, for focused follow-up PRs.",
  "",
  "| Rank | Morphology code | OT occurrences | First occurrence | Parser status | Next action |",
  "|---:|---|---:|---|---|---|",
  ...gaps.slice(0, 60).map((r, i) =>
    "| " + (i + 1) + " | " + escMarkdown(r.code) + " | " + r.count.toLocaleString("en-US") + " | " + escMarkdown(r.firstOccurrence) + " | " + r.parserStatus + (r.parserDetail ? " — " + escMarkdown(r.parserDetail) : "") + " | " + r.action + " |"
  ),
  "",
  "## Parser-review inventory",
  "",
  "These codes are flagged because the parser either lacks a dispatch branch or one or more code dimensions do not match the parser lookup tables. This inventory includes already-tested codes as well as exact-code gaps.",
  "",
  "| Code | OT occurrences | First occurrence | Parser status | Detail | Exact-code test |",
  "|---|---:|---|---|---|---|",
  ...parserIssues.slice(0, 100).map(r =>
    "| " + escMarkdown(r.code) + " | " + r.count.toLocaleString("en-US") + " | " + escMarkdown(r.firstOccurrence) + " | " + r.parserStatus + " | " + escMarkdown(r.parserDetail) + " | " + (r.tested ? "Yes" : "No") + " |"
  ),
  "",
  "## Book-by-book inventory",
  "",
  "| Book | XML file | Word tokens | Morphology-tagged tokens |",
  "|---|---|---:|---:|",
  ...bookSummaries.map(b => "| " + b.book + " | " + b.file + " | " + b.wordTokens.toLocaleString("en-US") + " | " + b.morphTokens.toLocaleString("en-US") + " |"),
  "",
  "## Definitions",
  "",
  "- A morphology code is the complete raw morph attribute of a MorphHB word token, including slash-separated composite segments.",
  "- Both distinct-code coverage and occurrence-weighted coverage are reported. Exact-code coverage means the whole source code is directly passed as a test literal to the BSMP parser.",
  "- The CSV is the master list of every exact code, not merely the high-frequency shortlist. Any Partial or Unsupported parser status needs review before treating the item as test-only.",
  "- Word index is the 1-based ordinal of word elements within the source verse; markup segments such as maqaf and paseq are not counted as word tokens.",
  "",
].join("\n");

const allRows = rows.sort((a,b) => {
  if (a.tested !== b.tested) return a.tested ? 1 : -1;
  return b.count - a.count || a.code.localeCompare(b.code);
});
const headers = [
  "gap_rank", "frequency_priority", "morphology_code", "ot_occurrences", "first_occurrence",
  "first_book", "chapter", "verse", "word_index", "parser_status", "parser_detail",
  "covered_by_exact_code_test", "recommended_action",
];
const gapRanks = new Map(gaps.map((r,i) => [r.code, i+1]));
const csvLines = [headers.join(",")];
for (const r of allRows) {
  csvLines.push([
    gapRanks.get(r.code) ?? "",
    r.priority,
    r.code,
    r.count,
    r.firstOccurrence,
    r.firstBook,
    r.firstChapter,
    r.firstVerse,
    r.firstWord,
    r.parserStatus,
    r.parserDetail,
    r.tested ? "yes" : "no",
    r.action,
  ].map(csv).join(","));
}
fs.mkdirSync(path.dirname(outMd), {recursive: true});
fs.mkdirSync(path.dirname(outCsv), {recursive: true});
fs.writeFileSync(outMd, report, "utf8");
fs.writeFileSync(outCsv, csvLines.join("\n") + "\n", "utf8");
console.log("MORPHHB_GLOBAL_AUDIT_SUMMARY=" + JSON.stringify(summary));
console.log("UNTESTED_TOP_20=" + JSON.stringify(gaps.slice(0,20).map(r => ({
  code:r.code,count:r.count,first:r.firstOccurrence,parser:r.parserStatus,action:r.action
}))));
console.log("Parser lookup maps checked: " + Object.keys(maps).join(", "));
console.log("Source book files: " + entries.join(", "));
