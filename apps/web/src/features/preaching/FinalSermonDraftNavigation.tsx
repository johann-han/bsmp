"use client";

import Link from "next/link";
import type { ExpositorySermon, SermonManuscriptSection } from "@bsmp/preaching";

interface Props {
    studyId: string;
    sermon: ExpositorySermon;
    sections: readonly SermonManuscriptSection[];
}

const linkStyle = { color: "#1d4ed8", textDecoration: "none" } as const;

export function FinalSermonDraftNavigation({ studyId, sermon, sections }: Props) {
    if (sections.length === 0) return null;

    return (
        <nav
            aria-label="Final manuscript sections"
            className="bsmp-print-hide"
            style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#f8fafc" }}
        >
            <div style={{ fontWeight: 700 }}>Manuscript navigation</div>
            <div style={{ marginTop: 4, color: "#6b7280", fontSize: 13 }}>
                Jump directly to a section while keeping the sermon point and Study foundations nearby.
            </div>
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {sections.map((section, index) => {
                    const outlinePoint = section.outlinePointId
                        ? sermon.outline.find((point) => point.id === section.outlinePointId)
                        : undefined;
                    return (
                        <div key={section.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            <Link href={`#manuscript-section-${encodeURIComponent(section.id)}`} style={{ ...linkStyle, fontWeight: 600 }}>
                                {index + 1}. {section.title}
                            </Link>
                            {outlinePoint && (
                                <Link href={`/preaching/exposition?studyId=${encodeURIComponent(studyId)}&pointId=${encodeURIComponent(outlinePoint.id)}`} style={{ ...linkStyle, fontSize: 12 }}>
                                    Sermon point
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </nav>
    );
}
