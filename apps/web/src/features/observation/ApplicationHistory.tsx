import type { ApplicationViewModel, InterpretationViewModel } from "@bsmp/study";

export function ApplicationHistory({ applications, interpretations }: { applications: readonly ApplicationViewModel[]; interpretations: readonly InterpretationViewModel[] }) {
    const interpretationMap = new Map(interpretations.map((item) => [item.id, item.statement]));

    return (
        <section style={{ marginTop: 20 }}>
            <h2 style={{ marginBottom: 12, fontSize: 20 }}>Application History</h2>
            {applications.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No applications recorded yet.</p>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {applications.map((application) => (
                        <article key={application.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 16 }}>
                            <p style={{ marginTop: 0, fontSize: 13, color: "#6b7280" }}><strong>From interpretation:</strong> {interpretationMap.get(application.interpretationId) ?? application.interpretationId}</p>
                            <div style={{ display: "grid", gap: 10 }}>
                                <Block title="Principle" value={application.principle} />
                                <Block title="Personal" value={application.personal} />
                                <Block title="Ministry" value={application.ministry} />
                                <Block title="Action" value={application.action} />
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function Block({ title, value }: { title: string; value: string }) {
    return <div><strong>{title}</strong><p style={{ margin: "4px 0 0" }}>{value}</p></div>;
}
