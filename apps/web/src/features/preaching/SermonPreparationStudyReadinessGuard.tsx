"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudyId } from "@bsmp/study";

import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";

const studyRepository = new SupabaseStudyRepository();

interface Props {
    studyId: string;
}

export function SermonPreparationStudyReadinessGuard({ studyId }: Props) {
    const router = useRouter();
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        if (!studyId) return;

        let active = true;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        async function checkStudyReadiness() {
            try {
                const study = await studyRepository.find(StudyId.from(studyId));
                if (!active || !study) return;

                const hasObservation = study.observations.length > 0;
                const hasInterpretation = study.interpretations.length > 0;
                const hasApplication = study.applications.length > 0;

                if (!hasObservation || !hasInterpretation || !hasApplication) {
                    setRedirecting(true);
                    timeoutId = setTimeout(() => {
                        if (active) {
                            router.replace(`/workspace?studyId=${encodeURIComponent(studyId)}`);
                        }
                    }, 12000);
                }
            } catch {
                // Leave the Sermon Preparation page available if the readiness check cannot be completed.
            }
        }

        void checkStudyReadiness();

        return () => {
            active = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [router, studyId]);

    if (!redirecting) return null;

    return (
        <section
            role="status"
            style={{
                maxWidth: 1200,
                margin: "0 auto 20px",
                padding: 20,
                border: "1px solid #fcd34d",
                borderRadius: 12,
                background: "#fffbeb",
            }}
        >
            <h2 style={{ marginTop: 0 }}>Complete the Study first</h2>
            <p style={{ marginBottom: 8 }}>
                Sermon Preparation requires foundational study work. Please complete at least one
                Observation, one Interpretation, and one Application in the Study Workspace.
            </p>
            <p style={{ marginBottom: 0, color: "#92400e" }}>
                Returning to the Study Workspace in 12 seconds…
            </p>
        </section>
    );
}
