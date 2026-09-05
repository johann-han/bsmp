"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudyId } from "@bsmp/study";

import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";

const studyRepository = new SupabaseStudyRepository();

interface Props {
    studyId: string;
}

export function SermonPreparationStudyReadinessGuard({ studyId }: Props) {
    const router = useRouter();

    useEffect(() => {
        if (!studyId) return;

        let active = true;

        async function checkStudyReadiness() {
            try {
                const study = await studyRepository.find(StudyId.from(studyId));
                if (!active || !study) return;

                const hasObservation = study.observations.length > 0;
                const hasInterpretation = study.interpretations.length > 0;
                const hasApplication = study.applications.length > 0;

                if (!hasObservation && !hasInterpretation && !hasApplication) {
                    router.replace(`/workspace?studyId=${encodeURIComponent(studyId)}`);
                }
            } catch {
                // Leave the Sermon Preparation page available if the readiness check cannot be completed.
            }
        }

        void checkStudyReadiness();

        return () => {
            active = false;
        };
    }, [router, studyId]);

    return null;
}
