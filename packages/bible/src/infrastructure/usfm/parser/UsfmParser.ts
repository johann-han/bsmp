import { Token } from "../lexer/Token.js";
import { TokenType } from "../lexer/TokenType.js";
import { ParsedBook, ParsedChapter } from "./ParsedBook.js";

export class UsfmParser {

    public parse(
        tokens: readonly Token[],
    ): ParsedBook {

        let id = "";

        const chapters: ParsedChapter[] = [];

        let currentChapter: ParsedChapter | undefined;

        for (let i = 0; i < tokens.length; i++) {

            const token = tokens[i];

            if (!token) {
                continue;
            }

            if (token.type !== TokenType.Marker) {
                continue;
            }

            switch (token.value) {

                case "id": {

                    const text = tokens[++i];

                    if (!text) {
                        throw new Error("Missing book identifier.");
                    }

                    id = text.value;

                    break;
                }

                case "c": {

                    const text = tokens[++i];

                    if (!text) {
                        throw new Error("Missing chapter number.");
                    }

                    currentChapter = {
                        number: Number(text.value),
                        verses: [],
                    };

                    chapters.push(currentChapter);

                    break;
                }

                case "v": {

                    if (!currentChapter) {
                        throw new Error(
                            "Verse encountered before chapter.",
                        );
                    }

                    const text = tokens[++i];

                    if (!text) {
                        throw new Error("Missing verse.");
                    }

                    const firstSpace = text.value.indexOf(" ");

                    const verseNumber = Number(
                        text.value.substring(0, firstSpace),
                    );

                    const verseText = text.value
                        .substring(firstSpace + 1)
                        .trim();

                    currentChapter.verses.push({
                        number: verseNumber,
                        text: verseText,
                    });

                    break;
                }

            }

        }

        return {
            id,
            chapters,
        };

    }

}