import { Application } from "../../domain/entities/Application.js";
import type { StudyRepository } from "../../domain/repositories/StudyRepository.js";
import {
    ApplicationAction,
    ApplicationId,
    ApplicationMinistry,
    ApplicationPersonal,
    ApplicationPrinciple,
    InterpretationId,
    StudyId,
} from "../../domain/value-objects/index.js";

export class CreateApplication {
    public constructor(private readonly repository: StudyRepository) {}

    public async execute(
        studyId: StudyId,
        interpretationId: InterpretationId,
        principle: string,
        personal: string,
        ministry: string,
        action: string,
    ): Promise<Application> {
        const study = await this.repository.find(studyId);
        if (!study) throw new Error("Study not found.");

        const interpretation = study.interpretations.find(
            (item) => item.id.toString() === interpretationId.toString(),
        );
        if (!interpretation) {
            throw new Error(`Interpretation ${interpretationId.toString()} is not part of this study.`);
        }

        const application = Application.create(
            ApplicationId.create(),
            interpretationId,
            ApplicationPrinciple.from(principle),
            ApplicationPersonal.from(personal),
            ApplicationMinistry.from(ministry),
            ApplicationAction.from(action),
        );

        study.addApplication(application);
        await this.repository.save(study);
        return application;
    }
}
