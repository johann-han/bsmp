import { describe, expect, it } from "vitest";

import { ConnectingWordId } from "../../domain/connecting-words/value-objects/ConnectingWordId.js";
import { InMemoryConnectingWordRepository } from "./InMemoryConnectingWordRepository.js";

describe("InMemoryConnectingWordRepository", () => {

    it("returns all connecting words", async () => {

        const repository =
            new InMemoryConnectingWordRepository();

        const words =
            await repository.findAll();

        expect(words).toHaveLength(10);

    });

    it("finds a connecting word by id", async () => {

        const repository =
            new InMemoryConnectingWordRepository();

        const word =
            await repository.findById(
                ConnectingWordId.from("CW-001"),
            );

        expect(word).not.toBeNull();
        expect(word?.text.toString()).toBe("Therefore");

    });

    it("returns null for an unknown id", async () => {

        const repository =
            new InMemoryConnectingWordRepository();

        const word =
            await repository.findById(
                ConnectingWordId.from("CW-999"),
            );

        expect(word).toBeNull();

    });

});