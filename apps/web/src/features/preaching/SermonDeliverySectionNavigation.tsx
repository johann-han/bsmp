"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SermonManuscriptSection } from "@bsmp/preaching";

interface Props { sections: readonly SermonManuscriptSection[]; }
interface ScreenWakeLockSentinelLike extends EventTarget { released: boolean; release(): Promise<void>; }
interface DeliveryPlaceMarker { mode: "line"; sectionId: string; lineBottomOffset: number; savedAt: number; }
interface DeliveryRecoveryState {
    sectionIndex: number;
    focus: "manuscript" | "notes";
    readingSize: "compact" | "comfortable" | "large";
    focusModeRequested: boolean;
    placeMarker?: DeliveryPlaceMarker;
}

function sectionId(id: string): string { return `delivery-section-${encodeURIComponent(id)}`; }
function navigationLinkId(id: string): string { return `delivery-nav-${encodeURIComponent(id)}`; }
const DELIVERY_NAV_OFFSET = 150;
const DELIVERY_RECOVERY_PREFIX = "bsmp.delivery.recovery.v1";

function recoveryKey(): string {
    const studyId = new URLSearchParams(window.location.search).get("studyId") ?? "unknown";
    return `${DELIVERY_RECOVERY_PREFIX}:${studyId}`;
}

function parsePlaceMarker(value: unknown): DeliveryPlaceMarker | undefined {
    if (!value || typeof value !== "object") return undefined;
    const marker = value as Partial<DeliveryPlaceMarker>;
    if (marker.mode !== "line" || typeof marker.sectionId !== "string" || typeof marker.lineBottomOffset !== "number" || typeof marker.savedAt !== "number") return undefined;
    return {
        mode: "line",
        sectionId: marker.sectionId,
        lineBottomOffset: Math.max(0, Number.isFinite(marker.lineBottomOffset) ? marker.lineBottomOffset : 0),
        savedAt: marker.savedAt,
    };
}

function readRecoveryState(sectionCount: number): DeliveryRecoveryState | null {
    try {
        const raw = window.localStorage.getItem(recoveryKey());
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<DeliveryRecoveryState>;
        const state: DeliveryRecoveryState = {
            sectionIndex: typeof parsed.sectionIndex === "number" ? Math.max(0, Math.min(Math.floor(parsed.sectionIndex), Math.max(0, sectionCount - 1))) : 0,
            focus: parsed.focus === "notes" ? "notes" : "manuscript",
            readingSize: parsed.readingSize === "compact" || parsed.readingSize === "large" ? parsed.readingSize : "comfortable",
            focusModeRequested: parsed.focusModeRequested === true,
        };
        const marker = parsePlaceMarker(parsed.placeMarker);
        if (marker) state.placeMarker = marker;
        return state;
    } catch { return null; }
}

function writeRecoveryState(patch: Partial<DeliveryRecoveryState>, sectionCount: number) {
    try {
        const existing = readRecoveryState(sectionCount) ?? { sectionIndex: 0, focus: "manuscript" as const, readingSize: "comfortable" as const, focusModeRequested: false };
        window.localStorage.setItem(recoveryKey(), JSON.stringify({ ...existing, ...patch }));
    } catch { /* Recovery is a convenience; delivery must work without local storage. */ }
}

function getDeliveryRoot(): HTMLElement | null {
    return document.querySelector<HTMLElement>(".bsmp-delivery-root");
}

function getFullscreenScrollContainer(): HTMLElement | null {
    return document.fullscreenElement instanceof HTMLElement ? document.fullscreenElement : null;
}

function getScrollTop(): number {
    return getFullscreenScrollContainer()?.scrollTop ?? window.scrollY;
}

function getSectionDocumentTop(element: HTMLElement): number {
    const fullscreenRoot = getFullscreenScrollContainer();
    if (fullscreenRoot) {
        const rootRect = fullscreenRoot.getBoundingClientRect();
        return element.getBoundingClientRect().top - rootRect.top + fullscreenRoot.scrollTop;
    }
    return element.getBoundingClientRect().top + window.scrollY;
}

function scrollToDocumentPosition(targetTop: number) {
    const fullscreenRoot = getFullscreenScrollContainer();
    if (fullscreenRoot) {
        const maxScroll = Math.max(0, fullscreenRoot.scrollHeight - fullscreenRoot.clientHeight);
        fullscreenRoot.scrollTo({ top: Math.min(Math.max(0, targetTop), maxScroll), behavior: "smooth" });
        return;
    }
    const documentElement = document.documentElement;
    const maxScroll = Math.max(0, documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(Math.max(0, targetTop), maxScroll), behavior: "smooth" });
}

function dispatchShortcut(key: string) { window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })); }

function activateFocusMode() {
    const focusButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button[title]"))
        .find((button) => {
            const title = button.getAttribute("title") ?? "";
            return title === "Enter distraction-free mode" || title === "Exit distraction-free mode";
        });
    focusButton?.click();
}

export function SermonDeliverySectionNavigation({ sections }: Props) {
    const [activeIndex, setActiveIndex] = useState(0);
    const wakeLockRef = useRef<ScreenWakeLockSentinelLike | null>(null);
    const [screenAwake, setScreenAwake] = useState(false);
    const [focusModeActive, setFocusModeActive] = useState(false);
    const [focusRecoveryPending, setFocusRecoveryPending] = useState(false);
    const [controlsOpen, setControlsOpen] = useState(false);
    const [recoveryAvailable, setRecoveryAvailable] = useState(false);
    const [placeMarker, setPlaceMarker] = useState<DeliveryPlaceMarker | null>(null);
    const [markerSectionElement, setMarkerSectionElement] = useState<HTMLElement | null>(null);

    const safeActiveIndex = Math.min(activeIndex, Math.max(0, sections.length - 1));
    const activeSection = sections[safeActiveIndex];
    const progressLabel = useMemo(() => `${safeActiveIndex + 1} of ${sections.length}`, [safeActiveIndex, sections.length]);

    useEffect(() => {
        if (sections.length === 0) return;
        const recovery = readRecoveryState(sections.length);
        setRecoveryAvailable(Boolean(recovery));
        setPlaceMarker(recovery?.placeMarker ?? null);
        setFocusRecoveryPending(recovery?.focusModeRequested === true && document.fullscreenElement === null);
        if (!recovery) return;
        const target = sections[recovery.sectionIndex];
        if (target && !window.location.hash) {
            const targetId = sectionId(target.id);
            window.history.replaceState(null, "", `#${targetId}`);
            window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: "auto", block: "start" }), 0);
        }
        setActiveIndex(recovery.sectionIndex);
        window.setTimeout(() => {
            if (recovery.focus === "notes") dispatchShortcut("n");
            if (recovery.readingSize === "large") dispatchShortcut("=");
            else if (recovery.readingSize === "compact") dispatchShortcut("-");
        }, 0);
    }, [sections]);

    useEffect(() => {
        if (!placeMarker) { setMarkerSectionElement(null); return; }
        setMarkerSectionElement(document.getElementById(sectionId(placeMarker.sectionId)));
    }, [placeMarker, sections]);

    useEffect(() => {
        if (sections.length === 0) return;
        let frame = 0;
        const updateActiveSection = () => {
            const viewportPosition = getScrollTop() + DELIVERY_NAV_OFFSET;
            let nextIndex = 0;
            sections.forEach((section, index) => {
                const element = document.getElementById(sectionId(section.id));
                if (element && getSectionDocumentTop(element) <= viewportPosition) nextIndex = index;
            });
            setActiveIndex((current) => current === nextIndex ? current : nextIndex);
            writeRecoveryState({ sectionIndex: nextIndex }, sections.length);
            setRecoveryAvailable(true);
            frame = 0;
        };
        const scheduleUpdate = () => { if (!frame) frame = window.requestAnimationFrame(updateActiveSection); };
        updateActiveSection();
        const fullscreenRoot = getFullscreenScrollContainer();
        fullscreenRoot?.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate, { passive: true });
        document.addEventListener("fullscreenchange", scheduleUpdate);
        return () => {
            fullscreenRoot?.removeEventListener("scroll", scheduleUpdate);
            window.removeEventListener("scroll", scheduleUpdate);
            window.removeEventListener("resize", scheduleUpdate);
            document.removeEventListener("fullscreenchange", scheduleUpdate);
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, [focusModeActive, sections]);

    useEffect(() => {
        if (sections.length === 0) return;
        const handleManuscriptLineClick = (event: MouseEvent) => {
            const target = event.target instanceof HTMLElement ? event.target : event.target instanceof Node ? event.target.parentElement : null;
            if (!target) return;
            if (target.closest("button,a,input,textarea,select,[role=button],summary")) return;
            const content = target.closest<HTMLElement>(".bsmp-delivery-section-content");
            const sectionElement = target.closest<HTMLElement>(".bsmp-delivery-print-section");
            if (!content || !sectionElement) return;
            const domSectionIndex = sections.findIndex((section) => sectionId(section.id) === sectionElement.id);
            if (domSectionIndex < 0) return;

            const docWithCaret = document as Document & {
                caretRangeFromPoint?: (x: number, y: number) => Range | null;
                caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
            };
            let range = docWithCaret.caretRangeFromPoint?.(event.clientX, event.clientY) ?? null;
            if (!range && docWithCaret.caretPositionFromPoint) {
                const position = docWithCaret.caretPositionFromPoint(event.clientX, event.clientY);
                if (position) {
                    range = document.createRange();
                    range.setStart(position.offsetNode, position.offset);
                    range.collapse(true);
                }
            }
            let lineBottom: number | null = null;
            if (range) {
                const rects = Array.from(range.getClientRects());
                const matchingRect = rects.find((rect) => event.clientY >= rect.top && event.clientY <= rect.bottom + 1);
                lineBottom = (matchingRect ?? range.getBoundingClientRect()).bottom;
            }
            if (lineBottom === null || !Number.isFinite(lineBottom)) {
                const rect = target.getBoundingClientRect();
                const style = window.getComputedStyle(target);
                const fontSize = Number.parseFloat(style.fontSize);
                const rawLineHeight = Number.parseFloat(style.lineHeight);
                const lineHeight = Number.isFinite(rawLineHeight) && rawLineHeight > 0 ? rawLineHeight : Number.isFinite(fontSize) && fontSize > 0 ? fontSize * 1.45 : 24;
                const lineIndex = Math.max(0, Math.floor((event.clientY - rect.top) / lineHeight));
                lineBottom = Math.min(rect.bottom, rect.top + (lineIndex + 1) * lineHeight);
            }

            const section = sections[domSectionIndex];
            if (!section) return;
            const sectionRect = sectionElement.getBoundingClientRect();
            const lineBottomOffset = Math.max(0, Math.round(lineBottom - sectionRect.top));
            const marker: DeliveryPlaceMarker = {
                mode: "line",
                sectionId: section.id,
                lineBottomOffset,
                savedAt: Date.now(),
            };
            setPlaceMarker(marker);
            setMarkerSectionElement(sectionElement);
            setActiveIndex(domSectionIndex);
            writeRecoveryState({ placeMarker: marker, sectionIndex: domSectionIndex }, sections.length);
            setRecoveryAvailable(true);
        };
        document.addEventListener("click", handleManuscriptLineClick);
        return () => document.removeEventListener("click", handleManuscriptLineClick);
    }, [sections]);

    useEffect(() => {
        if (sections.length === 0) return;
        const header = getDeliveryRoot()?.querySelector<HTMLElement>(".bsmp-delivery-header");
        if (!header) return;
        const handleHeaderMouseLeave = () => setControlsOpen(false);
        header.addEventListener("mouseleave", handleHeaderMouseLeave);
        return () => header.removeEventListener("mouseleave", handleHeaderMouseLeave);
    }, [sections.length]);

    function jumpTo(index: number) {
        if (sections.length === 0) return;
        const nextIndex = Math.max(0, Math.min(index, sections.length - 1));
        const section = sections[nextIndex];
        if (!section) return;
        const target = document.getElementById(sectionId(section.id));
        if (!target) return;
        setActiveIndex(nextIndex);
        writeRecoveryState({ sectionIndex: nextIndex }, sections.length);
        setRecoveryAvailable(true);
        const targetId = sectionId(section.id);
        if (window.location.hash !== `#${targetId}`) window.history.replaceState(null, "", `#${targetId}`);
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function returnToMyPlace() {
        if (!placeMarker || placeMarker.mode !== "line" || sections.length === 0) return;
        const nextIndex = sections.findIndex((section) => section.id === placeMarker.sectionId);
        if (nextIndex < 0) return;
        const element = document.getElementById(sectionId(placeMarker.sectionId));
        if (!element) return;
        const lineViewportTop = element.getBoundingClientRect().top + placeMarker.lineBottomOffset;
        const fullscreenRoot = getFullscreenScrollContainer();
        const rootRect = fullscreenRoot?.getBoundingClientRect();
        const header = getDeliveryRoot()?.querySelector<HTMLElement>(".bsmp-delivery-header");
        const desiredViewportTop = fullscreenRoot ? (header?.getBoundingClientRect().bottom ?? (rootRect?.top ?? 0) + 120) + 20 - (rootRect?.top ?? 0) : (header?.getBoundingClientRect().bottom ?? 120) + 20;
        const currentScrollTop = getScrollTop();
        const targetScrollTop = Math.max(0, currentScrollTop + lineViewportTop - desiredViewportTop);
        setActiveIndex(nextIndex);
        writeRecoveryState({ sectionIndex: nextIndex }, sections.length);
        setRecoveryAvailable(true);
        const section = sections[nextIndex];
        if (!section) return;
        const targetId = sectionId(section.id);
        if (window.location.hash !== `#${targetId}`) window.history.replaceState(null, "", `#${targetId}`);
        scrollToDocumentPosition(targetScrollTop);
    }

    function clearMyPlace() {
        setPlaceMarker(null);
        setMarkerSectionElement(null);
        try {
            const recovery = readRecoveryState(sections.length);
            if (!recovery) return;
            const { placeMarker: _removed, ...withoutMarker } = recovery;
            window.localStorage.setItem(recoveryKey(), JSON.stringify(withoutMarker));
            setRecoveryAvailable(true);
        } catch { /* Clearing the marker never blocks delivery. */ }
    }

    useEffect(() => {
        if (sections.length === 0) return;
        const targetId = window.location.hash.slice(1);
        if (!targetId) return;
        const hashIndex = sections.findIndex((section) => sectionId(section.id) === targetId);
        if (hashIndex >= 0) { setActiveIndex(hashIndex); writeRecoveryState({ sectionIndex: hashIndex }, sections.length); setRecoveryAvailable(true); }
    }, [sections]);

    useEffect(() => {
        if (sections.length === 0) return;
        function handleHashChange() {
            const targetId = window.location.hash.slice(1);
            const nextIndex = sections.findIndex((section) => sectionId(section.id) === targetId);
            if (nextIndex >= 0) { setActiveIndex(nextIndex); writeRecoveryState({ sectionIndex: nextIndex }, sections.length); setRecoveryAvailable(true); }
        }
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, [sections]);

    useEffect(() => {
        if (sections.length === 0) return;
        const section = sections[safeActiveIndex];
        if (!section) return;
        const activeLink = document.getElementById(navigationLinkId(section.id));
        activeLink?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, [safeActiveIndex, sections]);

    useEffect(() => {
        if (sections.length === 0) return;
        const browserNavigator = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<ScreenWakeLockSentinelLike> } };
        if (!browserNavigator.wakeLock) return;
        let disposed = false;
        async function acquireWakeLock() {
            if (disposed || document.visibilityState !== "visible" || wakeLockRef.current) return;
            try {
                const sentinel = await browserNavigator.wakeLock!.request("screen");
                if (disposed) { await sentinel.release(); return; }
                wakeLockRef.current = sentinel;
                setScreenAwake(true);
                sentinel.addEventListener("release", () => { if (wakeLockRef.current === sentinel) wakeLockRef.current = null; setScreenAwake(false); });
            } catch { setScreenAwake(false); }
        }
        function handleVisibilityChange() { if (document.visibilityState === "visible") void acquireWakeLock(); }
        void acquireWakeLock();
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => { disposed = true; document.removeEventListener("visibilitychange", handleVisibilityChange); const sentinel = wakeLockRef.current; wakeLockRef.current = null; setScreenAwake(false); if (sentinel && !sentinel.released) void sentinel.release(); };
    }, [sections.length]);

    useEffect(() => {
        if (sections.length === 0) return;
        const handleFullscreenChange = () => {
            const active = document.fullscreenElement !== null;
            setFocusModeActive(active);
            setFocusRecoveryPending(false);
            writeRecoveryState({ focusModeRequested: active }, sections.length);
            setRecoveryAvailable(true);
        };
        setFocusModeActive(document.fullscreenElement !== null);
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isTextEntry = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT" || target?.isContentEditable;
            if (isTextEntry || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            const key = event.key.toLowerCase();
            if (key === "p") { if (safeActiveIndex === 0) return; event.preventDefault(); jumpTo(safeActiveIndex - 1); return; }
            if (key === "j") { if (safeActiveIndex === sections.length - 1) return; event.preventDefault(); jumpTo(safeActiveIndex + 1); return; }
            if (key === "r") { if (!placeMarker) return; event.preventDefault(); returnToMyPlace(); return; }
            if (key === "m" || key === "n") { writeRecoveryState({ focus: key === "n" ? "notes" : "manuscript" }, sections.length); setRecoveryAvailable(true); return; }
            if (key === "-" || key === "=") {
                const current = readRecoveryState(sections.length)?.readingSize ?? "comfortable";
                const next = key === "=" ? current === "compact" ? "comfortable" : "large" : current === "large" ? "comfortable" : "compact";
                writeRecoveryState({ readingSize: next }, sections.length);
                setRecoveryAvailable(true);
            }
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        window.addEventListener("keydown", handleKeyDown);
        return () => { document.removeEventListener("fullscreenchange", handleFullscreenChange); window.removeEventListener("keydown", handleKeyDown); };
    }, [placeMarker, safeActiveIndex, sections.length]);

    if (sections.length === 0) return null;
    const currentRecovery = readRecoveryState(sections.length);
    const recoveryFocusLabel = currentRecovery?.focus === "notes" ? "Notes" : "Manuscript";
    const recoverySizeLabel = currentRecovery?.readingSize === "large" ? "Large" : currentRecovery?.readingSize === "compact" ? "Compact" : "Comfortable";
    const markerSavedLabel = placeMarker ? "My Place set" : "Click a manuscript line to set My Place";
    const focusLabel = focusModeActive ? "Focus active" : focusRecoveryPending ? "Focus ready to resume" : "Focus off";
    const markerView = placeMarker && markerSectionElement ? createPortal(
        <div className="bsmp-delivery-place-marker bsmp-delivery-print-hide" style={{ top: placeMarker.lineBottomOffset }} aria-label="My Place marker">
            <div className="bsmp-delivery-place-marker-line" />
            <span className="bsmp-delivery-place-marker-label">My Place</span>
            <div className="bsmp-delivery-place-marker-line" />
        </div>,
        markerSectionElement,
    ) : null;

    return (
        <>
            <style>{`
                .bsmp-delivery-print-section { position:relative; }
                .bsmp-delivery-section-content { cursor:crosshair; }
                .bsmp-delivery-place-marker { position:absolute; left:0; right:0; z-index:40; pointer-events:none; display:flex; align-items:center; gap:10px; transform:translateY(-50%); }
                .bsmp-delivery-place-marker-line { flex:1; height:3px; border-radius:999px; background:#b45309; box-shadow:0 0 0 1px rgba(255,255,255,.95),0 2px 8px rgba(180,83,9,.35); }
                .bsmp-delivery-place-marker-label { flex:0 0 auto; padding:4px 9px; border-radius:999px; border:1px solid #b45309; background:#fffbeb; color:#92400e; font-size:11px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; box-shadow:0 2px 8px rgba(0,0,0,.16); }
                .bsmp-delivery-controls-details { margin:0; }
                .bsmp-delivery-controls-summary { display:flex; align-items:center; justify-content:space-between; gap:12px; cursor:pointer; padding:10px 0; list-style:none; user-select:none; }
                .bsmp-delivery-controls-summary::-webkit-details-marker { display:none; }
                .bsmp-delivery-controls-summary-status { display:inline-flex; align-items:center; gap:8px; margin-left:8px; color:#6b7280; font-weight:400; }
                .bsmp-delivery-controls-panel { margin-top:4px; padding:14px; border:1px solid #e5e7eb; border-radius:10px; background:#fff; }
                .bsmp-delivery-controls-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
                .bsmp-delivery-control-card { display:flex; flex-direction:column; gap:8px; min-width:0; padding:12px; border:1px solid #e5e7eb; border-radius:9px; background:#f8fafc; line-height:1.45; }
                .bsmp-delivery-control-label { color:#6b7280; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
                .bsmp-delivery-control-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
                .bsmp-delivery-control-actions button { min-height:34px; padding:7px 10px; }
                .bsmp-delivery-control-actions kbd { margin-left:6px; padding:1px 5px; border:1px solid #d1d5db; border-bottom-width:2px; border-radius:4px; font-size:10px; line-height:1.2; background:#fff; }
                .bsmp-delivery-controls-recovery { margin-top:12px; padding-top:10px; border-top:1px solid #e5e7eb; color:#6b7280; font-size:12px; line-height:1.5; }
                @media (max-width:900px) { .bsmp-delivery-controls-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
                @media (max-width:700px) { .bsmp-delivery-controls-summary{gap:8px;padding:8px 0}.bsmp-delivery-controls-summary-status{display:block;margin-left:0;margin-top:3px}.bsmp-delivery-controls-panel{padding:10px}.bsmp-delivery-controls-grid{grid-template-columns:1fr;gap:10px}.bsmp-delivery-control-card{padding:10px}.bsmp-delivery-place-marker{left:8px;right:8px}.bsmp-delivery-place-marker-label{font-size:10px;padding:3px 7px} }
            `}</style>
            {markerView}
            <nav aria-label="Delivery manuscript sections" className="bsmp-delivery-section-nav bsmp-delivery-print-hide">
                <details
                    className="bsmp-delivery-controls-details"
                    open={controlsOpen}
                >
                    <summary
                        className="bsmp-delivery-controls-summary"
                        onClick={(event) => {
                            event.preventDefault();
                            setControlsOpen((open) => !open);
                        }}
                    >
                        <span><strong>Preaching Controls</strong><span className="bsmp-delivery-controls-summary-status"> · {activeSection?.title ?? "Current section"} · {progressLabel}</span></span>
                        <span aria-hidden="true">⌄</span>
                    </summary>
                    <div className="bsmp-delivery-controls-panel">
                        <div className="bsmp-delivery-controls-grid">
                            <div className="bsmp-delivery-control-card"><span className="bsmp-delivery-control-label">Current section</span><strong>{activeSection?.title ?? "Current section"}</strong><span>{progressLabel}</span></div>
                            <div className="bsmp-delivery-control-card"><span className="bsmp-delivery-control-label">Presentation</span><div className="bsmp-delivery-control-actions"><button type="button" onClick={() => dispatchShortcut("m")} disabled={recoveryFocusLabel === "Manuscript"}>Manuscript <kbd>M</kbd></button><button type="button" onClick={() => dispatchShortcut("n")} disabled={recoveryFocusLabel === "Notes"}>Notes <kbd>N</kbd></button></div></div>
                            <div className="bsmp-delivery-control-card"><span className="bsmp-delivery-control-label">Text size</span><div className="bsmp-delivery-control-actions"><button type="button" onClick={() => dispatchShortcut("-")} disabled={recoverySizeLabel === "Compact"}>A−</button><button type="button" onClick={() => { if (recoverySizeLabel === "Large") dispatchShortcut("-"); else if (recoverySizeLabel === "Compact") dispatchShortcut("="); }} disabled={recoverySizeLabel === "Comfortable"}>A</button><button type="button" onClick={() => dispatchShortcut("=")} disabled={recoverySizeLabel === "Large"}>A+</button></div><span>{recoverySizeLabel}</span></div>
                            <div className="bsmp-delivery-control-card"><span className="bsmp-delivery-control-label">Focus & recovery</span><div className="bsmp-delivery-control-actions"><button type="button" onClick={activateFocusMode}>{focusModeActive ? "Exit Focus" : focusRecoveryPending ? "Resume Focus" : "Focus Mode"}</button><button type="button" onClick={returnToMyPlace} disabled={!placeMarker}>Return to My Place <kbd>R</kbd></button><button type="button" onClick={clearMyPlace} disabled={!placeMarker}>Clear My Place</button></div><span>{focusLabel} · {screenAwake ? "Screen awake" : "Screen sleep may resume"} · {markerSavedLabel}</span></div>
                        </div>
                        <div className="bsmp-delivery-controls-recovery" role="status" aria-live="polite">{recoveryAvailable ? `Recovery ready · ${recoveryFocusLabel} · ${recoverySizeLabel} · section ${progressLabel}${placeMarker ? " · place marker set" : ""}${focusRecoveryPending ? " · Focus can be resumed" : ""}` : "Recovery not yet available"}</div>
                    </div>
                </details>
                <div className="bsmp-delivery-section-nav-links">
                    {sections.map((section, index) => {
                        const active = index === safeActiveIndex;
                        return <Link id={navigationLinkId(section.id)} key={section.id} href={`#${sectionId(section.id)}`} className="bsmp-delivery-section-nav-link" aria-current={active ? "location" : undefined} onClick={() => { setActiveIndex(index); writeRecoveryState({ sectionIndex:index }, sections.length); setRecoveryAvailable(true); }} style={active ? { borderColor: "#1d4ed8", boxShadow: "0 0 0 1px #1d4ed8 inset" } : undefined}><span>{index + 1}.</span><span>{section.title}</span></Link>;
                    })}
                </div>
            </nav>
        </>
    );
}
