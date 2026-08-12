import type { EvidenceViewModel } from "./EvidenceViewModel.js";

export interface InterpretationViewModel {
    readonly id: string;
    readonly statement: string;
    readonly observationIds: readonly string[];
    readonly evidence: readonly EvidenceViewModel[];
    readonly createdAt: string;
}
