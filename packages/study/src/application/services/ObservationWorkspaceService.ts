import {
    ConnectingWord,
    ListConnectingWords,
    ListObservationQuestions,
    ObservationQuestion,
} from "@bsmp/inductive";

import type {
    ConnectingWordViewModel,
    ObservationQuestionViewModel,
    ObservationWorkspaceViewModel,
} from "../view-models/index.js";

export interface ObservationWorkspaceData {
    observationQuestions: readonly ObservationQuestionViewModel[];
    connectingWords: readonly ConnectingWordViewModel[];
}

export class ObservationWorkspaceService {

    public constructor(
        private readonly listObservationQuestions:
            ListObservationQuestions,

        private readonly listConnectingWords:
            ListConnectingWords,
    ) { }

    public async load():
        Promise<ObservationWorkspaceViewModel> {

        const [
            observationQuestions,
            connectingWords,
        ] = await Promise.all([
            this.listObservationQuestions.execute(),
            this.listConnectingWords.execute(),
        ]);

        return {
            observationQuestions:
                observationQuestions.map(
                    (question) =>
                        this.toObservationQuestionViewModel(question),
                ),

            connectingWords:
                connectingWords.map(
                    (word) =>
                        this.toConnectingWordViewModel(word),
                ),
        };

    }

    private toObservationQuestionViewModel(
        question: ObservationQuestion,
    ): ObservationQuestionViewModel {

        return {
            id: question.id.toString(),
            question: question.question.toString(),
            purpose: question.purpose.toString(),
        };

    }

    private toConnectingWordViewModel(
        word: ConnectingWord,
    ): ConnectingWordViewModel {

        return {
            id: word.id.toString(),
            text: word.text.toString(),
            category: word.category,
            meaning: word.meaning.toString(),
        };

    }

}