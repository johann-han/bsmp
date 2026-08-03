import { BibleRepository } from "../../domain/repositories/BibleRepository.js";
import { Passage } from "../../domain/value-objects/Passage.js";
import { Verse } from "../../domain/value-objects/Verse.js";

export class ReadPassage {

    public constructor(
        private readonly repository: BibleRepository,
    ) { }

    public async execute(
        passage: Passage,
    ): Promise<readonly Verse[]> {

        const bible = await this.repository.find();

        return bible.read(
            passage,
        );

    }

}