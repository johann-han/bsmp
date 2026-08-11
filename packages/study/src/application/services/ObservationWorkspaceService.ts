import type {
    ConnectingWord,
    ObservationQuestion,
    ListConnectingWords,
    ListObservationQuestions,
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

        const [
            observationQuestions,
            connectingWords,
        ] = await Promise.all([
            this.listObservationQuestions.execute(),
            this.listConnectingWords.execute(),
        ]);

        return {
            observationQuestions,
            connectingWords,
        };
    }
}