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

    return (
        <AppShell title="Study Library">
            <div className="mb-6 flex items-center justify-between">
                <input
                    placeholder="Search studies..."
                    className="w-96 rounded-lg border px-4 py-2"
                />

                <NewStudyButton onClick={() => setOpen(true)} />
            </div>

            {error ? <p role="alert" className="mb-4">{error}</p> : null}

            <StudyList studies={studies} />

            <NewStudyDialog
                open={open}
                onClose={() => setOpen(false)}
                onCreate={(title, passage) => void createStudy(title, passage)}
            />
        </AppShell>
    );
}
