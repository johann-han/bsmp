import type { StudyRepository } from "../../domain/repositories/StudyRepository.js";
import {
    ApplicationAction,
    ApplicationId,
    ApplicationMinistry,
    ApplicationPersonal,
    ApplicationPrinciple,
    StudyId,
} from "../../domain/value-objects/index.js";

export class UpdateApplication {
    public constructor(private readonly repository: StudyRepository) {}

    public async execute(
        studyId: StudyId,
        applicationId: ApplicationId,
        principle: string,
        personal: string,
        ministry: string,
        action: string,
    ): Promise<void> {
        const study = await this.repository.find(studyId);
        if (!study) throw new Error("Study not found.");

        const application = study.applications.find(
            (item) => item.id.toString() === applicationId.toString(),
        );
        if (!application) {
            throw new Error(`Application ${applicationId.toString()} is not part of this study.`);
        }

        application.revise(
            ApplicationPrinciple.from(principle),
            ApplicationPersonal.from(personal),
            ApplicationMinistry.from(ministry),
            ApplicationAction.from(action),
        );

        await this.repository.save(study);
    }
}
