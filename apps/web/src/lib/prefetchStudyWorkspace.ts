import type { StudySession } from "@bsmp/study";

import { createSupabaseObservationWorkspace } from "./createSupabaseObservationWorkspace";
import { cachePreparedStudyWorkspace, cacheStudyForWorkspace } from "./studyWorkspaceNavigationCache";

const inFlight = new Map<string, Promise<void>>();

export function prefetchStudyWorkspace(study: StudySession): void {
    const studyId = study.id.value;
    if (inFlight.has(studyId)) return;

    cacheStudyForWorkspace(study);

    const task = createSupabaseObservationWorkspace(studyId, study)
        .then(async (prepared) => {
            const [data, passage] = await Promise.all([
                prepared.workspace.load(),
                prepared.passageService.load(),
            ]);

            cachePreparedStudyWorkspace({
                ...prepared,
                data,
                passage,
            });
        })
        .catch(() => {
            // Navigation still has a normal fallback path if prefetch fails.
        })
        .finally(() => {
            inFlight.delete(studyId);
        });

    inFlight.set(studyId, task);
}
