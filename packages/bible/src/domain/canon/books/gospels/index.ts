export { Matthew } from "./Matthew.js";
export { Mark } from "./Mark.js";
export { Luke } from "./Luke.js";
export { John } from "./John.js";

import { Matthew } from "./Matthew.js";
import { Mark } from "./Mark.js";
import { Luke } from "./Luke.js";
import { John } from "./John.js";

export const gospels = [
    Matthew,
    Mark,
    Luke,
    John,
] as const;