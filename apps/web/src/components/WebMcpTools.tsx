"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";

type WebMcpTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    consequentialHint?: boolean;
  };
  execute: (input: Record<string, unknown>) => Promise<unknown> | unknown;
};

type ModelContext = {
  registerTool: (tool: WebMcpTool) => Promise<unknown> | unknown;
  unregisterTool?: (name: string) => Promise<unknown> | unknown;
};

type OutlineRow = {
  id: string;
  position: number;
  text_observation_ids?: string[] | null;
  meaning_interpretation_ids?: string[] | null;
  meaning_evidence_ids?: string[] | null;
  response_application_ids?: string[] | null;
  supporting_observation_ids?: string[] | null;
  supporting_interpretation_ids?: string[] | null;
  supporting_evidence_ids?: string[] | null;
  supporting_application_ids?: string[] | null;
  supporting_biblical_theology_ids?: string[] | null;
};

type SermonRow = {
  id: string;
  study_id: string;
  title: string;
  big_idea: string | null;
  purpose: string | null;
  manuscript: string | null;
  delivery_notes: string | null;
  teaching_plan_id?: string | null;
  manuscript_sections?: unknown;
};

type BiblicalTheologyRow = {
  id: string;
  interpretation_ids: string[] | null;
};

type TeachingPlanRow = {
  id: string;
  supporting_interpretation_ids: string[] | null;
  supporting_biblical_theology_ids: string[] | null;
};

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

function withStudyId(path: string, studyId?: string) {
  if (!studyId) return path;
  const params = new URLSearchParams({ studyId });
  return `${path}?${params.toString()}`;
}

function unique(values: readonly string[]) {
  return [...new Set(values.filter(Boolean))];
}

function missingIds(referencedIds: readonly string[], availableIds: ReadonlySet<string>) {
  return unique(referencedIds).filter((id) => !availableIds.has(id));
}

function arrayValue(value: string[] | null | undefined) {
  return value ?? [];
}

async function countRows(table: string, studyId: string) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("study_id", studyId);

  if (error) throw error;
  return count ?? 0;
}

async function getWorkflowState(input: Record<string, unknown>) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      message: "An authenticated BSMP browser session is required.",
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
    };
  }

  const requestedStudyId = typeof input.studyId === "string" ? input.studyId.trim() : "";
  const currentStudyId = new URLSearchParams(window.location.search).get("studyId")?.trim() ?? "";
  const studyId = requestedStudyId || currentStudyId;

  if (!studyId) {
    return {
      ok: false,
      code: "STUDY_REQUIRED",
      message: "Provide studyId or open a study-scoped BSMP route.",
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
    };
  }

  const routeEntry = Object.entries(WORKSPACES).find(([, path]) => path === window.location.pathname);
  const currentWorkspace = routeEntry?.[0] ?? "unknown";

  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("id")
    .eq("id", studyId)
    .maybeSingle();
  if (studyError) throw studyError;

  if (!study) {
    return {
      ok: false,
      code: "STUDY_NOT_FOUND",
      message: "The authenticated user cannot access the requested Study.",
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      studyId,
      currentWorkspace,
    };
  }

  const [observations, interpretations, evidence, applications, biblicalTheology, teachingPlans] = await Promise.all([
    countRows("study_observations", studyId),
    countRows("study_interpretations", studyId),
    countRows("interpretation_evidence", studyId),
    countRows("study_applications", studyId),
    countRows("biblical_theology_entries", studyId),
    countRows("teaching_plans", studyId),
  ]);

  const [interpretationRowsResult, evidenceRowsResult, applicationRowsResult, theologyRowsResult, teachingRowsResult, sermonResult] =
    await Promise.all([
      supabase.from("study_interpretations").select("id").eq("study_id", studyId),
      supabase.from("interpretation_evidence").select("id, interpretation_id").eq("study_id", studyId),
      supabase.from("study_applications").select("id, interpretation_id").eq("study_id", studyId),
      supabase.from("biblical_theology_entries").select("id, interpretation_ids").eq("study_id", studyId),
      supabase.from("teaching_plans").select("id, supporting_interpretation_ids, supporting_biblical_theology_ids").eq("study_id", studyId),
      supabase
        .from("expository_sermons")
        .select("id, study_id, title, big_idea, purpose, manuscript, delivery_notes, teaching_plan_id, manuscript_sections")
        .eq("study_id", studyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  for (const result of [interpretationRowsResult, evidenceRowsResult, applicationRowsResult, theologyRowsResult, teachingRowsResult, sermonResult]) {
    if (result.error) throw result.error;
  }

  const interpretationIds = new Set((interpretationRowsResult.data ?? []).map((row) => row.id as string));
  const evidenceIds = new Set((evidenceRowsResult.data ?? []).map((row) => row.id as string));
  const applicationIds = new Set((applicationRowsResult.data ?? []).map((row) => row.id as string));
  const theologyIds = new Set((theologyRowsResult.data ?? []).map((row) => row.id as string));
  const teachingRows = (teachingRowsResult.data ?? []) as unknown as TeachingPlanRow[];
  const theologyRows = (theologyRowsResult.data ?? []) as unknown as BiblicalTheologyRow[];
  const sermon = (sermonResult.data ?? null) as unknown as SermonRow | null;

  const integrityIssues: string[] = [];
  const discrepancyCodes: string[] = [];

  for (const row of theologyRows) {
    const missing = missingIds(arrayValue(row.interpretation_ids), interpretationIds);
    if (missing.length > 0) {
      integrityIssues.push("Biblical Theology references an interpretation outside the Study.");
      discrepancyCodes.push("BIBLICAL_THEOLOGY_REFERENCE_MISSING");
    }
  }

  for (const row of teachingRows) {
    const missingInterpretations = missingIds(arrayValue(row.supporting_interpretation_ids), interpretationIds);
    const missingTheology = missingIds(arrayValue(row.supporting_biblical_theology_ids), theologyIds);
    if (missingInterpretations.length > 0) {
      integrityIssues.push("Teaching Plan references an interpretation outside the Study.");
      discrepancyCodes.push("TEACHING_INTERPRETATION_REFERENCE_MISSING");
    }
    if (missingTheology.length > 0) {
      integrityIssues.push("Teaching Plan references Biblical Theology outside the Study.");
      discrepancyCodes.push("TEACHING_THEOLOGY_REFERENCE_MISSING");
    }
  }

  const sermonId = sermon?.id ?? null;
  let outlineRows: OutlineRow[] = [];
  let linkedTeachingPlan: TeachingPlanRow | null = null;

  if (sermonId) {
    const { data, error } = await supabase
      .from("sermon_outline_points")
      .select(
        "id, position, text_observation_ids, meaning_interpretation_ids, meaning_evidence_ids, response_application_ids, supporting_observation_ids, supporting_interpretation_ids, supporting_evidence_ids, supporting_application_ids, supporting_biblical_theology_ids",
      )
      .eq("sermon_id", sermonId)
      .order("position", { ascending: true });
    if (error) throw error;
    outlineRows = (data ?? []) as unknown as OutlineRow[];

    if (sermon.teaching_plan_id) {
      const { data: plan, error: planError } = await supabase
        .from("teaching_plans")
        .select("id, supporting_interpretation_ids, supporting_biblical_theology_ids")
        .eq("id", sermon.teaching_plan_id)
        .eq("study_id", studyId)
        .maybeSingle();
      if (planError) throw planError;
      linkedTeachingPlan = (plan ?? null) as unknown as TeachingPlanRow | null;
    }
  }

  const observationIdsResult = sermonId
    ? await supabase.from("study_observations").select("id").eq("study_id", studyId)
    : { data: [], error: null };
  if (observationIdsResult.error) throw observationIdsResult.error;
  const observationIds = new Set((observationIdsResult.data ?? []).map((row) => row.id as string));

  for (const point of outlineRows) {
    const observationRefs = [...arrayValue(point.text_observation_ids), ...arrayValue(point.supporting_observation_ids)];
    const interpretationRefs = [...arrayValue(point.meaning_interpretation_ids), ...arrayValue(point.supporting_interpretation_ids)];
    const evidenceRefs = [...arrayValue(point.meaning_evidence_ids), ...arrayValue(point.supporting_evidence_ids)];
    const applicationRefs = [...arrayValue(point.response_application_ids), ...arrayValue(point.supporting_application_ids)];
    const theologyRefs = arrayValue(point.supporting_biblical_theology_ids);

    if (missingIds(observationRefs, observationIds).length > 0) {
      integrityIssues.push("Sermon outline point references an observation outside the Study.");
      discrepancyCodes.push("OUTLINE_OBSERVATION_REFERENCE_MISSING");
    }
    if (missingIds(interpretationRefs, interpretationIds).length > 0) {
      integrityIssues.push("Sermon outline point references an interpretation outside the Study.");
      discrepancyCodes.push("OUTLINE_INTERPRETATION_REFERENCE_MISSING");
    }
    if (missingIds(evidenceRefs, evidenceIds).length > 0) {
      integrityIssues.push("Sermon outline point references evidence outside the Study.");
      discrepancyCodes.push("OUTLINE_EVIDENCE_REFERENCE_MISSING");
    }
    if (missingIds(applicationRefs, applicationIds).length > 0) {
      integrityIssues.push("Sermon outline point references an application outside the Study.");
      discrepancyCodes.push("OUTLINE_APPLICATION_REFERENCE_MISSING");
    }
    if (missingIds(theologyRefs, theologyIds).length > 0) {
      integrityIssues.push("Sermon outline point references Biblical Theology outside the Study.");
      discrepancyCodes.push("OUTLINE_THEOLOGY_REFERENCE_MISSING");
    }
  }

  const manuscriptSections = Array.isArray(sermon?.manuscript_sections) ? sermon?.manuscript_sections : [];
  const manuscriptSectionCount = manuscriptSections.length;
  const hasManuscript = typeof sermon?.manuscript === "string" && sermon.manuscript.trim().length > 0;
  const hasDeliveryNotes = typeof sermon?.delivery_notes === "string" && sermon.delivery_notes.trim().length > 0;
  const hasOutline = outlineRows.length > 0;
  const hasTeachingPlan = teachingPlans > 0;
  const hasLinkedTeachingPlan = Boolean(linkedTeachingPlan);

  if (hasManuscript && !hasOutline) discrepancyCodes.push("MANUSCRIPT_WITHOUT_OUTLINE");
  if (manuscriptSectionCount > 0 && !hasOutline) discrepancyCodes.push("MANUSCRIPT_SECTIONS_WITHOUT_OUTLINE");
  if (hasDeliveryNotes && !hasManuscript && manuscriptSectionCount === 0) discrepancyCodes.push("DELIVERY_WITHOUT_MANUSCRIPT");
  if (hasLinkedTeachingPlan && !hasTeachingPlan) discrepancyCodes.push("LINKED_TEACHING_PLAN_NOT_FOUND");

  return {
    ok: true,
    authenticated: true,
    origin: window.location.origin,
    pathname: window.location.pathname,
    search: window.location.search,
    currentWorkspace,
    studyId,
    study: { exists: true },
    sourceCounts: {
      observations,
      interpretations,
      evidence,
      applications,
      biblicalTheology,
      teachingPlans,
    },
    sermon: sermon
      ? {
          exists: true,
          id: sermonId,
          hasBigIdea: Boolean(sermon.big_idea?.trim()),
          hasPurpose: Boolean(sermon.purpose?.trim()),
          outlinePointCount: outlineRows.length,
          persistedOutlineIds: outlineRows.map((row) => row.id),
          hasLegacyManuscript: hasManuscript,
          manuscriptSectionCount,
          hasDeliveryNotes,
          teachingPlanId: sermon.teaching_plan_id ?? null,
          linkedTeachingPlanFound: hasLinkedTeachingPlan,
        }
      : {
          exists: false,
          id: null,
          hasBigIdea: false,
          hasPurpose: false,
          outlinePointCount: 0,
          persistedOutlineIds: [],
          hasLegacyManuscript: false,
          manuscriptSectionCount: 0,
          hasDeliveryNotes: false,
          teachingPlanId: null,
          linkedTeachingPlanFound: false,
        },
    readiness: {
      preparation: Boolean(sermon),
      framework: Boolean(sermon?.big_idea?.trim() && sermon?.purpose?.trim()),
      exposition: hasOutline,
      finalDraft: hasOutline && (manuscriptSectionCount > 0 || hasManuscript),
      delivery: hasOutline && (manuscriptSectionCount > 0 || hasManuscript),
    },
    traceability: {
      studyChainCounts: {
        observations,
        interpretations,
        evidence,
        applications,
      },
      integrityIssues: unique(integrityIssues),
    },
    discrepancyCodes: unique(discrepancyCodes),
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
        description:
          "Return the current BSMP browser context and, when a Study is active or a studyId is supplied, an authenticated metadata-only workflow diagnostic. It returns identifiers, counts, readiness flags, traceability checks, and discrepancy codes; it never returns user-authored study or sermon text.",
        inputSchema: {
          type: "object",
          properties: {
            studyId: {
              type: "string",
              description: "Optional Study UUID. Defaults to the studyId query parameter on the current route.",
            },
          },
        },
        annotations: { readOnlyHint: true },
        execute: getWorkflowState,
      },
      {
        name: "navigate_bsmp_workspace",
        title: "Navigate BSMP workspace",
        description:
          "Navigate the authenticated BSMP browser session to one of the supported study or sermon preparation workspaces. This action does not modify study, sermon, or database data.",
        inputSchema: {
          type: "object",
          properties: {
            workspace: {
              type: "string",
              enum: Object.keys(WORKSPACES),
              description: "The BSMP workspace to open.",
            },
            studyId: {
              type: "string",
              description: "Optional Study UUID used by study-scoped workspaces.",
            },
          },
          required: ["workspace"],
        },
        annotations: { readOnlyHint: false, consequentialHint: false },
        execute: ({ workspace, studyId }) => {
          if (typeof workspace !== "string" || !(workspace in WORKSPACES)) {
            throw new Error("Unsupported BSMP workspace.");
          }

          const path = WORKSPACES[workspace as keyof typeof WORKSPACES];
          window.location.assign(withStudyId(path, typeof studyId === "string" ? studyId : undefined));
          return `Navigating to ${path}`;
        },
      },
    ];

    for (const tool of tools) {
      void modelContext.registerTool(tool);
    }

    return () => {
      for (const tool of tools) {
        if (modelContext.unregisterTool) {
          void modelContext.unregisterTool(tool.name);
        }
      }
    };
  }, []);

  return null;
}
