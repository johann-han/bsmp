import { Evidence } from "../../domain/entities/Evidence.js";
import { Interpretation } from "../../domain/entities/Interpretation.js";
import {
    EvidenceDescription,
    EvidenceId,
    EvidenceType,
    StudyId,
} from "../../domain/value-objects/index.js";
import { StudyRepository } from "../../domain/repositories/StudyRepository.js";

export class CreateEvidence {
    public constructor(
        private readonly repository: StudyRepository,
    ) { }

    public async execute(
        studyId: StudyId,
        interpretationId: string,
        type: string,
        description: string,
    ): Promise<Evidence> {
        const study = await this.repository.find(studyId);
        if (!study) {
            throw new Error("Study not found.");
        }

        const interpretation = study.interpretations.find(
            (item) => item.id.toString() === interpretationId,
        );

        if (!interpretation) {
            throw new Error("Interpretation not found.");
        }

        const evidenceType = this.toEvidenceType(type);
        const evidence = Evidence.create(
            EvidenceId.create(),
            evidenceType,
            EvidenceDescription.from(description),
        );

        interpretation.addEvidence(evidence);
        await this.repository.save(study);
        return evidence;
    }

    private toEvidenceType(value: string): EvidenceType {
        switch (value) {
            case "Scripture": return EvidenceType.scripture();
            case "CrossReference": return EvidenceType.crossReference();
            case "OriginalLanguage": return EvidenceType.originalLanguage();
            case "Historical": return EvidenceType.historical();
            case "Geographical": return EvidenceType.geographical();
            case "Literary": return EvidenceType.literary();
            case "PersonalNote": return EvidenceType.personalNote();
            default: return EvidenceType.other();
        }
    }
}
