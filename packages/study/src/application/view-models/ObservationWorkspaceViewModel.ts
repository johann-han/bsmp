export interface ObservationQuestionViewModel {
    id: string;
    question: string;
}

export interface ConnectingWordViewModel {
    id: string;
    text: string;
    category: string;
}

export interface ObservationWorkspaceViewModel {
    observationQuestions: readonly ObservationQuestionViewModel[];
    connectingWords: readonly ConnectingWordViewModel[];
}