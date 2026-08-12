"use client";

import { useEffect, useState } from "react";

import {
    createObservationWorkspace,
    type ObservationWorkspaceData,
} from "@bsmp/study";

import { ObservationPanel } from "@repo/ui";

import { StudyPassage } from "./StudyPassage.js";

const demoPassage = {
    reference: "John 15:1–11",
    translation: "KJV",
    verses: [
        { number: 1, text: "I am the true vine, and my Father is the husbandman." },
        { number: 2, text: "Every branch in me that beareth not fruit he taketh away: and every branch that beareth fruit, he purgeth it, that it may bring forth more fruit." },
        { number: 3, text: "Now ye are clean through the word which I have spoken unto you." },
        { number: 4, text: "Abide in me, and I in you. As the branch cannot bear fruit of itself, except it abide in the vine; no more can ye, except ye abide in me." },
        { number: 5, text: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing." },
        { number: 6, text: "If a man abide not in me, he is cast forth as a branch, and is withered; and men gather them, and cast them into the fire, and they are burned." },
        { number: 7, text: "If ye abide in me, and my words abide in you, ye shall ask what ye will, and it shall be done unto you." },
        { number: 8, text: "Herein is my Father glorified, that ye bear much fruit; so shall ye be my disciples." },
        { number: 9, text: "As the Father hath loved me, so have I loved you: continue ye in my love." },
        { number: 10, text: "If ye keep my commandments, ye shall abide in my love; even as I have kept my Father's commandments, and abide in his love." },
        { number: 11, text: "These things have I spoken unto you, that my joy might remain in you, and that your joy might be full." },
    ],
} as const;

export function ObservationWorkspace() {
    const [data, setData] =
        useState<ObservationWorkspaceData | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        const workspace =
            createObservationWorkspace();

        workspace
            .load()
            .then(setData)
            .catch(() => {
                setError(
                    "Unable to load observation data.",
                );
            });
    }, []);

    if (error) {
        return <p>{error}</p>;
    }

    if (!data) {
        return <p>Loading observation tools...</p>;
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
                reference={demoPassage.reference}
                translation={demoPassage.translation}
                verses={demoPassage.verses}
            />

            <ObservationPanel data={data} />
        </div>
    );
}
