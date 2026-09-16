import { runBiblicalResearch, type BiblicalResearchFocus, type BiblicalResearchResult } from "./biblicalResearchProvider";
import { runExternalBiblicalResearch, type ExternalBiblicalResearchResult } from "./externalBiblicalResearchProvider";
import { runOpenRouterBiblicalResearch, type OpenRouterBiblicalResearchResult } from "./openRouterBiblicalResearchProvider";
import type { OpenRouterBiblicalResearchInput } from "./openRouterBiblicalResearchProvider";

export interface RoutedBiblicalResearchInput {
    readonly question: string;
    readonly studyTitle: string;
    readonly passage: string;
    readonly observations: readonly string[];
    readonly interpretations: readonly string[];
    readonly biblicalTheology: readonly { theme: string; synthesis: string }[];
    readonly focus: BiblicalResearchFocus;
}

export interface RoutedExternalBiblicalResearchInput {
    readonly question: string;
    readonly studyTitle: string;
    readonly passage: string;
    readonly studyContext: readonly string[];
    readonly sourceUrls: readonly string[];
    readonly focus: BiblicalResearchFocus;
}

function canFallbackFromGemini(reason: unknown): boolean {
    const message = reason instanceof Error ? reason.message : String(reason);
    return /\[gemini:(429|5\d\d)\]/i.test(message) || /Gemini (?:external )?research is not configured/i.test(message);
}

export async function runRoutedBiblicalResearch(input: RoutedBiblicalResearchInput): Promise<BiblicalResearchResult> {
    try {
        return await runBiblicalResearch(input);
    } catch (reason) {
        if (!canFallbackFromGemini(reason)) throw reason;
        const fallback = await runOpenRouterBiblicalResearch({
            question: input.question,
            studyTitle: input.studyTitle,
            passage: input.passage,
            studyContext: [
                ...input.observations.map((value) => `Observation — ${value}`),
                ...input.interpretations.map((value) => `Interpretation — ${value}`),
                ...input.biblicalTheology.map((entry) => `Biblical Theology — ${entry.theme}: ${entry.synthesis}`),
            ],
            sourceUrls: [],
            focus: input.focus,
            external: false,
        });
        return {
            answer: fallback.answer,
            textualBasis: fallback.textualBasis,
            furtherQuestions: fallback.furtherQuestions,
            cautions: fallback.cautions,
            model: fallback.model,
            provider: fallback.provider,
        };
    }
}

export async function runRoutedExternalBiblicalResearch(input: RoutedExternalBiblicalResearchInput): Promise<ExternalBiblicalResearchResult | OpenRouterBiblicalResearchResult> {
    try {
        return await runExternalBiblicalResearch(input);
    } catch (reason) {
        if (!canFallbackFromGemini(reason)) throw reason;
        const openRouterInput: OpenRouterBiblicalResearchInput = {
            question: input.question,
            studyTitle: input.studyTitle,
            passage: input.passage,
            studyContext: input.studyContext,
            sourceUrls: input.sourceUrls,
            focus: input.focus,
            external: true,
        };
        return await runOpenRouterBiblicalResearch(openRouterInput);
    }
}
