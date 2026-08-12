import { Passage } from "@bsmp/bible";
import {
    InMemoryConnectingWordRepository,
    InMemoryObservationQuestionRepository,
    ListConnectingWords,
    ListObservationQuestions,
} from "@bsmp/inductive";

import { AddObservation } from "../application/commands/AddObservation.js";
import { StudySession } from "../domain/aggregates/StudySession.js";
import { StudyRepository } from "../domain/repositories/StudyRepository.js";
import {
    StudyId,
    StudyTitle,
} from "../domain/value-objects/index.js";
import { InMemoryStudyRepository } from "../infrastructure/repositories/InMemoryStudyRepository.js";
import { ObservationWorkspaceService } from "../application/services/ObservationWorkspaceService.js";
import { createStudyPassage } from "./createStudyPassage.js";

export function createObservationWorkspace(): ObservationWorkspaceService {
    const observationRepository =
        new InMemoryObservationQuestionRepository();

    const connectingWordRepository =
        new InMemoryConnectingWordRepository();

    const listObservationQuestions =
        new ListObservationQuestions(
            observationRepository,
        );

    const listConnectingWords =
        new ListConnectingWords(
            connectingWordRepository,
        );

    const passageService = createStudyPassage();
    const passage: Passage = passageService.passageReference;

    const study = StudySession.create(
        StudyId.create(),
        StudyTitle.from("John 15 Observation Study"),
        passage,
    );

    const studyRepository: StudyRepository =
        new InMemoryStudyRepository([
            study,
        ]);

    const addObservation =
        new AddObservation(
            studyRepository,
        );

    return new ObservationWorkspaceService(
        listObservationQuestions,
        listConnectingWords,
        addObservation,
        study.id,
        studyRepository,
    );
}
