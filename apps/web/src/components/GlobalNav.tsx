"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const items = [
    ["Dashboard", "/"],
    ["Bible", "/bible"],
    ["Studies", "/studies"],
    ["Workspace", "/workspace"],
    ["Settings", "/settings"],
    ["Sermon Preparation", "/preaching"],
] as const;

function NavigationLinks() {
    const searchParams = useSearchParams();
    const studyId = searchParams.get("studyId");
    const preachingHref = studyId ? `/preaching?studyId=${encodeURIComponent(studyId)}` : "/preaching";

    function openSermonPreparation(event: React.MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();
        const currentStudyId = new URLSearchParams(window.location.search).get("studyId");
        const target = currentStudyId
            ? `/preaching?studyId=${encodeURIComponent(currentStudyId)}`
            : preachingHref;
        window.location.assign(target);
    }

    return (
        <nav
            aria-label="Primary navigation"
            style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                minHeight: 52,
                padding: "0 20px",
                overflowX: "auto",
                whiteSpace: "nowrap",
            }}
        >
            <a href="/" style={{ fontWeight: 800, color: "#0f172a", textDecoration: "none", marginRight: 6 }}>
                BSMP
            </a>
            {items.map(([label, href]) => (
                <a
                    key={href}
                    href={href === "/preaching" ? preachingHref : href}
                    onClick={href === "/preaching" ? openSermonPreparation : undefined}
                    style={{ color: "#334155", textDecoration: "none", fontSize: 14, fontWeight: 600 }}
                >
                    {label}
                </a>
            ))}
        </nav>
    );
}

export function GlobalNav() {
    return (
        <header
            style={{
                position: "sticky",
                top: 0,
                zIndex: 1000,
                borderBottom: "1px solid #e5e7eb",
                background: "rgba(255,255,255,0.96)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 1px 8px rgba(15,23,42,0.06)",
            }}
        >
            <Suspense fallback={<div style={{ minHeight: 52 }} />}>
                <NavigationLinks />
            </Suspense>
        </header>
    );
}
