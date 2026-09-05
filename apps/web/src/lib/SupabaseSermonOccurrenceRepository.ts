import type { SermonOccurrenceRepository, SermonOccurrence, SermonOccurrenceId, SermonOccurrenceStatus, ExpositorySermonId } from "@bsmp/preaching";
import { SermonOccurrence as SermonOccurrenceEntity, SermonOccurrenceId as SermonOccurrenceIdValue, ExpositorySermonId as ExpositorySermonIdValue } from "@bsmp/preaching";
import { supabase } from "./supabase";

type Row = {
    id: string; sermon_id: string; user_id: string; scheduled_at: string; status: SermonOccurrenceStatus;
    venue: string; service_name: string; notes: string; preached_at: string | null; created_at: string;
};

function asUuid(value: string): `${string}-${string}-${string}-${string}-${string}` {
    return value as `${string}-${string}-${string}-${string}-${string}`;
}

export class SupabaseSermonOccurrenceRepository implements SermonOccurrenceRepository {
    public async find(id: SermonOccurrenceId): Promise<SermonOccurrence | undefined> {
        const { data, error } = await supabase.from("sermon_occurrences").select("*").eq("id", id.value).maybeSingle();
        if (error) throw error;
        return data ? this.hydrate(data as Row) : undefined;
    }

    public async findBySermonId(sermonId: ExpositorySermonId): Promise<readonly SermonOccurrence[]> {
        const { data, error } = await supabase.from("sermon_occurrences").select("*").eq("sermon_id", sermonId.value).order("scheduled_at", { ascending: false });
        if (error) throw error;
        return (data ?? []).map((row) => this.hydrate(row as Row));
    }

    public async save(occurrence: SermonOccurrence): Promise<void> {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!userData.user) throw new Error("A signed-in Supabase user is required for preaching history persistence.");
        const { error } = await supabase.from("sermon_occurrences").upsert({
            id: occurrence.id.value,
            sermon_id: occurrence.sermonId.value,
            user_id: userData.user.id,
            scheduled_at: occurrence.scheduledAt.toISOString(),
            status: occurrence.status,
            venue: occurrence.venue,
            service_name: occurrence.serviceName,
            notes: occurrence.notes,
            preached_at: occurrence.preachedAt?.toISOString() ?? null,
            created_at: occurrence.createdAt.toISOString(),
        } as never);
        if (error) throw error;
    }

    public async delete(id: SermonOccurrenceId): Promise<void> {
        const { error } = await supabase.from("sermon_occurrences").delete().eq("id", id.value);
        if (error) throw error;
    }

    private hydrate(row: Row): SermonOccurrence {
        const occurrence = SermonOccurrenceEntity.create(
            SermonOccurrenceIdValue.create(asUuid(row.id)),
            ExpositorySermonIdValue.create(asUuid(row.sermon_id)),
            new Date(row.scheduled_at),
            row.venue,
            row.service_name,
            row.notes,
        );
        if (row.status === "cancelled") occurrence.cancel();
        if (row.status === "completed") occurrence.markCompleted(row.preached_at ? new Date(row.preached_at) : new Date(row.scheduled_at));
        return occurrence;
    }
}
