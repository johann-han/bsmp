import type {
    ObservationWorkspaceData,
    ObservationWorkspaceService,
    StudyPassageData,
    StudyPassageService,
    StudySession,
} from "@bsmp/study";

export interface PreparedStudyWorkspace {
    readonly workspace: ObservationWorkspaceService;
    readonly passageService: StudyPassageService;
    readonly study: StudySession;
    readonly data: ObservationWorkspaceData;
    readonly passage: StudyPassageData;
}

let cachedStudy: StudySession | null = null;
let preparedWorkspace: PreparedStudyWorkspace | null = null;

export function cacheStudyForWorkspace(study: StudySession): void {
    cachedStudy = study;
}

export function takeCachedStudyForWorkspace(studyId: string): StudySession | undefined {
    if (!cachedStudy || cachedStudy.id.value !== studyId) return undefined;

    const study = cachedStudy;
    cachedStudy = null;
    return study;
}

export function cachePreparedStudyWorkspace(value: PreparedStudyWorkspace): void {
    preparedWorkspace = value;
}

export function takePreparedStudyWorkspace(studyId: string): PreparedStudyWorkspace | undefined {
    if (!preparedWorkspace || preparedWorkspace.study.id.value !== studyId) return undefined;

    const value = preparedWorkspace;
    preparedWorkspace = null;
    return value;
}
