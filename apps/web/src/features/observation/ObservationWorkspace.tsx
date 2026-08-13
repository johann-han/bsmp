"use client";

import { useEffect, useState } from "react";

import type {
    ObservationWorkspaceData,
    ObservationWorkspaceService,
    StudyPassageData,
    StudyPassageService,
} from "@bsmp/study";

import { ObservationPanel } from "@repo/ui";

import { createSupabaseObservationWorkspace } from "../../lib/createSupabaseObservationWorkspace";
import { ApplicationComposer } from "./ApplicationComposer";
import { ApplicationHistory } from "./ApplicationHistory";
import { InterpretationComposer } from "./InterpretationComposer";
import { InterpretationHistory } from "./InterpretationHistory";
import { InterpretationTools } from "./InterpretationTools";
import { ObservationComposer } from "./ObservationComposer";
import { ObservationHistory } from "./ObservationHistory";
import { StudyPassage, type StudyVerse } from "./StudyPassage";

interface RealBiblePassageResponse {
    readonly reference: string;
    readonly translation: string;
    readonly verses: readonly {
        readonly number: number;
        readonly reference: string;
        readonly text: string;
    }[];
}

function buildBibleApiReference(passage: StudyPassageService["passageReference"]): string {
    const start = passage.start;
    const end = passage.end;
    const book = start.book.value;
    const startChapter = start.chapter.value;
    const startVerse = start.verse.value;
    const endChapter = end.chapter.value;
    const endVerse = end.verse.value;

    if (startChapter === endChapter) {
        return `${book} ${startChapter}:${startVerse}-${endVerse}`;
    }

    return `${book} ${startChapter}:${startVerse}-${endChapter}:${endVerse}`;
}

async function loadRealBiblePassage(
    passageService: StudyPassageService,
): Promise<StudyPassageData | null> {
    const reference = buildBibleApiReference(passageService.passageReference);
    const response = await fetch(`/api/bible/passage?reference=${encodeURIComponent(reference)}`);

    if (!response.ok) {
        return null;
    }

    const payload = await response.json() as RealBiblePassageResponse;

    return {
        reference: payload.reference,
        translation: payload.translation,
        verses: payload.verses,
    };
}

export function ObservationWorkspace() {
    const [workspace, setWorkspace] = useState<ObservationWorkspaceService | null>(null);
    const [passageService, setPassageService] = useState<StudyPassageService | null>(null);
    const [data, setData] = useState<ObservationWorkspaceData | null>(null);
    const [passage, setPassage] = useState<StudyPassageData | null>(null);
    const [selectedVerse, setSelectedVerse] = useState<StudyVerse | null>(null);
    const [studyTitle, setStudyTitle] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const studyId = new URLSearchParams(window.location.search).get("studyId") ?? undefined;

        createSupabaseObservationWorkspace(studyId)
            .then(async ({ workspace: nextWorkspace, passageService: nextPassageService, study }) => {
                const [workspaceData, developmentPassage, realPassage] = await Promise.all([
                    nextWorkspace.load(),
                    nextPassageService.load(),
                    loadRealBiblePassage(nextPassageService).catch(() => null),
                ]);

                setWorkspace(nextWorkspace);
                setPassageService(nextPassageService);
                setData(workspaceData);
                setPassage(realPassage ?? developmentPassage);
                setStudyTitle(study.title.value);
            })
            .catch((reason: unknown) => {
                setError(reason instanceof Error ? reason.message : "Unable to load the study workspace.");
            });
    }, []);

    async function refreshWorkspace() {
        if (!workspace) return;
        setData(await workspace.load());
    }

    if (error) return <p>{error}</p>;
    if (!workspace || !passageService || !data || !passage) return <p>Loading study workspace...</p>;

    const selectedVerseReference = selectedVerse
        ? passage.verses.find((verse) => verse.number === selectedVerse.number)?.reference ?? null
        : null;

    return (
        <div>
            {studyTitle && (
                <p style={{ margin: "0 0 16px", fontWeight: 600 }}>
                    Study: {studyTitle}
                </p>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 360px)", gap: 20, alignItems: "start" }}>
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

            <ObservationHistory observations={data.observations} selectedVerseReference={selectedVerseReference} />

            <InterpretationComposer workspace={workspace} observations={data.observations} onSaved={refreshWorkspace} />
            <InterpretationHistory interpretations={data.interpretations} observations={data.observations} />
            <InterpretationTools interpretations={data.interpretations} observations={data.observations} workspace={workspace} onSaved={refreshWorkspace} />

            <ApplicationComposer workspace={workspace} interpretations={data.interpretations} onSaved={refreshWorkspace} />
            <ApplicationHistory applications={data.applications} interpretations={data.interpretations} />
        </div>
    );
}
