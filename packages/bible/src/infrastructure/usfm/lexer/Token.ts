import { TokenType } from "./TokenType.js";

export interface Token {
    type: TokenType;
    value: string;
}