export { Job } from "./Job.js";
export { Psalms } from "./Psalms.js";
export { Proverbs } from "./Proverbs.js";
export { Ecclesiastes } from "./Ecclesiastes.js";
export { SongOfSongs } from "./SongOfSongs.js";

import { Job } from "./Job.js";
import { Psalms } from "./Psalms.js";
import { Proverbs } from "./Proverbs.js";
import { Ecclesiastes } from "./Ecclesiastes.js";
import { SongOfSongs } from "./SongOfSongs.js";

export const wisdomLiterature = [
    Job,
    Psalms,
    Proverbs,
    Ecclesiastes,
    SongOfSongs,
] as const;