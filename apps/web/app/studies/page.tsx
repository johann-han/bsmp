"use client";

import { useEffect, useState } from "react";

import {
    AppShell,
    NewStudyButton,
    NewStudyDialog,
    StudyList,
} from "@repo/ui";

import { supabase } from "../../src/lib/supabase";
import type { StudySummary } from "../../types/study";

export default function StudiesPage() {
    const [studies, setStudies] = useState<StudySummary[]>([]);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function authorizationHeaders(): Promise<HeadersInit> {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) throw new Error("Please sign in to view your studies.");

        return {
            Authorization: `Bearer ${data.session.access_token}`,
        };
    }

    async function loadStudies() {
        const response = await fetch("/api/studies", {
            headers: await authorizationHeaders(),
        });
        const result = await response.json() as StudySummary[] | { error?: string };

        if (!response.ok) {
            throw new Error("error" in result && result.error ? result.error : "Unable to load studies.");
        }

        setStudies(result as StudySummary[]);
    }

    useEffect(() => {
        void loadStudies().catch((reason: unknown) => {
            setError(reason instanceof Error ? reason.message : "Unable to load studies.");
        });
    }, []);

    async function createStudy(title: string, passage: string) {
        setError(null);

        try {
            const response = await fetch("/api/studies", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(await authorizationHeaders()),
                },
                body: JSON.stringify({ title, passage }),
            });

            const result = await response.json() as { error?: string; id?: string };

            if (!response.ok) {
                throw new Error(result.error ?? "Unable to create study.");
            }

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
