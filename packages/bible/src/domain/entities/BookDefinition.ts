import {
    BibleDivision,
    BookMetadata,
    CanonicalOrder,
    ChapterCount,
    Testament,
} from "../index.js";

export interface BibleBookProps {
    metadata: BookMetadata;
    canonicalOrder: CanonicalOrder;
    testament: Testament;
    division: BibleDivision;
    chapterCount: ChapterCount;
}