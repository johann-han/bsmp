import type { ExpositorySermon } from "../domain/ExpositorySermon.js";

export interface FinalSermonReadinessCheck {
    readonly id: "big-idea" | "purpose" | "outline" | "exposition" | "final-manuscript" | "delivery-preparation";
    readonly label: string;
    readonly description: string;
    readonly complete: boolean;
}

export function evaluateFinalSermonReadiness(
    sermon: ExpositorySermon,
): readonly FinalSermonReadinessCheck[] {
    const manuscript = sermon.manuscript?.value.trim() ?? "";
    const hasExposition = sermon.outline.some((point) =>
        Boolean(point.text || point.explanation || point.illustration || point.application),
    );

    return [
        {
            id: "big-idea",
            label: "Big Idea",
            description: "The governing truth of the sermon is defined.",
            complete: Boolean(sermon.bigIdea?.value.trim()),
        },
        {
            id: "purpose",
            label: "Purpose",
            description: "The intended response of the congregation is defined.",
            complete: Boolean(sermon.purpose?.value.trim()),
        },
        {
            id: "outline",
            label: "Outline",
            description: "The sermon has at least one prepared outline point.",
            complete: sermon.outline.length > 0,
        },
        {
            id: "exposition",
            label: "Exposition",
            description: "At least one outline point has developed exposition material.",
            complete: hasExposition,
        },
        {
            id: "final-manuscript",
            label: "Final Manuscript",
            description: "A saved manuscript is ready for preaching review.",
            complete: manuscript.length > 0,
        },
        {
            id: "delivery-preparation",
            label: "Delivery Preparation",
            description: "Delivery notes are prepared for the preaching setting.",
            complete: Boolean(sermon.deliveryNotes?.value.trim()),
        },
    ];
}
