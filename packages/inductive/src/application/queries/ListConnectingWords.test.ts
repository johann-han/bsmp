import { describe, expect, it } from "vitest";

import { ListConnectingWords } from "./ListConnectingWords.js";
import { InMemoryConnectingWordRepository } from "../../infrastructure/repositories/InMemoryConnectingWordRepository.js";

describe("ListConnectingWords", () => {

    it("returns all connecting words", async () => {

        const repository =
            new InMemoryConnectingWordRepository();

        const query =
            new ListConnectingWords(repository);

        const words =
            await query.execute();

        expect(words).toHaveLength(10);

    });

});