import { ParsedBook } from "./ParsedBook.js";

export class UsfmParser {

    public parse(
        usfm: string,
    ): ParsedBook {

        const lines = usfm
            .split("\n")
            .map(line => line.trim());

        const idLine = lines.find(
            line => line.startsWith("\\id "),
        );

        if (!idLine) {
            throw new Error(
                "Missing \\id marker.",
            );
        }

        return {
            id: idLine.substring(4).trim(),
        };

    }

}