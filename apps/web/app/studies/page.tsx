"use client";

import { useEffect, useState } from "react";

import { CreateStudy } from "@bsmp/study";
import {
    AppShell,
    NewStudyButton,
    NewStudyDialog,
    StudyList,
} from "@repo/ui";

import { SupabaseStudyRepository } from "../../src/lib/SupabaseStudyRepository";
import { parseStudyPassage } from "../../src/lib/parseStudyPassage";
import type { StudySummary } from "../../types/study";

const repository = new SupabaseStudyRepository();

export default function StudiesPage() {
    const [studies, setStudies] = useState<StudySummary[]>([]);
    const [open, setOpen] = useState(false);
    const [initialPassage, setInitialPassage] = useState("");
    const [initialTitle, setInitialTitle] = useState("");
    const [error, setError] = useState<string | null>(null);

    async function loadStudies() {
        const result = await repository.findAll();
        setStudies(
            result.map((study) => ({
                id: study.id.value,
                title: study.title.value,
                passage: study.passage.toString(),
                status: study.status.value,
            })),
        );
    }

    useEffect(() => {
        void loadStudies().catch((reason: unknown) => {
            setError(reason instanceof Error ? reason.message : "Unable to load studies.");
        });
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const passage = params.get("passage")?.trim() ?? "";
        const shouldOpen = params.get("newStudy") === "1" && passage.length > 0;
        if (!shouldOpen) return;

        setInitialPassage(passage);
        setInitialTitle(`${passage} Study`);
        setOpen(true);
        window.history.replaceState(null, "", "/studies");
    }, []);

    async function createStudy(title: string, passage: string) {
        setError(null);

        try {
            await new CreateStudy(repository).execute(
                title,
                parseStudyPassage(passage),
            );
            await loadStudies();
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to create study.");
        }
    }

    function openBlankStudyDialog() {
        setInitialTitle("");
        setInitialPassage("");
        setOpen(true);
    }

    return (
        <AppShell title="Study Library">
            <div className="mb-6 flex items-center justify-between">
                <input
                    placeholder="Search studies..."
                    className="w-96 rounded-lg border px-4 py-2"
                />

                <NewStudyButton onClick={openBlankStudyDialog} />
            </div>

            {error ? <p role="alert" className="mb-4">{error}</p> : null}

            <StudyList studies={studies} />

            <NewStudyDialog
                open={open}
                onClose={() => setOpen(false)}
                initialTitle={initialTitle}
                initialPassage={initialPassage}
                onCreate={(title, passage) => void createStudy(title, passage)}
            />
        </AppShell>
    );
}
