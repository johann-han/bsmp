"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpositorySermon, SermonManuscriptSection } from "@bsmp/preaching";
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
            <style>{`html { scroll-behavior: smooth; } .bsmp-delivery-print-page { max-width: 1100px; margin: 0 auto; padding: 16px 0 48px; } .bsmp-delivery-header { position: sticky; top: 0; z-index: 10; background: rgba(255,255,255,0.98); border-bottom: 1px solid #e5e7eb; padding: 12px 0 0; backdrop-filter: blur(6px); } .bsmp-delivery-header-inner { display: flex; justify-content: space-between; gap: 16px; align-items: center; flex-wrap: wrap; } .bsmp-delivery-section-nav { width: 100%; margin: 12px 0 0; padding: 10px 14px 12px; border-top: 1px solid #e5e7eb; background: rgba(248,250,252,0.98); box-sizing: border-box; } .bsmp-delivery-section-nav-heading { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; } .bsmp-delivery-section-nav-title { font-weight: 700; } .bsmp-delivery-section-nav-help { color: #6b7280; font-size: 12px; line-height: 1.45; } .bsmp-delivery-section-nav-links { display: flex; gap: 8px; margin-top: 8px; overflow-x: auto; overflow-y: hidden; padding-bottom: 2px; scrollbar-width: thin; } .bsmp-delivery-section-nav-link { display: inline-flex; gap: 6px; align-items: flex-start; flex: 0 0 auto; padding: 7px 9px; border: 1px solid #dbe3ee; border-radius: 8px; color: #1d4ed8; text-decoration: none; background: #fff; font-size: 12px; font-weight: 600; } @media (max-width: 640px) { .bsmp-delivery-print-page { padding-top: 0; } .bsmp-delivery-header { padding-top: 8px; } .bsmp-delivery-section-nav-heading { display: none; } .bsmp-delivery-section-nav { margin-top: 8px; padding: 8px 10px; } .bsmp-delivery-section-nav-links { margin-top: 0; gap: 6px; } .bsmp-delivery-section-nav-link { padding: 6px 8px; font-size: 11px; } } @media print { .bsmp-delivery-print-hide { display: none !important; } .bsmp-delivery-print-page { max-width: none !important; margin: 0 !important; padding: 0 !important; } .bsmp-delivery-print-main { max-width: none !important; margin: 0 !important; font-size: 14pt !important; line-height: 1.6 !important; } .bsmp-delivery-print-section { border: 0 !important; box-shadow: none !important; padding: 0 !important; margin: 0 0 24px !important; break-inside: avoid; } .bsmp-delivery-print-notes { max-width: none !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; } }`}</style>
            <div className="bsmp-delivery-print-page">
                <header className="bsmp-delivery-header bsmp-delivery-print-hide">
                    <div className="bsmp-delivery-header-inner">
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
                    {focus === "manuscript" && hasTraceableSections && <SermonDeliverySectionNavigation sections={sections} />}
                </header>

                {focus === "manuscript" ? (
                    <main className="bsmp-delivery-print-main" style={{ maxWidth: 820, margin: "28px auto 0", fontSize: 22, lineHeight: 1.8, fontFamily: "Georgia, serif" }}>
                        <h1 style={{ display: "none" }} className="bsmp-delivery-print-title">{sermon.title.value}</h1>
                        {sermon.bigIdea && <p style={{ fontFamily: "inherit", fontSize: 18, fontWeight: 700, lineHeight: 1.5, borderLeft: "4px solid #d1d5db", paddingLeft: 16 }}>{sermon.bigIdea.value}</p>}
                        {hasTraceableSections ? (
                            sections.map((section: SermonManuscriptSection) => {
                                const outlinePoint = section.outlinePointId ? sermon.outline.find((point) => point.id === section.outlinePointId) : undefined;
                                return (
                                    <section id={`delivery-section-${encodeURIComponent(section.id)}`} key={section.id} className="bsmp-delivery-print-section" style={{ marginBottom: 30, scrollMarginTop: 160 }}>
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
