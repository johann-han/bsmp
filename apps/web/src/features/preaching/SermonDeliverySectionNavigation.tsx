"use client";

import Link from "next/link";
import type { SermonManuscriptSection } from "@bsmp/preaching";

interface Props {
    sections: readonly SermonManuscriptSection[];
}

export function SermonDeliverySectionNavigation({ sections }: Props) {
    if (sections.length === 0) return null;

    return (
        <nav
            aria-label="Delivery manuscript sections"
            className="bsmp-delivery-section-nav bsmp-delivery-print-hide"
        >
            <div className="bsmp-delivery-section-nav-heading">
                <div className="bsmp-delivery-section-nav-title">Sermon sections</div>
                <div className="bsmp-delivery-section-nav-help">
                    Jump directly to each manuscript section during preaching.
                </div>
            </div>
            <div className="bsmp-delivery-section-nav-links">
                {sections.map((section, index) => (
                    <Link
                        key={section.id}
                        href={`#delivery-section-${encodeURIComponent(section.id)}`}
                        className="bsmp-delivery-section-nav-link"
                    >
                        <span>{index + 1}.</span>
                        <span>{section.title}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
