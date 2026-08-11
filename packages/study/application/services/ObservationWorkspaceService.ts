import {
    ListConnectingWords,
    ListObservationQuestions,
    ObservationQuestion,
    ConnectingWord,
} from "@bsmp/inductive";

export interface ObservationWorkspaceData {

    observationQuestions:
    readonly ObservationQuestion[];

    connectingWords:
    readonly ConnectingWord[];

}

export class ObservationWorkspaceService {

    public constructor(
        private readonly listObservationQuestions:
            ListObservationQuestions,

        private readonly listConnectingWords:
            ListConnectingWords,
    ) { }

    public async load():
        Promise<ObservationWorkspaceData> {

        return {

            observationQuestions:
                await this.listObservationQuestions.execute(),

            connectingWords:
                await this.listConnectingWords.execute(),

        };

    }

}