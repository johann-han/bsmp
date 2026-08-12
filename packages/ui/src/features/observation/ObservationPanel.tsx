import type { ObservationWorkspaceData } from "@bsmp/study";

import { ObservationQuestions } from "./ObservationQuestions.js";
import { ConnectingWords } from "./ConnectingWords.js";


export interface ObservationPanelProps {
    data: ObservationWorkspaceData;
}

export function ObservationPanel({
    data,
}: ObservationPanelProps) {
    return (
        <aside>
            <ObservationQuestions
                questions={data.observationQuestions}
            />

            <ConnectingWords
                connectingWords={data.connectingWords}
            />
        </aside>
    );
}