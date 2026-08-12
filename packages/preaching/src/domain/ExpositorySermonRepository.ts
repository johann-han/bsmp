import type { ExpositorySermon, ExpositorySermonId } from "./ExpositorySermon.js";

export interface ExpositorySermonRepository {
    find(id: ExpositorySermonId): Promise<ExpositorySermon | undefined>;
    findByStudyId(studyId: string): Promise<ExpositorySermon | undefined>;
    findAll(): Promise<readonly ExpositorySermon[]>;
    save(sermon: ExpositorySermon): Promise<void>;
}
