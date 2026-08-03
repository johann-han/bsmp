import { ParsedBook } from "./ParsedBook.js";

export class UsfmParser {

    public parse(
        usfm: string,
    ): ParsedBook {

        const lines = usfm
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0);

        let id = "";

        const chapters: ParsedBook["chapters"] = [];

        let currentChapter:
            ParsedBook["chapters"][number]
            | undefined;

        for (const line of lines) {

            if (line.startsWith("\\id ")) {

                id = line.substring(4).trim();

            } else if (line.startsWith("\\c ")) {

                currentChapter = {
                    number: Number(
                        line.substring(3).trim(),
                    ),
                    verses: [],
                };

                chapters.push(currentChapter);

            } else if (line.startsWith("\\v ")) {

                if (!currentChapter) {
                    throw new Error(
                        "Verse encountered before chapter.",
                    );
                }

                const content = line.substring(3);

                const firstSpace = content.indexOf(" ");

                const verseNumber = Number(
                    content.substring(0, firstSpace),
                );

                const text = content
                    .substring(firstSpace + 1)
                    .trim();

                currentChapter.verses.push({
                    number: verseNumber,
                    text,
                });

            }

        }

        return {
            id,
            chapters,
        };

    }

}