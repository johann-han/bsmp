"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpositorySermon } from "@bsmp/preaching";
import { StudyId } from "@bsmp/study";
import { AppShell } from "@repo/ui";
import { SupabaseStudyRepository } from "../../lib/SupabaseStudyRepository";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";

interface Props { studyId: string; }

function splitParagraphs(value: string): string[] {
    return value.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

export function SermonDeliveryWorkspace({ studyId }: Props) {
    const router = useRouter();
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [focus, setFocus] = useState<"manuscript" | "notes">("manuscript");

    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!studyId) { setError("A study is required to open sermon delivery."); setLoading(false); return; }
            try {
                const repository = new SupabaseExpositorySermonRepository();
                const studyRepository = new SupabaseStudyRepository();
                const study = await studyRepository.find(StudyId.from(studyId));
                const nextSermon = await repository.findByStudyId(studyId);
                if (cancelled) return;
                if (!study) throw new Error("The selected study could not be found.");
                if (!nextSermon) throw new Error("Complete Sermon Preparation before opening delivery mode.");
                setSermon(nextSermon);
            } catch (reason: unknown) {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load sermon delivery.");
            } finally { if (!cancelled) setLoading(false); }
        }
        void load();
        return () => { cancelled = true; };
    }, [studyId]);

    const paragraphs = useMemo(() => splitParagraphs(sermon?.manuscript?.value ?? ""), [sermon]);
    const wordCount = sermon?.manuscript?.value.trim() ? sermon.manuscript.value.trim().split(/\s+/).length : 0;
    const estimatedMinutes = Math.max(0, Math.round((wordCount / 130) * 10) / 10);

    if (loading) return <AppShell title="Sermon Delivery"><p>Loading sermon delivery view...</p></AppShell>;
    if (error || !sermon) return <AppShell title="Sermon Delivery"><p style={{ color: "#b91c1c" }}>{error ?? "Sermon delivery could not be loaded."}</p><button type="button" onClick={() => router.push(`/preaching/final?studyId=${encodeURIComponent(studyId)}`)} style={{ padding: "10px 16px" }}>← Back to Final Draft</button></AppShell>;

    return (
        <AppShell title="Sermon Delivery">
            <style>{`@media print { .bsmp-delivery-print-hide { display: none !important; } .bsmp-delivery-print-page { max-width: none !important; margin: 0 !important; padding: 0 !important; } .bsmp-delivery-print-main { max-width: none !important; margin: 0 !important; font-size: 14pt !important; line-height: 1.6 !important; } .bsmp-delivery-print-notes { max-width: none !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; } }`}</style>
            <div className="bsmp-delivery-print-page" style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 0 48px" }}>
                <header className="bsmp-delivery-print-hide" style={{ position: "sticky", top: 0, zIndex: 5, background: "rgba(255,255,255,0.96)", borderBottom: "1px solid #e5e7eb", padding: "12px 0", backdropFilter: "blur(6px)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                            <div style={{ fontSize: 13, color: "#6b7280" }}>Delivery Mode</div>
                            <h1 style={{ margin: "2px 0" }}>{sermon.title.value}</h1>
                            <div style={{ color: "#6b7280", fontSize: 13 }}>{sermon.passage.toString()} · {wordCount} words · ≈ {estimatedMinutes} min</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button type="button" onClick={() => setFocus("manuscript")} disabled={focus === "manuscript"}>Manuscript</button>
                            <button type="button" onClick={() => setFocus("notes")} disabled={focus === "notes"}>Delivery Notes</button>
                            <button type="button" onClick={() => window.print()}>Print / Save PDF</button>
                            <button type="button" onClick={() => router.push(`/preaching/final?studyId=${encodeURIComponent(studyId)}`)}>Exit Delivery</button>
                        </div>
                    </div>
                </header>

                {focus === "manuscript" ? (
                    <main className="bsmp-delivery-print-main" style={{ maxWidth: 820, margin: "28px auto 0", fontSize: 22, lineHeight: 1.8, fontFamily: "Georgia, serif" }}>
                        <h1 style={{ display: "none" }} className="bsmp-delivery-print-title">{sermon.title.value}</h1>
                        {sermon.bigIdea && <p style={{ fontFamily: "inherit", fontSize: 18, fontWeight: 700, lineHeight: 1.5, borderLeft: "4px solid #d1d5db", paddingLeft: 16 }}>{sermon.bigIdea.value}</p>}
                        {paragraphs.length === 0 ? <p style={{ fontFamily: "inherit", fontSize: 18 }}>No manuscript has been written yet. Return to Final Draft to write or generate the manuscript.</p> : paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 16)}`}>{paragraph}</p>)}
                    </main>
                ) : (
                    <aside className="bsmp-delivery-print-notes" style={{ maxWidth: 820, margin: "28px auto 0" }}>
                        <h2>Delivery Notes</h2>
                        {sermon.deliveryNotes?.value.trim() ? <div style={{ whiteSpace: "pre-wrap", fontSize: 18, lineHeight: 1.7, border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fff" }}>{sermon.deliveryNotes.value}</div> : <p style={{ color: "#6b7280" }}>No delivery notes have been recorded yet. Return to Final Draft to add them.</p>}
                    </aside>
                )}
            </div>
        </AppShell>
    );
}
