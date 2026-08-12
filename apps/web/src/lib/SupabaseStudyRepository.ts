import type { StudyRepository, StudySession } from "@bsmp/study";
import {
    Observation,
    ObservationId,
    ObservationStatement,
    ObservationVerseReference,
    StudyId,
    StudyTitle,
} from "@bsmp/study";
import { createStudyPassage } from "@bsmp/study";

import { supabase } from "./supabase.js";

export class SupabaseStudyRepository implements StudyRepository {
    public async find(id: StudyId): Promise<StudySession | undefined> {
        const user = await this.requireUser();

        const { data: study, error } = await supabase
            .from("studies")
            .select("*")
            .eq("id", id.toString())
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!study) {
            return undefined;
        }

        return this.hydrateStudy(study);
    }

    public async findAll(): Promise<readonly StudySession[]> {
        const user = await this.requireUser();

        const { data: studies, error } = await supabase
            .from("studies")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        return Promise.all(
            (studies ?? []).map((study) => this.hydrateStudy(study)),
        );
    }

    public async save(study: StudySession): Promise<void> {
        const user = await this.requireUser();
        const passage = study.passage;

        const { error: studyError } = await supabase
            .from("studies")
            .upsert({
                id: study.id.toString(),
                user_id: user.id,
                title: study.title.value,
                status: study.status.value,
                passage_start_book: passage.start.book.value,
                passage_start_chapter: passage.start.chapter.value,
                passage_start_verse: passage.start.verse.value,
                passage_end_book: passage.end.book.value,
                passage_end_chapter: passage.end.chapter.value,
                passage_end_verse: passage.end.verse.value,
                created_at: study.createdAt.toISOString(),
            });

        if (studyError) {
            throw studyError;
        }

        if (study.observations.length === 0) {
            return;
        }

        const { error: observationError } = await supabase
            .from("study_observations")
            .upsert(
                study.observations.map((observation) => ({
                    id: observation.id.toString(),
                    study_id: study.id.toString(),
                    user_id: user.id,
                    verse_book: observation.verseReference.value.book.value,
                    verse_chapter: observation.verseReference.value.chapter.value,
                    verse_verse: observation.verseReference.value.verse.value,
                    statement: observation.statement.value,
                    created_at: observation.createdAt.toISOString(),
                })),
            );

        if (observationError) {
            throw observationError;
        }
    }

    public async delete(id: StudyId): Promise<void> {
        const user = await this.requireUser();

        const { error } = await supabase
            .from("studies")
            .delete()
            .eq("id", id.toString())
            .eq("user_id", user.id);

        if (error) {
            throw error;
        }
    }

    private async hydrateStudy(row: DatabaseStudyRow): Promise<StudySession> {
        const passageService = createStudyPassage();

        const { data: observationRows, error } = await supabase
            .from("study_observations")
            .select("*")
            .eq("study_id", row.id)
            .order("created_at", { ascending: true });

        if (error) {
            throw error;
        }

        const study = StudySession.create(
            StudyId.from(row.id),
            StudyTitle.from(row.title),
            passageService.passageReference,
        );

        for (const observationRow of observationRows ?? []) {
            study.addObservation(
                Observation.create(
                    ObservationId.from(observationRow.id),
                    ObservationStatement.from(observationRow.statement),
                    ObservationVerseReference.from(
                        passageService.getVerseReference(
                            observationRow.verse_verse,
                        ),
                    ),
                ),
            );
        }

        return study;
    }

    private async requireUser() {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error(
                "A signed-in Supabase user is required for study persistence.",
            );
        }

        return data.user;
    }
}

type DatabaseStudyRow = {
    id: string;
    user_id: string;
    title: string;
    status: string;
    passage_start_book: string;
    passage_start_chapter: number;
    passage_start_verse: number;
    passage_end_book: string;
    passage_end_chapter: number;
    passage_end_verse: number;
    created_at: string;
};
