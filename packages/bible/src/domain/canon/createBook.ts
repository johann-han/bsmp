import { BibleDivision } from "../classification/index.js";
import { BibleBook } from "../entities/index.js";
import { Testament } from "../classification/index.js";

import {
    BibleBookId,
    BookMetadata,
    BookName,
    ChapterCount,
} from "../value-objects/index.js";

export interface CreateBookProps {
    id: string;
    canonicalName: string;
    shortName: string;
    abbreviation: string;
    testament: Testament;
    division: BibleDivision;
    chapterCount: number;
}

export function createBook(
    props: CreateBookProps,
): BibleBook {

    return BibleBook.create({
        id: BibleBookId.from(props.id),

        metadata: BookMetadata.create({
            canonicalName: BookName.from(props.canonicalName),
            shortName: BookName.from(props.shortName),
            abbreviation: BookName.from(props.abbreviation),
        }),

        testament: props.testament,

        division: props.division,

        chapterCount: ChapterCount.from(props.chapterCount),
    });
}