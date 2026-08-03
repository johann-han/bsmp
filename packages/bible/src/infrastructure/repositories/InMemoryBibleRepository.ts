import { BibleRepository } from "../../domain/repositories/BibleRepository.js";
import { Bible } from "../../domain/aggregates/Bible.js";

export class InMemoryBibleRepository implements BibleRepository {

    public constructor(
        private readonly bible: Bible,
    ) { }

    public async find(): Promise<Bible> {
        return this.bible;
    }

}