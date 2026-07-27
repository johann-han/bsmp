export { Genesis } from "./Genesis.js";
export { Exodus } from "./Exodus.js";
export { Leviticus } from "./Leviticus.js";
export { Numbers } from "./Numbers.js";
export { Deuteronomy } from "./Deuteronomy.js";

import { Genesis } from "./Genesis.js";
import { Exodus } from "./Exodus.js";
import { Leviticus } from "./Leviticus.js";
import { Numbers } from "./Numbers.js";
import { Deuteronomy } from "./Deuteronomy.js";

export const pentateuch = [
    Genesis,
    Exodus,
    Leviticus,
    Numbers,
    Deuteronomy,
] as const;