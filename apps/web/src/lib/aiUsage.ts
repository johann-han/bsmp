import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

export type AiUsageStatus = "success" | "error";

export interface AiUsageEventInput {
    readonly userId: string;
    readonly studyId?: string | null;
    readonly feature: string;
    readonly operation?: string;
    readonly provider: string;
    readonly model: string;
    readonly status: AiUsageStatus;
    readonly durationMs?: number | null;
    readonly inputTokens?: number | null;
    readonly outputTokens?: number | null;
    readonly totalTokens?: number | null;
    readonly estimatedCostUsd?: number | null;
    readonly errorCode?: string | null;
    readonly metadata?: Record<string, unknown>;
}

function serverClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) return null;

    return createClient<Database>(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

/**
 * Best-effort server-side accounting. Missing service-role configuration does not
 * block an otherwise valid AI request, but production metering should provide it.
 */
export async function recordAiUsageEvent(input: AiUsageEventInput): Promise<boolean> {
    const client = serverClient();
    if (!client) return false;

    const { error } = await client.from("ai_usage_events").insert({
        user_id: input.userId,
        study_id: input.studyId ?? null,
        feature: input.feature,
        operation: input.operation ?? "generate",
        provider: input.provider,
        model: input.model,
        status: input.status,
        duration_ms: input.durationMs ?? null,
        input_tokens: input.inputTokens ?? null,
        output_tokens: input.outputTokens ?? null,
        total_tokens: input.totalTokens ?? null,
        estimated_cost_usd: input.estimatedCostUsd ?? null,
        error_code: input.errorCode ?? null,
        metadata: input.metadata ?? {},
    });

    return !error;
}
