import type { StudySession } from "@bsmp/study";

let cachedStudy: StudySession | null = null;

export function cacheStudyForWorkspace(study: StudySession): void {
    cachedStudy = study;
}

export function takeCachedStudyForWorkspace(studyId: string): StudySession | undefined {
    if (!cachedStudy || cachedStudy.id.value !== studyId) return undefined;

    const study = cachedStudy;
    cachedStudy = null;
    return study;
}
