export interface StudyObservationContext {
    readonly id: string;
    readonly verseReference: string;
    readonly statement: string;
}

export interface StudyEvidenceContext {
    readonly id: string;
    readonly interpretationId: string;
    readonly type: string;
    readonly description: string;
}

export interface StudyInterpretationContext {
    readonly id: string;
    readonly statement: string;
    readonly observationIds: readonly string[];
    readonly evidence: readonly StudyEvidenceContext[];
}

export interface StudyApplicationContext {
    readonly id: string;
    readonly interpretationId: string;
    readonly principle: string;
    readonly personal: string;
    readonly ministry: string;
    readonly action: string;
}

export interface SermonStudyContext {
    readonly studyId: string;
    readonly studyTitle: string;
    readonly passageReference: string;
    readonly observations: readonly StudyObservationContext[];
    readonly interpretations: readonly StudyInterpretationContext[];
    readonly applications: readonly StudyApplicationContext[];
}
