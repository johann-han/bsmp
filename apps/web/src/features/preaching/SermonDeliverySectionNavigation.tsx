"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SermonManuscriptSection } from "@bsmp/preaching";

interface Props {
    sections: readonly SermonManuscriptSection[];
}

interface ScreenWakeLockSentinelLike extends EventTarget {
    released: boolean;
    release(): Promise<void>;
}

function sectionId(id: string): string {
    return `delivery-section-${encodeURIComponent(id)}`;
}

function navigationLinkId(id: string): string {
    return `delivery-nav-${encodeURIComponent(id)}`;
}

const DELIVERY_NAV_OFFSET = 150;

export function SermonDeliverySectionNavigation({ sections }: Props) {
    const [activeIndex, setActiveIndex] = useState(0);
    const wakeLockRef = useRef<ScreenWakeLockSentinelLike | null>(null);
    const [screenAwake, setScreenAwake] = useState(false);

    useEffect(() => {
        if (sections.length === 0) return;

        let frame = 0;

        const updateActiveSection = () => {
            const viewportPosition = window.scrollY + DELIVERY_NAV_OFFSET;
            let nextIndex = 0;

            sections.forEach((section, index) => {
                const element = document.getElementById(sectionId(section.id));
                if (!element) return;

                const documentTop = element.getBoundingClientRect().top + window.scrollY;
                if (documentTop <= viewportPosition) {
                    nextIndex = index;
                }
            });

            setActiveIndex((current) => current === nextIndex ? current : nextIndex);
            frame = 0;
        };

        const scheduleUpdate = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(updateActiveSection);
        };

        updateActiveSection();
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate, { passive: true });

        return () => {
            window.removeEventListener("scroll", scheduleUpdate);
            window.removeEventListener("resize", scheduleUpdate);
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, [sections]);

    const safeActiveIndex = Math.min(activeIndex, Math.max(0, sections.length - 1));
    const activeSection = sections[safeActiveIndex];
    const progressLabel = useMemo(
        () => `${safeActiveIndex + 1} of ${sections.length}`,
        [safeActiveIndex, sections.length],
    );

    function jumpTo(index: number) {
        if (sections.length === 0) return;

        const nextIndex = Math.max(0, Math.min(index, sections.length - 1));
        const targetId = sectionId(sections[nextIndex].id);
        setActiveIndex(nextIndex);

        if (window.location.hash !== `#${targetId}`) {
            window.history.replaceState(null, "", `#${targetId}`);
        }

        document.getElementById(targetId)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    useEffect(() => {
        if (sections.length === 0) return;

        const targetId = window.location.hash.slice(1);
        if (!targetId) return;

        const hashIndex = sections.findIndex((section) => sectionId(section.id) === targetId);
        if (hashIndex >= 0) setActiveIndex(hashIndex);
    }, [sections]);

    useEffect(() => {
        if (sections.length === 0) return;

        function handleHashChange() {
            const targetId = window.location.hash.slice(1);
            const nextIndex = sections.findIndex((section) => sectionId(section.id) === targetId);
            if (nextIndex >= 0) setActiveIndex(nextIndex);
        }

        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, [sections]);

    useEffect(() => {
        if (sections.length === 0) return;

        const activeLink = document.getElementById(navigationLinkId(sections[safeActiveIndex].id));
        activeLink?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, [safeActiveIndex, sections]);

    useEffect(() => {
        if (sections.length === 0) return;

        const browserNavigator = navigator as Navigator & {
            wakeLock?: {
                request(type: "screen"): Promise<ScreenWakeLockSentinelLike>;
            };
        };

        if (!browserNavigator.wakeLock) return;

        let disposed = false;

        async function acquireWakeLock() {
            if (disposed || document.visibilityState !== "visible" || wakeLockRef.current) return;

            try {
                const sentinel = await browserNavigator.wakeLock!.request("screen");
                if (disposed) {
                    await sentinel.release();
                    return;
                }
                wakeLockRef.current = sentinel;
                setScreenAwake(true);

                sentinel.addEventListener("release", () => {
                    if (wakeLockRef.current === sentinel) wakeLockRef.current = null;
                    setScreenAwake(false);
                });
            } catch {
                setScreenAwake(false);
            }
        }

        function handleVisibilityChange() {
            if (document.visibilityState === "visible") {
                void acquireWakeLock();
            }
        }

        void acquireWakeLock();
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            disposed = true;
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            const sentinel = wakeLockRef.current;
            wakeLockRef.current = null;
            setScreenAwake(false);
            if (sentinel && !sentinel.released) void sentinel.release();
        };
    }, [sections.length]);

    useEffect(() => {
        if (sections.length === 0) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isTextEntry =
                target?.tagName === "INPUT" ||
                target?.tagName === "TEXTAREA" ||
                target?.tagName === "SELECT" ||
                target?.isContentEditable;

            if (isTextEntry || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

            const key = event.key.toLowerCase();
            if (key === "p") {
                if (safeActiveIndex === 0) return;
                event.preventDefault();
                jumpTo(safeActiveIndex - 1);
            } else if (key === "j") {
                if (safeActiveIndex === sections.length - 1) return;
                event.preventDefault();
                jumpTo(safeActiveIndex + 1);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [safeActiveIndex, sections]);

    if (sections.length === 0) return null;

    return (
        <nav
            aria-label="Delivery manuscript sections"
            className="bsmp-delivery-section-nav bsmp-delivery-print-hide"
        >
            <div className="bsmp-delivery-section-nav-heading">
                <div>
                    <div className="bsmp-delivery-section-nav-title">Sermon sections</div>
                    <div className="bsmp-delivery-section-nav-help" aria-live="polite">
                        {activeSection?.title ?? "Current section"} · {progressLabel} · P Previous · J Next · {screenAwake ? "Screen awake" : "Screen sleep may resume"}
                    </div>
                </div>
                <div
                    className="bsmp-delivery-section-nav-controls"
                    aria-label="Section navigation controls"
                    style={{ display: "flex", gap: 14, marginLeft: "auto" }}
                >
                    <button
                        type="button"
                        onClick={() => jumpTo(safeActiveIndex - 1)}
                        disabled={safeActiveIndex === 0}
                        aria-label="Previous sermon section"
                        title="Previous section (P)"
                        style={{ minWidth: 92, padding: "7px 12px" }}
                    >
                        ← Previous
                    </button>
                    <button
                        type="button"
                        onClick={() => jumpTo(safeActiveIndex + 1)}
                        disabled={safeActiveIndex === sections.length - 1}
                        aria-label="Next sermon section"
                        title="Next section (J)"
                        style={{ minWidth: 92, padding: "7px 12px" }}
                    >
                        Next →
                    </button>
                </div>
            </div>
            <div className="bsmp-delivery-section-nav-links">
                {sections.map((section, index) => {
                    const active = index === safeActiveIndex;
                    return (
                        <Link
                            id={navigationLinkId(section.id)}
                            key={section.id}
                            href={`#${sectionId(section.id)}`}
                            className="bsmp-delivery-section-nav-link"
                            aria-current={active ? "location" : undefined}
                            onClick={() => setActiveIndex(index)}
                            style={active ? { borderColor: "#1d4ed8", boxShadow: "0 0 0 1px #1d4ed8 inset" } : undefined}
                        >
                            <span>{index + 1}.</span>
                            <span>{section.title}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
