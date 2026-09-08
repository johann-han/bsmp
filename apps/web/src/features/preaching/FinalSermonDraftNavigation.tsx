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
        <>
            <style>{`@media (max-width: 700px) {
                .bsmp-final-draft-navigation { padding: 14px !important; }
                .bsmp-final-draft-navigation-list { display: grid !important; grid-template-columns: minmax(0,1fr) !important; gap: 8px !important; }
                .bsmp-final-draft-navigation-item { display: grid !important; grid-template-columns: minmax(0,1fr) auto !important; align-items: stretch !important; gap: 8px !important; }
                .bsmp-final-draft-navigation-link { display: flex; align-items: center; min-width: 0; min-height: 44px; padding: 10px 12px; border: 1px solid #dbe3ee; border-radius: 9px; background: #fff; box-sizing: border-box; overflow-wrap: anywhere; }
                .bsmp-final-draft-navigation-point { display: flex; align-items: center; min-height: 44px; padding: 10px 10px; border: 1px solid #dbe3ee; border-radius: 9px; background: #fff; box-sizing: border-box; white-space: nowrap; }
            }`}</style>
            <nav
                aria-label="Final manuscript sections"
                className="bsmp-print-hide bsmp-final-draft-navigation"
                style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#f8fafc" }}
            >
                <div style={{ fontWeight: 700 }}>Manuscript navigation</div>
                <div style={{ marginTop: 4, color: "#6b7280", fontSize: 13, lineHeight: 1.45 }}>
                    Jump directly to a section while keeping the sermon point and Study foundations nearby.
                </div>
                <div className="bsmp-final-draft-navigation-list" style={{ display: "grid", gap: 8, marginTop: 12 }}>
                    {sections.map((section, index) => {
                        const outlinePoint = section.outlinePointId
                            ? sermon.outline.find((point) => point.id === section.outlinePointId)
                            : undefined;
                        return (
                            <div
                                key={section.id}
                                className="bsmp-final-draft-navigation-item"
                                style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}
                            >
                                <Link
                                    href={`#manuscript-section-${encodeURIComponent(section.id)}`}
                                    className="bsmp-final-draft-navigation-link"
                                    style={{ ...linkStyle, fontWeight: 600 }}
                                >
                                    {index + 1}. {section.title}
                                </Link>
                                {outlinePoint && (
                                    <Link
                                        href={`/preaching/exposition?studyId=${encodeURIComponent(studyId)}&pointId=${encodeURIComponent(outlinePoint.id)}`}
                                        className="bsmp-final-draft-navigation-point"
                                        style={{ ...linkStyle, fontSize: 12 }}
                                    >
                                        Sermon point
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
