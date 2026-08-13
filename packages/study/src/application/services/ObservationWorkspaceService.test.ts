import { describe, expect, it } from "vitest";

import {
    InMemoryConnectingWordRepository,
    InMemoryObservationQuestionRepository,
    ListConnectingWords,
    ListObservationQuestions,
} from "@bsmp/inductive";
import { BookCode, ChapterNumber, Passage, VerseNumber, VerseReference } from "@bsmp/bible";

import { AddObservation } from "../commands/AddObservation.js";
import { StudySession } from "../../domain/aggregates/StudySession.js";
import { InMemoryStudyRepository } from "../../infrastructure/repositories/InMemoryStudyRepository.js";
import { StudyId, StudyTitle } from "../../domain/value-objects/index.js";
import { ObservationWorkspaceService } from "./ObservationWorkspaceService.js";

describe("ObservationWorkspaceService", () => {
    function createService() {
        const studyId = StudyId.create();
        const passage = Passage.create(
            VerseReference.create(
                BookCode.from("JHN"),
                ChapterNumber.of(15),
                VerseNumber.from(1),
            ),
            VerseReference.create(
                BookCode.from("JHN"),
                ChapterNumber.of(15),
                VerseNumber.from(11),
            ),
        );

        const repository = new InMemoryStudyRepository([
            StudySession.create(
                studyId,
                StudyTitle.from("John 15 Observation Study"),
                passage,
            ),
        ]);

        return {
            service: new ObservationWorkspaceService(
                new ListObservationQuestions(
                    new InMemoryObservationQuestionRepository(),
                ),
                new ListConnectingWords(
                    new InMemoryConnectingWordRepository(),
                ),
                new AddObservation(repository),
                studyId,
                repository,
            ),
            verseReference: VerseReference.create(
                BookCode.from("JHN"),
                ChapterNumber.of(15),
                VerseNumber.from(4),
            ),
        };
    }

    it("loads observation questions, connecting words, and observations", async () => {
        const { service } = createService();
        const workspace = await service.load();

        expect(workspace.observationQuestions).toHaveLength(6);
        expect(workspace.connectingWords).toHaveLength(10);
        expect(workspace.observations).toHaveLength(0);
    });

    it("maps saved observations into presentation-ready view models", async () => {
        const { service, verseReference } = createService();

        await service.addObservation(
            verseReference,
            "The command is to abide in Christ.",
        );

        const workspace = await service.load();

        expect(workspace.observations).toHaveLength(1);
        expect(workspace.observations[0]).toMatchObject({
            verseReference: "JHN 15:4",
            statement: "The command is to abide in Christ.",
        });
    });

    it("updates an observation while preserving its id and target", async () => {
        const { service, verseReference } = createService();

        const created = await service.addObservation(
            verseReference,
            "The command is to abide in Christ.",
            {
                translation: "asv",
                wordIndex: 1,
                wordText: "abide",
                markupSymbol: "N",
            },
        );

        await service.updateObservation(
            created.id.value,
            verseReference,
            "The repeated command emphasizes continuing dependence on Christ.",
            {
                translation: "asv",
                wordIndex: 1,
                wordText: "abide",
                markupSymbol: "N",
            },
        );

        const workspace = await service.load();
        expect(workspace.observations).toHaveLength(1);
        expect(workspace.observations[0]).toMatchObject({
            id: created.id.value,
            statement: "The repeated command emphasizes continuing dependence on Christ.",
            target: {
                translation: "asv",
                wordIndex: 1,
                wordText: "abide",
                markupSymbol: "N",
            },
        });
    });

    it("removes an observation that is not linked to an interpretation", async () => {
        const { service, verseReference } = createService();
        const created = await service.addObservation(verseReference, "Temporary observation.");

        await service.removeObservation(created.id.value);

        const workspace = await service.load();
        expect(workspace.observations).toHaveLength(0);
    });
});
