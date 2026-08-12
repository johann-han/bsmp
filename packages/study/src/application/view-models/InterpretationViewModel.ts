export interface InterpretationViewModel {
    readonly id: string;
    readonly statement: string;
    readonly observationIds: readonly string[];
    readonly createdAt: string;
}
