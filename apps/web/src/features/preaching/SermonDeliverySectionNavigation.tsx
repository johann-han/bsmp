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
            className="bsmp-delivery-print-hide"
            style={{
                margin: "18px auto 0",
                maxWidth: 820,
                padding: 14,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                background: "#f8fafc",
            }}
        >
            <div style={{ fontWeight: 700 }}>Sermon sections</div>
            <div style={{ marginTop: 4, color: "#6b7280", fontSize: 13 }}>
                Jump directly to each manuscript section during preaching.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {sections.map((section, index) => (
                    <Link
                        key={section.id}
                        href={`#delivery-section-${encodeURIComponent(section.id)}`}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "7px 10px",
                            border: "1px solid #dbe3ee",
                            borderRadius: 8,
                            color: "#1d4ed8",
                            textDecoration: "none",
                            background: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        <span>{index + 1}.</span>
                        <span>{section.title}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
