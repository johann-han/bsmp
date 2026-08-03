import { Bible } from "../../domain/aggregates/Bible.js";
import { BibleRepository } from "../../domain/repositories/BibleRepository.js";

export class InMemoryBibleRepository
    implements BibleRepository {

    public constructor(
        private readonly bible: Bible,
    ) { }

    public async find(): Promise<Bible> {

        return this.bible;

    }

}