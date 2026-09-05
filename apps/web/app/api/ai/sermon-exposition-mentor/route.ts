import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../../src/lib/database.types";
import { createSermonExpositionMentorProvider } from "../../../../src/lib/sermonExpositionMentorProvider";

interface RequestBody {
  studyId?: unknown;
  truth?: unknown;
  text?: unknown;
  meaning?: unknown;
  preaching?: unknown;
  response?: unknown;
  transition?: unknown;
  observationIds?: unknown;
  interpretationIds?: unknown;
  evidenceIds?: unknown;
  applicationIds?: unknown;
  biblicalTheologyIds?: unknown;
}

function requiredText(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${name} is required.`);
  return value.trim();
}
function ids(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim()).map((item) => item.trim()) : []; }
function bearer(request: Request): string {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) throw new Error("A signed-in Supabase session is required.");
  const token = value.slice(7).trim();
  if (!token) throw new Error("A signed-in Supabase session is required.");
  return token;
}

async function context(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment configuration.");
  const client = createClient<Database>(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("A valid signed-in Supabase session is required.");
  return { client, userId: data.user.id };
}

function validateIds(requested: string[], returned: readonly { id: string }[]): boolean {
  const available = new Set(returned.map((row) => row.id));
  return requested.every((id) => available.has(id));
}

export async function POST(request: Request) {
  try {
    const token = bearer(request);
    const { client, userId } = await context(token);
    const body = await request.json() as RequestBody;
    const studyId = requiredText(body.studyId, "Study ID");
    const { data: study, error: studyError } = await client.from("studies").select("id").eq("id", studyId).eq("user_id", userId).maybeSingle();
    if (studyError) throw studyError;
    if (!study) throw new Error("The selected Study could not be found.");

    const observationIds = ids(body.observationIds);
    const interpretationIds = ids(body.interpretationIds);
    const evidenceIds = ids(body.evidenceIds);
    const applicationIds = ids(body.applicationIds);
    const biblicalTheologyIds = ids(body.biblicalTheologyIds);
    const missingId = "00000000-0000-0000-0000-000000000000";
    const [observationsResult, interpretationsResult, evidenceResult, applicationsResult, theologyResult] = await Promise.all([
      client.from("study_observations").select("id, statement").eq("study_id", studyId).in("id", observationIds.length ? observationIds : [missingId]),
      client.from("study_interpretations").select("id, statement").eq("study_id", studyId).in("id", interpretationIds.length ? interpretationIds : [missingId]),
      client.from("interpretation_evidence").select("id, description, type").eq("study_id", studyId).in("id", evidenceIds.length ? evidenceIds : [missingId]),
      client.from("study_applications").select("id, principle, action").eq("study_id", studyId).in("id", applicationIds.length ? applicationIds : [missingId]),
      client.from("biblical_theology_entries").select("id, theme, synthesis").eq("study_id", studyId).in("id", biblicalTheologyIds.length ? biblicalTheologyIds : [missingId]),
    ]);
    for (const result of [observationsResult, interpretationsResult, evidenceResult, applicationsResult, theologyResult]) if (result.error) throw result.error;
    if (!validateIds(observationIds, observationsResult.data ?? []) || !validateIds(interpretationIds, interpretationsResult.data ?? []) || !validateIds(evidenceIds, evidenceResult.data ?? []) || !validateIds(applicationIds, applicationsResult.data ?? []) || !validateIds(biblicalTheologyIds, theologyResult.data ?? [])) throw new Error("One or more Study support references are invalid for the selected Study.");

    const byId = <T extends { id: string }>(rows: readonly T[], selectedIds: readonly string[]) => {
      const map = new Map(rows.map((row) => [row.id, row]));
      return selectedIds.map((id) => map.get(id)).filter((row): row is T => Boolean(row));
    };
    const observations = byId(observationsResult.data ?? [], observationIds).map((row) => row.statement);
    const interpretations = byId(interpretationsResult.data ?? [], interpretationIds).map((row) => row.statement);
    const evidence = byId(evidenceResult.data ?? [], evidenceIds).map((row) => `${row.type}: ${row.description}`);
    const applications = byId(applicationsResult.data ?? [], applicationIds).map((row) => `${row.principle}: ${row.action}`);
    const biblicalTheology = byId(theologyResult.data ?? [], biblicalTheologyIds).map((row) => `${row.theme}: ${row.synthesis}`);

    const result = await createSermonExpositionMentorProvider().assess({
      truth: requiredText(body.truth, "Outline truth"),
      text: requiredText(body.text, "Text exposition"),
      meaning: requiredText(body.meaning, "Meaning exposition"),
      preaching: requiredText(body.preaching, "Preaching development"),
      response: requiredText(body.response, "Response development"),
      transition: typeof body.transition === "string" ? body.transition.trim() : "",
      observations,
      interpretations,
      evidence,
      applications,
      biblicalTheology,
    });
    return NextResponse.json(result);
  } catch (reason: unknown) {
    const message = reason instanceof Error ? reason.message : "Unable to run the sermon exposition mentor.";
    const status = /signed-in|session|Supabase|Study could not be found/i.test(message) ? 401 : /not configured|Unsupported AI_PROVIDER/i.test(message) ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
