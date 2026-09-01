import type { ExpositorySermon } from "../domain/ExpositorySermon.js";

function section(title: string, value: string | undefined): string {
    const normalized = value?.trim() ?? "";
    return normalized ? `${title}\n\n${normalized}` : "";
}

export function buildSermonManuscript(sermon: ExpositorySermon): string {
    const sections: string[] = [];

    sections.push(`SERMON: ${sermon.title.value}`);
    sections.push(`PASSAGE: ${sermon.passage.toString()}`);

    const bigIdea = section("BIG IDEA", sermon.bigIdea?.value);
    if (bigIdea) sections.push(bigIdea);

    const purpose = section("PURPOSE", sermon.purpose?.value);
    if (purpose) sections.push(purpose);

    const introduction = section("INTRODUCTION", sermon.introduction?.value);
    if (introduction) sections.push(introduction);

    const context = section("CONTEXT / SETTING", sermon.context?.value);
    if (context) sections.push(context);

    sermon.outline.forEach((point, index) => {
        const parts = [
            `${index + 1}. ${point.heading}`,
            `Truth: ${point.truth}`,
            point.text ? `Text\n${point.text}` : "",
            point.explanation ? `Explanation\n${point.explanation}` : "",
            point.illustration ? `Illustration\n${point.illustration}` : "",
            point.application ? `Application\n${point.application}` : "",
            point.transition ? `Transition\n${point.transition}` : "",
        ].filter(Boolean);

        sections.push(parts.join("\n\n"));
    });

    const conclusion = section("CONCLUSION", sermon.conclusion?.value);
    if (conclusion) sections.push(conclusion);

    return sections.join("\n\n---\n\n").trim();
}
