import {
    ConnectingWord,
    ListConnectingWords,
    ListObservationQuestions,
    ObservationQuestion,
} from "@bsmp/inductive";
import type { VerseReference } from "@bsmp/bible";

import { AddObservation } from "../commands/AddObservation.js";
import { CreateApplication } from "../commands/CreateApplication.js";
import { CreateEvidence } from "../commands/CreateEvidence.js";
import { CreateInterpretation } from "../commands/CreateInterpretation.js";
import { UpdateApplication } from "../commands/UpdateApplication.js";
import { UpdateInterpretation } from "../commands/UpdateInterpretation.js";
import type {
    ApplicationViewModel,
    ConnectingWordViewModel,
    EvidenceViewModel,
    InterpretationViewModel,
    ObservationQuestionViewModel,
    ObservationViewModel,
} from "../view-models/index.js";
import type { Application } from "../../domain/entities/Application.js";
import type { Evidence } from "../../domain/entities/Evidence.js";
import type { Interpretation } from "../../domain/entities/Interpretation.js";
import type { Observation } from "../../domain/entities/Observation.js";
import type { StudyRepository } from "../../domain/repositories/StudyRepository.js";
import { ApplicationId } from "../../domain/value-objects/ApplicationId.js";
import { ObservationId } from "../../domain/value-objects/ObservationId.js";
import { InterpretationId } from "../../domain/value-objects/InterpretationId.js";
import {
    EvidenceDescription,
    EvidenceId,
    EvidenceType,
    ObservationStatement,
    ObservationTarget,
} from "../../domain/value-objects/index.js";
import type { ObservationWordTargetInput, StudyId } from "../../domain/value-objects/index.js";

export interface ObservationWorkspaceData {
    observationQuestions: readonly ObservationQuestionViewModel[];
    connectingWords: readonly ConnectingWordViewModel[];
    observations: readonly ObservationViewModel[];
    interpretations: readonly InterpretationViewModel[];
    applications: readonly ApplicationViewModel[];
}

export class ObservationWorkspaceService {
    public constructor(
        private readonly listObservationQuestions: ListObservationQuestions,
        private readonly listConnectingWords: ListConnectingWords,
        private readonly addObservationCommand?: AddObservation,
        private readonly studyId?: StudyId,
        private readonly studyRepository?: StudyRepository,
        private readonly createInterpretationCommand?: CreateInterpretation,
        private readonly updateInterpretationCommand?: UpdateInterpretation,
        private readonly createEvidenceCommand?: CreateEvidence,
        private readonly createApplicationCommand?: CreateApplication,
        private readonly updateApplicationCommand?: UpdateApplication,
    ) { }

    public async load(): Promise<ObservationWorkspaceData> {
        const [observationQuestions, connectingWords] = await Promise.all([
            this.listObservationQuestions.execute(),
            this.listConnectingWords.execute(),
        ]);

        const study = this.studyId && this.studyRepository
            ? await this.studyRepository.find(this.studyId)
            : undefined;

        return {
            observationQuestions: observationQuestions.map((question) =>
                this.toObservationQuestionViewModel(question),
            ),
            connectingWords: connectingWords.map((word) =>
                this.toConnectingWordViewModel(word),
            ),
            observations: (study?.observations ?? []).map((observation) =>
                this.toObservationViewModel(observation),
            ),
            interpretations: (study?.interpretations ?? []).map((interpretation) =>
                this.toInterpretationViewModel(interpretation),
            ),
            applications: (study?.applications ?? []).map((application) =>
                this.toApplicationViewModel(application),
            ),
        };
    }

    public async addObservation(
        verseReference: VerseReference,
        statement: string,
        wordTarget?: ObservationWordTargetInput,
    ): Promise<Observation> {
        if (!this.addObservationCommand || !this.studyId) {
            throw new Error("Observation persistence is not configured for this workspace.");
        }
        return this.addObservationCommand.execute(this.studyId, verseReference, statement, wordTarget);
    }

    public async updateObservation(
        observationId: string,
        verseReference: VerseReference,
        statement: string,
        wordTarget?: ObservationWordTargetInput,
    ): Promise<void> {
        if (!this.studyRepository || !this.studyId) {
            throw new Error("Observation persistence is not configured for this workspace.");
        }

        const study = await this.studyRepository.find(this.studyId);
        if (!study) throw new Error(`Study not found: ${this.studyId.toString()}`);

        const target = wordTarget
            ? ObservationTarget.word(verseReference, wordTarget)
            : ObservationTarget.verse(verseReference);
        const normalizedStatement = statement.trim();
        const currentId = ObservationId.from(observationId);

        const duplicate = study.observations.find((existing) =>
            existing.id.value !== currentId.value &&
            existing.statement.value === normalizedStatement &&
            this.sameTarget(existing.target, target),
        );

        if (duplicate) {
            throw new Error("An identical observation already exists for this study target.");
        }

        study.updateObservation(
            currentId,
            ObservationStatement.from(normalizedStatement),
            target,
        );
        await this.studyRepository.save(study);
    }

    public async removeObservation(observationId: string): Promise<void> {
        if (!this.studyRepository || !this.studyId) {
            throw new Error("Observation persistence is not configured for this workspace.");
        }

        const study = await this.studyRepository.find(this.studyId);
        if (!study) throw new Error(`Study not found: ${this.studyId.toString()}`);

        study.removeObservation(ObservationId.from(observationId));
        await this.studyRepository.save(study);
    }

    public async addInterpretation(statement: string, observationIds: readonly string[] = []): Promise<Interpretation> {
        if (!this.createInterpretationCommand || !this.studyId) {
            throw new Error("Interpretation persistence is not configured for this workspace.");
        }
        return this.createInterpretationCommand.execute(
            this.studyId,
            statement,
            observationIds.map((id) => ObservationId.from(id)),
        );
    }

    public async updateInterpretation(interpretationId: string, statement: string, observationIds: readonly string[] = []): Promise<Interpretation> {
        if (!this.updateInterpretationCommand || !this.studyId) {
            throw new Error("Interpretation editing is not configured for this workspace.");
        }
        return this.updateInterpretationCommand.execute(
            this.studyId,
            interpretationId,
            statement,
            observationIds.map((id) => ObservationId.from(id)),
        );
    }

    public async addEvidence(interpretationId: string, type: string, description: string): Promise<Evidence> {
        if (!this.createEvidenceCommand || !this.studyId) {
            throw new Error("Evidence persistence is not configured for this workspace.");
        }
        return this.createEvidenceCommand.execute(this.studyId, interpretationId, type, description);
    }

    public async updateEvidence(
        interpretationId: string,
        evidenceId: string,
        type: string,
        description: string,
    ): Promise<void> {
        if (!this.studyRepository || !this.studyId) {
            throw new Error("Evidence editing is not configured for this workspace.");
        }

        const study = await this.studyRepository.find(this.studyId);
        if (!study) throw new Error(`Study not found: ${this.studyId.toString()}`);

        const normalizedDescription = description.trim();
        const evidenceType = this.toEvidenceType(type);
        const currentInterpretationId = InterpretationId.from(interpretationId);
        const currentEvidenceId = EvidenceId.from(evidenceId);

        study.updateEvidence(
            currentInterpretationId,
            currentEvidenceId,
            evidenceType,
            EvidenceDescription.from(normalizedDescription),
        );
        await this.studyRepository.save(study);
    }

    public async addApplication(
        interpretationId: string,
        principle: string,
        personal: string,
        ministry: string,
        action: string,
    ): Promise<Application> {
        if (!this.createApplicationCommand || !this.studyId) {
            throw new Error("Application persistence is not configured for this workspace.");
        }
        return this.createApplicationCommand.execute(
            this.studyId,
            InterpretationId.from(interpretationId),
            principle,
            personal,
            ministry,
            action,
        );
    }

    public async updateApplication(
        applicationId: string,
        principle: string,
        personal: string,
        ministry: string,
        action: string,
    ): Promise<void> {
        if (!this.updateApplicationCommand || !this.studyId) {
            throw new Error("Application editing is not configured for this workspace.");
        }
        await this.updateApplicationCommand.execute(
            this.studyId,
            ApplicationId.from(applicationId),
            principle,
            personal,
            ministry,
            action,
        );
    }

    public async removeApplication(applicationId: string): Promise<void> {
        if (!this.studyRepository || !this.studyId) {
            throw new Error("Application persistence is not configured for this workspace.");
        }

        const study = await this.studyRepository.find(this.studyId);
        if (!study) throw new Error(`Study not found: ${this.studyId.toString()}`);

        study.removeApplication(ApplicationId.from(applicationId));
        await this.studyRepository.save(study);
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

    private sameTarget(left: ObservationTarget, right: ObservationTarget): boolean {
        return left.verseReference.toString() === right.verseReference.toString()
            && left.translation === right.translation
            && left.wordIndex === right.wordIndex
            && left.wordText === right.wordText
            && left.markupSymbol === right.markupSymbol;
    }

    private toObservationQuestionViewModel(question: ObservationQuestion): ObservationQuestionViewModel {
        return { id: question.id.toString(), question: question.question.toString(), purpose: question.purpose.toString() };
    }

    private toConnectingWordViewModel(word: ConnectingWord): ConnectingWordViewModel {
        return { id: word.id.toString(), text: word.text.toString(), category: word.category, meaning: word.meaning.toString() };
    }

    private toObservationViewModel(observation: Observation): ObservationViewModel {
        return {
            id: observation.id.value,
            verseReference: observation.verseReference.toString(),
            target: {
                verseReference: observation.target.verseReference.toString(),
                translation: observation.target.translation,
                wordIndex: observation.target.wordIndex,
                wordText: observation.target.wordText,
                markupSymbol: observation.target.markupSymbol,
            },
            statement: observation.statement.value,
            createdAt: observation.createdAt.toISOString(),
        };
    }

    private toEvidenceViewModel(evidence: Evidence): EvidenceViewModel {
        return { id: evidence.id.value, type: evidence.type.value, description: evidence.description.value, createdAt: evidence.createdAt.toISOString() };
    }

    private toInterpretationViewModel(interpretation: Interpretation): InterpretationViewModel {
        return { id: interpretation.id.value, statement: interpretation.statement.value, observationIds: interpretation.observationIds.map((id) => id.value), evidence: interpretation.evidence.map((evidence) => this.toEvidenceViewModel(evidence)), createdAt: interpretation.createdAt.toISOString() };
    }

    private toApplicationViewModel(application: Application): ApplicationViewModel {
        return {
            id: application.id.value,
            interpretationId: application.interpretationId.value,
            principle: application.principle.value,
            personal: application.personal.value,
            ministry: application.ministry.value,
            action: application.action.value,
            createdAt: application.createdAt.toISOString(),
        };
    }
}
