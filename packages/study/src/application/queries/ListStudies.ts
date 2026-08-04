import { StudySession } from "../../domain/aggregates/StudySession.js";
import { StudyRepository } from "../../domain/repositories/StudyRepository.js";

export class ListStudies {

    public constructor(
        private readonly repository: StudyRepository,
    ) { }

    public async execute():
        Promise<readonly StudySession[]> {

        return this.repository.findAll();

    }

}