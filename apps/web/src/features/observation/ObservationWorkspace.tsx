"use client";

import { useEffect, useState } from "react";

import {
    createObservationWorkspace,
    createStudyPassage,
    type ObservationWorkspaceData,
    type ObservationWorkspaceService,
    type StudyPassageData,
    type StudyPassageService,
} from "@bsmp/study";

import { ObservationPanel } from "@repo/ui";

import { ObservationComposer } from "./ObservationComposer.js";
import { StudyPassage, type StudyVerse } from "./StudyPassage.js";

export function ObservationWorkspace() {
    const [workspace, setWorkspace] =
        useState<ObservationWorkspaceService | null>(null);

    const [passageService, setPassageService] =
        useState<StudyPassageService | null>(null);

    const [data, setData] =
        useState<ObservationWorkspaceData | null>(null);

    const [passage, setPassage] =
        useState<StudyPassageData | null>(null);

    const [selectedVerse, setSelectedVerse] =
        useState<StudyVerse | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        const nextWorkspace = createObservationWorkspace();
        const nextPassageService = createStudyPassage();

        Promise.all([
            nextWorkspace.load(),
            nextPassageService.load(),
        ])
            .then(([workspaceData, passageData]) => {
                setWorkspace(nextWorkspace);
                setPassageService(nextPassageService);
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

    if (!workspace || !passageService || !data || !passage) {
        return <p>Loading study workspace...</p>;
    }

    return (
        <div>
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

            <ObservationComposer
                workspace={workspace}
                selectedVerse={selectedVerse}
                getVerseReference={passageService.getVerseReference.bind(passageService)}
            />
        </div>
    );
}
