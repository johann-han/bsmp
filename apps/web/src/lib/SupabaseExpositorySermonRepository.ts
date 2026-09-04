import type { ExpositorySermonRepository } from "@bsmp/preaching";
import { ExpositorySermon, ExpositorySermonId, SermonBigIdea, SermonConclusion, SermonContext, SermonDeliveryNotes, SermonIntroduction, SermonManuscript, SermonPurpose, SermonTitle } from "@bsmp/preaching";
import { BookCode, ChapterNumber, Passage, VerseNumber, VerseReference } from "@bsmp/bible";
import { StudyId } from "@bsmp/study";
import { supabase } from "./supabase";

type DatabaseSermonRow = { id: string; study_id: string; user_id: string; title: string; big_idea: string | null; purpose: string | null; introduction?: string | null; context?: string | null; conclusion?: string | null; manuscript?: string | null; delivery_notes?: string | null; teaching_plan_id?: string | null; manuscript_sections?: unknown; created_at: string; };
type DatabaseOutlinePointRow = { id: string; sermon_id: string; user_id: string; heading: string; truth: string; position: number; text?: string | null; explanation?: string | null; illustration?: string | null; application?: string | null; transition?: string | null; text_observation_ids?: string[] | null; meaning_interpretation_ids?: string[] | null; meaning_evidence_ids?: string[] | null; response_application_ids?: string[] | null; supporting_observation_ids?: string[] | null; supporting_interpretation_ids?: string[] | null; supporting_evidence_ids?: string[] | null; supporting_application_ids?: string[] | null; supporting_biblical_theology_ids?: string[] | null; };
type ManuscriptSectionRow = { id?: unknown; title?: unknown; content?: unknown; outlinePointId?: unknown; };

function parseManuscriptSections(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value.flatMap((raw) => {
        if (!raw || typeof raw !== "object") return [];
        const section = raw as ManuscriptSectionRow;
        if (typeof section.id !== "string" || typeof section.title !== "string" || typeof section.content !== "string") return [];
        return [{ id: section.id, title: section.title, content: section.content, ...(typeof section.outlinePointId === "string" ? { outlinePointId: section.outlinePointId } : {}) }];
    });
}

export class SupabaseExpositorySermonRepository implements ExpositorySermonRepository {
    public async find(id: ExpositorySermonId): Promise<ExpositorySermon | undefined> { const { data, error } = await supabase.from("expository_sermons").select("*").eq("id", id.value).maybeSingle(); if (error) throw error; return data ? this.hydrate(data) : undefined; }
    public async findByStudyId(studyId: string): Promise<ExpositorySermon | undefined> { const { data, error } = await supabase.from("expository_sermons").select("*").eq("study_id", studyId).order("created_at", { ascending: false }).limit(1).maybeSingle(); if (error) throw error; return data ? this.hydrate(data) : undefined; }
    public async findAll(): Promise<readonly ExpositorySermon[]> { const { data, error } = await supabase.from("expository_sermons").select("*").order("created_at", { ascending: false }); if (error) throw error; return Promise.all((data ?? []).map((row) => this.hydrate(row))); }
    public async save(sermon: ExpositorySermon): Promise<void> {
        const { data: userData, error: userError } = await supabase.auth.getUser(); if (userError) throw userError; if (!userData.user) throw new Error("A signed-in Supabase user is required for sermon persistence.");
        if (sermon.teachingPlanId) {
            const { data: teachingPlan, error: teachingPlanError } = await supabase.from("teaching_plans").select("id, study_id").eq("id", sermon.teachingPlanId).eq("study_id", sermon.studyId.value).maybeSingle();
            if (teachingPlanError) throw teachingPlanError;
            if (!teachingPlan) throw new Error("The linked Teaching Plan must belong to the same Study as the sermon.");
        }
        const row = { id: sermon.id.value, study_id: sermon.studyId.value, user_id: userData.user.id, title: sermon.title.value, big_idea: sermon.bigIdea?.value ?? null, purpose: sermon.purpose?.value ?? null, introduction: sermon.introduction?.value ?? null, context: sermon.context?.value ?? null, conclusion: sermon.conclusion?.value ?? null, manuscript: sermon.manuscript?.value ?? null, delivery_notes: sermon.deliveryNotes?.value ?? null, teaching_plan_id: sermon.teachingPlanId ?? null, manuscript_sections: sermon.manuscriptSections, created_at: sermon.createdAt.toISOString() };
        const { error } = await supabase.from("expository_sermons").upsert(row as unknown as never); if (error) throw error;
        const { error: deleteError } = await supabase.from("sermon_outline_points").delete().eq("sermon_id", sermon.id.value); if (deleteError) throw deleteError;
        if (sermon.outline.length > 0) {
            const outlineRows = sermon.outline.map((point, index) => ({ id: point.id, sermon_id: sermon.id.value, user_id: userData.user!.id, heading: point.heading, truth: point.truth, position: index, text: point.text || null, explanation: point.explanation || null, illustration: point.illustration || null, application: point.application || null, transition: point.transition || null, text_observation_ids: [...point.textObservationIds], meaning_interpretation_ids: [...point.meaningInterpretationIds], meaning_evidence_ids: [...point.meaningEvidenceIds], response_application_ids: [...point.responseApplicationIds], supporting_observation_ids: [...point.supportingObservationIds], supporting_interpretation_ids: [...point.supportingInterpretationIds], supporting_evidence_ids: [...point.supportingEvidenceIds], supporting_application_ids: [...point.supportingApplicationIds], supporting_biblical_theology_ids: [...point.supportingBiblicalTheologyIds] }));
            const { error: outlineError } = await supabase.from("sermon_outline_points").insert(outlineRows as unknown as never); if (outlineError) throw outlineError;
        }
    }
    private async hydrate(row: DatabaseSermonRow): Promise<ExpositorySermon> {
        const { data: study, error: studyError } = await supabase.from("studies").select("*").eq("id", row.study_id).maybeSingle(); if (studyError) throw studyError; if (!study) throw new Error(`Study ${row.study_id} for sermon ${row.id} was not found.`);
        const start = VerseReference.create(BookCode.from(study.passage_start_book), ChapterNumber.of(study.passage_start_chapter), VerseNumber.from(study.passage_start_verse)); const end = VerseReference.create(BookCode.from(study.passage_end_book), ChapterNumber.of(study.passage_end_chapter), VerseNumber.from(study.passage_end_verse));
        const sermon = ExpositorySermon.create(ExpositorySermonId.create(row.id as `${string}-${string}-${string}-${string}-${string}`), StudyId.from(row.study_id), SermonTitle.from(row.title), Passage.create(start, end));
        if (row.big_idea) sermon.defineBigIdea(SermonBigIdea.from(row.big_idea)); if (row.purpose) sermon.definePurpose(SermonPurpose.from(row.purpose)); if (row.introduction) sermon.defineIntroduction(SermonIntroduction.from(row.introduction)); if (row.context) sermon.defineContext(SermonContext.from(row.context)); if (row.conclusion) sermon.defineConclusion(SermonConclusion.from(row.conclusion)); if (row.manuscript) sermon.defineManuscript(SermonManuscript.from(row.manuscript)); if (row.delivery_notes) sermon.defineDeliveryNotes(SermonDeliveryNotes.from(row.delivery_notes)); if (row.teaching_plan_id) sermon.defineTeachingPlan(row.teaching_plan_id);
        sermon.defineManuscriptSections(parseManuscriptSections(row.manuscript_sections));
        const { data: outlineRows, error: outlineError } = await supabase.from("sermon_outline_points").select("*").eq("sermon_id", row.id).order("position", { ascending: true }); if (outlineError) throw outlineError;
        for (const rawPoint of outlineRows ?? []) { const point = rawPoint as unknown as DatabaseOutlinePointRow; const pointId = point.id as `${string}-${string}-${string}-${string}-${string}`; sermon.addOutlinePoint(point.heading, point.truth, { supportingObservationIds: point.supporting_observation_ids ?? [], supportingInterpretationIds: point.supporting_interpretation_ids ?? [], supportingEvidenceIds: point.supporting_evidence_ids ?? [], supportingApplicationIds: point.supporting_application_ids ?? [], supportingBiblicalTheologyIds: point.supporting_biblical_theology_ids ?? [] }, pointId, { text: point.text ?? "", explanation: point.explanation ?? "", illustration: point.illustration ?? "", application: point.application ?? "", transition: point.transition ?? "", textObservationIds: point.text_observation_ids ?? [], meaningInterpretationIds: point.meaning_interpretation_ids ?? [], meaningEvidenceIds: point.meaning_evidence_ids ?? [], responseApplicationIds: point.response_application_ids ?? [] }); }
        return sermon;
    }
}
