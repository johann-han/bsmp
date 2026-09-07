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

export function SermonDeliverySectionNavigation({ sections }: Props) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (sections.length === 0) return;

        const elements = sections
            .map((section) => document.getElementById(sectionId(section.id)))
            .filter((element): element is HTMLElement => Boolean(element));

        if (elements.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length === 0) return;
                const index = elements.indexOf(visible[0].target as HTMLElement);
                if (index >= 0) setActiveIndex(index);
            },
            { rootMargin: "-135px 0px -55% 0px", threshold: [0, 0.2, 0.6] },
        );

        elements.forEach((element) => observer.observe(element));
        return () => observer.disconnect();
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
        document.getElementById(sectionId(sections[nextIndex].id))?.scrollIntoView({ behavior: "smooth", block: "start" });
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
                    style={{ display: "flex", gap: 10, marginLeft: "auto" }}
                >
                    <button
                        type="button"
                        onClick={() => jumpTo(safeActiveIndex - 1)}
                        disabled={safeActiveIndex === 0}
                        aria-label="Previous sermon section"
                        title="Previous section"
                    >
                        ← Previous
                    </button>
                    <button
                        type="button"
                        onClick={() => jumpTo(safeActiveIndex + 1)}
                        disabled={safeActiveIndex === sections.length - 1}
                        aria-label="Next sermon section"
                        title="Next section"
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
