"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

const items = [
    ["Dashboard", "/"],
    ["Bible", "/bible"],
    ["Studies", "/studies"],
    ["Workspace", "/workspace"],
    ["Settings", "/settings"],
    ["Sermon Preparation", "/preaching"],
    ["Sermon Overview", "/preaching/overview"],
    ["Preaching History", "/preaching/history"],
] as const;

export function GlobalNav() {
    const [user, setUser] = useState<User | null>(null);
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        let mounted = true;

        void supabase.auth.getUser().then(({ data }) => {
            if (mounted) setUser(data.user ?? null);
        });

        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) setUser(session?.user ?? null);
        });

        return () => {
            mounted = false;
            subscription.subscription.unsubscribe();
        };
    }, []);

    async function signOut() {
        setSigningOut(true);
        const { error } = await supabase.auth.signOut();
        setSigningOut(false);
        if (error) return;
        window.location.assign("/");
    }

    return (
        <header className="bsmp-print-hide" style={{ position: "sticky", top: 0, zIndex: 1000, borderBottom: "1px solid #e5e7eb", background: "rgba(255,255,255,0.96)", backdropFilter: "blur(10px)", boxShadow: "0 1px 8px rgba(15,23,42,0.06)" }}>
            <nav aria-label="Primary navigation" style={{ display: "flex", alignItems: "center", gap: 18, minHeight: 52, padding: "0 20px", overflowX: "auto", whiteSpace: "nowrap" }}>
                <a href="/" style={{ fontWeight: 800, color: "#0f172a", textDecoration: "none", marginRight: 6 }}>BSMP</a>
                {items.map(([label, href]) => (
                    <a key={href} href={href} style={{ color: "#334155", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                        {label}
                    </a>
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
                    <a href="/login" style={{ border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 11px", color: "#334155", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
                        Sign in
                    </a>
                )}
            </nav>
        </header>
    );
}
