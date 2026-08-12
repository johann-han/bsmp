"use client";

import { useState } from "react";

import type { ObservationWorkspaceService } from "@bsmp/study";

import type { StudyVerse } from "./StudyPassage.js";

export interface ObservationComposerProps {
    readonly workspace: ObservationWorkspaceService;
    readonly selectedVerse: StudyVerse | null;
    readonly getVerseReference: (verseNumber: number) => ReturnType<
        ObservationWorkspaceService["addObservation"]
    > extends Promise<unknown> ? never : never;
}
