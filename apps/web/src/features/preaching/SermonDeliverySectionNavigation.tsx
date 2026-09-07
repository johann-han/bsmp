"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SermonManuscriptSection } from "@bsmp/preaching";

interface Props { sections: readonly SermonManuscriptSection[]; }
interface ScreenWakeLockSentinelLike extends EventTarget { released: boolean; release(): Promise<void>; }
interface DeliveryPlaceMarker { sectionIndex: number; offset: number; scrollY: number; savedAt: number; }
interface DeliveryRecoveryState {
    sectionIndex: number;
    focus: "manuscript" | "notes";
    readingSize: "compact" | "comfortable" | "large";
    focusModeRequested: boolean;
    placeMarker?: DeliveryPlaceMarker;
}
interface MarkerPosition { top: number; }

function sectionId(id: string): string { return `delivery-section-${encodeURIComponent(id)}`; }
function navigationLinkId(id: string): string { return `delivery-nav-${encodeURIComponent(id)}`; }
const DELIVERY_NAV_OFFSET = 150;
const DELIVERY_RECOVERY_PREFIX = "bsmp.delivery.recovery.v1";

function recoveryKey(): string {
    const studyId = new URLSearchParams(window.location.search).get("studyId") ?? "unknown";
    return `${DELIVERY_RECOVERY_PREFIX}:${studyId}`;
}

function parsePlaceMarker(value: unknown, sectionCount: number): DeliveryPlaceMarker | undefined {
    if (!value || typeof value !== "object") return undefined;
    const marker = value as Partial<DeliveryPlaceMarker>;
    if (typeof marker.sectionIndex !== "number" || typeof marker.offset !== "number" || typeof marker.scrollY !== "number" || typeof marker.savedAt !== "number") return undefined;
    return {
        sectionIndex: Math.max(0, Math.min(Math.floor(marker.sectionIndex), Math.max(0, sectionCount - 1))),
        offset: marker.offset,
        scrollY: Math.max(0, marker.scrollY),
        savedAt: marker.savedAt,
    };
}

function readRecoveryState(sectionCount: number): DeliveryRecoveryState | null {
    try {
        const raw = window.localStorage.getItem(recoveryKey());
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<DeliveryRecoveryState>;
        return {
            sectionIndex: typeof parsed.sectionIndex === "number" ? Math.max(0, Math.min(Math.floor(parsed.sectionIndex), Math.max(0, sectionCount - 1))) : 0,
            focus: parsed.focus === "notes" ? "notes" : "manuscript",
            readingSize: parsed.readingSize === "compact" || parsed.readingSize === "large" ? parsed.readingSize : "comfortable",
            focusModeRequested: parsed.focusModeRequested === true,
            placeMarker: parsePlaceMarker(parsed.placeMarker, sectionCount),
        };
    } catch { return null; }
}

function writeRecoveryState(patch: Partial<DeliveryRecoveryState>, sectionCount: number) {
    try {
        const existing = readRecoveryState(sectionCount) ?? {
            sectionIndex: 0,
            focus: "manuscript" as const,
            readingSize: "comfortable" as const,
            focusModeRequested: false,
        };
        window.localStorage.setItem(recoveryKey(), JSON.stringify({ ...existing, ...patch }));
    } catch {
        // Recovery is a convenience; delivery must work without local storage.
    }
}

function getScrollContainer(): HTMLElement | null {
    if (document.fullscreenElement instanceof HTMLElement) return document.fullscreenElement;
    return document.scrollingElement ?? document.documentElement;
}

function getScrollTop(container: HTMLElement | null): number {
    return container ? container.scrollTop : window.scrollY;
}

function getDocumentTop(element: HTMLElement, container: HTMLElement | null): number {
    if (!container) return element.getBoundingClientRect().top + window.scrollY;
    const containerRect = container.getBoundingClientRect();
    return element.getBoundingClientRect().top - containerRect.top + container.scrollTop;
}

function getRootContentTop(element: HTMLElement, root: HTMLElement, container: HTMLElement | null): number {
    const rootRect = root.getBoundingClientRect();
    const containerRect = container?.getBoundingClientRect();
    const scrollTop = getScrollTop(container);
    const elementViewportTop = element.getBoundingClientRect().top;
    const rootViewportTop = rootRect.top;
    const containerViewportTop = containerRect?.top ?? 0;
    return elementViewportTop - rootViewportTop + (scrollTop - (container === root ? 0 : containerViewportTop - rootViewportTop));
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
    const [recoveryAvailable, setRecoveryAvailable] = useState(false);
    const [placeMarker, setPlaceMarker] = useState<DeliveryPlaceMarker | null>(null);
    const [markerPosition, setMarkerPosition] = useState<MarkerPosition | null>(null);

    useEffect(() => {
        if (sections.length === 0) return;
        const recovery = readRecoveryState(sections.length);
        setRecoveryAvailable(Boolean(recovery));
        setPlaceMarker(recovery?.placeMarker ?? null);
        if (!recovery) return;
        const target = sections[recovery.sectionIndex];
        if (target && !window.location.hash) {
            const targetId = sectionId(target.id);
            window.history.replaceState(null, "", `#${targetId}`);
            window.setTimeout(() => { document.getElementById(targetId)?.scrollIntoView({ behavior: "auto", block: "start" }); }, 0);
        }
        setActiveIndex(recovery.sectionIndex);
        window.setTimeout(() => {
            if (recovery.focus === "notes") dispatchShortcut("n");
            if (recovery.readingSize === "large") dispatchShortcut("=");
            else if (recovery.readingSize === "compact") dispatchShortcut("-");
        }, 0);
        if (recovery.focusModeRequested) document.documentElement.dataset.bsmpDeliveryFocusRecovery = "requested";
    }, [sections]);

    const safeActiveIndex = Math.min(activeIndex, Math.max(0, sections.length - 1));
    const activeSection = sections[safeActiveIndex];
    const progressLabel = useMemo(() => `${safeActiveIndex + 1} of ${sections.length}`, [safeActiveIndex, sections.length]);

    useEffect(() => {
        if (sections.length === 0) return;
        let frame = 0;
        const container = getScrollContainer();
        const updateActiveSection = () => {
            const viewportPosition = getScrollTop(container) + DELIVERY_NAV_OFFSET;
            let nextIndex = 0;
            sections.forEach((section, index) => {
                const element = document.getElementById(sectionId(section.id));
                if (!element) return;
                const documentTop = getDocumentTop(element, container);
                if (documentTop <= viewportPosition) nextIndex = index;
            });
            setActiveIndex((current) => current === nextIndex ? current : nextIndex);
            writeRecoveryState({ sectionIndex: nextIndex }, sections.length);
            setRecoveryAvailable(true);
            frame = 0;
        };
        const scheduleUpdate = () => {
            if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
        };
        updateActiveSection();
        container?.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate, { passive: true });
        return () => {
            container?.removeEventListener("scroll", scheduleUpdate);
            window.removeEventListener("scroll", scheduleUpdate);
            window.removeEventListener("resize", scheduleUpdate);
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, [focusModeActive, sections]);

    function jumpTo(index: number) {
        if (sections.length === 0) return;
        const nextIndex = Math.max(0, Math.min(index, sections.length - 1));
        const targetId = sectionId(sections[nextIndex].id);
        setActiveIndex(nextIndex);
        writeRecoveryState({ sectionIndex: nextIndex }, sections.length);
        setRecoveryAvailable(true);
        if (window.location.hash !== `#${targetId}`) window.history.replaceState(null, "", `#${targetId}`);
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function markMyPlace() {
        if (sections.length === 0) return;
        const section = sections[safeActiveIndex];
        const element = document.getElementById(sectionId(section.id));
        if (!element) return;
        const container = getScrollContainer();
        const documentTop = getDocumentTop(element, container);
        const currentScrollTop = getScrollTop(container);
        const marker: DeliveryPlaceMarker = {
            sectionIndex: safeActiveIndex,
            offset: currentScrollTop - documentTop,
            scrollY: currentScrollTop,
            savedAt: Date.now(),
        };
        setPlaceMarker(marker);
        writeRecoveryState({ placeMarker: marker, sectionIndex: safeActiveIndex }, sections.length);
        setRecoveryAvailable(true);
    }

    function returnToMyPlace() {
        if (!placeMarker || sections.length === 0) return;
        const nextIndex = Math.max(0, Math.min(placeMarker.sectionIndex, sections.length - 1));
        const section = sections[nextIndex];
        const element = document.getElementById(sectionId(section.id));
        const container = getScrollContainer();
        if (!element) return;
        const documentTop = getDocumentTop(element, container);
        const targetScrollTop = Math.max(0, documentTop + placeMarker.offset);
        const targetId = sectionId(section.id);
        setActiveIndex(nextIndex);
        writeRecoveryState({ sectionIndex: nextIndex }, sections.length);
        setRecoveryAvailable(true);
        if (window.location.hash !== `#${targetId}`) window.history.replaceState(null, "", `#${targetId}`);
        if (container) container.scrollTo({ top: targetScrollTop, behavior: "smooth" });
        else window.scrollTo({ top: targetScrollTop, behavior: "smooth" });
    }

    function clearMyPlace() {
        setPlaceMarker(null);
        setMarkerPosition(null);
        try {
            const recovery = readRecoveryState(sections.length);
            if (!recovery) return;
            const { placeMarker: _removed, ...withoutMarker } = recovery;
            window.localStorage.setItem(recoveryKey(), JSON.stringify(withoutMarker));
            setRecoveryAvailable(true);
        } catch {
            // Clearing the marker is a convenience and should never block delivery.
        }
    }

    useEffect(() => {
        if (sections.length === 0 || !placeMarker) {
            setMarkerPosition(null);
            return;
        }
        let frame = 0;
        const updateMarkerPosition = () => {
            const root = document.querySelector<HTMLElement>(".bsmp-delivery-root");
            const markerSectionIndex = Math.max(0, Math.min(placeMarker.sectionIndex, sections.length - 1));
            const section = sections[markerSectionIndex];
            const element = section ? document.getElementById(sectionId(section.id)) : null;
            const container = getScrollContainer();
            if (!root || !element) {
                setMarkerPosition(null);
                frame = 0;
                return;
            }
            const rootRect = root.getBoundingClientRect();
            const containerRect = container?.getBoundingClientRect();
            const scrollDelta = container ? container.scrollTop - (container === root ? 0 : (containerRect?.top ?? 0) - rootRect.top) : window.scrollY;
            const top = element.getBoundingClientRect().top - rootRect.top + scrollDelta + placeMarker.offset;
            setMarkerPosition({ top: Math.round(top) });
            frame = 0;
        };
        const scheduleUpdate = () => {
            if (!frame) frame = window.requestAnimationFrame(updateMarkerPosition);
        };
        updateMarkerPosition();
        window.addEventListener("resize", scheduleUpdate, { passive: true });
        document.addEventListener("fullscreenchange", scheduleUpdate);
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        getScrollContainer()?.addEventListener("scroll", scheduleUpdate, { passive: true });
        return () => {
            window.removeEventListener("resize", scheduleUpdate);
            document.removeEventListener("fullscreenchange", scheduleUpdate);
            window.removeEventListener("scroll", scheduleUpdate);
            getScrollContainer()?.removeEventListener("scroll", scheduleUpdate);
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, [focusModeActive, placeMarker, sections]);

    useEffect(() => {
        if (sections.length === 0) return;
        const targetId = window.location.hash.slice(1);
        if (!targetId) return;
        const hashIndex = sections.findIndex((section) => sectionId(section.id) === targetId);
        if (hashIndex >= 0) {
            setActiveIndex(hashIndex);
            writeRecoveryState({ sectionIndex: hashIndex }, sections.length);
            setRecoveryAvailable(true);
        }
    }, [sections]);

    useEffect(() => {
        if (sections.length === 0) return;
        function handleHashChange() {
            const targetId = window.location.hash.slice(1);
            const nextIndex = sections.findIndex((section) => sectionId(section.id) === targetId);
            if (nextIndex >= 0) {
                setActiveIndex(nextIndex);
                writeRecoveryState({ sectionIndex: nextIndex }, sections.length);
                setRecoveryAvailable(true);
            }
        }
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, [sections]);

    useEffect(() => {
        if (sections.length === 0) return;
        const activeLink = document.getElementById(navigationLinkId(sections[safeActiveIndex].id));
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
                sentinel.addEventListener("release", () => {
                    if (wakeLockRef.current === sentinel) wakeLockRef.current = null;
                    setScreenAwake(false);
                });
            } catch { setScreenAwake(false); }
        }
        function handleVisibilityChange() { if (document.visibilityState === "visible") void acquireWakeLock(); }
        void acquireWakeLock();
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            disposed = true;
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            const sentinel = wakeLockRef.current;
            wakeLockRef.current = null;
            setScreenAwake(false);
            if (sentinel && !sentinel.released) void sentinel.release();
        };
    }, [sections.length]);

    useEffect(() => {
        if (sections.length === 0) return;
        const handleFullscreenChange = () => {
            const active = document.fullscreenElement !== null;
            setFocusModeActive(active);
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
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [placeMarker, safeActiveIndex, sections.length]);

    if (sections.length === 0) return null;
    const currentRecovery = readRecoveryState(sections.length);
    const recoveryFocusLabel = currentRecovery?.focus === "notes" ? "Notes" : "Manuscript";
    const recoverySizeLabel = currentRecovery?.readingSize === "large" ? "Large" : currentRecovery?.readingSize === "compact" ? "Compact" : "Comfortable";
    const markerSavedLabel = placeMarker ? "Place marker saved" : "No place marker saved";

    return (
        <>
            <style>{`
                .bsmp-delivery-root { position:relative; }
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
            {markerPosition && placeMarker && (
                <div className="bsmp-delivery-place-marker bsmp-delivery-print-hide" style={{ top: markerPosition.top }} aria-label="My Place marker">
                    <div className="bsmp-delivery-place-marker-line" />
                    <span className="bsmp-delivery-place-marker-label">My Place</span>
                    <div className="bsmp-delivery-place-marker-line" />
                </div>
            )}
            <nav aria-label="Delivery manuscript sections" className="bsmp-delivery-section-nav bsmp-delivery-print-hide">
                <details className="bsmp-delivery-controls-details">
                    <summary className="bsmp-delivery-controls-summary">
                        <span><strong>Preaching Controls</strong><span className="bsmp-delivery-controls-summary-status"> · {activeSection?.title ?? "Current section"} · {progressLabel}</span></span>
                        <span aria-hidden="true">⌄</span>
                    </summary>
                    <div className="bsmp-delivery-controls-panel">
                        <div className="bsmp-delivery-controls-grid">
                            <div className="bsmp-delivery-control-card"><span className="bsmp-delivery-control-label">Current section</span><strong>{activeSection?.title ?? "Current section"}</strong><span>{progressLabel}</span></div>
                            <div className="bsmp-delivery-control-card"><span className="bsmp-delivery-control-label">Presentation</span><div className="bsmp-delivery-control-actions"><button type="button" onClick={() => dispatchShortcut("m")} disabled={recoveryFocusLabel === "Manuscript"}>Manuscript <kbd>M</kbd></button><button type="button" onClick={() => dispatchShortcut("n")} disabled={recoveryFocusLabel === "Notes"}>Notes <kbd>N</kbd></button></div></div>
                            <div className="bsmp-delivery-control-card"><span className="bsmp-delivery-control-label">Text size</span><div className="bsmp-delivery-control-actions"><button type="button" onClick={() => dispatchShortcut("-")} disabled={recoverySizeLabel === "Compact"}>A−</button><button type="button" onClick={() => { if (recoverySizeLabel === "large") dispatchShortcut("-"); else if (recoverySizeLabel === "compact") dispatchShortcut("="); }} disabled={recoverySizeLabel === "Comfortable"}>A</button><button type="button" onClick={() => dispatchShortcut("=")} disabled={recoverySizeLabel === "Large"}>A+</button></div><span>{recoverySizeLabel}</span></div>
                            <div className="bsmp-delivery-control-card"><span className="bsmp-delivery-control-label">Focus & recovery</span><div className="bsmp-delivery-control-actions"><button type="button" onClick={activateFocusMode}>{focusModeActive ? "Exit Focus" : "Focus Mode"}</button><button type="button" onClick={markMyPlace}>Mark My Place</button><button type="button" onClick={returnToMyPlace} disabled={!placeMarker}>Return to My Place <kbd>R</kbd></button><button type="button" onClick={clearMyPlace} disabled={!placeMarker}>Clear My Place</button></div><span>{focusModeActive ? "Focus active" : "Focus off"} · {screenAwake ? "Screen awake" : "Screen sleep may resume"} · {markerSavedLabel}</span></div>
                        </div>
                        <div className="bsmp-delivery-controls-recovery" role="status" aria-live="polite">{recoveryAvailable ? `Recovery ready · ${recoveryFocusLabel} · ${recoverySizeLabel} · section ${progressLabel}${placeMarker ? " · place marker saved" : ""}` : "Recovery not yet available"}</div>
                    </div>
                </details>
                <div className="bsmp-delivery-section-nav-links">
                    {sections.map((section, index) => {
                        const active = index === safeActiveIndex;
                        return <Link id={navigationLinkId(section.id)} key={section.id} href={`#${sectionId(section.id)}`} className="bsmp-delivery-section-nav-link" aria-current={active ? "location" : undefined} onClick={() => { setActiveIndex(index); writeRecoveryState({ sectionIndex: index }, sections.length); setRecoveryAvailable(true); }} style={active ? { borderColor: "#1d4ed8", boxShadow: "0 0 0 1px #1d4ed8 inset" } : undefined}><span>{index + 1}.</span><span>{section.title}</span></Link>;
                    })}
                </div>
            </nav>
        </>
    );
}
