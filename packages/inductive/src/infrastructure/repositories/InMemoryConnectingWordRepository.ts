import { connectingWords } from "../../data/connecting-words/connectingWords.js";

import { ConnectingWord } from "../../domain/connecting-words/entities/ConnectingWord.js";
import { ConnectingWordRepository } from "../../domain/connecting-words/repositories/ConnectingWordRepository.js";
import { ConnectingWordId } from "../../domain/connecting-words/value-objects/ConnectingWordId.js";
import { ConnectingWordMeaning } from "../../domain/connecting-words/value-objects/ConnectingWordMeaning.js";
import { ConnectingWordText } from "../../domain/connecting-words/value-objects/ConnectingWordText.js";

export class InMemoryConnectingWordRepository
    implements ConnectingWordRepository {

    private readonly words = new Map<string, ConnectingWord>();

    public constructor() {
        this.seed();
    }

    private seed(): void {

        for (const record of connectingWords) {

            const word = ConnectingWord.create(
                ConnectingWordId.from(record.id),
                ConnectingWordText.from(record.text),
                record.category,
                ConnectingWordMeaning.from(record.meaning),
            );

            this.words.set(
                word.id.toString(),
                word,
            );

        }

    }

    public async findById(
        id: ConnectingWordId,
    ): Promise<ConnectingWord | null> {

        return this.words.get(id.toString()) ?? null;

    }

    public async findAll(): Promise<readonly ConnectingWord[]> {

        return [...this.words.values()];

    }

}