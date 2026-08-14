"use client";

import type { StudySession } from "@bsmp/study";

interface Props {
    study: StudySession;
}

function workspaceHref(studyId: string, target: string): string {
    return `/workspace?studyId=${encodeURIComponent(studyId)}#${encodeURIComponent(target)}`;
}

const linkStyle = {
    color: "#1d4ed8",
    textDecoration: "none",
};

export function SermonStudySourcePanel({ study }: Props) {
    const studyId = study.id.value;

    return (
        <aside style={{ display: "grid", gap: 16 }}>
            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
                <h2 style={{ marginTop: 0 }}>Study Source</h2>
                <p style={{ marginBottom: 4 }}><strong>{study.title.value}</strong></p>
                <p style={{ marginTop: 0 }}>Passage: {study.passage.toString()}</p>
                <p style={{ marginBottom: 4 }}>Observations: {study.observations.length}</p>
                <p style={{ margin: "4px 0" }}>Interpretations: {study.interpretations.length}</p>
                <p style={{ marginTop: 4 }}>Applications: {study.applications.length}</p>
                <a
                    href={`/workspace?studyId=${encodeURIComponent(studyId)}`}
                    style={{ display: "inline-block", marginTop: 8, fontWeight: 600 }}
                >
                    Open Study Workspace
                </a>
            </section>

            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Observations</h3>
                {study.observations.length === 0 ? (
                    <p>No observations recorded.</p>
                ) : (
                    study.observations.map((observation) => (
                        <article key={observation.id.value} style={{ marginBottom: 12 }}>
                            <a href={workspaceHref(studyId, `observation-${observation.id.value}`)} style={linkStyle}>
                                <strong>{observation.verseReference.value.toString()}</strong>
                            </a>
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
                        <article key={interpretation.id.value} style={{ marginBottom: 16 }}>
                            <a href={workspaceHref(studyId, `interpretation-${interpretation.id.value}`)} style={linkStyle}>
                                <strong>{interpretation.statement.value}</strong>
                            </a>
                            {interpretation.observationIds.length > 0 && (
                                <div style={{ marginTop: 6, fontSize: 13 }}>
                                    Supported by {interpretation.observationIds.length} observation(s).
                                </div>
                            )}
                            {interpretation.evidence.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <strong>Evidence</strong>
                                    {interpretation.evidence.map((evidence) => (
                                        <div key={evidence.id.value} id={`evidence-${evidence.id.value}`} style={{ marginTop: 4, scrollMarginTop: 24 }}>
                                            <a href={workspaceHref(studyId, `evidence-${evidence.id.value}`)} style={linkStyle}>
                                                <span>{evidence.type.value}: </span>{evidence.description.value}
                                            </a>
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
                        <article key={application.id.value} style={{ marginBottom: 14 }}>
                            <a href={workspaceHref(studyId, `application-${application.id.value}`)} style={linkStyle}>
                                <div><strong>Principle:</strong> {application.principle.value}</div>
                            </a>
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
