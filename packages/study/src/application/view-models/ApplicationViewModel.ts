export interface ApplicationViewModel {
    readonly id: string;
    readonly interpretationId: string;
    readonly principle: string;
    readonly personal: string;
    readonly ministry: string;
    readonly action: string;
    readonly createdAt: string;
}

export interface BiblicalTheologyViewModel {
    readonly id: string;
    readonly theme: string;
    readonly synthesis: string;
    readonly interpretationIds: readonly string[];
    readonly createdAt: string;
}
