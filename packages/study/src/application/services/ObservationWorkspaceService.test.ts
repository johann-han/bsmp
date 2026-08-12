import { describe, expect, it } from "vitest";

import {
    InMemoryConnectingWordRepository,
    InMemoryObservationQuestionRepository,
    ListConnectingWords,
    ListObservationQuestions,
} from "@bsmp/inductive";

import { ObservationWorkspaceService } from "./ObservationWorkspaceService.js";

describe("ObservationWorkspaceService", () => {

    it("loads the observation workspace", async () => {

        const observationRepository =
            new InMemoryObservationQuestionRepository();

        const connectingWordRepository =
            new InMemoryConnectingWordRepository();

        const service =
            new ObservationWorkspaceService(
                new ListObservationQuestions(
                    observationRepository,
                ),

                new ListConnectingWords(
                    connectingWordRepository,
                ),
            );

        const workspace =
            await service.load();

        expect(
            workspace.observationQuestions,
        ).toHaveLength(6);

        expect(
            workspace.connectingWords,
        ).toHaveLength(10);

    });

    it("returns presentation-ready observation questions", async () => {

        const service =
            new ObservationWorkspaceService(
                new ListObservationQuestions(
                    new InMemoryObservationQuestionRepository(),
                ),

                new ListConnectingWords(
                    new InMemoryConnectingWordRepository(),
                ),
            );

        const workspace =
            await service.load();

        const question =
            workspace.observationQuestions[0];

        expect(question).toEqual({
            id: "OBSQ-001",
            question: "Who?",
            purpose: expect.any(String),
        });

    });

    it("returns presentation-ready connecting words", async () => {

        const service =
            new ObservationWorkspaceService(
                new ListObservationQuestions(
                    new InMemoryObservationQuestionRepository(),
                ),

                new ListConnectingWords(
                    new InMemoryConnectingWordRepository(),
                ),
            );

        const workspace =
            await service.load();

        const word =
            workspace.connectingWords[0];

        expect(word).toEqual({
            id: "CW-001",
            text: "Therefore",
            category: "Conclusion",
            meaning: expect.any(String),
        });

    });

});