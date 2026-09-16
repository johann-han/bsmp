"use client";

import { useEffect, useMemo, useState } from "react";

import { CreateStudy } from "@bsmp/study";
import {
    AppShell,
    NewStudyButton,
    NewStudyDialog,
    StudyList,
} from "@repo/ui";

import { supabase } from "../../src/lib/supabase";
import { SupabaseStudyRepository } from "../../src/lib/SupabaseStudyRepository";
import { parseStudyPassage } from "../../src/lib/parseStudyPassage";
import type { StudySummary } from "../../types/study";

const repository = new SupabaseStudyRepository();

type StudyApiRecord = {
    id: string;
    title: string;
    passage: string;
    status: string;
};

export default function StudiesPage() {
    const [studies, setStudies] = useState<StudySummary[]>([]);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [initialPassage, setInitialPassage] = useState("");
    const [initialTitle, setInitialTitle] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    async function loadStudies() {
        setError(null);
        setLoading(true);

        try {
            const { data, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;

            const accessToken = data.session?.access_token;
            if (!accessToken) {
                throw new Error("A signed-in Supabase session is required for study persistence.");
            }

            const response = await fetch("/api/studies", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                cache: "no-store",
            });

            const body = await response.json() as StudyApiRecord | StudyApiRecord[] | { error?: string };
            if (!response.ok) {
                const message = "error" in body && body.error
                    ? body.error
                    : "Unable to load studies.";
                throw new Error(message);
            }

            if (!Array.isArray(body)) {
                throw new Error("The study service returned an invalid response.");
            }

            setStudies(
                body.map((study) => ({
                    id: study.id,
                    title: study.title,
                    passage: study.passage,
                    status: study.status,
                })),
            );
        } finally {
            setLoading(false);
        }
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

    const filteredStudies = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return studies;

        return studies.filter((study) =>
            study.title.toLowerCase().includes(query) ||
            study.passage.toLowerCase().includes(query) ||
            study.status.toLowerCase().includes(query),
        );
    }, [search, studies]);

    return (
        <AppShell title="Study Library">
            <div className="mb-6 flex items-center justify-between">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search studies..."
                    aria-label="Search studies"
                    className="w-96 rounded-lg border px-4 py-2"
                />

                <NewStudyButton onClick={openBlankStudyDialog} />
            </div>

            {error ? <p role="alert" className="mb-4">{error}</p> : null}
            {loading ? <p className="mb-4">Loading studies...</p> : null}

            {!loading && !error && studies.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <h2 className="mb-2 text-lg font-semibold">No studies yet</h2>
                    <p className="mb-4">You do not have any Bible studies in your Study Library.</p>
                    <NewStudyButton onClick={openBlankStudyDialog} />
                </div>
            ) : null}

            {!loading && !error && studies.length > 0 && filteredStudies.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <h2 className="mb-2 text-lg font-semibold">No matching studies</h2>
                    <p>No studies match “{search}”.</p>
                </div>
            ) : null}

            {!loading && !error && filteredStudies.length > 0 ? (
                <StudyList studies={filteredStudies} />
            ) : null}

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
