"use client";

import { useState } from "react";

import {
    AppShell,
    NewStudyButton,
    NewStudyDialog,
    StudyList,
} from "@repo/ui";

const studies = [
    {
        id: "1",
        title: "Romans 8 Study",
        passage: "Romans 8:1–39",
        status: "Draft",
    },
    {
        id: "2",
        title: "John 15 Study",
        passage: "John 15:1–17",
        status: "Draft",
    },
];

export default function StudiesPage() {

    const [open, setOpen] = useState(false);

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