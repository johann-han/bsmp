"use client";

import { useEffect } from "react";

function targetForHash(hash: string): string | null {
    const decoded = decodeURIComponent(hash.replace(/^#/, ""));
    if (!decoded.startsWith("interpretation-") || decoded.startsWith("interpretation-tools-")) return null;
    const interpretationId = decoded.slice("interpretation-".length);
    return interpretationId ? `interpretation-tools-${interpretationId}` : null;
}

export function StudyWorkspaceAnchorResolver() {
    useEffect(() => {
        const target = targetForHash(window.location.hash);
        if (!target) return;

        const scrollToTarget = () => {
            const element = document.getElementById(target);
            if (!element) return false;
            history.replaceState(null, "", `#${encodeURIComponent(target)}`);
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            return true;
        };

        if (scrollToTarget()) return;

        const observer = new MutationObserver(() => {
            if (scrollToTarget()) observer.disconnect();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        const timeout = window.setTimeout(() => observer.disconnect(), 10000);
        return () => {
            window.clearTimeout(timeout);
            observer.disconnect();
        };
    }, []);

    return null;
}
