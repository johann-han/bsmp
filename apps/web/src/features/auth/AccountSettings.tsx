"use client";

import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

export function AccountSettings() {
    const [user, setUser] = useState<User | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        void supabase.auth.getUser().then(({ data, error: authError }) => {
            if (!mounted) return;
            if (authError) setError(authError.message);
            setUser(data.user ?? null);
            setLoading(false);
        });
        return () => {
            mounted = false;
        };
    }, []);

    async function changePassword(event: FormEvent<HTMLFormElement>) {
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
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) throw updateError;
            setPassword("");
            setConfirmPassword("");
            setMessage("Password changed successfully.");
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : "Unable to change your password.");
        } finally {
            setSaving(false);
        }
    }

    async function signOut() {
        setError(null);
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
            setError(signOutError.message);
            return;
        }
        window.location.assign("/");
    }

    if (loading) return <p>Loading account...</p>;
    if (!user) return <p style={{ color: "#b91c1c" }}>A signed-in user is required to manage account settings.</p>;

    return (
        <div style={{ display: "grid", gap: 20, maxWidth: 640 }}>
            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                <div style={{ color: "#6b7280", fontSize: 13 }}>Account</div>
                <h2 style={{ margin: "4px 0 8px" }}>Signed-in account</h2>
                <p style={{ margin: 0 }}><strong>Email:</strong> {user.email ?? "Unknown"}</p>
            </section>

            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                <h2>Change Password</h2>
                <form onSubmit={changePassword} style={{ display: "grid", gap: 12 }}>
                    <label>
                        New password
                        <input type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 10, marginTop: 4 }} />
                    </label>
                    <label>
                        Confirm new password
                        <input type="password" minLength={6} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 10, marginTop: 4 }} />
                    </label>
                    <button type="submit" disabled={saving} style={{ width: "fit-content", padding: "10px 16px", fontWeight: 600 }}>{saving ? "Saving..." : "Change Password"}</button>
                </form>
            </section>

            {message ? <p style={{ color: "#047857" }} role="status">{message}</p> : null}
            {error ? <p style={{ color: "#b91c1c" }} role="alert">{error}</p> : null}

            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "#fff" }}>
                <h2>Session</h2>
                <button type="button" onClick={() => void signOut()} style={{ padding: "10px 16px", fontWeight: 600 }}>Sign out</button>
            </section>
        </div>
    );
}
