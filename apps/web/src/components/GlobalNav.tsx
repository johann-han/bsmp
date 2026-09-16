"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

const items = [
    ["Dashboard", "/"],
    ["Bible", "/bible"],
    ["Studies", "/studies"],
    ["Workspace", "/workspace"],
    ["Biblical Theology", "/biblical-theology"],
    ["Teaching", "/teaching"],
    ["Sermon Preparation", "/preaching"],
    ["Sermon Overview", "/preaching/overview"],
    ["Preaching History", "/preaching/history"],
    ["Settings", "/settings"],
] as const;

const studyScopedPaths = new Set([
    "/workspace",
    "/biblical-theology",
    "/teaching",
    "/preaching",
    "/preaching/overview",
    "/preaching/history",
]);

function withStudyId(path: string, studyId: string) {
    if (!studyId || !studyScopedPaths.has(path)) return path;
    return `${path}?${new URLSearchParams({ studyId }).toString()}`;
}

export function GlobalNav() {
    const [user, setUser] = useState<User | null>(null);
    const [signingOut, setSigningOut] = useState(false);
    const [studyId, setStudyId] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        let mounted = true;

        void supabase.auth.getUser().then(({ data }) => {
            if (mounted) setUser(data.user ?? null);
        });

        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) setUser(session?.user ?? null);
        });

        const params = new URLSearchParams(window.location.search);
        const currentStudyId = params.get("studyId")?.trim() ?? "";
        if (mounted) setStudyId(currentStudyId);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMobileOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            mounted = false;
            subscription.subscription.unsubscribe();
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    async function signOut() {
        setSigningOut(true);
        const { error } = await supabase.auth.signOut();
        setSigningOut(false);
        if (error) return;
        setMobileOpen(false);
        window.location.assign("/");
    }

    return (
        <header className="bsmp-print-hide bsmp-global-nav" style={{ position: "sticky", top: 0, zIndex: 1000, borderBottom: "1px solid #e5e7eb", background: "rgba(255,255,255,0.97)", backdropFilter: "blur(10px)", boxShadow: "0 1px 8px rgba(15,23,42,0.06)" }}>
            <style>{`
                .bsmp-global-nav-desktop { display:flex; align-items:center; gap:18px; min-height:52px; padding:0 20px; white-space:nowrap; }
                .bsmp-global-nav-mobile-bar { display:none; }
                .bsmp-global-nav-mobile-menu { display:none; }
                @media (max-width: 760px) {
                    .bsmp-global-nav-desktop { display:none; }
                    .bsmp-global-nav-mobile-bar { display:flex; align-items:center; justify-content:space-between; min-height:52px; padding:0 14px; }
                    .bsmp-global-nav-mobile-menu { display:block; border-top:1px solid #e5e7eb; background:#fff; box-shadow:0 8px 18px rgba(15,23,42,0.08); }
                    .bsmp-global-nav-mobile-link { display:block; padding:13px 16px; color:#1e293b; text-decoration:none; font-size:15px; font-weight:650; border-bottom:1px solid #f1f5f9; }
                    .bsmp-global-nav-mobile-account { padding:14px 16px; border-top:1px solid #e5e7eb; background:#f8fafc; }
                    .bsmp-global-nav-mobile-email { display:block; margin-bottom:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#64748b; font-size:13px; }
                    .bsmp-global-nav-mobile-signout { width:100%; min-height:42px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; color:#334155; font-weight:700; }
                    .bsmp-global-nav-mobile-menu a:active, .bsmp-global-nav-mobile-signout:active { background:#f1f5f9; }
                }
            `}</style>

            <nav className="bsmp-global-nav-desktop" aria-label="Primary navigation">
                <Link href="/" style={{ fontWeight: 800, color: "#0f172a", textDecoration: "none", marginRight: 6 }}>BSMP</Link>
                {items.map(([label, href]) => (
                    <Link key={href} href={withStudyId(href, studyId)} style={{ color: "#334155", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                        {label}
                    </Link>
                ))}
                <span aria-hidden="true" style={{ flex: 1 }} />
                {user ? (
                    <>
                        <span title={user.email ?? undefined} style={{ color: "#64748b", fontSize: 13 }}>{user.email ?? "Signed in"}</span>
                        <button type="button" onClick={() => void signOut()} disabled={signingOut} style={{ border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 11px", background: "#fff", color: "#334155", cursor: signingOut ? "wait" : "pointer", fontWeight: 600 }}>
                            {signingOut ? "Signing out..." : "Sign out"}
                        </button>
                    </>
                ) : (
                    <Link href="/login" style={{ border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 11px", color: "#334155", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
                        Sign in
                    </Link>
                )}
            </nav>

            <nav className="bsmp-global-nav-mobile-bar" aria-label="Primary navigation">
                <Link href="/" style={{ fontWeight: 850, color: "#0f172a", textDecoration: "none", fontSize: 17 }}>BSMP</Link>
                <button
                    type="button"
                    aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={mobileOpen}
                    aria-controls="bsmp-mobile-menu"
                    onClick={() => setMobileOpen((open) => !open)}
                    style={{ width: 44, height: 44, display: "grid", placeItems: "center", border: "1px solid #cbd5e1", borderRadius: 9, background: "#fff", color: "#0f172a", cursor: "pointer", fontSize: 23, lineHeight: 1 }}
                >
                    <span aria-hidden="true">{mobileOpen ? "×" : "☰"}</span>
                </button>
            </nav>

            {mobileOpen && (
                <div id="bsmp-mobile-menu" className="bsmp-global-nav-mobile-menu">
                    {items.map(([label, href]) => (
                        <Link key={href} href={withStudyId(href, studyId)} className="bsmp-global-nav-mobile-link" onClick={() => setMobileOpen(false)}>
                            {label}
                        </Link>
                    ))}
                    <div className="bsmp-global-nav-mobile-account">
                        {user ? (
                            <>
                                <span className="bsmp-global-nav-mobile-email" title={user.email ?? undefined}>{user.email ?? "Signed in"}</span>
                                <button type="button" className="bsmp-global-nav-mobile-signout" onClick={() => void signOut()} disabled={signingOut}>
                                    {signingOut ? "Signing out..." : "Sign out"}
                                </button>
                            </>
                        ) : (
                            <Link href="/login" className="bsmp-global-nav-mobile-link" onClick={() => setMobileOpen(false)} style={{ border: 0, padding: "0 0 2px", fontWeight: 800 }}>
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
