import { ConnectingWordCategory } from "../../classification/index.js";

export const connectingWords = [
    {
        id: "CW-001",
        text: "Therefore",
        category: ConnectingWordCategory.Conclusion,
        meaning: "Introduces a conclusion drawn from previous statements.",
    },
    {
        id: "CW-002",
        text: "But",
        category: ConnectingWordCategory.Contrast,
        meaning: "Introduces a contrast or exception.",
    },
    {
        id: "CW-003",
        text: "Because",
        category: ConnectingWordCategory.Cause,
        meaning: "Introduces the reason or cause for something.",
    },
    {
        id: "CW-004",
        text: "If",
        category: ConnectingWordCategory.Condition,
        meaning: "Introduces a condition.",
    },
    {
        id: "CW-005",
        text: "Then",
        category: ConnectingWordCategory.Result,
        meaning: "Introduces the result of a condition or sequence.",
    },
    {
        id: "CW-006",
        text: "So that",
        category: ConnectingWordCategory.Purpose,
        meaning: "Introduces purpose or intended outcome.",
    },
    {
        id: "CW-007",
        text: "For",
        category: ConnectingWordCategory.Explanation,
        meaning: "Introduces an explanation.",
    },
    {
        id: "CW-008",
        text: "Since",
        category: ConnectingWordCategory.Cause,
        meaning: "Introduces a reason or basis.",
    },
    {
        id: "CW-009",
        text: "Although",
        category: ConnectingWordCategory.Contrast,
        meaning: "Introduces a concession or contrast.",
    },
    {
        id: "CW-010",
        text: "And",
        category: ConnectingWordCategory.Addition,
        meaning: "Adds another idea or statement.",
    },
] as const;