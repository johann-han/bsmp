import { Canon } from "./Canon.js";
import { CanonDefinition } from "./CanonDefinition.js";
import { acts, generalEpistles, gospels, majorProphets, minorProphets, paulineEpistles, pentateuch, wisdomLiterature } from "./books/index.js";
import { historicalBooks } from "./books/index.js";
import { CanonId, CanonMetadata, } from "../value-objects/index.js";
import { revelation } from "./books/revelation/index.js";

export const ProtestantCanon = Canon.create(
    CanonDefinition.create({
        id: CanonId.protestant(),

        metadata: CanonMetadata.create({
            displayName: "Protestant Canon",
            shortName: "Protestant",
            description:
                "The sixty-six-book canon recognized by Protestant churches.",
        }),

        books: [
            ...pentateuch,
            ...historicalBooks,
            ...wisdomLiterature,
            ...majorProphets,
            ...minorProphets,
            ...gospels,
            ...acts,
            ...paulineEpistles,
            ...generalEpistles,
            ...revelation,
        ],
    }),
);
