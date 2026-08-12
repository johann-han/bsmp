"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase";

export function AuthForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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

        router.push("/workspace");
        router.refresh();
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

            {error ? <p role="alert">{error}</p> : null}
            {message ? <p>{message}</p> : null}

            <button
                type="button"
                onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
            >
                {mode === "sign-in"
                    ? "Need an account? Create one"
                    : "Already have an account? Sign in"}
            </button>
        </form>
    );
}
