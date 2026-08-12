"use client";

import { useEffect, useState } from "react";

import {
    createObservationWorkspace,
    createStudyPassage,
    type ObservationWorkspaceData,
    type StudyPassageData,
} from "@bsmp/study";

import { ObservationPanel } from "@repo/ui";

import { StudyPassage, type StudyVerse } from "./StudyPassage.js";

export function ObservationWorkspace() {
    const [data, setData] =
        useState<ObservationWorkspaceData | null>(null);

    const [passage, setPassage] =
        useState<StudyPassageData | null>(null);

    const [selectedVerse, setSelectedVerse] =
        useState<StudyVerse | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        const workspace = createObservationWorkspace();
        const studyPassage = createStudyPassage();

        Promise.all([
            workspace.load(),
            studyPassage.load(),
        ])
            .then(([workspaceData, passageData]) => {
                setData(workspaceData);
                setPassage(passageData);
            })
            .catch(() => {
                setError(
                    "Unable to load the study workspace.",
                );
            });
    }, []);

    if (error) {
        return <p>{error}</p>;
    }

    if (!data || !passage) {
        return <p>Loading study workspace...</p>;
    }

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 360px)",
                gap: 20,
                alignItems: "start",
            }}
        >
            <StudyPassage
                reference={passage.reference}
                translation={passage.translation}
                verses={passage.verses}
                selectedVerse={selectedVerse?.number ?? null}
                onSelectVerse={setSelectedVerse}
            />

            <ObservationPanel data={data} />
        </div>
    );
}
