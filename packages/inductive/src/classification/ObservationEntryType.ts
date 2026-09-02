export type ObservationEntryType = "question" | "observation" | "inference" | "interpretation" | "empty";

export function classifyObservationEntry(value: string): ObservationEntryType {
    const text = value.trim();
    if (!text) return "empty";

    const normalized = text.toLowerCase();
    if (text.endsWith("?") || /^(who|what|where|when|why|how|which|whose|whom|to whom|for whom)\b/i.test(normalized)) {
        return "question";
    }

    if (/\b(therefore|thus|so this means|this means|which means|hence|consequently|must be|is why)\b/i.test(normalized)) {
        return "interpretation";
    }

    if (/\b(it shows|this shows|this suggests|this implies|apparently|likely|probably|perhaps|seems to|appears to|we can conclude|i think)\b/i.test(normalized)) {
        return "inference";
    }

    return "observation";
}
