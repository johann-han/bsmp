"use client";

import { useEffect } from "react";

const DELIVERY_SECTION_PREFIX = "delivery-section-";
const DELIVERY_RECOVERY_PREFIX = "bsmp.delivery.recovery.v1";
const DELIVERY_MANUSCRIPT_SIGNATURE_PREFIX = "bsmp.delivery.manuscript.signature.v1";

function studyIdFromLocation(): string {
    return new URLSearchParams(window.location.search).get("studyId") ?? "unknown";
}

function recoveryKey(): string {
    return `${DELIVERY_RECOVERY_PREFIX}:${studyIdFromLocation()}`;
}

function manuscriptSignatureKey(): string {
    return `${DELIVERY_MANUSCRIPT_SIGNATURE_PREFIX}:${studyIdFromLocation()}`;
}

function getManuscriptSignature(): string | null {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".bsmp-delivery-print-section"));
    if (sections.length === 0) return null;

    return JSON.stringify(sections.map((section) => {
        const clone = section.cloneNode(true) as HTMLElement;
        clone.querySelectorAll(".bsmp-delivery-place-marker").forEach((marker) => marker.remove());
        return {
            id: section.id,
            text: clone.textContent?.replace(/\s+/g, " ").trim() ?? "",
        };
    }));
}

function invalidateStaleMyPlace() {
    const signature = getManuscriptSignature();
    if (!signature) return;

    try {
        const key = manuscriptSignatureKey();
        const previousSignature = window.localStorage.getItem(key);
        if (previousSignature && previousSignature !== signature) {
            const recoveryRaw = window.localStorage.getItem(recoveryKey());
            if (recoveryRaw) {
                const parsed = JSON.parse(recoveryRaw) as unknown;
                if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                    const recovery = parsed as Record<string, unknown>;
                    if (recovery.placeMarker) {
                        // A line offset belongs to a specific rendered manuscript. When
                        // authored text changes, the same section id can remain while the
                        // saved line moves; discard only My Place and preserve the rest of
                        // the preacher's Delivery recovery state.
                        delete recovery.placeMarker;
                        window.localStorage.setItem(recoveryKey(), JSON.stringify(recovery));
                    }
                }
            }
        }
        window.localStorage.setItem(key, signature);
    } catch {
        // Recovery is optional; storage failures must never block delivery.
    }
}

function sanitizeDeliveryHash() {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith(DELIVERY_SECTION_PREFIX)) return;

    // Do not clear a valid recovery hash while the delivery workspace is still loading.
    // The navigation/section DOM is the signal that persisted manuscript sections are ready.
    const deliverySectionContainer = document.querySelector<HTMLElement>(".bsmp-delivery-section-nav");
    if (!deliverySectionContainer) return;
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
                invalidateStaleMyPlace();
                sanitizeDeliveryHash();
            });
        };

        invalidateStaleMyPlace();
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
