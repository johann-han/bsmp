"use client";

import { useEffect } from "react";

const DELIVERY_SECTION_PREFIX = "delivery-section-";

function sanitizeDeliveryHash() {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith(DELIVERY_SECTION_PREFIX)) return;
    if (document.getElementById(hash)) return;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

export function SermonDeliveryRecoveryGuard() {
    useEffect(() => {
        let frame = 0;
        const schedule = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(() => {
                frame = 0;
                sanitizeDeliveryHash();
            });
        };

        sanitizeDeliveryHash();
        window.addEventListener("hashchange", schedule);
        window.addEventListener("popstate", schedule);
        window.addEventListener("resize", schedule);
        const observer = new MutationObserver(schedule);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener("hashchange", schedule);
            window.removeEventListener("popstate", schedule);
            window.removeEventListener("resize", schedule);
            observer.disconnect();
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, []);

    return null;
}
