"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SermonManuscriptSection } from "@bsmp/preaching";

interface Props {
    sections: readonly SermonManuscriptSection[];
}

function sectionId(id: string): string {
    return `delivery-section-${encodeURIComponent(id)}`;
}

const DELIVERY_NAV_OFFSET = 150;

export function SermonDeliverySectionNavigation({ sections }: Props) {
    const [activeIndex, setActiveIndex] = useState(0);

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
        const nextIndex = Math.max(0, Math.min(index, sections.length - 1));
        setActiveIndex(nextIndex);
        document.getElementById(sectionId(sections[nextIndex].id))?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    if (sections.length === 0) return null;

    return (
        <nav
            aria-label="Delivery manuscript sections"
            className="bsmp-delivery-section-nav bsmp-delivery-print-hide"
        >
            <div className="bsmp-delivery-section-nav-heading">
                <div>
                    <div className="bsmp-delivery-section-nav-title">Sermon sections</div>
                    <div className="bsmp-delivery-section-nav-help">
                        {activeSection?.title ?? "Current section"} · {progressLabel}
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
                        title="Previous section"
                        style={{ minWidth: 92, padding: "7px 12px" }}
                    >
                        ← Previous
                    </button>
                    <button
                        type="button"
                        onClick={() => jumpTo(safeActiveIndex + 1)}
                        disabled={safeActiveIndex === sections.length - 1}
                        aria-label="Next sermon section"
                        title="Next section"
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
