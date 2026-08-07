import { Entity } from "@bsmp/shared";

import { ConnectingWordCategory } from "../../../classification/index.js";

import { ConnectingWordId } from "../value-objects/ConnectingWordId.js";
import { ConnectingWordMeaning } from "../value-objects/ConnectingWordMeaning.js";
import { ConnectingWordText } from "../value-objects/ConnectingWordText.js";

export class ConnectingWord extends Entity<ConnectingWordId> {

    private constructor(
        id: ConnectingWordId,
        public readonly text: ConnectingWordText,
        public readonly category: ConnectingWordCategory,
        public readonly meaning: ConnectingWordMeaning,
    ) {
        super(id);
    }

    public static create(
        id: ConnectingWordId,
        text: ConnectingWordText,
        category: ConnectingWordCategory,
        meaning: ConnectingWordMeaning,
    ): ConnectingWord {

        return new ConnectingWord(
            id,
            text,
            category,
            meaning,
        );

    }

}