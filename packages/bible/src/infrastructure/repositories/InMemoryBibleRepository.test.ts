import { describe, expect, it } from "vitest";

import { BibleBuilder } from "../usfm/builder/BibleBuilder.js";

import {
    BibleMetadata,
    Language,
    Translation,
} from "../../domain/value-objects/index.js";

import { InMemoryBibleRepository } from "./InMemoryBibleRepository.js";

describe("InMemoryBibleRepository", () => {

    it("returns the stored Bible", async () => {

        // Arrange

        const bible = new BibleBuilder().build(
            [],
            BibleMetadata.create({
                displayName: "Test Bible",
                abbreviation: "TEST",
            }),
            Language.from("en"),
            Translation.from("Test"),
        );

        const repository =
            new InMemoryBibleRepository(
                bible,
            );

        // Act

        const loaded =
            await repository.find();

        // Assert

        expect(loaded).toBe(bible);

    });

});