"use client";

import { useEffect, useState } from "react";

import {
    createObservationWorkspace,
    type ObservationWorkspaceData,
} from "@bsmp/study";

import { ObservationPanel } from "@repo/ui";

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
        <ObservationPanel data={data} />
    );
}