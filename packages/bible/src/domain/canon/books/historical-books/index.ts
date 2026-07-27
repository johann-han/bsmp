export * from "../pentateuch/index.js";
export * from "../historical-books/index.js";

export { Joshua } from "./Joshua.js";

import { Ezra } from "./Ezra.js";
import { FirstChronicles } from "./FirstChronicles.js";
import { FirstKings } from "./FirstKings.js";
import { FirstSamuel } from "./FirstSamuel.js";
import { Joshua } from "./Joshua.js";
import { Judges } from "./Judges.js";
import { Nehemiah } from "./Nehemiah.js";
import { Ruth } from "./Ruth.js";
import { SecondChronicles } from "./SecondChronicles.js";
import { SecondKings } from "./SecondKings.js";
import { SecondSamuel } from "./SecondSamuel.js";

export const historicalBooks = [
    Joshua,
    Judges,
    Ruth,
    FirstSamuel,
    SecondSamuel,
    FirstKings,
    SecondKings,
    FirstChronicles,
    SecondChronicles,
    Ezra,
    Nehemiah,
] as const;