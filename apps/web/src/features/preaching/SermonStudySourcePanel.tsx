"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { StudySession } from "@bsmp/study";

import { cacheStudyForWorkspace } from "../../lib/studyWorkspaceNavigationCache";
import { prefetchStudyWorkspace } from "../../lib/prefetchStudyWorkspace";

interface Props { study: StudySession; }

function workspaceHref(studyId: string, target?: string): string {
    const params = new URLSearchParams({ studyId, returnTo: `/preaching?studyId=${encodeURIComponent(studyId)}` });
    return target ? `/workspace?${params.toString()}#${encodeURIComponent(target)}` : `/workspace?${params.toString()}`;
}

const linkStyle: CSSProperties = { color: "#1d4ed8", textDecoration: "none" };

function WorkspaceLink({ href, study, children, style }: { href: string; study: StudySession; children: ReactNode; style?: CSSProperties }) {
    return <Link href={href} prefetch style={style} onMouseEnter={() => prefetchStudyWorkspace(study)} onFocus={() => prefetchStudyWorkspace(study)} onClick={() => cacheStudyForWorkspace(study)}>{children}</Link>;
}

export function SermonStudySourcePanel({ study }: Props) {
    const studyId = study.id.value;
    return (
        <aside style={{ display: "grid", gap: 16, position: "sticky", top: 68, alignSelf: "start", maxHeight: "calc(100vh - 84px)", overflowY: "auto", paddingRight: 4 }}>
            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, background: "#fff" }}>
                <h2 style={{ marginTop: 0 }}>Study Source</h2>
                <p style={{ marginBottom: 4 }}><strong>{study.title.value}</strong></p>
                <p style={{ marginTop: 0 }}>Passage: {study.passage.toString()}</p>
                <p style={{ marginBottom: 4 }}>Observations: {study.observations.length}</p>
                <p style={{ margin: "4px 0" }}>Interpretations: {study.interpretations.length}</p>
                <p style={{ marginTop: 4 }}>Applications: {study.applications.length}</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
                    <WorkspaceLink href={workspaceHref(studyId)} study={study} style={{ fontWeight: 600 }}>Open Study Workspace</WorkspaceLink>
                    <Link href={`/biblical-theology?studyId=${encodeURIComponent(studyId)}`} prefetch style={{ ...linkStyle, fontWeight: 600 }}>Open Biblical Theology</Link>
                    <Link href={`/preaching/framework?studyId=${encodeURIComponent(studyId)}`} prefetch style={{ ...linkStyle, fontWeight: 600 }}>Open Sermon Framework</Link>
                </div>
            </section>

            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, background: "#fff" }}>
                <h3 style={{ marginTop: 0 }}>Observations</h3>
                {study.observations.length === 0 ? <p>No observations recorded.</p> : study.observations.map((observation) => <article key={observation.id.value} style={{ marginBottom: 12 }}><WorkspaceLink study={study} href={workspaceHref(studyId, `observation-${observation.id.value}`)} style={linkStyle}><strong>{observation.verseReference.value.toString()}</strong></WorkspaceLink><div>{observation.statement.value}</div></article>)}
            </section>

            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, background: "#fff" }}>
                <h3 style={{ marginTop: 0 }}>Interpretations & Evidence</h3>
                {study.interpretations.length === 0 ? <p>No interpretations recorded.</p> : study.interpretations.map((interpretation) => <article key={interpretation.id.value} style={{ marginBottom: 16 }}><WorkspaceLink study={study} href={workspaceHref(studyId, `interpretation-${interpretation.id.value}`)} style={linkStyle}><strong>{interpretation.statement.value}</strong></WorkspaceLink>{interpretation.observationIds.length > 0 && <div style={{ marginTop: 6, fontSize: 13 }}>Supported by {interpretation.observationIds.length} observation(s).</div>}{interpretation.observationIds.length > 0 && <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}><strong>Observation chain:</strong>{" "}{interpretation.observationIds.map((observationId, index) => { const observation = study.observations.find((item) => item.id.value === observationId.value); return <span key={observationId.value}>{observation ? <WorkspaceLink study={study} href={workspaceHref(studyId, `observation-${observation.id.value}`)} style={{ ...linkStyle, fontSize: 12 }}>{observation.verseReference.value.toString()}</WorkspaceLink> : <span>Missing observation</span>}{index < interpretation.observationIds.length - 1 ? ", " : ""}</span>; })}</div>}{interpretation.evidence.length > 0 && <div style={{ marginTop: 8 }}><strong>Evidence</strong>{interpretation.evidence.map((evidence) => <div key={evidence.id.value} style={{ marginTop: 4 }}><WorkspaceLink study={study} href={workspaceHref(studyId, `evidence-${evidence.id.value}`)} style={linkStyle}><span>{evidence.type.value}: </span>{evidence.description.value}</WorkspaceLink></div>)}</div>}</article>)}
            </section>

            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, background: "#fff" }}>
                <h3 style={{ marginTop: 0 }}>Applications</h3>
                {study.applications.length === 0 ? <p>No applications recorded.</p> : study.applications.map((application) => { const interpretation = study.interpretations.find((item) => item.id.value === application.interpretationId.value); return <article key={application.id.value} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}><WorkspaceLink study={study} href={workspaceHref(studyId, `application-${application.id.value}`)} style={linkStyle}><div><strong>Principle:</strong> {application.principle.value}</div></WorkspaceLink><div><strong>Personal:</strong> {application.personal.value}</div><div><strong>Ministry:</strong> {application.ministry.value}</div><div><strong>Action:</strong> {application.action.value}</div><div style={{ marginTop: 8, paddingLeft: 10, borderLeft: "3px solid #86efac" }}><strong>Study foundation</strong>{interpretation ? <><div style={{ marginTop: 4 }}><WorkspaceLink study={study} href={workspaceHref(studyId, `interpretation-${interpretation.id.value}`)} style={linkStyle}>Interpretation: {interpretation.statement.value}</WorkspaceLink></div>{interpretation.observationIds.length > 0 && <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>Observations: {interpretation.observationIds.map((observationId, index) => { const observation = study.observations.find((item) => item.id.value === observationId.value); return <span key={observationId.value}>{observation ? <WorkspaceLink study={study} href={workspaceHref(studyId, `observation-${observation.id.value}`)} style={{ ...linkStyle, fontSize: 12 }}>{observation.verseReference.value.toString()}</WorkspaceLink> : <span>Missing observation</span>}{index < interpretation.observationIds.length - 1 ? ", " : ""}</span>; })}</div>}{interpretation.evidence.length > 0 && <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>Evidence: {interpretation.evidence.map((evidence, index) => <span key={evidence.id.value}><WorkspaceLink study={study} href={workspaceHref(studyId, `evidence-${evidence.id.value}`)} style={{ ...linkStyle, fontSize: 12 }}>{evidence.type.value}</WorkspaceLink>{index < interpretation.evidence.length - 1 ? ", " : ""}</span>)}</div>}</> : <div style={{ marginTop: 4, color: "#b91c1c", fontSize: 13 }}>The source interpretation is unavailable. Re-open the Study Workspace to repair this application link.</div>}</div></article>; })}
            </section>
        </aside>
    );
}
