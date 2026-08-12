import type { SupabaseClient } from "@supabase/supabase-js";
import {
    BookCode,
    ChapterNumber,
    Passage,
    VerseNumber,
    VerseReference,
} from "@bsmp/bible";
import type { StudyRepository } from "@bsmp/study";
import {
    Application,
    ApplicationAction,
    ApplicationId,
    ApplicationMinistry,
    ApplicationPersonal,
    ApplicationPrinciple,
    Evidence,
    EvidenceDescription,
    EvidenceId,
    EvidenceType,
    Interpretation,
    InterpretationId,
    InterpretationStatement,
    Observation,
    ObservationId,
    ObservationStatement,
    ObservationVerseReference,
    StudyId,
    StudySession,
    StudyTitle,
} from "@bsmp/study";

import type { Database } from "./database.types";
import { supabase } from "./supabase";

export class SupabaseStudyRepository implements StudyRepository {
    public constructor(
        private readonly client: SupabaseClient<Database> = supabase,
    ) { }

    public async find(id: StudyId): Promise<StudySession | undefined> {
        const user = await this.requireUser();
        const { data: study, error } = await this.client.from("studies").select("*").eq("id", id.toString()).eq("user_id", user.id).maybeSingle();
        if (error) throw error;
        if (!study) return undefined;
        return this.hydrateStudy(study);
    }

    public async findAll(): Promise<readonly StudySession[]> {
        const user = await this.requireUser();
        const { data: studies, error } = await this.client.from("studies").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        if (error) throw error;
        return Promise.all((studies ?? []).map((study) => this.hydrateStudy(study)));
    }

    public async save(study: StudySession): Promise<void> {
        const user = await this.requireUser();
        const passage = study.passage;
        const { error: studyError } = await this.client.from("studies").upsert({
            id: study.id.toString(), user_id: user.id, title: study.title.value, status: study.status.value,
            passage_start_book: passage.start.book.value, passage_start_chapter: passage.start.chapter.value, passage_start_verse: passage.start.verse.value,
            passage_end_book: passage.end.book.value, passage_end_chapter: passage.end.chapter.value, passage_end_verse: passage.end.verse.value,
            created_at: study.createdAt.toISOString(),
        });
        if (studyError) throw studyError;

        if (study.observations.length > 0) {
            const { error } = await this.client.from("study_observations").upsert(study.observations.map((observation) => ({
                id: observation.id.toString(), study_id: study.id.toString(), user_id: user.id,
                verse_book: observation.verseReference.value.book.value, verse_chapter: observation.verseReference.value.chapter.value,
                verse_verse: observation.verseReference.value.verse.value, statement: observation.statement.value,
                created_at: observation.createdAt.toISOString(),
            })));
            if (error) throw error;
        }

        if (study.interpretations.length > 0) {
            const { error: interpretationError } = await this.client.from("study_interpretations").upsert(study.interpretations.map((interpretation) => ({
                id: interpretation.id.toString(), study_id: study.id.toString(), user_id: user.id,
                statement: interpretation.statement.value, created_at: interpretation.createdAt.toISOString(),
            })));
            if (interpretationError) throw interpretationError;

            const interpretationIds = study.interpretations.map((interpretation) => interpretation.id.toString());
            const { error: deleteLinksError } = await this.client.from("interpretation_observations").delete().in("interpretation_id", interpretationIds);
            if (deleteLinksError) throw deleteLinksError;

            const supportLinks = study.interpretations.flatMap((interpretation) => interpretation.observationIds.map((observationId) => ({
                interpretation_id: interpretation.id.toString(), observation_id: observationId.toString(),
            })));
            if (supportLinks.length > 0) {
                const { error } = await this.client.from("interpretation_observations").upsert(supportLinks, { onConflict: "interpretation_id,observation_id" });
                if (error) throw error;
            }

            const evidenceRows = study.interpretations.flatMap((interpretation) => interpretation.evidence.map((evidence) => ({
                id: evidence.id.toString(), interpretation_id: interpretation.id.toString(), study_id: study.id.toString(), user_id: user.id,
                evidence_type: evidence.type.value, description: evidence.description.value, created_at: evidence.createdAt.toISOString(),
            })));
            if (evidenceRows.length > 0) {
                const { error } = await this.client.from("interpretation_evidence").upsert(evidenceRows);
                if (error) throw error;
            }
        }

        if (study.applications.length > 0) {
            const { error } = await this.client.from("study_applications").upsert(study.applications.map((application) => ({
                id: application.id.toString(), study_id: study.id.toString(), interpretation_id: application.interpretationId.toString(),
                user_id: user.id, principle: application.principle.value, personal: application.personal.value,
                ministry: application.ministry.value, action: application.action.value, created_at: application.createdAt.toISOString(),
            })));
            if (error) throw error;
        }
    }

    public async delete(id: StudyId): Promise<void> {
        const user = await this.requireUser();
        const { error } = await this.client.from("studies").delete().eq("id", id.toString()).eq("user_id", user.id);
        if (error) throw error;
    }

    private async hydrateStudy(row: DatabaseStudyRow): Promise<StudySession> {
        const { data: observationRows, error: observationError } = await this.client.from("study_observations").select("*").eq("study_id", row.id).order("created_at", { ascending: true });
        if (observationError) throw observationError;
        const { data: interpretationRows, error: interpretationError } = await this.client.from("study_interpretations").select("*").eq("study_id", row.id).order("created_at", { ascending: true });
        if (interpretationError) throw interpretationError;
        const { data: evidenceRows, error: evidenceError } = await this.client.from("interpretation_evidence").select("*").eq("study_id", row.id).order("created_at", { ascending: true });
        if (evidenceError) throw evidenceError;
        const { data: applicationRows, error: applicationError } = await this.client.from("study_applications").select("*").eq("study_id", row.id).order("created_at", { ascending: true });
        if (applicationError) throw applicationError;

        const startBook = BookCode.from(row.passage_start_book);
        const startChapter = ChapterNumber.of(row.passage_start_chapter);
        const startVerse = VerseNumber.from(row.passage_start_verse);
        const endBook = BookCode.from(row.passage_end_book);
        const endChapter = ChapterNumber.of(row.passage_end_chapter);
        const endVerse = VerseNumber.from(row.passage_end_verse);

        const studyPassage = Passage.create(
            VerseReference.create(startBook, startChapter, startVerse),
            VerseReference.create(endBook, endChapter, endVerse),
        );

        const study = StudySession.create(
            StudyId.from(row.id),
            StudyTitle.from(row.title),
            studyPassage,
        );

        for (const observationRow of observationRows ?? []) {
            const observationReference = VerseReference.create(
                BookCode.from(observationRow.verse_book),
                ChapterNumber.of(observationRow.verse_chapter),
                VerseNumber.from(observationRow.verse_verse),
            );

            study.addObservation(Observation.create(
                ObservationId.from(observationRow.id), ObservationStatement.from(observationRow.statement),
                ObservationVerseReference.from(observationReference),
            ));
        }

        for (const interpretationRow of interpretationRows ?? []) {
            const { data: supportRows, error: supportError } = await this.client.from("interpretation_observations").select("observation_id").eq("interpretation_id", interpretationRow.id);
            if (supportError) throw supportError;
            const interpretationEvidence = (evidenceRows ?? []).filter((evidence) => evidence.interpretation_id === interpretationRow.id).map((evidence) => Evidence.create(
                EvidenceId.from(evidence.id), this.toEvidenceType(evidence.evidence_type), EvidenceDescription.from(evidence.description),
            ));
            study.addInterpretation(Interpretation.create(
                InterpretationId.from(interpretationRow.id), InterpretationStatement.from(interpretationRow.statement),
                (supportRows ?? []).map((support) => ObservationId.from(support.observation_id)), interpretationEvidence,
            ));
        }

        for (const applicationRow of applicationRows ?? []) {
            study.addApplication(Application.create(
                ApplicationId.from(applicationRow.id),
                InterpretationId.from(applicationRow.interpretation_id),
                ApplicationPrinciple.from(applicationRow.principle),
                ApplicationPersonal.from(applicationRow.personal),
                ApplicationMinistry.from(applicationRow.ministry),
                ApplicationAction.from(applicationRow.action),
            ));
        }

        return study;
    }

    private toEvidenceType(value: string): EvidenceType {
        switch (value) {
            case "Scripture": return EvidenceType.scripture();
            case "CrossReference": return EvidenceType.crossReference();
            case "OriginalLanguage": return EvidenceType.originalLanguage();
            case "Historical": return EvidenceType.historical();
            case "Geographical": return EvidenceType.geographical();
            case "Literary": return EvidenceType.literary();
            case "PersonalNote": return EvidenceType.personalNote();
            default: return EvidenceType.other();
        }
    }

    private async requireUser() {
        const { data, error } = await this.client.auth.getUser();
        if (error) throw error;
        if (!data.user) throw new Error("A signed-in Supabase user is required for study persistence.");
        return data.user;
    }
}

type DatabaseStudyRow = {
    id: string; user_id: string; title: string; status: string;
    passage_start_book: string; passage_start_chapter: number; passage_start_verse: number;
    passage_end_book: string; passage_end_chapter: number; passage_end_verse: number; created_at: string;
};
