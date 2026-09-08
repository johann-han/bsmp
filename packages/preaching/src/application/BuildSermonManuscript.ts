import type { ExpositorySermon, SermonManuscriptSection } from "../domain/ExpositorySermon.js";

function section(title: string, value: string | undefined): string {
    const normalized = value?.trim() ?? "";
    return normalized ? `${title}\n\n${normalized}` : "";
}

export function buildSermonManuscriptSections(sermon: ExpositorySermon): SermonManuscriptSection[] {
    const sections: SermonManuscriptSection[] = [];
    const push = (id: string, title: string, content: string | undefined, outlinePointId?: string) => {
        const normalized = content?.trim() ?? "";
        if (!normalized) return;
        sections.push({ id, title, content: normalized, ...(outlinePointId ? { outlinePointId } : {}) });
    };

    push("introduction", "INTRODUCTION", sermon.introduction?.value);
    push("context", "CONTEXT / SETTING", sermon.context?.value);

    sermon.outline.forEach((point, index) => {
        const parts = [
            `Truth: ${point.truth}`,
            point.text ? `Text\n${point.text}` : "",
            point.explanation ? `Explanation\n${point.explanation}` : "",
            point.illustration ? `Illustration\n${point.illustration}` : "",
            point.application ? `Application\n${point.application}` : "",
            point.transition ? `Transition\n${point.transition}` : "",
        ].filter(Boolean);
        push(`outline-${point.id}`, `${index + 1}. ${point.heading}`, parts.join("\n\n"), point.id);
    });

    push("conclusion", "CONCLUSION", sermon.conclusion?.value);
    return sections;
}

export function composeSermonManuscript(sermon: ExpositorySermon, sections: readonly SermonManuscriptSection[]): string {
    const header = [
        `SERMON: ${sermon.title.value}`,
        `PASSAGE: ${sermon.passage.toString()}`,
        section("BIG IDEA", sermon.bigIdea?.value),
        section("PURPOSE", sermon.purpose?.value),
    ].filter(Boolean);

    const body = sections.map((item) => `${item.title}\n\n${item.content}`);
    return [...header, ...body].join("\n\n---\n\n").trim();
}

export function buildSermonManuscript(sermon: ExpositorySermon): string {
    return composeSermonManuscript(sermon, buildSermonManuscriptSections(sermon));
}
