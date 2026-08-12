import {
    BookCode,
    ChapterNumber,
    Passage,
    VerseNumber,
    VerseReference,
} from "@bsmp/bible";

const BOOK_CODES: Record<string, string> = {
    genesis: "GEN", exodus: "EXO", leviticus: "LEV", numbers: "NUM", deuteronomy: "DEU",
    joshua: "JOS", judges: "JDG", ruth: "RUT", "1 samuel": "1SA", "2 samuel": "2SA",
    "1 kings": "1KI", "2 kings": "2KI", "1 chronicles": "1CH", "2 chronicles": "2CH",
    ezra: "EZR", nehemiah: "NEH", esther: "EST", job: "JOB", psalms: "PSA", psalm: "PSA",
    proverbs: "PRO", ecclesiastes: "ECC", "song of solomon": "SNG", song: "SNG", isaiah: "ISA",
    jeremiah: "JER", lamentations: "LAM", ezekiel: "EZK", daniel: "DAN", hosea: "HOS",
    joel: "JOL", amos: "AMO", obadiah: "OBA", jonah: "JON", micah: "MIC", nahum: "NAM",
    habakkuk: "HAB", zephaniah: "ZEP", haggai: "HAG", zechariah: "ZEC", malachi: "MAL",
    matthew: "MAT", mark: "MRK", luke: "LUK", john: "JHN", acts: "ACT", romans: "ROM",
    "1 corinthians": "1CO", "2 corinthians": "2CO", galatians: "GAL", ephesians: "EPH",
    philippians: "PHP", colossians: "COL", "1 thessalonians": "1TH", "2 thessalonians": "2TH",
    "1 timothy": "1TI", "2 timothy": "2TI", titus: "TIT", philemon: "PHM", hebrews: "HEB",
    james: "JAS", "1 peter": "1PE", "2 peter": "2PE", "1 john": "1JN", "2 john": "2JN",
    "3 john": "3JN", jude: "JUD", revelation: "REV",
};

export function parseStudyPassage(input: string): Passage {
    const normalized = input.trim().replace(/[–—]/g, "-");
    const match = normalized.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);

    if (!match) {
        throw new Error("Passage must look like 'Romans 8:1-39'.");
    }

    const bookName = match[1];
    const chapter = match[2];
    const startVerse = match[3];
    const endVerse = match[4] ?? startVerse;

    if (!bookName || !chapter || !startVerse || !endVerse) {
        throw new Error("Passage is incomplete.");
    }

    const code = BOOK_CODES[bookName.trim().toLowerCase()];

    if (!code) {
        throw new Error(`Unsupported Bible book: ${bookName.trim()}.`);
    }

    const book = BookCode.from(code);
    const chapterNumber = ChapterNumber.of(Number(chapter));

    return Passage.create(
        VerseReference.create(
            book,
            chapterNumber,
            VerseNumber.from(Number(startVerse)),
        ),
        VerseReference.create(
            book,
            chapterNumber,
            VerseNumber.from(Number(endVerse)),
        ),
    );
}
