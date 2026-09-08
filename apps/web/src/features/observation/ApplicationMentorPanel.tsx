"use client";

import { useState } from "react";

interface ApplicationMentorPanelProps {
    readonly interpretation: string;
    readonly principle: string;
    readonly personal: string;
    readonly ministry: string;
    readonly action: string;
}

type Assessment = "grounded" | "mixed" | "disconnected" | "too_general";

const assessmentLabels: Record<Assessment, string> = {
    grounded: "Clearly connected to the interpretation",
    mixed: "Partly connected; check the weak step",
    disconnected: "Not clearly connected to the interpretation",
    too_general: "Too general to test meaningfully",
};

const fieldLabels: Record<string, string> = {
    principle: "Principle",
    personal: "Personal Application",
    ministry: "Ministry Application",
    action: "Action",
};

export function ApplicationMentorPanel({ interpretation, principle, personal, ministry, action }: ApplicationMentorPanelProps) {
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [coaching, setCoaching] = useState<string | null>(null);
    const [focuses, setFocuses] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function askMentor() {
        if (!interpretation.trim() || !principle.trim() || !personal.trim() || !ministry.trim() || !action.trim()) {
            setError("Complete all four application fields before asking the mentor.");
            return;
        }
        setBusy(true);
        setError(null);
        setAssessment(null);
        setCoaching(null);
        setFocuses([]);
        try {
            const { supabase } = await import("../../lib/supabase");
            const session = await supabase.auth.getSession();
            const accessToken = session.data.session?.access_token;
            if (!accessToken) throw new Error("A signed-in Supabase session is required.");
            const response = await fetch("/api/ai/application-mentor", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({ interpretation, principle, personal, ministry, action }),
            });
            const payload = await response.json() as { assessment?: unknown; coaching?: unknown; focuses?: unknown; error?: unknown };
            if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Unable to run the application mentor.");
            if (payload.assessment !== "grounded" && payload.assessment !== "mixed" && payload.assessment !== "disconnected" && payload.assessment !== "too_general") throw new Error("The application mentor returned an invalid assessment.");
            if (typeof payload.coaching !== "string" || !payload.coaching.trim()) throw new Error("The application mentor returned no coaching response.");
            const nextFocuses = Array.isArray(payload.focuses)
                ? payload.focuses.filter((value): value is string => typeof value === "string" && value in fieldLabels).slice(0, 4)
                : [];
            setAssessment(payload.assessment);
            setCoaching(payload.coaching.trim());
            setFocuses(nextFocuses);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to run the application mentor.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <section style={{ margin: "12px 0 16px", border: "1px solid #dbeafe", borderRadius: 12, background: "#eff6ff", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#1d4ed8" }}>Application Mentor</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151" }}>Check whether your application follows from the interpretation and becomes concrete in practice.</p>
                </div>
                <button type="button" onClick={() => void askMentor()} disabled={busy} style={{ border: 0, borderRadius: 8, background: busy ? "#9ca3af" : "#1d4ed8", color: "#fff", padding: "9px 12px", fontWeight: 700 }}>{busy ? "Checking..." : "Ask the mentor"}</button>
            </div>
            {assessment && <p style={{ margin: "12px 0 0", fontWeight: 700 }}>Assessment: {assessmentLabels[assessment]}</p>}
            {coaching && <p style={{ margin: "8px 0 0", lineHeight: 1.5 }}>{coaching}</p>}
            {focuses.length > 0 && (
                <div style={{ marginTop: 12 }}>
                    <strong style={{ fontSize: 13 }}>Fields to recheck</strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                        {focuses.map((focus) => <span key={focus} style={{ padding: "5px 8px", borderRadius: 999, background: "#fff", border: "1px solid #bfdbfe", fontSize: 12, fontWeight: 600 }}>{fieldLabels[focus]}</span>)}
                    </div>
                </div>
            )}
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "#64748b" }}>The mentor coaches your reasoning; it does not write the application for you.</p>
            {error && <p style={{ margin: "10px 0 0", color: "#b91c1c" }}>{error}</p>}
        </section>
    );
}
