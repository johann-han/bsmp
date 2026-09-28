export interface ResearchContextSnapshot {
    readonly studyTitle: string;
    readonly passage: string;
    readonly observations: readonly string[];
    readonly interpretations: readonly string[];
    readonly biblicalTheology: readonly {
        theme: string;
        synthesis: string;
    }[];
}

export interface ResearchContextSnapshotInput {
    readonly studyTitle: string;
    readonly passage: string;
    readonly observations: readonly string[];
    readonly interpretations: readonly string[];
    readonly biblicalTheology: readonly {
        theme: string;
        synthesis: string;
    }[];
}

export function buildResearchContextSnapshot(
    input: ResearchContextSnapshotInput,
): ResearchContextSnapshot {
    return {
        studyTitle: input.studyTitle.trim(),
        passage: input.passage.trim(),
        observations: input.observations.map((value) => value.trim()).filter(Boolean),
        interpretations: input.interpretations.map((value) => value.trim()).filter(Boolean),
        biblicalTheology: input.biblicalTheology
            .map((entry) => ({
                theme: entry.theme.trim(),
                synthesis: entry.synthesis.trim(),
            }))
            .filter((entry) => entry.theme || entry.synthesis),
    };
}
