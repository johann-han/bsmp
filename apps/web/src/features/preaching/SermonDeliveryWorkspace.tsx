"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function normalizeTextValue(value: unknown): string {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && "value" in value) {
        return normalizeTextValue((value as { value?: unknown }).value);
    }
    return "";
}

function splitParagraphs(value: string): string[] {
    return value.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

function splitLabeledBlock(value: string): { label: string; body: string } | null {
    const match = value.match(/^(Truth|Text|Explanation|Illustration|Application|Transition)\s*:?\s*(.*)$/is);
    const label = match?.[1];
    if (!label) return null;
    return { label, body: match[2]?.trim() ?? "" };
}

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
            if (!studyId) {
                setError("A study is required to open sermon delivery.");
                setLoading(false);
                return;
            }
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
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void load();
        return () => { cancelled = true; };
    }, [studyId]);

    const manuscript = normalizeTextValue(sermon?.manuscript?.value);
    const paragraphs = useMemo(() => splitParagraphs(manuscript), [manuscript]);
    const sections = sermon?.manuscriptSections ?? [];
    const hasTraceableSections = sections.length > 0;
    const wordCount = manuscript.trim() ? manuscript.trim().split(/\s+/).length : 0;
    const estimatedMinutes = Math.max(0, Math.round((wordCount / 130) * 10) / 10);
    const readingConfig = readingSizeConfig[readingSize];
    const bigIdea = normalizeTextValue(sermon?.bigIdea?.value) || "No Big Idea has been prepared.";

    const persistRecoveryState = useCallback((patch: { focus?: "manuscript" | "notes"; readingSize?: ReadingSize }) => {
        try {
            const key = `bsmp.delivery.recovery.v1:${studyId}`;
            const raw = window.localStorage.getItem(key);
            const existing = raw ? JSON.parse(raw) as Record<string, unknown> : {};
            window.localStorage.setItem(key, JSON.stringify({
                ...existing,
                sectionIndex: typeof existing.sectionIndex === "number" ? existing.sectionIndex : 0,
                focus: patch.focus ?? (existing.focus === "notes" ? "notes" : "manuscript"),
                readingSize: patch.readingSize ?? (existing.readingSize === "compact" || existing.readingSize === "large" ? existing.readingSize : "comfortable"),
                focusModeRequested: existing.focusModeRequested === true,
            }));
        } catch {
            // Recovery is a convenience; presentation controls must work without local storage.
        }
    }, [studyId]);

    const changeFocus = useCallback((nextFocus: "manuscript" | "notes") => {
        setFocus(nextFocus);
        persistRecoveryState({ focus: nextFocus });
    }, [persistRecoveryState]);

    const changeReadingSize = useCallback((nextSize: ReadingSize) => {
        setReadingSize(nextSize);
        persistRecoveryState({ readingSize: nextSize });
    }, [persistRecoveryState]);

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
            if (key === "m") changeFocus("manuscript");
            if (key === "n") changeFocus("notes");
            if (key === "-") changeReadingSize(readingSize === "large" ? "comfortable" : "compact");
            if (key === "=") changeReadingSize(readingSize === "compact" ? "comfortable" : "large");
        }
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [changeFocus, changeReadingSize, readingSize]);

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
            <style>{`
                html { scroll-behavior: smooth; }
                .bsmp-delivery-root { min-height: 100vh; background: inherit; }
                .bsmp-delivery-root:fullscreen { overflow-y: auto; background: #f8fafc; padding: 0 24px 48px; box-sizing: border-box; }
                .bsmp-delivery-root:fullscreen .bsmp-delivery-print-page { max-width: 1180px; }
                .bsmp-delivery-root:fullscreen .bsmp-delivery-header { border-radius: 0 0 12px 12px; }
                .bsmp-delivery-root:fullscreen .bsmp-delivery-trace-links { display: none !important; }
                .bsmp-delivery-print-page { max-width: 1100px; margin: 0 auto; padding: 16px 0 48px; }
                .bsmp-delivery-header { position: sticky; top: 0; z-index: 10; background: rgba(255,255,255,0.98); border-bottom: 1px solid #e5e7eb; padding: 12px 0 0; backdrop-filter: blur(6px); }
                .bsmp-delivery-header-inner { display: flex; justify-content: space-between; gap: 16px; align-items: center; flex-wrap: wrap; }
                .bsmp-delivery-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
                .bsmp-delivery-toolbar > button { min-height: 38px; padding: 8px 11px; }
                .bsmp-delivery-size-controls { display: flex; gap: 6px; align-items: center; padding-left: 8px; border-left: 1px solid #e5e7eb; }
                .bsmp-delivery-size-label { font-size: 12px; color: #6b7280; }
                .bsmp-delivery-size-button { min-width: 34px; padding: 6px 8px; }
                .bsmp-delivery-section-nav { width: 100%; margin: 12px 0 0; padding: 10px 14px 12px; border-top: 1px solid #e5e7eb; background: rgba(248,250,252,0.98); box-sizing: border-box; }
                .bsmp-delivery-section-nav-title { font-weight: 700; }
                .bsmp-delivery-manuscript { max-width: 820px; margin: 32px auto 0; color: #1f2937; }
                .bsmp-delivery-big-idea { margin: 0 0 42px; padding: 18px 20px; border-left: 4px solid #9ca3af; border-radius: 0 10px 10px 0; background: #f3f4f6; font-weight: 700; }
                .bsmp-delivery-print-section { margin-bottom: 52px; scroll-margin-top: 170px; }
                .bsmp-delivery-section-heading { letter-spacing: -0.01em; font-weight: 700; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; }
                .bsmp-delivery-section-content { margin-top: 20px; }
                .bsmp-delivery-content-paragraph { margin: 0 0 1.15em; }
                .bsmp-delivery-content-block { margin: 0 0 1.25em; }
                .bsmp-delivery-content-block-label { display: block; margin-bottom: 0.35em; font-family: Arial, sans-serif; font-size: 0.62em; line-height: 1.2; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; }
                .bsmp-delivery-content-block-body { display: block; }
                .bsmp-delivery-notes { max-width: 820px; margin: 32px auto 0; }
                .bsmp-delivery-notes-content { border: 1px solid #e5e7eb; border-radius: 12px; padding: 22px; background: #fff; }
                .bsmp-delivery-notes-content p { margin: 0 0 1em; }
                @media (max-width:700px) {
                    .bsmp-delivery-print-page { padding: 0 0 30px; }
                    .bsmp-delivery-header { padding: 8px 0 0; }
                    .bsmp-delivery-header-inner { display: block; }
                    .bsmp-delivery-header-inner > div:first-child { padding: 0 12px 8px; min-width: 0; }
                    .bsmp-delivery-header-inner h1 { font-size: 20px !important; line-height: 1.2; margin: 0 0 3px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .bsmp-delivery-header-inner > div:first-child > div:last-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .bsmp-delivery-toolbar { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 6px; padding: 0 12px 8px; }
                    .bsmp-delivery-toolbar > button { width: 100%; min-height: 44px; padding: 8px 10px; }
                    .bsmp-delivery-size-controls { grid-column: 1 / -1; display: grid; grid-template-columns: auto repeat(3,minmax(0,1fr)); gap: 6px; width: 100%; padding: 6px 0 0; border-left: 0; border-top: 1px solid #e5e7eb; }
                    .bsmp-delivery-size-label { display: flex; align-items: center; justify-content: center; font-size: 11px; }
                    .bsmp-delivery-size-button { min-width: 0; min-height: 42px; width: 100%; }
                    .bsmp-delivery-section-nav { margin-top: 0; padding: 0 0 8px; border-top: 1px solid #e5e7eb; }
                    .bsmp-delivery-manuscript, .bsmp-delivery-notes { margin-top: 18px; padding: 0 14px; }
                    .bsmp-delivery-manuscript { max-width: none; }
                    .bsmp-delivery-big-idea { margin-bottom: 28px; padding: 14px 15px; line-height: 1.45; }
                    .bsmp-delivery-print-section { margin-bottom: 38px; scroll-margin-top: 220px; }
                    .bsmp-delivery-section-heading { font-size: 18px !important; line-height: 1.3; padding-bottom: 8px; }
                    .bsmp-delivery-section-content { margin-top: 16px; }
                    .bsmp-delivery-notes-content { padding: 16px; border-radius: 10px; }
                    .bsmp-delivery-root:fullscreen { padding: 0 0 20px; }
                    .bsmp-delivery-root:fullscreen .bsmp-delivery-print-page { max-width: none; }
                    .bsmp-delivery-root:fullscreen .bsmp-delivery-header { border-radius: 0; }
                }
                @media print {
                    .bsmp-delivery-print-hide { display: none !important; }
                    .bsmp-delivery-print-page { max-width: none !important; margin: 0 !important; padding: 0 !important; }
                    .bsmp-delivery-print-main { max-width: none !important; margin: 0 !important; font-size: 14pt !important; line-height: 1.6 !important; }
                    .bsmp-delivery-manuscript { max-width: none !important; margin: 0 !important; padding: 0 !important; }
                    .bsmp-delivery-print-section { border: 0 !important; box-shadow: none !important; padding: 0 !important; margin: 0 0 24px !important; break-inside: avoid; }
                    .bsmp-delivery-notes { max-width: none !important; margin: 0 !important; }
                    .bsmp-delivery-notes-content { border: 0 !important; padding: 0 !important; }
                }
            `}</style>
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
                                <button type="button" onClick={() => changeFocus("manuscript")} disabled={focus === "manuscript"} title="Focus manuscript (M)">Manuscript</button>
                                <button type="button" onClick={() => changeFocus("notes")} disabled={focus === "notes"} title="Focus delivery notes (N)">Delivery Notes</button>
                                <div className="bsmp-delivery-size-controls" aria-label="Manuscript text size controls">
                                    <span className="bsmp-delivery-size-label">Text size</span>
                                    <button type="button" className="bsmp-delivery-size-button" onClick={() => changeReadingSize(readingSize === "large" ? "comfortable" : "compact")} disabled={readingSize === "compact"} title="Decrease text size">A−</button>
                                    <button type="button" className="bsmp-delivery-size-button" onClick={() => changeReadingSize("comfortable")} disabled={readingSize === "comfortable"} title="Reset text size">A</button>
                                    <button type="button" className="bsmp-delivery-size-button" onClick={() => changeReadingSize(readingSize === "compact" ? "comfortable" : "large")} disabled={readingSize === "large"} title="Increase text size">A+</button>
                                </div>
                                <button type="button" onClick={() => window.print()}>Print / Save PDF</button>
                                <button type="button" onClick={() => router.push(`/preaching/final?studyId=${encodeURIComponent(studyId)}`)}>Exit Delivery</button>
                                <button type="button" onClick={toggleDistractionFree} title={distractionFree ? "Exit distraction-free mode" : "Enter distraction-free mode"}>{distractionFree ? "Exit Focus" : "Focus Mode"}</button>
                            </div>
                        </div>
                        <SermonDeliverySectionNavigation sections={sections} />
                    </header>

                    {focus === "manuscript" ? (
                        <main className="bsmp-delivery-print-main">
                            <div className="bsmp-delivery-manuscript">
                                <div className="bsmp-delivery-big-idea">Big Idea: {bigIdea}</div>
                                {hasTraceableSections ? sections.map((section: SermonManuscriptSection) => (
                                    <section key={section.id} id={`delivery-section-${encodeURIComponent(section.id)}`} className="bsmp-delivery-print-section">
                                        <h2 className="bsmp-delivery-section-heading" style={{ fontSize: `${readingConfig.heading}px` }}>{section.title}</h2>
                                        <div className="bsmp-delivery-section-content" style={{ fontSize: `${readingConfig.manuscript}px`, lineHeight: 1.65 }}>
                                            {splitParagraphs(normalizeTextValue(section.content)).map((paragraph, index) => {
                                                const labeled = splitLabeledBlock(paragraph);
                                                return labeled ? <div className="bsmp-delivery-content-block" key={`${section.id}-${index}`}><span className="bsmp-delivery-content-block-label">{labeled.label}</span><span className="bsmp-delivery-content-block-body">{labeled.body}</span></div> : <p className="bsmp-delivery-content-paragraph" key={`${section.id}-${index}`}>{paragraph}</p>;
                                            })}
                                        </div>
                                    </section>
                                )) : (
                                    <section className="bsmp-delivery-print-section">
                                        {paragraphs.map((paragraph, index) => {
                                            const labeled = splitLabeledBlock(paragraph);
                                            return labeled ? <div className="bsmp-delivery-content-block" key={`manuscript-${index}`}><span className="bsmp-delivery-content-block-label">{labeled.label}</span><span className="bsmp-delivery-content-block-body">{labeled.body}</span></div> : <p className="bsmp-delivery-content-paragraph" key={`manuscript-${index}`}>{paragraph}</p>;
                                        })}
                                    </section>
                                )}
                            </div>
                        </main>
                    ) : (
                        <main className="bsmp-delivery-print-main">
                            <div className="bsmp-delivery-notes">
                                <h2>Delivery Notes</h2>
                                <div className="bsmp-delivery-notes-content" style={{ fontSize: `${readingConfig.manuscript}px`, lineHeight: 1.65 }}>
                                    {splitParagraphs(normalizeTextValue(sermon.deliveryNotes?.value) || "No delivery notes have been prepared.").map((paragraph, index) => <p key={`note-${index}`}>{paragraph}</p>)}
                                </div>
                            </div>
                        </main>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
