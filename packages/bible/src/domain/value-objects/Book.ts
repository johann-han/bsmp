import { ValueObject } from "@bsmp/shared";

import { BookCode } from "./BookCode.js";
import { BookName } from "./BookName.js";
import { Chapter } from "./Chapter.js";
import { ChapterNumber } from "./ChapterNumber.js";

interface BookProps {
    code: BookCode;
    name: BookName;
    chapters: readonly Chapter[];
}

export class Book extends ValueObject<BookProps> {

    private constructor(
        props: BookProps,
    ) {
        super(props);
    }

    public static create(
        code: BookCode,
        name: BookName,
        chapters: readonly Chapter[],
    ): Book {

        return new Book({
            code,
            name,
            chapters,
        });

    }

    public get code(): BookCode {
        return this.get("code");
    }

    public get name(): BookName {
        return this.get("name");
    }

    public get chapters(): readonly Chapter[] {
        return this.get("chapters");
    }

    public chapter(
        number: ChapterNumber,
    ): Chapter | undefined {

        return this.get("chapters").find(
            chapter => chapter.number.equals(number),
        );

    }

}