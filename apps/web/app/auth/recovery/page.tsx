"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../src/lib/supabase";

export default function RecoveryPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [ready, setReady] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        void supabase.auth.getSession().then(({ data, error: sessionError }) => {
            if (!mounted) return;
            if (sessionError) setError(sessionError.message);
            setReady(Boolean(data.session));
        });
        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) setReady(Boolean(session));
        });
        return () => {
            mounted = false;
            subscription.subscription.unsubscribe();
        };
    }, []);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setMessage(null);
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (password !== confirmPassword) {
            setError("The passwords do not match.");
            return;
        }
        setSaving(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setSaving(false);
        if (updateError) {
            setError(updateError.message);
            return;
        }
        setPassword("");
        setConfirmPassword("");
        setMessage("Password updated successfully. You can now return to BSMP.");
        setTimeout(() => router.push("/workspace"), 800);
    }

    if (!ready) {
        return <main style={{ padding: 32, maxWidth: 520 }}><h1>Reset Password</h1><p style={{ color: error ? "#b91c1c" : "#6b7280" }}>{error ?? "Waiting for your recovery session..."}</p></main>;
    }

    return (
        <main style={{ padding: 32, maxWidth: 520 }}>
            <h1>Reset Password</h1>
            <p>Choose a new password for your BSMP account.</p>
            <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
                <label>New password<input type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 10, marginTop: 4 }} /></label>
                <label>Confirm new password<input type="password" minLength={6} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 10, marginTop: 4 }} /></label>
                <button type="submit" disabled={saving} style={{ width: "fit-content", padding: "10px 16px", fontWeight: 600 }}>{saving ? "Saving..." : "Set New Password"}</button>
            </form>
            {message ? <p style={{ color: "#047857" }} role="status">{message}</p> : null}
            {error ? <p style={{ color: "#b91c1c" }} role="alert">{error}</p> : null}
        </main>
    );
}
