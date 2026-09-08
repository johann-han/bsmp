import type { SermonOccurrence, SermonOccurrenceId } from "./SermonOccurrence.js";
import type { ExpositorySermonId } from "./ExpositorySermon.js";

export interface SermonOccurrenceRepository {
    find(id: SermonOccurrenceId): Promise<SermonOccurrence | undefined>;
    findBySermonId(sermonId: ExpositorySermonId): Promise<readonly SermonOccurrence[]>;
    save(occurrence: SermonOccurrence): Promise<void>;
    delete(id: SermonOccurrenceId): Promise<void>;
}
