"use client";

import { useEffect } from "react";
import type { ExpositorySermon, SermonOutlinePoint } from "@bsmp/preaching";
import { StudyId, type StudySession } from "@bsmp/study";
import type { Database } from "../lib/database.types";
import { SupabaseExpositorySermonRepository } from "../lib/SupabaseExpositorySermonRepository";
import { SupabaseStudyRepository } from "../lib/SupabaseStudyRepository";
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

type WorkflowIssue = {
  code:
    | "OUTLINE_HYDRATION_MISMATCH"
    | "EXPOSITION_OUTLINE_MISSING"
    | "MANUSCRIPT_SECTION_ORPHANED"
    | "DELIVERY_NOTES_WITHOUT_MANUSCRIPT"
    | "TRACEABLE_SECTIONS_WITHOUT_MANUSCRIPT"
    | "INTERPRETATION_MISSING_OBSERVATION_FOUNDATION"
    | "APPLICATION_MISSING_INTERPRETATION_FOUNDATION"
    | "BIBLICAL_THEOLOGY_MISSING_INTERPRETATION_FOUNDATION"
    | "TEACHING_PLAN_LINK_UNAVAILABLE"
    | "TEACHING_PLAN_TRACEABILITY_MISMATCH"
    | "OUTLINE_TRACEABILITY_MISMATCH";
  severity: "warning" | "error";
};

type BiblicalTheologyTrace = Pick<
  Database["public"]["Tables"]["biblical_theology_entries"]["Row"],
  "id" | "interpretation_ids"
>;

type TeachingPlanTrace = Pick<
  Database["public"]["Tables"]["teaching_plans"]["Row"],
  | "audience"
  | "central_truth"
  | "teaching_aim"
  | "explanation"
  | "key_points"
  | "response_prompt"
  | "supporting_interpretation_ids"
  | "supporting_biblical_theology_ids"
>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasText(value: string) {
  return Boolean(value.trim());
}

function expositionReadiness(point: SermonOutlinePoint, isLastPoint: boolean) {
  const checks = [
    hasText(point.text),
    point.textObservationIds.length > 0,
    hasText(point.explanation),
    point.meaningInterpretationIds.length > 0,
    point.meaningEvidenceIds.length > 0,
    hasText(point.illustration),
    hasText(point.application),
    point.responseApplicationIds.length > 0,
    ...(isLastPoint ? [] : [hasText(point.transition)]),
  ];

  return checks.every(Boolean);
}

function sameIds(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length &&
    left.every((id, index) => id === right[index])
  );
}

function countMissingReferences(
  ids: readonly string[],
  available: ReadonlySet<string>,
) {
  return ids.filter((id) => !available.has(id)).length;
}

function isCompleteTeachingPlan(plan: TeachingPlanTrace) {
  return Boolean(
    plan.audience.trim() &&
    plan.central_truth.trim() &&
    plan.teaching_aim.trim() &&
    plan.explanation.trim() &&
    plan.key_points.length > 0 &&
    plan.response_prompt.trim() &&
    plan.supporting_interpretation_ids.length > 0 &&
    plan.supporting_biblical_theology_ids.length > 0,
  );
}

function traceabilitySummary(
  study: StudySession,
  sermon: ExpositorySermon,
  biblicalTheology: readonly BiblicalTheologyTrace[],
  teachingPlan: TeachingPlanTrace | null,
) {
  const observationIds = new Set(
    study.observations.map((observation) => observation.id.value),
  );
  const interpretationIds = new Set(
    study.interpretations.map((interpretation) => interpretation.id.value),
  );
  const evidenceIds = new Set(
    study.interpretations.flatMap((interpretation) =>
      interpretation.evidence.map((evidence) => evidence.id.value),
    ),
  );
  const applicationIds = new Set(
    study.applications.map((application) => application.id.value),
  );
  const biblicalTheologyIds = new Set(
    biblicalTheology.map((entry) => entry.id),
  );
  const interpretationsWithoutObservations = study.interpretations.filter(
    (interpretation) => interpretation.observationIds.length === 0,
  ).length;
  const applicationsWithoutInterpretations = study.applications.filter(
    (application) => !interpretationIds.has(application.interpretationId.value),
  ).length;
  const biblicalTheologyMissingInterpretations = biblicalTheology.reduce(
    (count, entry) =>
      count +
      countMissingReferences(entry.interpretation_ids, interpretationIds),
    0,
  );
  const sectionsByOutlinePoint = new Set(
    sermon.manuscriptSections.flatMap((section) =>
      section.outlinePointId ? [section.outlinePointId] : [],
    ),
  );
  const points = sermon.outline.map((point, index) => {
    const observationReferences = [
      ...point.supportingObservationIds,
      ...point.textObservationIds,
    ];
    const interpretationReferences = [
      ...point.supportingInterpretationIds,
      ...point.meaningInterpretationIds,
    ];
    const evidenceReferences = [
      ...point.supportingEvidenceIds,
      ...point.meaningEvidenceIds,
    ];
    const applicationReferences = [
      ...point.supportingApplicationIds,
      ...point.responseApplicationIds,
    ];
    const theologicalReferences = point.supportingBiblicalTheologyIds;
    const missingReferenceCount =
      countMissingReferences(observationReferences, observationIds) +
      countMissingReferences(interpretationReferences, interpretationIds) +
      countMissingReferences(evidenceReferences, evidenceIds) +
      countMissingReferences(applicationReferences, applicationIds) +
      countMissingReferences(theologicalReferences, biblicalTheologyIds);

    return {
      id: point.id,
      expositionReady: expositionReadiness(
        point,
        index === sermon.outline.length - 1,
      ),
      manuscriptSectionPresent: sectionsByOutlinePoint.has(point.id),
      referenceCounts: {
        observations: observationReferences.length,
        interpretations: interpretationReferences.length,
        evidence: evidenceReferences.length,
        applications: applicationReferences.length,
        biblicalTheology: theologicalReferences.length,
        missing: missingReferenceCount,
      },
    };
  });
  const missingOutlineReferences = points.reduce(
    (count, point) => count + point.referenceCounts.missing,
    0,
  );
  const missingTeachingReferences = teachingPlan
    ? countMissingReferences(
        teachingPlan.supporting_interpretation_ids,
        interpretationIds,
      ) +
      countMissingReferences(
        teachingPlan.supporting_biblical_theology_ids,
        biblicalTheologyIds,
      )
    : 0;
  const issues: WorkflowIssue[] = [];

  if (interpretationsWithoutObservations > 0) {
    issues.push({
      code: "INTERPRETATION_MISSING_OBSERVATION_FOUNDATION",
      severity: "warning",
    });
  }
  if (applicationsWithoutInterpretations > 0) {
    issues.push({
      code: "APPLICATION_MISSING_INTERPRETATION_FOUNDATION",
      severity: "error",
    });
  }
  if (biblicalTheologyMissingInterpretations > 0) {
    issues.push({
      code: "BIBLICAL_THEOLOGY_MISSING_INTERPRETATION_FOUNDATION",
      severity: "error",
    });
  }
  if (sermon.teachingPlanId && !teachingPlan) {
    issues.push({ code: "TEACHING_PLAN_LINK_UNAVAILABLE", severity: "error" });
  }
  if (
    teachingPlan &&
    (!isCompleteTeachingPlan(teachingPlan) || missingTeachingReferences > 0)
  ) {
    issues.push({
      code: "TEACHING_PLAN_TRACEABILITY_MISMATCH",
      severity: "error",
    });
  }
  if (missingOutlineReferences > 0) {
    issues.push({ code: "OUTLINE_TRACEABILITY_MISMATCH", severity: "error" });
  }

  return {
    study: {
      observationCount: observationIds.size,
      interpretationCount: interpretationIds.size,
      evidenceCount: evidenceIds.size,
      applicationCount: applicationIds.size,
      interpretationsWithoutObservationCount:
        interpretationsWithoutObservations,
      applicationsWithoutInterpretationCount:
        applicationsWithoutInterpretations,
    },
    biblicalTheology: {
      entryCount: biblicalTheology.length,
      missingInterpretationReferenceCount:
        biblicalTheologyMissingInterpretations,
    },
    teaching: {
      sermonLinked: Boolean(sermon.teachingPlanId),
      linkedPlanAvailable: sermon.teachingPlanId ? Boolean(teachingPlan) : null,
      linkedPlanComplete: teachingPlan
        ? isCompleteTeachingPlan(teachingPlan)
        : null,
      missingReferenceCount: missingTeachingReferences,
    },
    outline: {
      pointCount: points.length,
      points,
    },
    manuscript: {
      traceableOutlinePointCount: sectionsByOutlinePoint.size,
      outlinePointsWithoutTraceableSectionCount: points.filter(
        (point) => !point.manuscriptSectionPresent,
      ).length,
    },
    issues,
  };
}

function workflowSummary(
  sermon: ExpositorySermon,
  persistedOutlineIds: readonly string[],
  traceability: ReturnType<typeof traceabilitySummary>,
) {
  const hydratedOutlineIds = sermon.outline.map((point) => point.id);
  const outlineMatchesPersistence = sameIds(
    persistedOutlineIds,
    hydratedOutlineIds,
  );
  const readyOutlinePoints = sermon.outline.filter((point, index) =>
    expositionReadiness(point, index === sermon.outline.length - 1),
  ).length;
  const manuscript = sermon.manuscript?.value.trim() ?? "";
  const deliveryNotes = sermon.deliveryNotes?.value.trim() ?? "";
  const outlineIds = new Set(hydratedOutlineIds);
  const orphanedSections = sermon.manuscriptSections.filter(
    (section) =>
      section.outlinePointId && !outlineIds.has(section.outlinePointId),
  );
  const issues: WorkflowIssue[] = [];

  if (!outlineMatchesPersistence) {
    issues.push({ code: "OUTLINE_HYDRATION_MISMATCH", severity: "error" });
  }
  if (persistedOutlineIds.length > 0 && hydratedOutlineIds.length === 0) {
    issues.push({ code: "EXPOSITION_OUTLINE_MISSING", severity: "error" });
  }
  if (orphanedSections.length > 0) {
    issues.push({ code: "MANUSCRIPT_SECTION_ORPHANED", severity: "warning" });
  }
  if (deliveryNotes && !manuscript) {
    issues.push({
      code: "DELIVERY_NOTES_WITHOUT_MANUSCRIPT",
      severity: "warning",
    });
  }
  if (sermon.manuscriptSections.length > 0 && !manuscript) {
    issues.push({
      code: "TRACEABLE_SECTIONS_WITHOUT_MANUSCRIPT",
      severity: "warning",
    });
  }
  issues.push(...traceability.issues);

  return {
    status: issues.some((issue) => issue.severity === "error")
      ? "attention_needed"
      : "ok",
    sermon: {
      id: sermon.id.value,
      teachingPlanLinked: Boolean(sermon.teachingPlanId),
    },
    preparation: {
      exists: true,
      bigIdeaDefined: Boolean(sermon.bigIdea),
      purposeDefined: Boolean(sermon.purpose),
      outlinePointCount: hydratedOutlineIds.length,
    },
    persistence: {
      persistedOutlinePointCount: persistedOutlineIds.length,
      hydratedOutlinePointCount: hydratedOutlineIds.length,
      outlineMatchesPersistence,
    },
    exposition: {
      outlinePointCount: hydratedOutlineIds.length,
      readyOutlinePointCount: readyOutlinePoints,
      incompleteOutlinePointCount:
        hydratedOutlineIds.length - readyOutlinePoints,
    },
    finalDraft: {
      manuscriptPresent: Boolean(manuscript),
      traceableSectionCount: sermon.manuscriptSections.length,
      orphanedSectionCount: orphanedSections.length,
    },
    delivery: {
      manuscriptAvailable: Boolean(manuscript),
      deliveryNotesPresent: Boolean(deliveryNotes),
      canOpenDeliveryMode: Boolean(manuscript),
    },
    traceability: {
      study: traceability.study,
      biblicalTheology: traceability.biblicalTheology,
      teaching: traceability.teaching,
      outline: traceability.outline,
      manuscript: traceability.manuscript,
    },
    issues,
  };
}

async function getWorkflowState(input: Record<string, unknown>) {
  const requestedStudyId = input.studyId;
  if (requestedStudyId !== undefined && typeof requestedStudyId !== "string") {
    return {
      status: "invalid_request",
      reason: "studyId must be a UUID string when provided.",
    };
  }

  const routeStudyId = new URLSearchParams(window.location.search).get(
    "studyId",
  );
  const studyId = requestedStudyId || routeStudyId;
  const studyIdSource = requestedStudyId
    ? "input"
    : routeStudyId
      ? "route"
      : "none";
  const context = {
    pathname: window.location.pathname,
    studyId: studyId ?? null,
    studyIdSource,
  };

  if (!studyId) {
    return { status: "study_required", context };
  }
  if (!UUID_PATTERN.test(studyId)) {
    return { status: "invalid_study_id", context };
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { status: "not_authenticated", context };
  }

  try {
    const sermonRepository = new SupabaseExpositorySermonRepository();
    const studyRepository = new SupabaseStudyRepository();
    const [study, sermon] = await Promise.all([
      studyRepository.find(StudyId.from(studyId)),
      sermonRepository.findByStudyId(studyId),
    ]);

    if (!study) {
      return {
        status: "study_not_available",
        context,
        study: { loaded: false },
      };
    }
    if (!sermon) {
      return {
        status: "no_sermon_preparation",
        context,
        study: { loaded: true },
        preparation: { exists: false, outlinePointCount: 0 },
      };
    }

    const [outlineResult, biblicalTheologyResult, teachingPlanResult] =
      await Promise.all([
        supabase
          .from("sermon_outline_points")
          .select("id")
          .eq("sermon_id", sermon.id.value)
          .order("position", { ascending: true }),
        supabase
          .from("biblical_theology_entries")
          .select("id, interpretation_ids")
          .eq("study_id", studyId),
        sermon.teachingPlanId
          ? supabase
              .from("teaching_plans")
              .select(
                "audience, central_truth, teaching_aim, explanation, key_points, response_prompt, supporting_interpretation_ids, supporting_biblical_theology_ids",
              )
              .eq("id", sermon.teachingPlanId)
              .eq("study_id", studyId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
    if (
      outlineResult.error ||
      biblicalTheologyResult.error ||
      teachingPlanResult.error
    ) {
      throw new Error("The workflow traceability state could not be read.");
    }

    const traceability = traceabilitySummary(
      study,
      sermon,
      (biblicalTheologyResult.data ?? []) as BiblicalTheologyTrace[],
      teachingPlanResult.data as TeachingPlanTrace | null,
    );

    return {
      context,
      study: { loaded: true },
      ...workflowSummary(
        sermon,
        (outlineResult.data ?? []).map((point) => point.id),
        traceability,
      ),
    };
  } catch {
    return {
      status: "unavailable",
      context,
      reason: "The authenticated workflow state could not be read.",
    };
  }
}

function withStudyId(path: string, studyId?: string) {
  if (!studyId) return path;
  const params = new URLSearchParams({ studyId });
  return `${path}?${params.toString()}`;
}

export function WebMcpTools() {
  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) return;

    const tools: WebMcpTool[] = [
      {
        name: "get_bsmp_browser_context",
        title: "Get BSMP browser context",
        description:
          "Return the current BSMP browser context and a privacy-safe summary of the authenticated Study and sermon workflow. It verifies persisted outline points, Study-to-sermon source references, Biblical Theology-to-Teaching links, and outline-to-manuscript traceability. It returns only IDs, counts, completion flags, and discrepancy codes; it never writes data or exposes sermon content.",
        inputSchema: {
          type: "object",
          properties: {
            studyId: {
              type: "string",
              format: "uuid",
              description:
                "Optional Study UUID. If omitted, the studyId from the current BSMP route is used.",
            },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: async (input) => ({
          origin: window.location.origin,
          pathname: window.location.pathname,
          search: window.location.search,
          workspaces: WORKSPACES,
          workflow: await getWorkflowState(input),
        }),
      },
      {
        name: "navigate_bsmp_workspace",
        title: "Navigate BSMP workspace",
        description:
          "Navigate the authenticated BSMP browser session to one of the supported study or sermon preparation workspaces. The existing BSMP authentication session remains responsible for access control.",
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
              description:
                "Optional Study UUID used by study-scoped workspaces.",
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
          window.location.assign(
            withStudyId(
              path,
              typeof studyId === "string" ? studyId : undefined,
            ),
          );
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
