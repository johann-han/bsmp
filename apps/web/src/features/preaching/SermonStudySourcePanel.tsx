"use client";

import type { StudySession } from "@bsmp/study";

interface Props {
    study: StudySession;
}

export function SermonStudySourcePanel({ study }: Props) {
    return (
        <aside style={{ display: "grid", gap: 16 }}>
            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
                <h2 style={{ marginTop: 0 }}>Study Source</h2>
                <p style={{ marginBottom: 4 }}><strong>{study.title.value}</strong></p>
                <p style={{ marginTop: 0 }}>Passage: {study.passage.toString()}</p>
                <p>Observations: {study.observations.length}</p>
                <p>Interpretations: {study.interpretations.length}</p>
                <p>Applications: {study.applications.length}</p>
            </section>

            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Observations</h3>
                {study.observations.length === 0 ? (
                    <p>No observations recorded.</p>
                ) : (
                    study.observations.map((observation) => (
                        <article key={observation.id.toString()} style={{ marginBottom: 12 }}>
                            <strong>{observation.verseReference.value.toString()}</strong>
                            <div>{observation.statement.value}</div>
                        </article>
                    ))
                )}
            </section>

            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Interpretations & Evidence</h3>
                {study.interpretations.length === 0 ? (
                    <p>No interpretations recorded.</p>
                ) : (
                    study.interpretations.map((interpretation) => (
                        <article key={interpretation.id.toString()} style={{ marginBottom: 16 }}>
                            <strong>{interpretation.statement.value}</strong>
                            {interpretation.observationIds.length > 0 && (
                                <div style={{ marginTop: 6, fontSize: 13 }}>
                                    Supported by {interpretation.observationIds.length} observation(s).
                                </div>
                            )}
                            {interpretation.evidence.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <strong>Evidence</strong>
                                    {interpretation.evidence.map((evidence) => (
                                        <div key={evidence.id.toString()} style={{ marginTop: 4 }}>
                                            <span>{evidence.type.value}: </span>{evidence.description.value}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>
                    ))
                )}
            </section>

            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Applications</h3>
                {study.applications.length === 0 ? (
                    <p>No applications recorded.</p>
                ) : (
                    study.applications.map((application) => (
                        <article key={application.id.toString()} style={{ marginBottom: 14 }}>
                            <div><strong>Principle:</strong> {application.principle.value}</div>
                            <div><strong>Personal:</strong> {application.personal.value}</div>
                            <div><strong>Ministry:</strong> {application.ministry.value}</div>
                            <div><strong>Action:</strong> {application.action.value}</div>
                        </article>
                    ))
                )}
            </section>
        </aside>
    );
}
