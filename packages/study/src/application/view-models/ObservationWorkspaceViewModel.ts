import type { ObservationQuestionViewModel } from "./ObservationQuestionViewModel.js";
import type { ConnectingWordViewModel } from "./ConnectingWordViewModel.js";

export interface ObservationWorkspaceViewModel {
    observationQuestions: readonly ObservationQuestionViewModel[];
    connectingWords: readonly ConnectingWordViewModel[];
}