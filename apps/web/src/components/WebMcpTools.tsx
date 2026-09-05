"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";

type WebMcpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; consequentialHint?: boolean };
  execute: (input: Record<string, unknown>) => Promise<unknown> | unknown;
};

type ModelContext = {
  registerTool: (tool: WebMcpTool) => Promise<unknown> | unknown;
  unregisterTool?: (name: string) => Promise<unknown> | unknown;
};

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

const WORKSPACES = {
  studies: "/studies",
  biblicalTheology: "/biblical-theology",
  teaching: "/teaching",
  teachingMentor: "/teaching",
  sermonPreparation: "/preaching",
  framework: "/preaching/framework",
  exposition: "/preaching/exposition",
  finalDraft: "/preaching/final",
  delivery: "/preaching/delivery",
} as const;

type StudyTable =
  | "study_observations"
  | "study_interpretations"
  | "interpretation_evidence"
  | "study_applications"
  | "biblical_theology_entries"
  | "teaching_plans";

type OutlineRow = {
  id: string;
  text_observation_ids: string[] | null;
  meaning_interpretation_ids: string[] | null;
  meaning_evidence_ids: string[] | null;
  response_application_ids: string[] | null;
  supporting_observation_ids: string[] | null;
  supporting_interpretation_ids: string[] | null;
  supporting_evidence_ids: string[] | null;
  supporting_application_ids: string[] | null;
  supporting_biblical_theology_ids: string[] | null;
};

function withStudyId(path: string, studyId?: string) {
  return studyId ? `${path}?${new URLSearchParams({ studyId })}` : path;
}

function ids(value: string[] | null | undefined) {
  return value ?? [];
}

function missing(references: readonly string[], available: ReadonlySet<string>) {
  return [...new Set(references.filter((id) => id && !available.has(id)))];
}

async function countRows(table: StudyTable, studyId: string) {
  const result = await supabase.from(table).select("id", { count: "exact", head: true }).eq("study_id", studyId);
  if (result.error) throw result.error;
  return result.count ?? 0;
}

async function getWorkflowState(input: Record<string, unknown>) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) {
    return { ok: false, code: "AUTH_REQUIRED", pathname: window.location.pathname, search: window.location.search };
  }

  const requestedStudyId = typeof input.studyId === "string" ? input.studyId.trim() : "";
  const studyId = requestedStudyId || new URLSearchParams(window.location.search).get("studyId")?.trim() || "";
  if (!studyId) {
    return { ok: false, code: "STUDY_REQUIRED", message: "Provide studyId or open a study-scoped BSMP route.", pathname: window.location.pathname, search: window.location.search };
  }

  const { data: study, error: studyError } = await supabase.from("studies").select("id").eq("id", studyId).maybeSingle();
  if (studyError) throw studyError;
  if (!study) return { ok: false, code: "STUDY_NOT_FOUND", studyId, pathname: window.location.pathname, search: window.location.search };

  const [observations, interpretations, evidence, applications, biblicalTheology, teachingPlans] = await Promise.all([
    countRows("study_observations", studyId),
    countRows("study_interpretations", studyId),
    countRows("interpretation_evidence", studyId),
    countRows("study_applications", studyId),
    countRows("biblical_theology_entries", studyId),
    countRows("teaching_plans", studyId),
  ]);

  const [interpretationResult, evidenceResult, applicationResult, theologyResult, teachingResult, sermonResult] = await Promise.all([
    supabase.from("study_interpretations").select("id").eq("study_id", studyId),
    supabase.from("interpretation_evidence").select("id, interpretation_id").eq("study_id", studyId),
    supabase.from("study_applications").select("id, interpretation_id").eq("study_id", studyId),
    supabase.from("biblical_theology_entries").select("id, interpretation_ids").eq("study_id", studyId),
    supabase.from("teaching_plans").select("id, supporting_interpretation_ids, supporting_biblical_theology_ids").eq("study_id", studyId),
    supabase.from("expository_sermons").select("id, big_idea, purpose, manuscript, delivery_notes, teaching_plan_id, manuscript_sections").eq("study_id", studyId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  for (const result of [interpretationResult, evidenceResult, applicationResult, theologyResult, teachingResult, sermonResult]) {
    if (result.error) throw result.error;
  }

  const interpretationIds = new Set((interpretationResult.data ?? []).map((row) => row.id));
  const evidenceIds = new Set((evidenceResult.data ?? []).map((row) => row.id));
  const applicationIds = new Set((applicationResult.data ?? []).map((row) => row.id));
  const theologyRows = theologyResult.data ?? [];
  const theologyIds = new Set(theologyRows.map((row) => row.id));
  const teachingRows = teachingResult.data ?? [];
  const issues: string[] = [];
  const codes: string[] = [];

  for (const row of theologyRows) {
    if (missing(row.interpretation_ids ?? [], interpretationIds).length) {
      issues.push("Biblical Theology references an interpretation outside the Study.");
      codes.push("BIBLICAL_THEOLOGY_REFERENCE_MISSING");
    }
  }

  for (const row of teachingRows) {
    if (missing(row.supporting_interpretation_ids ?? [], interpretationIds).length) {
      issues.push("Teaching Plan references an interpretation outside the Study.");
      codes.push("TEACHING_INTERPRETATION_REFERENCE_MISSING");
    }
    if (missing(row.supporting_biblical_theology_ids ?? [], theologyIds).length) {
      issues.push("Teaching Plan references Biblical Theology outside the Study.");
      codes.push("TEACHING_THEOLOGY_REFERENCE_MISSING");
    }
  }

  const sermon = sermonResult.data;
  let outlineRows: OutlineRow[] = [];
  let linkedTeachingPlan: { id: string } | null = null;

  if (sermon?.id) {
    const outlineResult = await supabase.from("sermon_outline_points").select("id, text_observation_ids, meaning_interpretation_ids, meaning_evidence_ids, response_application_ids, supporting_observation_ids, supporting_interpretation_ids, supporting_evidence_ids, supporting_application_ids, supporting_biblical_theology_ids").eq("sermon_id", sermon.id).order("position", { ascending: true });
    if (outlineResult.error) throw outlineResult.error;
    outlineRows = (outlineResult.data ?? []) as unknown as OutlineRow[];

    const teachingPlanId = sermon.teaching_plan_id;
    if (teachingPlanId) {
      const planResult = await supabase.from("teaching_plans").select("id").eq("id", teachingPlanId).eq("study_id", studyId).maybeSingle();
      if (planResult.error) throw planResult.error;
      linkedTeachingPlan = planResult.data;
    }
  }

  const observationResult = sermon?.id
    ? await supabase.from("study_observations").select("id").eq("study_id", studyId)
    : { data: [], error: null };
  if (observationResult.error) throw observationResult.error;
  const observationIds = new Set((observationResult.data ?? []).map((row) => row.id));

  for (const point of outlineRows) {
    if (missing([...ids(point.text_observation_ids), ...ids(point.supporting_observation_ids)], observationIds).length) {
      issues.push("Sermon outline point references an observation outside the Study.");
      codes.push("OUTLINE_OBSERVATION_REFERENCE_MISSING");
    }
    if (missing([...ids(point.meaning_interpretation_ids), ...ids(point.supporting_interpretation_ids)], interpretationIds).length) {
      issues.push("Sermon outline point references an interpretation outside the Study.");
      codes.push("OUTLINE_INTERPRETATION_REFERENCE_MISSING");
    }
    if (missing([...ids(point.meaning_evidence_ids), ...ids(point.supporting_evidence_ids)], evidenceIds).length) {
      issues.push("Sermon outline point references evidence outside the Study.");
      codes.push("OUTLINE_EVIDENCE_REFERENCE_MISSING");
    }
    if (missing([...ids(point.response_application_ids), ...ids(point.supporting_application_ids)], applicationIds).length) {
      issues.push("Sermon outline point references an application outside the Study.");
      codes.push("OUTLINE_APPLICATION_REFERENCE_MISSING");
    }
    if (missing(ids(point.supporting_biblical_theology_ids), theologyIds).length) {
      issues.push("Sermon outline point references Biblical Theology outside the Study.");
      codes.push("OUTLINE_THEOLOGY_REFERENCE_MISSING");
    }
  }

  const manuscriptSections = Array.isArray(sermon?.manuscript_sections) ? sermon.manuscript_sections : [];
  const hasManuscript = Boolean(sermon?.manuscript?.trim());
  const hasDeliveryNotes = Boolean(sermon?.delivery_notes?.trim());
  const hasOutline = outlineRows.length > 0;
  const hasTeachingPlan = teachingPlans > 0;
  const hasLinkedTeachingPlan = Boolean(linkedTeachingPlan);

  if (hasManuscript && !hasOutline) codes.push("MANUSCRIPT_WITHOUT_OUTLINE");
  if (manuscriptSections.length > 0 && !hasOutline) codes.push("MANUSCRIPT_SECTIONS_WITHOUT_OUTLINE");
  if (hasDeliveryNotes && !hasManuscript && manuscriptSections.length === 0) codes.push("DELIVERY_WITHOUT_MANUSCRIPT");
  if (hasLinkedTeachingPlan && !hasTeachingPlan) codes.push("LINKED_TEACHING_PLAN_NOT_FOUND");

  return {
    ok: true,
    authenticated: true,
    pathname: window.location.pathname,
    search: window.location.search,
    currentWorkspace: Object.entries(WORKSPACES).find(([, path]) => path === window.location.pathname)?.[0] ?? "unknown",
    studyId,
    sourceCounts: { observations, interpretations, evidence, applications, biblicalTheology, teachingPlans },
    sermon: {
      exists: Boolean(sermon),
      id: sermon?.id ?? null,
      hasBigIdea: Boolean(sermon?.big_idea?.trim()),
      hasPurpose: Boolean(sermon?.purpose?.trim()),
      outlinePointCount: outlineRows.length,
      persistedOutlineIds: outlineRows.map((row) => row.id),
      manuscriptSectionCount: manuscriptSections.length,
      hasLegacyManuscript: hasManuscript,
      hasDeliveryNotes,
      teachingPlanId: sermon?.teaching_plan_id ?? null,
      linkedTeachingPlanFound: hasLinkedTeachingPlan,
    },
    readiness: {
      preparation: Boolean(sermon),
      framework: Boolean(sermon?.big_idea?.trim() && sermon?.purpose?.trim()),
      exposition: hasOutline,
      finalDraft: hasOutline && (hasManuscript || manuscriptSections.length > 0),
      delivery: hasOutline && (hasManuscript || manuscriptSections.length > 0),
    },
    traceability: { studyChainCounts: { observations, interpretations, evidence, applications }, integrityIssues: [...new Set(issues)] },
    discrepancyCodes: [...new Set(codes)],
  };
}

export function WebMcpTools() {
  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) return;

    const tools: WebMcpTool[] = [
      {
        name: "get_bsmp_browser_context",
        title: "Get BSMP workflow context",
        description: "Return current BSMP browser context and authenticated, metadata-only Study workflow diagnostics. Never return user-authored study or sermon text.",
        inputSchema: {
          type: "object",
          properties: { studyId: { type: "string", description: "Optional Study UUID. Defaults to the current route studyId." } },
        },
        annotations: { readOnlyHint: true },
        execute: getWorkflowState,
      },
      {
        name: "navigate_bsmp_workspace",
        title: "Navigate BSMP workspace",
        description: "Navigate the browser to a supported BSMP workspace without modifying database data.",
        inputSchema: {
          type: "object",
          properties: {
            workspace: { type: "string", enum: Object.keys(WORKSPACES) },
            studyId: { type: "string", description: "Optional Study UUID for study-scoped workspaces." },
          },
          required: ["workspace"],
        },
        annotations: { readOnlyHint: false, consequentialHint: false },
        execute: ({ workspace, studyId }) => {
          if (typeof workspace !== "string" || !(workspace in WORKSPACES)) throw new Error("Unsupported BSMP workspace.");
          const path = WORKSPACES[workspace as keyof typeof WORKSPACES];
          window.location.assign(withStudyId(path, typeof studyId === "string" ? studyId : undefined));
          return `Navigating to ${path}`;
        },
      },
    ];

    for (const tool of tools) void modelContext.registerTool(tool);
    return () => {
      for (const tool of tools) if (modelContext.unregisterTool) void modelContext.unregisterTool(tool.name);
    };
  }, []);

  return null;
}
