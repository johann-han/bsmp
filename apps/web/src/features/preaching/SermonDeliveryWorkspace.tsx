"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpositorySermon } from "@bsmp/preaching";
import { StudyId } from "@bsmp/study";
import { AppShell } from "@repo/ui";
import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";
import { SermonDeliverySectionNavigation } from "./SermonDeliverySectionNavigation";

interface Props { studyId: string; }

function splitParagraphs(value: string): string[] {
    return value.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

function workspaceHref(studyId: string, target: string): string {
    const params = new URLSearchParams({ studyId, returnTo: `/preaching/delivery?studyId=${encodeURIComponent(studyId)}` });
    return `/workspace?${params.toString()}#${encodeURIComponent(target)}`;
}

const linkStyle = { color: "#1d4ed8", textDecoration: "none" } as const;

export function SermonDeliveryWorkspace({ studyId }: Props) {
    const router = useRouter();
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [focus, setFocus] = useState<"manuscript" | "notes">("manuscript");

    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!studyId) { setError("A study is required to open sermon delivery."); setLoading(false); return; }
            try {
                const repository = new SupabaseExpositorySermonRepository();
                const studyRepository = new SupabaseStudyRepository();
                const study = await studyRepository.find(StudyId.from(studyId));
                const nextSermon = await repository.findByStudyId(studyId);
                if (cancelled) return;
                if (!study) throw new Error("The selected study could not be found.");
                if (!nextSermon) throw new Error("Complete Sermon Preparation before opening delivery mode.");
                setSermon(nextSermon);
            } catch (reason: unknown) {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load sermon delivery.");
            } finally { if (!cancelled) setLoading(false); }
        }
        void load();
        return () => { cancelled = true; };
    }, [studyId]);

    const manuscript = sermon?.manuscript?.value ?? "";
    const paragraphs = useMemo(() => splitParagraphs(manuscript), [manuscript]);
    const sections = sermon?.manuscriptSections ?? [];
    const hasTraceableSections = sections.length > 0;
    const wordCount = manuscript.trim() ? manuscript.trim().split(/\s+/).length : 0;
    const estimatedMinutes = Math.max(0, Math.round((wordCount / 130) * 10) / 10);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            const target = event.target as HTMLElement | null;
            if (target?.isContentEditable || target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT") return;
            if (event.key.toLowerCase() === "m") setFocus("manuscript");
            if (event.key.toLowerCase() === "n") setFocus("notes");
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    if (loading) return <AppShell title="Sermon Delivery"><p>Loading sermon delivery view...</p></AppShell>;
    if (error || !sermon) return <AppShell title="Sermon Delivery"><p style={{ color: "#b91c1c" }}>{error ?? "Sermon delivery could not be loaded."}</p><button type="button" onClick={() => router.push(`/preaching/final?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>← Back to Final Draft</button></AppShell>;

    return (
        <AppShell title="Sermon Delivery">
            <style>{`html { scroll-behavior: smooth; } .bsmp-delivery-layout { display: grid; grid-template-columns: 220px minmax(0, 820px); gap: 28px; align-items: start; justify-content: center; } .bsmp-delivery-section-nav { position: sticky; top: 88px; z-index: 4; width: 220px; max-height: calc(100vh - 108px); overflow-y: auto; overflow-x: hidden; margin: 18px 0 0; padding: 14px; border: 1px solid #e5e7eb; border-radius: 12px; background: rgba(248,250,252,0.97); box-sizing: border-box; } .bsmp-delivery-section-nav-title { font-weight: 700; } .bsmp-delivery-section-nav-help { margin-top: 4px; color: #6b7280; font-size: 12px; line-height: 1.45; } .bsmp-delivery-section-nav-links { display: grid; gap: 6px; margin-top: 10px; } .bsmp-delivery-section-nav-link { display: flex; gap: 6px; align-items: flex-start; padding: 7px 9px; border: 1px solid #dbe3ee; border-radius: 8px; color: #1d4ed8; text-decoration: none; background: #fff; font-size: 12px; font-weight: 600; } .bsmp-delivery-main-column { min-width: 0; } @media (max-width: 860px) { .bsmp-delivery-layout { display: block; } .bsmp-delivery-section-nav { width: auto; max-height: none; margin: 12px 0 18px; overflow-x: auto; overflow-y: hidden; position: sticky; top: 72px; white-space: nowrap; } .bsmp-delivery-section-nav-links { display: flex; gap: 8px; width: max-content; } .bsmp-delivery-section-nav-link { flex: 0 0 auto; } } @media print { .bsmp-delivery-print-hide { display: none !important; } .bsmp-delivery-print-page { max-width: none !important; margin: 0 !important; padding: 0 !important; } .bsmp-delivery-print-main { max-width: none !important; margin: 0 !important; font-size: 14pt !important; line-height: 1.6 !important; } .bsmp-delivery-print-section { border: 0 !important; box-shadow: none !important; padding: 0 !important; margin: 0 0 24px !important; break-inside: avoid; } .bsmp-delivery-print-notes { max-width: none !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; } }`}</style>
            <div className="bsmp-delivery-print-page" style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 0 48px" }}>
                <header className="bsmp-delivery-print-hide" style={{ position: "sticky", top: 0, zIndex: 5, background: "rgba(255,255,255,0.96)", borderBottom: "1px solid #e5e7eb", padding: "12px 0", backdropFilter: "blur(6px)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                            <div style={{ fontSize: 13, color: "#6b7280" }}>Delivery Mode</div>
                            <h1 style={{ margin: "2px 0" }}>{sermon.title.value}</h1>
                            <div style={{ color: "#6b7280", fontSize: 13 }}>{sermon.passage.toString()} · {wordCount} words · ≈ {estimatedMinutes} min</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button type="button" onClick={() => setFocus("manuscript")} disabled={focus === "manuscript"} title="Focus manuscript (M)">Manuscript</button>
                            <button type="button" onClick={() => setFocus("notes")} disabled={focus === "notes"} title="Focus delivery notes (N)">Delivery Notes</button>
                            <button type="button" onClick={() => window.print()}>Print / Save PDF</button>
                            <button type="button" onClick={() => router.push(`/preaching/final?studyId=${encodeURIComponent(studyId)}`)}>Exit Delivery</button>
                        </div>
                    </div>
                </header>

                {focus === "manuscript" ? (
                    <div className={hasTraceableSections ? "bsmp-delivery-layout" : undefined} style={hasTraceableSections ? { marginTop: 18 } : undefined}>
                        {hasTraceableSections && <SermonDeliverySectionNavigation sections={sections} />}
                        <main className="bsmp-delivery-print-main bsmp-delivery-main-column" style={{ maxWidth: 820, margin: hasTraceableSections ? "10px 0 0" : "28px auto 0", fontSize: 22, lineHeight: 1.8, fontFamily: "Georgia, serif" }}>
                            <h1 style={{ display: "none" }} className="bsmp-delivery-print-title">{sermon.title.value}</h1>
                            {sermon.bigIdea && <p style={{ fontFamily: "inherit", fontSize: 18, fontWeight: 700, lineHeight: 1.5, borderLeft: "4px solid #d1d5db", paddingLeft: 16 }}>{sermon.bigIdea.value}</p>}
                            {hasTraceableSections ? (
                                sections.map((section: SermonManuscriptSection) => {
                                    const outlinePoint = section.outlinePointId ? sermon.outline.find((point) => point.id === section.outlinePointId) : undefined;
                                    return (
                                        <section id={`delivery-section-${encodeURIComponent(section.id)}`} key={section.id} className="bsmp-delivery-print-section" style={{ marginBottom: 30, scrollMarginTop: 115 }}>
                                            <h2 style={{ fontSize: 18, lineHeight: 1.4, margin: "0 0 12px", fontFamily: "Arial, sans-serif" }}>{section.title}</h2>
                                            <div style={{ whiteSpace: "pre-wrap" }}>{section.content}</div>
                                            {outlinePoint && (
                                                <div className="bsmp-delivery-print-hide" style={{ marginTop: 10, fontFamily: "Arial, sans-serif", fontSize: 12, color: "#6b7280", display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                    <Link href={`/preaching/exposition?studyId=${encodeURIComponent(studyId)}&pointId=${encodeURIComponent(outlinePoint.id)}`} style={linkStyle}>Review sermon point</Link>
                                                    {outlinePoint.supportingObservationIds.map((id) => <Link key={`obs-${id}`} href={workspaceHref(studyId, `observation-${id}`)} style={linkStyle}>Observation</Link>)}
                                                    {outlinePoint.supportingInterpretationIds.map((id) => <Link key={`int-${id}`} href={workspaceHref(studyId, `interpretation-${id}`)} style={linkStyle}>Interpretation</Link>)}
                                                    {outlinePoint.supportingEvidenceIds.map((id) => <Link key={`evidence-${id}`} href={workspaceHref(studyId, `evidence-${id}`)} style={linkStyle}>Evidence</Link>)}
                                                    {outlinePoint.supportingApplicationIds.map((id) => <Link key={`application-${id}`} href={workspaceHref(studyId, `application-${id}`)} style={linkStyle}>Application</Link>)}
                                                    {outlinePoint.supportingBiblicalTheologyIds.map((id) => <Link key={`bt-${id}`} href={`/biblical-theology?studyId=${encodeURIComponent(studyId)}#biblical-theology-${encodeURIComponent(id)}`} style={linkStyle}>Biblical Theology</Link>)}
                                                </div>
                                            )}
                                        </section>
                                    );
                                })
                            ) : paragraphs.length === 0 ? (
                                <p style={{ fontFamily: "inherit", fontSize: 18 }}>No manuscript has been written yet. Return to Final Draft to write or generate the manuscript.</p>
                            ) : (
                                paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 16)}`}>{paragraph}</p>)
                            )}
                        </main>
                    </div>
                ) : (
                    <aside className="bsmp-delivery-print-notes" style={{ maxWidth: 820, margin: "28px auto 0" }}>
                        <h2>Delivery Notes</h2>
                        {sermon.deliveryNotes?.value.trim() ? <div style={{ whiteSpace: "pre-wrap", fontSize: 18, lineHeight: 1.7, border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fff" }}>{sermon.deliveryNotes.value}</div> : <p style={{ color: "#6b7280" }}>No delivery notes have been recorded yet. Return to Final Draft to add them.</p>}
                        <p className="bsmp-delivery-print-hide" style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>Tip: press <kbd>M</kbd> for manuscript or <kbd>N</kbd> for delivery notes.</p>
                    </aside>
                )}
            </div>
        </AppShell>
    );
}
