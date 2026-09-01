"use client";

import { usePathname } from "next/navigation";

export function WorkspaceBackButton() {
    const pathname = usePathname();

    if (pathname !== "/workspace") return null;

    return (
        <button
            type="button"
            onClick={() => window.history.back()}
            style={{
                position: "fixed",
                left: 20,
                bottom: 20,
                zIndex: 1000,
                border: "1px solid #d1d5db",
                borderRadius: 999,
                padding: "10px 16px",
                background: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(10px)",
                color: "#1d4ed8",
                cursor: "pointer",
                fontWeight: 700,
                boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
            }}
        >
            Back to Sermon Exposition
        </button>
    );
}
