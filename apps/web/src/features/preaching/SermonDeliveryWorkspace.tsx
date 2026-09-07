"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpositorySermon, SermonManuscriptSection } from "@bsmp/preaching";
import { StudyId } from "@bsmp/study";
import { AppShell } from "@repo/ui";
import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";
import { SermonDeliverySectionNavigation } from "./SermonDeliverySectionNavigation";

interface Props { studyId: string; }

type ReadingSize = "compact" | "comfortable" | "large";

const readingSizeConfig: Record<ReadingSize, { label: string; manuscript: number; heading: number }> = {
    compact: { label: "Compact", manuscript: 20, heading: 17 },
    comfortable: { label: "Comfortable", manuscript: 22, heading: 19 },
    large: { label: "Large", manuscript: 26, heading: 21 },
};

function splitParagraphs(value: string): string[] {
    return value.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

function splitLabeledBlock(value: string): { label: string; body: string } | null {
    const match = value.match(/^(Truth|Text|Explanation|Illustration|Application|Transition)\s*:?\s*(.*)$/is);
    if (!match) return null;
    return { label: match[1], body: match[2].trim() };
}

function workspaceHref(studyId: string, target: string): string {
    const params = new URLSearchParams({ studyId, returnTo: `/preaching/delivery?studyId=${encodeURIComponent(studyId)}` });
    return `/workspace?${params.toString()}#${encodeURIComponent(target)}`;
}

const linkStyle = { color: "#1d4ed8", textDecoration: "none" } as const;

export function SermonDeliveryWorkspace({ studyId }: Props) {
    const router = useRouter();
    const deliveryRootRef = useRef<HTMLDivElement | null>(null);
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [focus, setFocus] = useState<"manuscript" | "notes">("manuscript");
    const [readingSize, setReadingSize] = useState<ReadingSize>("comfortable");
    const [distractionFree, setDistractionFree] = useState(false);

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
    const readingConfig = readingSizeConfig[readingSize];

    useEffect(() => {
        function handleFullscreenChange() {
            const active = document.fullscreenElement === deliveryRootRef.current;
            setDistractionFree(active);
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            const target = event.target as HTMLElement | null;
            if (target?.isContentEditable || target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT") return;
            const key = event.key.toLowerCase();
            if (key === "m") setFocus("manuscript");
            if (key === "n") setFocus("notes");
            if (key === "-") setReadingSize((current) => current === "large" ? "comfortable" : "compact");
            if (key === "=") setReadingSize((current) => current === "compact" ? "comfortable" : "large");
        }
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    async function toggleDistractionFree() {
        setError(null);
        try {
            if (document.fullscreenElement === deliveryRootRef.current) {
                await document.exitFullscreen();
                return;
            }
            if (!deliveryRootRef.current?.requestFullscreen) {
                throw new Error("Distraction-free mode is not supported by this browser.");
            }
            await deliveryRootRef.current.requestFullscreen();
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to change distraction-free mode.");
        }
    }

    if (loading) return <AppShell title="Sermon Delivery"><p>Loading sermon delivery view...</p></AppShell>;
    if (error || !sermon) return <AppShell title="Sermon Delivery"><p style={{ color: "#b91c1c" }}>{error ?? "Sermon delivery could not be loaded."}</p><button type="button" onClick={() => router.push(`/preaching/final?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>← Back to Final Draft</button></AppShell>;

    return (
        <AppShell title="Sermon Delivery">
            <style>{`html { scroll-behavior: smooth; } .bsmp-delivery-root { min-height: 100vh; background: inherit; } .bsmp-delivery-root:fullscreen { overflow-y: auto; background: #f8fafc; padding: 18px 24px 48px; box-sizing: border-box; } .bsmp-delivery-root:fullscreen .bsmp-delivery-print-page { max-width: 1180px; } .bsmp-delivery-root:fullscreen .bsmp-delivery-header { border-radius: 0 0 12px 12px; } .bsmp-delivery-print-page { max-width: 1100px; margin: 0 auto; padding: 16px 0 48px; } .bsmp-delivery-header { position: sticky; top: 0; z-index: 10; background: rgba(255,255,255,0.98); border-bottom: 1px solid #e5e7eb; padding: 12px 0 0; backdrop-filter: blur(6px); } .bsmp-delivery-header-inner { display: flex; justify-content: space-between; gap: 16px; align-items: center; flex-wrap: wrap; } .bsmp-delivery-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; } .bsmp-delivery-size-controls { display: flex; gap: 6px; align-items: center; padding-left: 8px; border-left: 1px solid #e5e7eb; } .bsmp-delivery-size-label { font-size: 12px; color: #6b7280; } .bsmp-delivery-size-button { min-width: 34px; padding: 6px 8px; } .bsmp-delivery-section-nav { width: 100%; margin: 12px 0 0; padding: 10px 14px 12px; border-top: 1px solid #e5e7eb; background: rgba(248,250,252,0.98); box-sizing: border-box; } .bsmp-delivery-section-nav-heading { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; } .bsmp-delivery-section-nav-title { font-weight: 700; } .bsmp-delivery-section-nav-help { color: #6b7280; font-size: 12px; line-height: 1.45; } .bsmp-delivery-section-nav-links { display: flex; gap: 8px; margin-top: 8px; overflow-x: auto; overflow-y: hidden; padding-bottom: 2px; scrollbar-width: thin; } .bsmp-delivery-section-nav-link { display: inline-flex; gap: 6px; align-items: flex-start; flex: 0 0 auto; padding: 7px 9px; border: 1px solid #dbe3ee; border-radius: 8px; color: #1d4ed8; text-decoration: none; background: #fff; font-size: 12px; font-weight: 600; } .bsmp-delivery-manuscript { max-width: 820px; margin: 32px auto 0; color: #1f2937; } .bsmp-delivery-big-idea { margin: 0 0 42px; padding: 18px 20px; border-left: 4px solid #9ca3af; border-radius: 0 10px 10px 0; background: #f3f4f6; font-weight: 700; } .bsmp-delivery-print-section { margin-bottom: 52px; scroll-margin-top: 170px; } .bsmp-delivery-section-heading { letter-spacing: -0.01em; font-weight: 700; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; } .bsmp-delivery-section-content { margin-top: 20px; } .bsmp-delivery-content-paragraph { margin: 0 0 1.15em; } .bsmp-delivery-content-block { margin: 0 0 1.25em; } .bsmp-delivery-content-block-label { display: block; margin-bottom: 0.35em; font-family: Arial, sans-serif; font-size: 0.62em; line-height: 1.2; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; } .bsmp-delivery-content-block-body { display: block; } .bsmp-delivery-trace-links { margin-top: 16px; font-family: Arial, sans-serif; font-size: 12px; color: #6b7280; display: flex; gap: 8px; flex-wrap: wrap; } .bsmp-delivery-trace-links a { padding: 3px 7px; border: 1px solid #e5e7eb; border-radius: 999px; background: #fff; } .bsmp-delivery-notes { max-width: 820px; margin: 32px auto 0; } .bsmp-delivery-notes-content { border: 1px solid #e5e7eb; border-radius: 12px; padding: 22px; background: #fff; } .bsmp-delivery-notes-content p { margin: 0 0 1em; } @media (max-width: 700px) { .bsmp-delivery-print-page { padding-top: 0; } .bsmp-delivery-header { padding-top: 8px; } .bsmp-delivery-toolbar { width: 100%; } .bsmp-delivery-size-controls { margin-left: auto; } .bsmp-delivery-section-nav { margin-top: 8px; padding: 8px 10px; } .bsmp-delivery-section-nav-links { margin-top: 0; gap: 6px; } .bsmp-delivery-section-nav-link { padding: 6px 8px; font-size: 11px; } .bsmp-delivery-manuscript, .bsmp-delivery-notes { margin-top: 22px; padding: 0 12px; } .bsmp-delivery-big-idea { margin-bottom: 30px; padding: 16px; } .bsmp-delivery-print-section { margin-bottom: 42px; } .bsmp-delivery-root:fullscreen { padding: 0 10px 24px; } } @media print { .bsmp-delivery-print-hide { display: none !important; } .bsmp-delivery-print-page { max-width: none !important; margin: 0 !important; padding: 0 !important; } .bsmp-delivery-print-main { max-width: none !important; margin: 0 !important; font-size: 14pt !important; line-height: 1.6 !important; } .bsmp-delivery-manuscript { max-width: none !important; margin: 0 !important; padding: 0 !important; } .bsmp-delivery-print-section { border: 0 !important; box-shadow: none !important; padding: 0 !important; margin: 0 0 24px !important; break-inside: avoid; } .bsmp-delivery-print-notes { max-width: none !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; } .bsmp-delivery-trace-links { display: none !important; } }`}</style>
            <div ref={deliveryRootRef} className="bsmp-delivery-root">
                <div className="bsmp-delivery-print-page">
                    <header className="bsmp-delivery-header bsmp-delivery-print-hide">
                        <div className="bsmp-delivery-header-inner">
                            <div>
                                <div style={{ fontSize: 13, color: "#6b7280" }}>Delivery Mode</div>
                                <h1 style={{ margin: "2px 0" }}>{sermon.title.value}</h1>
                                <div style={{ color: "#6b7280", fontSize: 13 }}>{sermon.passage.toString()} · {wordCount} words · ≈ {estimatedMinutes} min</div>
                            </div>
                            <div className="bsmp-delivery-toolbar">
                                <button type="button" onClick={() => setFocus("manuscript")} disabled={focus === "manuscript"} title="Focus manuscript (M)">Manuscript</button>
                                <button type="button" onClick={() => setFocus("notes")} disabled={focus === "notes"} title="Focus delivery notes (N)">Delivery Notes</button>
                                <div className="bsmp-delivery-size-controls" aria-label="Manuscript text size controls">
                                    <span className="bsmp-delivery-size-label">Text size</span>
                                    <button type="button" className="bsmp-delivery-size-button" onClick={() => setReadingSize((current) => current === "large" ? "comfortable" : "compact")} disabled={readingSize === "compact"} title="Decrease manuscript text size (minus key)" aria-label="Decrease manuscript text size">A−</button>
                                    <button type="button" className="bsmp-delivery-size-button" onClick={() => setReadingSize("comfortable")} disabled={readingSize === "comfortable"} title="Reset manuscript text size" aria-label="Reset manuscript text size">A</button>
                                    <button type="button" className="bsmp-delivery-size-button" onClick={() => setReadingSize((current) => current === "compact" ? "comfortable" : "large")} disabled={readingSize === "large"} title="Increase manuscript text size (equals key)" aria-label="Increase manuscript text size">A+</button>
                                </div>
                                <button type="button" onClick={() => window.print()}>Print / Save PDF</button>
                                <button type="button" onClick={() => void toggleDistractionFree()} title={distractionFree ? "Exit distraction-free mode" : "Enter distraction-free mode"}>{distractionFree ? "Exit Focus" : "Focus Mode"}</button>
                                <button type="button" onClick={() => router.push(`/preaching/final?studyId=${encodeURIComponent(studyId)}`)}>Exit Delivery</button>
                            </div>
                        </div>
                        {focus === "manuscript" && hasTraceableSections && <SermonDeliverySectionNavigation sections={sections} />}
                    </header>

                    {focus === "manuscript" ? (
                        <main className="bsmp-delivery-print-main bsmp-delivery-manuscript" style={{ fontSize: readingConfig.manuscript, lineHeight: 1.82, fontFamily: "Georgia, serif" }}>
                            <h1 style={{ display: "none" }} className="bsmp-delivery-print-title">{sermon.title.value}</h1>
                            {sermon.bigIdea && <p className="bsmp-delivery-big-idea" style={{ fontFamily: "inherit", fontSize: Math.max(16, readingConfig.manuscript - 4), lineHeight: 1.5 }}>{sermon.bigIdea.value}</p>}
                            {hasTraceableSections ? (
                                sections.map((section: SermonManuscriptSection) => {
                                    const outlinePoint = section.outlinePointId ? sermon.outline.find((point) => point.id === section.outlinePointId) : undefined;
                                    const contentBlocks = splitParagraphs(section.content);
                                    return (
                                        <section id={`delivery-section-${encodeURIComponent(section.id)}`} key={section.id} className="bsmp-delivery-print-section">
                                            <h2 className="bsmp-delivery-section-heading" style={{ fontSize: readingConfig.heading, lineHeight: 1.4, margin: 0, fontFamily: "Arial, sans-serif" }}>{section.title}</h2>
                                            <div className="bsmp-delivery-section-content">
                                                {contentBlocks.map((block, index) => {
                                                    const labeled = splitLabeledBlock(block);
                                                    if (!labeled) {
                                                        return <p className="bsmp-delivery-content-paragraph" key={`${index}-${block.slice(0, 16)}`}>{block}</p>;
                                                    }
                                                    return (
                                                        <div className="bsmp-delivery-content-block" key={`${index}-${block.slice(0, 16)}`}>
                                                            <span className="bsmp-delivery-content-block-label">{labeled.label}</span>
                                                            {labeled.body && <span className="bsmp-delivery-content-block-body">{labeled.body}</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {outlinePoint && (
                                                <div className="bsmp-delivery-trace-links bsmp-delivery-print-hide">
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
                                <p className="bsmp-delivery-content-paragraph" style={{ fontFamily: "inherit", fontSize: 18 }}>No manuscript has been written yet. Return to Final Draft to write or generate the manuscript.</p>
                            ) : (
                                paragraphs.map((paragraph, index) => <p className="bsmp-delivery-content-paragraph" key={`${index}-${paragraph.slice(0, 16)}`}>{paragraph}</p>)
                            )}
                        </main>
                    ) : (
                        <aside className="bsmp-delivery-print-notes bsmp-delivery-notes">
                            <h2>Delivery Notes</h2>
                            {sermon.deliveryNotes?.value.trim() ? <div className="bsmp-delivery-notes-content" style={{ fontSize: Math.max(17, readingConfig.manuscript - 3), lineHeight: 1.7 }}>{sermon.deliveryNotes.value}</div> : <p style={{ color: "#6b7280" }}>No delivery notes have been recorded yet. Return to Final Draft to add them.</p>}
                            <p className="bsmp-delivery-print-hide" style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>Tip: press <kbd>M</kbd> for manuscript, <kbd>N</kbd> for delivery notes, <kbd>-</kbd> for smaller text, or <kbd>=</kbd> for larger text.</p>
                        </aside>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
