"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { supabase } from "../lib/supabase";

const protectedPaths = ["/studies", "/workspace", "/bible", "/settings", "/preaching", "/teaching"];

function isProtectedPath(pathname: string): boolean {
    return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function AuthGate({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [checking, setChecking] = useState(() => isProtectedPath(pathname));

    useEffect(() => {
        if (!isProtectedPath(pathname)) {
            setChecking(false);
            return;
        }

        let active = true;
        const returnUrl = `${window.location.pathname}${window.location.search}`;

        async function checkAuth() {
            setChecking(true);
            const { data, error } = await supabase.auth.getUser();
            if (!active) return;
            if (error || !data.user) {
                const next = encodeURIComponent(returnUrl);
                router.replace(`/login?next=${next}`);
                return;
            }
            setChecking(false);
        }

        void checkAuth();

        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!active) return;
            if (!session) {
                const next = encodeURIComponent(returnUrl);
                router.replace(`/login?next=${next}`);
                return;
            }
            setChecking(false);
        });

        return () => {
            active = false;
            subscription.subscription.unsubscribe();
        };
    }, [pathname, router]);

    if (checking) return <main style={{ padding: 32 }}><p>Checking your BSMP session...</p></main>;
    return <>{children}</>;
}
