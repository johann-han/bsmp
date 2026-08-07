import type { ObservationQuestion } from "@bsmp/inductive";

type ConnectingWord = unknown;

export interface ObservationWorkspaceData {

    observationQuestions:
    readonly ObservationQuestion[];

    connectingWords:
    readonly ConnectingWord[];

}