import { Token } from "./Token.js";
import { TokenType } from "./TokenType.js";

export class UsfmLexer {

    public tokenize(
        usfm: string,
    ): readonly Token[] {

        const tokens: Token[] = [];

        const lines = usfm
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0);

        for (const line of lines) {

            if (!line.startsWith("\\")) {
                continue;
            }

            const content = line.substring(1).trim();

            const firstSpace = content.indexOf(" ");

            if (firstSpace === -1) {

                tokens.push({
                    type: TokenType.Marker,
                    value: content,
                });

                continue;
            }

            const marker = content.substring(0, firstSpace);
            const text = content.substring(firstSpace + 1).trim();

            tokens.push({
                type: TokenType.Marker,
                value: marker,
            });

            if (text.length > 0) {
                tokens.push({
                    type: TokenType.Text,
                    value: text,
                });
            }

        }

        return tokens;

    }

}