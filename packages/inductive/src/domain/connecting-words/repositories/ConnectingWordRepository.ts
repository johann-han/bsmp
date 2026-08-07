import { ConnectingWord } from "../entities/ConnectingWord.js";
import { ConnectingWordId } from "../value-objects/ConnectingWordId.js";

export interface ConnectingWordRepository {

    /**
     * Finds a connecting word by its unique identifier.
     */
    findById(
        id: ConnectingWordId,
    ): Promise<ConnectingWord | null>;

    /**
     * Returns all connecting words.
     */
    findAll(): Promise<readonly ConnectingWord[]>;

}