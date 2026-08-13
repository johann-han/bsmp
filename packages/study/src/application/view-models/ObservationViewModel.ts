export interface ObservationTargetViewModel {
    readonly verseReference: string;
    readonly translation: string | null;
    readonly wordIndex: number | null;
    readonly wordText: string | null;
    readonly markupSymbol: string | null;
}

export interface ObservationViewModel {
    readonly id: string;
    readonly verseReference: string;
    readonly target: ObservationTargetViewModel;
    readonly statement: string;
    readonly createdAt: string;
}
