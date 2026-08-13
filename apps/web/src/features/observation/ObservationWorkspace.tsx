"use client";

import { useEffect, useRef, useState } from "react";

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
import { StudyPassage, type StudyWordMarkup, type StudyVerse } from "./StudyPassage";

interface RealBiblePassageResponse {
    readonly reference: string;
    readonly translation: string;
    readonly verses: readonly {
        readonly number: number;
        readonly reference: string;
        readonly text: string;
    }[];
}

const TRANSLATIONS = [
    { id: "asv", name: "American Standard Version (1901)" },
    { id: "kjv", name: "King James Version" },
    { id: "web", name: "World English Bible" },
] as const;

type TranslationId = (typeof TRANSLATIONS)[number]["id"];

function buildBibleApiReference(passage: StudyPassageService["passageReference"]): string {
    const start = passage.start;
    const end = passage.end;
    const book = start.book.value;
    const startChapter = start.chapter.value;
    const startVerse = start.verse.value;
    const endChapter = end.chapter.value;
    const endVerse = end.verse.value;

    if (startChapter === endChapter) return `${book} ${startChapter}:${startVerse}-${endVerse}`;
    return `${book} ${startChapter}:${startVerse}-${endChapter}:${endVerse}`;
}

async function loadRealBiblePassage(
    passageService: StudyPassageService,
    translation: TranslationId,
): Promise<StudyPassageData | null> {
    const reference = buildBibleApiReference(passageService.passageReference);
    const response = await fetch(
        `/api/bible/passage?reference=${encodeURIComponent(reference)}&translation=${encodeURIComponent(translation)}`,
    );

    if (!response.ok) return null;

    const payload = await response.json() as RealBiblePassageResponse;
    return { reference: payload.reference, translation: payload.translation, verses: payload.verses };
}

export function ObservationWorkspace() {
    const observationComposerRef = useRef<HTMLElement | null>(null);
    const [workspace, setWorkspace] = useState<ObservationWorkspaceService | null>(null);
    const [passageService, setPassageService] = useState<StudyPassageService | null>(null);
    const [data, setData] = useState<ObservationWorkspaceData | null>(null);
    const [passage, setPassage] = useState<StudyPassageData | null>(null);
    const [selectedVerses, setSelectedVerses] = useState<readonly StudyVerse[]>([]);
    const [studyId, setStudyId] = useState<string | null>(null);
    const [studyTitle, setStudyTitle] = useState("");
    const [targetWord, setTargetWord] = useState<string | null>(null);
    const [targetMarkup, setTargetMarkup] = useState<StudyWordMarkup | null>(null);
    const [translation, setTranslation] = useState<TranslationId>("asv");
    const [passageLoading, setPassageLoading] = useState(false);
    const [passageError, setPassageError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const requestedStudyId = new URLSearchParams(window.location.search).get("studyId") ?? undefined;

        createSupabaseObservationWorkspace(requestedStudyId)
            .then(async ({ workspace: nextWorkspace, passageService: nextPassageService, study }) => {
                const [workspaceData, developmentPassage, realPassage] = await Promise.all([
                    nextWorkspace.load(),
                    nextPassageService.load(),
                    loadRealBiblePassage(nextPassageService, "asv").catch(() => null),
                ]);

                setWorkspace(nextWorkspace);
                setPassageService(nextPassageService);
                setData(workspaceData);
                setPassage(realPassage ?? developmentPassage);
                setStudyId(study.id.value);
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

    async function changeTranslation(nextTranslation: TranslationId) {
        if (!passageService || nextTranslation === translation) return;

        setTranslation(nextTranslation);
        setPassageLoading(true);
        setPassageError(null);

        try {
            const nextPassage = await loadRealBiblePassage(passageService, nextTranslation);
            if (!nextPassage) throw new Error("Unable to load the selected Bible translation.");
            setPassage(nextPassage);
            setSelectedVerses((current) => current.filter((selected) => nextPassage.verses.some((verse) => verse.number === selected.number)));
            setTargetWord(null);
            setTargetMarkup(null);
        } catch (reason: unknown) {
            setPassageError(reason instanceof Error ? reason.message : "Unable to load the selected Bible translation.");
        } finally {
            setPassageLoading(false);
        }
    }

    function targetObservationFromMarkup(verse: StudyVerse, markup: StudyWordMarkup, word: string) {
        setSelectedVerses([verse]);
        setTargetWord(word);
        setTargetMarkup(markup);
        window.requestAnimationFrame(() => {
            observationComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    }

    if (error) return <p>{error}</p>;
    if (!workspace || !passageService || !data || !passage || !studyId) return <p>Loading study workspace...</p>;

    const selectedVerse = selectedVerses[0] ?? null;
    const selectedVerseReference = selectedVerse
        ? passage.verses.find((verse) => verse.number === selectedVerse.number)?.reference ?? null
        : null;

    return (
        <div>
            {studyTitle && <p style={{ margin: "0 0 16px", fontWeight: 600 }}>Study: {studyTitle}</p>}

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <label htmlFor="study-translation" style={{ fontSize: 13, color: "#6b7280" }}>Translation</label>
                <select id="study-translation" value={translation} onChange={(event) => void changeTranslation(event.target.value as TranslationId)} disabled={passageLoading} style={{ minWidth: 240, padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff" }}>
                    {TRANSLATIONS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
            </div>

            {passageError && <p style={{ margin: "0 0 12px", color: "#b91c1c", fontSize: 13 }}>{passageError}</p>}

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 360px)", gap: 20, alignItems: "start" }}>
                <StudyPassage
                    studyId={studyId}
                    reference={passage.reference}
                    translation={translation}
                    verses={passage.verses}
                    selectedVerses={selectedVerses.map((verse) => verse.number)}
                    onSelectVerse={(verse) => {
                        setSelectedVerses([verse]);
                        setTargetWord(null);
                        setTargetMarkup(null);
                    }}
                    onSelectVerseRange={(verses) => {
                        setSelectedVerses(verses);
                        setTargetWord(null);
                        setTargetMarkup(null);
                    }}
                    onMarkedWordSelect={targetObservationFromMarkup}
                />
                <ObservationPanel data={data} />
            </div>

            <div ref={(node) => { observationComposerRef.current = node; }}>
                <ObservationComposer
                    workspace={workspace}
                    selectedVerse={selectedVerse}
                    targetWord={targetWord}
                    targetMarkup={targetMarkup}
                    translation={translation}
                    getVerseReference={passageService.getVerseReference.bind(passageService)}
                    onSaved={refreshWorkspace}
                />
            </div>
            <ObservationHistory observations={data.observations} selectedVerseReference={selectedVerseReference} />
            <InterpretationComposer workspace={workspace} observations={data.observations} onSaved={refreshWorkspace} />
            <InterpretationHistory interpretations={data.interpretations} observations={data.observations} />
            <InterpretationTools interpretations={data.interpretations} observations={data.observations} workspace={workspace} onSaved={refreshWorkspace} />
            <ApplicationComposer workspace={workspace} interpretations={data.interpretations} onSaved={refreshWorkspace} />
            <ApplicationHistory applications={data.applications} interpretations={data.interpretations} />
        </div>
    );
}
