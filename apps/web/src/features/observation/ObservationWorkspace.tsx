"use client";

import { useEffect, useState } from "react";

import type {
    ObservationWorkspaceData,
    ObservationWorkspaceService,
    StudyPassageData,
    StudyPassageService,
} from "@bsmp/study";

import { ObservationPanel } from "@repo/ui";

import { createSupabaseObservationWorkspace } from "../../lib/createSupabaseObservationWorkspace.js";
import { ObservationComposer } from "./ObservationComposer.js";
import { ObservationHistory } from "./ObservationHistory.js";
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
        createSupabaseObservationWorkspace()
            .then(async ({ workspace: nextWorkspace, passageService: nextPassageService }) => {
                const [workspaceData, passageData] = await Promise.all([
                    nextWorkspace.load(),
                    nextPassageService.load(),
                ]);

                setWorkspace(nextWorkspace);
                setPassageService(nextPassageService);
                setData(workspaceData);
                setPassage(passageData);
            })
            .catch((reason: unknown) => {
                setError(
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load the study workspace.",
                );
            });
    }, []);

    async function refreshWorkspace() {
        if (!workspace) {
            return;
        }

        setData(await workspace.load());
    }

    if (error) {
        return <p>{error}</p>;
    }

    if (!workspace || !passageService || !data || !passage) {
        return <p>Loading study workspace...</p>;
    }

    const selectedVerseReference = selectedVerse
        ? passage.verses.find(
            (verse) => verse.number === selectedVerse.number,
        )?.reference ?? null
        : null;

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
                onSaved={refreshWorkspace}
            />

            <ObservationHistory
                observations={data.observations}
                selectedVerseReference={selectedVerseReference}
            />
        </div>
    );
}
