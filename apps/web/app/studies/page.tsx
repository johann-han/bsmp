"use client";

import { useEffect, useState } from "react";

import {
    AppShell,
    NewStudyButton,
    NewStudyDialog,
    StudyList,
} from "@repo/ui";

import { StudySummary } from "../../types/study";

export default function StudiesPage() {

    const [studies, setStudies] =
        useState<StudySummary[]>([]);

    const [open, setOpen] = useState(false);

    useEffect(() => {

        fetch("/api/studies")

            .then((response) => response.json())

            .then(setStudies);

    }, []);

    return (

        <AppShell title="Study Library">

            <div className="mb-6 flex items-center justify-between">

                <input
                    placeholder="Search studies..."
                    className="w-96 rounded-lg border px-4 py-2"
                />

                <NewStudyButton
                    onClick={() => setOpen(true)}
                />

            </div>

            <StudyList
                studies={studies}
            />

            <NewStudyDialog
                open={open}
                onClose={() => setOpen(false)}
                onCreate={(title, passage) => {

                    console.log("Creating study:");

                    console.log({
                        title,
                        passage,
                    });

                    setOpen(false);

                }}
            />



        </AppShell>

    );

}