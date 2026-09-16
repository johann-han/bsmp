export interface ResearchSourceCandidate {
    readonly url: string;
    readonly title?: string;
}

export interface ResearchSourceRecord {
    readonly url: string;
    readonly title: string;
    readonly retrievedAt: string;
    readonly status: "retrieved" | "unsupported" | "failed";
    readonly excerpt?: string;
    readonly error?: string;
}

const MAX_SOURCES = 5;
const MAX_EXCERPT = 1800;

function safeUrl(value: string): URL {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error("Only HTTPS research sources are supported.");
    if (url.username || url.password) throw new Error("Research sources with embedded credentials are not supported.");
    return url;
}

function titleFromDocument(html: string, fallback: string): string {
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!match?.[1]) return fallback;
    return match[1].replace(/\s+/g, " ").trim().slice(0, 240) || fallback;
}

function textFromHtml(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();
}

export async function retrieveResearchSources(candidates: readonly ResearchSourceCandidate[]): Promise<ResearchSourceRecord[]> {
    const unique = Array.from(new Map(candidates.map((candidate) => [candidate.url.trim(), candidate])).values()).slice(0, MAX_SOURCES);
    const results: ResearchSourceRecord[] = [];

    for (const candidate of unique) {
        try {
            const url = safeUrl(candidate.url);
            const response = await fetch(url, {
                method: "GET",
                redirect: "error",
                headers: { Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8" },
                signal: AbortSignal.timeout(8000),
            });
            if (!response.ok) throw new Error(`Source returned HTTP ${response.status}.`);
            const contentType = response.headers.get("content-type") ?? "";
            if (!/text\/(html|plain)|application\/xhtml\+xml/i.test(contentType)) {
                results.push({ url: url.toString(), title: candidate.title ?? url.hostname, retrievedAt: new Date().toISOString(), status: "unsupported", error: "Only HTML and plain-text sources are supported in this slice." });
                continue;
            }
            const raw = await response.text();
            const excerpt = textFromHtml(raw).slice(0, MAX_EXCERPT);
            results.push({ url: url.toString(), title: candidate.title ?? titleFromDocument(raw, url.hostname), retrievedAt: new Date().toISOString(), status: "retrieved", excerpt });
        } catch (reason) {
            results.push({ url: candidate.url.trim(), title: candidate.title ?? candidate.url.trim(), retrievedAt: new Date().toISOString(), status: "failed", error: reason instanceof Error ? reason.message : "Unable to retrieve source." });
        }
    }

    return results;
}
