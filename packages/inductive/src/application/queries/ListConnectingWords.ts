import { ConnectingWord } from "../../domain/connecting-words/entities/ConnectingWord.js";
import { ConnectingWordRepository } from "../../domain/connecting-words/repositories/ConnectingWordRepository.js";

export class ListConnectingWords {

    public constructor(
        private readonly repository: ConnectingWordRepository,
    ) { }

    public async execute(): Promise<readonly ConnectingWord[]> {
        return this.repository.findAll();
    }

}