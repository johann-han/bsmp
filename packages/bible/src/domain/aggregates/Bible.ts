import { AggregateRoot } from "@bsmp/shared";

import { BibleId } from "../value-objects/BibleId.js";
import { BibleMetadata } from "../value-objects/BibleMetadata.js";
import { Language, Translation } from "../value-objects/index.js";

export class Bible extends AggregateRoot<BibleId> {

    private readonly _metadata: BibleMetadata;
    private readonly _language: Language;
    private readonly _translation: Translation;

    private constructor(
        id: BibleId,
        metadata: BibleMetadata,
        language: Language,
        translation: Translation,
    ) {
        super(id);

        this._metadata = metadata;
        this._language = language;
        this._translation = translation;
    }

    public static create(
        id: BibleId,
        metadata: BibleMetadata,
        language: Language,
        translation: Translation,
    ): Bible {

        return new Bible(
            id,
            metadata,
            language,
            translation,
        );

    }

    public get metadata(): BibleMetadata {
        return this._metadata;
    }

    public get language(): Language {
        return this._language;
    }

    public get translation(): Translation {
        return this._translation;
    }

}