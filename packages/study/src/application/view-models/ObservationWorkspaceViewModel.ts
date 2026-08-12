import type { ObservationQuestionViewModel } from "./ObservationQuestionViewModel.js";
import type { ConnectingWordViewModel } from "./ConnectingWordViewModel.js";
import type { ObservationViewModel } from "./ObservationViewModel.js";

export interface ObservationWorkspaceViewModel {
    observationQuestions: readonly ObservationQuestionViewModel[];
    connectingWords: readonly ConnectingWordViewModel[];
    observations: readonly ObservationViewModel[];
}
