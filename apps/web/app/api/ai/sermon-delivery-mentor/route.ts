import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../../src/lib/database.types";
import { createSermonDeliveryMentorProvider } from "../../../../src/lib/sermonDeliveryMentorProvider";

interface RequestBody { studyId?: unknown; manuscript?: unknown; deliveryNotes?: unknown; }
type OutlineRow = { heading: string; truth: string; };
function requiredText(value: unknown, name: string): string { if (typeof value !== "string" || !value.trim()) throw new Error(`${name} is required.`); return value.trim(); }
function bearer(request: Request): string { const value = request.headers.get("authorization"); if (!value?.startsWith("Bearer ")) throw new Error("A signed-in Supabase session is required."); const token = value.slice(7).trim(); if (!token) throw new Error("A signed-in Supabase session is required."); return token; }
async function context(token: string) { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; if (!url || !key) throw new Error("Missing Supabase environment configuration."); const client = createClient<Database>(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } }); const { data, error } = await client.auth.getUser(token); if (error || !data.user) throw new Error("A valid signed-in Supabase session is required."); return { client, userId: data.user.id }; }
export async function POST(request: Request) {
  try {
    const token = bearer(request); const { client, userId } = await context(token); const body = await request.json() as RequestBody; const studyId = requiredText(body.studyId, "Study ID"); const manuscript = requiredText(body.manuscript, "Final manuscript"); const deliveryNotes = typeof body.deliveryNotes === "string" ? body.deliveryNotes.trim() : "";
    const { data: study, error: studyError } = await client.from("studies").select("id").eq("id", studyId).eq("user_id", userId).maybeSingle(); if (studyError) throw studyError; if (!study) throw new Error("The selected Study could not be found.");
    const { data: sermon, error: sermonError } = await client.from("expository_sermons").select("id, big_idea, purpose").eq("study_id", studyId).eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(); if (sermonError) throw sermonError; if (!sermon) throw new Error("No sermon preparation exists for the selected Study.");
    const { data: outlineRows, error: outlineError } = await client.from("sermon_outline_points").select("heading, truth").eq("sermon_id", sermon.id).order("position", { ascending: true }); if (outlineError) throw outlineError;
    const outline = ((outlineRows ?? []) as unknown as OutlineRow[]).map((point) => `${point.heading}\nTruth: ${point.truth}`);
    const result = await createSermonDeliveryMentorProvider().assess({ bigIdea: sermon.big_idea ?? "", purpose: sermon.purpose ?? "", manuscript, deliveryNotes, outline });
    return NextResponse.json(result);
  } catch (reason: unknown) { const message = reason instanceof Error ? reason.message : "Unable to run the sermon delivery mentor."; const status = /signed-in|session|Supabase|Study could not be found/i.test(message) ? 401 : /not configured|Unsupported AI_PROVIDER/i.test(message) ? 503 : 502; return NextResponse.json({ error: message }, { status }); }
}
