import {
    InMemoryConnectingWordRepository,
    InMemoryObservationQuestionRepository,
    ListConnectingWords,
    ListObservationQuestions,
} from "@bsmp/inductive";

import { ObservationWorkspaceService } from "../application/services/ObservationWorkspaceService.js";

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

    return new ObservationWorkspaceService(
        listObservationQuestions,
        listConnectingWords,
    );
}