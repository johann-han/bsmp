import { Bible } from "../../../domain/aggregates/Bible.js";

import {
    BibleId,
    BibleMetadata,
    Book,
    Language,
    Translation,
} from "../../../domain/value-objects/index.js";

export class BibleBuilder {

    public build(
        books: readonly Book[],
        metadata: BibleMetadata,
        language: Language,
        translation: Translation,
    ): Bible {

        return Bible.create(
            BibleId.create(),
            metadata,
            language,
            translation,
            books,
        );

    }

}