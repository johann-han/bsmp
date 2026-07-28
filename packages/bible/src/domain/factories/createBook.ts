import { BibleDivision, Testament } from "../classification/index.js";
import { BibleBook } from "../entities/index.js";

import {
    BibleBookId,
    BookMetadata,
    BookName,
    CanonicalOrder,
    ChapterCount,
} from "../value-objects/index.js";

export interface CreateBookProps {
    id: string;
    canonicalName: string;
    shortName: string;
    abbreviation: string;
    canonicalOrder: number;
    testament: Testament;
    division: BibleDivision;
    chapterCount: number;
}

export function createBook(
    props: CreateBookProps,
): BibleBook {
    return BibleBook.create(
        BibleBookId.from(props.id),
        {
            metadata: BookMetadata.create({
                canonicalName: BookName.from(props.canonicalName),
                shortName: BookName.from(props.shortName),
                abbreviation: BookName.from(props.abbreviation),
            }),
            canonicalOrder: CanonicalOrder.of(props.canonicalOrder),
            testament: props.testament,
            division: props.division,
            chapterCount: ChapterCount.from(props.chapterCount),
        },
    );
}