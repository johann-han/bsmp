import { createClient } from "@supabase/supabase-js";

import { assertAiQuotaAvailable } from "./aiQuota";

export type AiUsageStatus = "success" | "error";

export interface AiUsageEventInput {
    readonly userId: string;
    readonly studyId?: string | null | undefined;
    readonly feature: string;
    readonly operation?: string | undefined;
    readonly provider: string;
    readonly model: string;
    readonly status: AiUsageStatus;
    readonly durationMs?: number | null | undefined;
    readonly inputTokens?: number | null | undefined;
    readonly outputTokens?: number | null | undefined;
    readonly totalTokens?: number | null | undefined;
    readonly estimatedCostUsd?: number | null | undefined;
    readonly errorCode?: string | null | undefined;
    readonly metadata?: Record<string, unknown> | undefined;
}

export interface MeteredAiOperationInput<T> {
    readonly userId: string;
    readonly studyId?: string | null | undefined;
    readonly feature: string;
    readonly operation: string;
    readonly run: () => Promise<T>;
    readonly metadata?: Record<string, unknown> | undefined;
}

function serverClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) return null;

    return createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

/**
 * Best-effort server-side accounting. Missing service-role configuration does not
 * block an otherwise valid AI request, but production metering should provide it.
 */
export async function recordAiUsageEvent(input: AiUsageEventInput): Promise<boolean> {
    try {
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
    } catch {
        return false;
    }
}

/**
 * Wrap one provider call so successful and failed AI executions share the same
 * provider-neutral usage accounting path. Prompt and generated content are never
 * written to the ledger. A configured finite AI quota is checked before the
 * provider is called.
 */
export async function runMeteredAiOperation<T extends { readonly provider: string; readonly model: string }>(input: MeteredAiOperationInput<T>): Promise<T> {
    await assertAiQuotaAvailable(input.userId);
    const startedAt = Date.now();

    try {
        const result = await input.run();
        await recordAiUsageEvent({
            userId: input.userId,
            studyId: input.studyId,
            feature: input.feature,
            operation: input.operation,
            provider: result.provider,
            model: result.model,
            status: "success",
            durationMs: Date.now() - startedAt,
            metadata: input.metadata,
        });
        return result;
    } catch (reason: unknown) {
        await recordAiUsageEvent({
            userId: input.userId,
            studyId: input.studyId,
            feature: input.feature,
            operation: input.operation,
            provider: "unknown",
            model: "unknown",
            status: "error",
            durationMs: Date.now() - startedAt,
            errorCode: "ai_operation_error",
            metadata: input.metadata,
        });
        throw reason;
    }
}
