"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabase } from "../../lib/supabase";

export function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const result = mode === "sign-in"
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        setLoading(false);

        if (result.error) {
            setError(result.error.message);
            return;
        }

        if (mode === "sign-up" && !result.data.session) {
            setMessage("Account created. Check your email to confirm your address, then sign in.");
            return;
        }

        const next = searchParams.get("next");
        const destination = next && next.startsWith("/") ? next : "/workspace";
        router.push(destination);
        router.refresh();
    }

    async function sendPasswordReset() {
        setError(null);
        setMessage(null);
        if (!email.trim()) {
            setError("Enter your email address first, then request a password reset.");
            return;
        }
        setLoading(true);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/auth/recovery`,
        });
        setLoading(false);
        if (resetError) {
            setError(resetError.message);
            return;
        }
        setResetSent(true);
        setMessage("Password reset email sent. Check your inbox and follow the recovery link.");
    }

    return (
        <form onSubmit={submit} style={{ maxWidth: 420, display: "grid", gap: 12 }}>
            <h1>{mode === "sign-in" ? "Sign in to BSMP" : "Create your BSMP account"}</h1>

            <label>
                Email
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    style={{ display: "block", width: "100%", padding: 10 }}
                />
            </label>

            <label>
                Password
                <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    style={{ display: "block", width: "100%", padding: 10 }}
                />
            </label>

            <button type="submit" disabled={loading}>
                {loading
                    ? "Please wait..."
                    : mode === "sign-in" ? "Sign in" : "Create account"}
            </button>

            {mode === "sign-in" ? (
                <button type="button" onClick={() => void sendPasswordReset()} disabled={loading || resetSent}>
                    {resetSent ? "Reset email sent" : "Forgot your password?"}
                </button>
            ) : null}

            {error ? <p role="alert">{error}</p> : null}
            {message ? <p role="status">{message}</p> : null}

            <button
                type="button"
                onClick={() => {
                    setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                    setError(null);
                    setMessage(null);
                    setResetSent(false);
                }}
            >
                {mode === "sign-in"
                    ? "Need an account? Create one"
                    : "Already have an account? Sign in"}
            </button>
        </form>
    );
}
