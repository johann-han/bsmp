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
    return (
        <header className="bsmp-print-hide" style={{ position: "sticky", top: 0, zIndex: 1000, borderBottom: "1px solid #e5e7eb", background: "rgba(255,255,255,0.96)", backdropFilter: "blur(10px)", boxShadow: "0 1px 8px rgba(15,23,42,0.06)" }}>
            <nav aria-label="Primary navigation" style={{ display: "flex", alignItems: "center", gap: 18, minHeight: 52, padding: "0 20px", overflowX: "auto", whiteSpace: "nowrap" }}>
                <a href="/" style={{ fontWeight: 800, color: "#0f172a", textDecoration: "none", marginRight: 6 }}>BSMP</a>
                {items.map(([label, href]) => (
                    <a key={href} href={href} style={{ color: "#334155", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                        {label}
                    </a>
                ))}
            </nav>
        </header>
    );
}
