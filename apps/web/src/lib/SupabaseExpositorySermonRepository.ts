import type { ExpositorySermonRepository } from "@bsmp/preaching";
import {
    ExpositorySermon,
    ExpositorySermonId,
    SermonBigIdea,
    SermonPurpose,
    SermonTitle,
} from "@bsmp/preaching";
import { BookCode, ChapterNumber, Passage, VerseNumber, VerseReference } from "@bsmp/bible";
import { StudyId } from "@bsmp/study";
import { supabase } from "./supabase";

export class SupabaseExpositorySermonRepository implements ExpositorySermonRepository {
    public async find(id: ExpositorySermonId): Promise<ExpositorySermon | undefined> {
        const { data, error } = await supabase.from("expository_sermons").select("*").eq("id", id.value).maybeSingle();
        if (error) throw error;
        return data ? this.hydrate(data) : undefined;
    }

    public async findByStudyId(studyId: string): Promise<ExpositorySermon | undefined> {
        const { data, error } = await supabase.from("expository_sermons").select("*").eq("study_id", studyId).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (error) throw error;
        return data ? this.hydrate(data) : undefined;
    }

    public async findAll(): Promise<readonly ExpositorySermon[]> {
        const { data, error } = await supabase.from("expository_sermons").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return Promise.all((data ?? []).map((row) => this.hydrate(row)));
    }

    public async save(sermon: ExpositorySermon): Promise<void> {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!userData.user) throw new Error("A signed-in Supabase user is required for sermon persistence.");

        const { error } = await supabase.from("expository_sermons").upsert({
            id: sermon.id.value,
            study_id: sermon.studyId.value,
            user_id: userData.user.id,
            title: sermon.title.value,
            big_idea: sermon.bigIdea?.value ?? null,
            purpose: sermon.purpose?.value ?? null,
            created_at: sermon.createdAt.toISOString(),
        });
        if (error) throw error;

        const { error: deleteError } = await supabase.from("sermon_outline_points").delete().eq("sermon_id", sermon.id.value);
        if (deleteError) throw deleteError;

        if (sermon.outline.length > 0) {
            const { error: outlineError } = await supabase.from("sermon_outline_points").insert(
                sermon.outline.map((point, index) => ({
                    id: point.id,
                    sermon_id: sermon.id.value,
                    user_id: userData.user!.id,
                    heading: point.heading,
                    truth: point.truth,
                    position: index,
                    supporting_observation_ids: [...point.supportingObservationIds],
                    supporting_interpretation_ids: [...point.supportingInterpretationIds],
                    supporting_evidence_ids: [...point.supportingEvidenceIds],
                    supporting_application_ids: [...point.supportingApplicationIds],
                })),
            );
            if (outlineError) throw outlineError;
        }
    }

    private async hydrate(row: DatabaseSermonRow): Promise<ExpositorySermon> {
        const { data: study, error: studyError } = await supabase.from("studies").select("*").eq("id", row.study_id).maybeSingle();
        if (studyError) throw studyError;
        if (!study) throw new Error(`Study ${row.study_id} for sermon ${row.id} was not found.`);

        const start = VerseReference.create(
            BookCode.from(study.passage_start_book),
            ChapterNumber.of(study.passage_start_chapter),
            VerseNumber.from(study.passage_start_verse),
        );
        const end = VerseReference.create(
            BookCode.from(study.passage_end_book),
            ChapterNumber.of(study.passage_end_chapter),
            VerseNumber.from(study.passage_end_verse),
        );
        const sermon = ExpositorySermon.create(
            ExpositorySermonId.create(row.id as `${string}-${string}-${string}-${string}-${string}`),
            StudyId.from(row.study_id),
            SermonTitle.from(row.title),
            Passage.create(start, end),
        );

        if (row.big_idea) sermon.defineBigIdea(SermonBigIdea.from(row.big_idea));
        if (row.purpose) sermon.definePurpose(SermonPurpose.from(row.purpose));

        const { data: outlineRows, error: outlineError } = await supabase.from("sermon_outline_points").select("*").eq("sermon_id", row.id).order("position", { ascending: true });
        if (outlineError) throw outlineError;
        for (const point of outlineRows ?? []) {
            sermon.addOutlinePoint(
                point.heading,
                point.truth,
                {
                    supportingObservationIds: point.supporting_observation_ids ?? [],
                    supportingInterpretationIds: point.supporting_interpretation_ids ?? [],
                    supportingEvidenceIds: point.supporting_evidence_ids ?? [],
                    supportingApplicationIds: point.supporting_application_ids ?? [],
                },
                point.id,
            );
        }
        return sermon;
    }
}

type DatabaseSermonRow = {
    id: string;
    study_id: string;
    user_id: string;
    title: string;
    big_idea: string | null;
    purpose: string | null;
    created_at: string;
};
