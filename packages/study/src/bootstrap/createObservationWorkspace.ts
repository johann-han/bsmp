import { Passage } from "@bsmp/bible";
import {
    InMemoryConnectingWordRepository,
    InMemoryObservationQuestionRepository,
    ListConnectingWords,
    ListObservationQuestions,
} from "@bsmp/inductive";

import { AddObservation } from "../application/commands/AddObservation.js";
import { CreateApplication } from "../application/commands/CreateApplication.js";
import { CreateEvidence } from "../application/commands/CreateEvidence.js";
import { CreateInterpretation } from "../application/commands/CreateInterpretation.js";
import { UpdateApplication } from "../application/commands/UpdateApplication.js";
import { UpdateInterpretation } from "../application/commands/UpdateInterpretation.js";
import { StudySession } from "../domain/aggregates/StudySession.js";
import type { StudyRepository } from "../domain/repositories/StudyRepository.js";
import { StudyId, StudyTitle } from "../domain/value-objects/index.js";
import { InMemoryStudyRepository } from "../infrastructure/repositories/InMemoryStudyRepository.js";
import { ObservationWorkspaceService } from "../application/services/ObservationWorkspaceService.js";
import { createStudyPassage } from "./createStudyPassage.js";

export function createObservationWorkspace(
    studyRepository?: StudyRepository,
    existingStudy?: StudySession,
): ObservationWorkspaceService {
    const observationRepository = new InMemoryObservationQuestionRepository();
    const connectingWordRepository = new InMemoryConnectingWordRepository();

    const listObservationQuestions = new ListObservationQuestions(observationRepository);
    const listConnectingWords = new ListConnectingWords(connectingWordRepository);

    const passageService = createStudyPassage();
    const passage: Passage = passageService.passageReference;

    const study = existingStudy ?? StudySession.create(
        StudyId.create(),
        StudyTitle.from("John 15 Observation Study"),
        passage,
    );

    const repository = studyRepository ?? new InMemoryStudyRepository([study]);
    const addObservation = new AddObservation(repository);
    const createInterpretation = new CreateInterpretation(repository);
    const updateInterpretation = new UpdateInterpretation(repository);
    const createEvidence = new CreateEvidence(repository);
    const createApplication = new CreateApplication(repository);
    const updateApplication = new UpdateApplication(repository);

    return new ObservationWorkspaceService(
        listObservationQuestions,
        listConnectingWords,
        addObservation,
        study.id,
        repository,
        createInterpretation,
        updateInterpretation,
        createEvidence,
        createApplication,
        updateApplication,
    );
}
