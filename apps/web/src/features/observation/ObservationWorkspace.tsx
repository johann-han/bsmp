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
import { takePreparedStudyWorkspace } from "../../lib/studyWorkspaceNavigationCache";
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
    const [returnTo, setReturnTo] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const params = new URLSearchParams(window.location.search);
        const requestedStudyId = params.get("studyId") ?? undefined;
        const requestedReturnTo = params.get("returnTo");
        if (requestedReturnTo) setReturnTo(requestedReturnTo);

        const prepared = requestedStudyId ? takePreparedStudyWorkspace(requestedStudyId) : undefined;

        const bootstrapPromise = prepared
            ? Promise.resolve(prepared)
            : createSupabaseObservationWorkspace(requestedStudyId).then(async (created) => {
                const [workspaceData, developmentPassage] = await Promise.all([
                    created.workspace.load(),
                    created.passageService.load(),
                ]);

                return {
                    ...created,
                    data: workspaceData,
                    passage: developmentPassage,
                };
            });

        void bootstrapPromise
            .then(({ workspace: nextWorkspace, passageService: nextPassageService, study, data: workspaceData, passage: developmentPassage }) => {
                if (cancelled) return;

                setWorkspace(nextWorkspace);
                setPassageService(nextPassageService);
                setData(workspaceData);
                setPassage(developmentPassage);
                setStudyId(study.id.value);
                setStudyTitle(study.title.value);

                void loadRealBiblePassage(nextPassageService, "asv")
                    .then((realPassage) => {
                        if (!cancelled && realPassage) setPassage(realPassage);
                    })
                    .catch(() => {
                        // Keep the development passage if the real translation service is unavailable.
                    });
            })
            .catch((reason: unknown) => {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load the study workspace.");
            });

        return () => {
            cancelled = true;
        };
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
        window.requestAnimationFrame(() => observationComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }

    function addOptimisticInterpretation(interpretation: ObservationWorkspaceData["interpretations"][number]) {
        setData((current) => current ? { ...current, interpretations: [...current.interpretations, interpretation] } : current);
    }

    function rollbackOptimisticInterpretation(id: string) {
        setData((current) => current ? { ...current, interpretations: current.interpretations.filter((item) => item.id !== id) } : current);
    }

    function updateInterpretation(next: ObservationWorkspaceData["interpretations"][number]) {
        setData((current) => current ? {
            ...current,
            interpretations: current.interpretations.map((item) => item.id === next.id ? next : item),
        } : current);
    }

    function addOptimisticEvidence(
        interpretationId: string,
        evidence: ObservationWorkspaceData["interpretations"][number]["evidence"][number],
    ) {
        setData((current) => current ? {
            ...current,
            interpretations: current.interpretations.map((item) => item.id === interpretationId ? { ...item, evidence: [...item.evidence, evidence] } : item),
        } : current);
    }

    function rollbackOptimisticEvidence(interpretationId: string, evidenceId: string) {
        setData((current) => current ? {
            ...current,
            interpretations: current.interpretations.map((item) => item.id === interpretationId ? { ...item, evidence: item.evidence.filter((item) => item.id !== evidenceId) } : item),
        } : current);
    }

    function addOptimisticApplication(application: ObservationWorkspaceData["applications"][number]) {
        setData((current) => current ? { ...current, applications: [...current.applications, application] } : current);
    }

    function rollbackOptimisticApplication(id: string) {
        setData((current) => current ? { ...current, applications: current.applications.filter((item) => item.id !== id) } : current);
    }

    function updateApplication(application: ObservationWorkspaceData["applications"][number]) {
        setData((current) => current ? {
            ...current,
            applications: current.applications.map((item) => item.id === application.id ? application : item),
        } : current);
    }

    function removeApplication(applicationId: string) {
        setData((current) => current ? { ...current, applications: current.applications.filter((item) => item.id !== applicationId) } : current);
    }

    function scrollToElement(id: string) {
        window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    }

    function focusObservation(observation: ObservationWorkspaceData["observations"][number]) {
        const verseNumber = Number.parseInt(observation.target.verseReference.split(":").at(-1) ?? "", 10);
        if (Number.isInteger(verseNumber) && passage) {
            const verse = passage.verses.find((item) => item.number === verseNumber);
            if (verse) setSelectedVerses([verse]);
        }
        window.requestAnimationFrame(() => scrollToElement(`observation-${observation.id}`));
    }

    function focusInterpretation(interpretationId: string) {
        scrollToElement(`interpretation-${interpretationId}`);
    }

    useEffect(() => {
        if (!data || !passage || !studyId) return;
        const hash = window.location.hash.replace(/^#/, "");
        if (!hash) return;
        window.setTimeout(() => {
            document.getElementById(decodeURIComponent(hash))?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 0);
    }, [data, passage, studyId]);

    if (error) return <p>{error}</p>;
    if (!workspace || !passageService || !data || !passage || !studyId) return <p>Loading study workspace...</p>;

    const selectedVerse = selectedVerses[0] ?? null;
    const selectedVerseReference = selectedVerse
        ? passage.verses.find((verse) => verse.number === selectedVerse.number)?.reference ?? null
        : null;
    const returnLabel = returnTo?.includes("/preaching/exposition")
        ? "← Back to Sermon Exposition"
        : "← Back to Sermon Study Source";

    return (
        <div>
            {returnTo && (
                <div
                    style={{
                        position: "fixed",
                        left: 20,
                        bottom: 20,
                        zIndex: 1000,
                        maxWidth: "calc(100vw - 40px)",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => window.location.assign(returnTo)}
                        style={{
                            border: "1px solid #d1d5db",
                            borderRadius: 999,
                            padding: "10px 16px",
                            background: "rgba(255,255,255,0.97)",
                            backdropFilter: "blur(10px)",
                            color: "#1d4ed8",
                            cursor: "pointer",
                            fontWeight: 700,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
                        }}
                    >
                        {returnLabel}
                    </button>
                </div>
            )}

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
            <ObservationHistory observations={data.observations} selectedVerseReference={selectedVerseReference} onChanged={refreshWorkspace} />
            <InterpretationComposer
                workspace={workspace}
                observations={data.observations}
                onSaved={refreshWorkspace}
                onOptimisticCreate={addOptimisticInterpretation}
                onRollbackCreate={rollbackOptimisticInterpretation}
            />
            <InterpretationHistory interpretations={data.interpretations} observations={data.observations} onObservationSelect={focusObservation} />
            <InterpretationTools
                interpretations={data.interpretations}
                observations={data.observations}
                workspace={workspace}
                onSaved={refreshWorkspace}
                onChanged={updateInterpretation}
                onEvidenceChanged={addOptimisticEvidence}
                onEvidenceRollback={rollbackOptimisticEvidence}
            />
            <ApplicationComposer
                workspace={workspace}
                interpretations={data.interpretations}
                onSaved={refreshWorkspace}
                onOptimisticCreate={addOptimisticApplication}
                onRollbackCreate={rollbackOptimisticApplication}
            />
            <ApplicationHistory
                applications={data.applications}
                interpretations={data.interpretations}
                workspace={workspace}
                onUpdated={updateApplication}
                onDeleted={removeApplication}
                onInterpretationSelect={focusInterpretation}
            />
        </div>
    );
}
