import { LexerError } from "./errors.js";

export const TokenType = {
  KEYWORD: "KEYWORD",
  IDENTIFIER: "IDENTIFIER",
  NUMBER: "NUMBER",
  STRING: "STRING",
  OPERATOR: "OPERATOR",
  NEWLINE: "NEWLINE",
  EOF: "EOF",
};

const KEYWORDS = new Set([
  "set",
  "to",
  "show",
  "if",
  "else",
  "end",
  "repeat",
  "times",
  "while",
  "and",
  "or",
  "not",
  "ask",
  "into",
  "define",
  "return",
  "call",
]);

const OPERATORS = new Set([
  "+",
  "-",
  "*",
  "/",
  "==",
  "!=",
  "<",
  ">",
  "<=",
  ">=",
  "=",
  "(",
  ")",
  "[",
  "]",
  ",",
]);

export class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;
  }

  tokenize() {
    const tokens = [];
    let token = this.nextToken();
    while (token.type !== TokenType.EOF) {
      tokens.push(token);
      token = this.nextToken();
    }
    tokens.push(token); // Push EOF
    return tokens;
  }

  nextToken() {
    this.skipWhitespaceAndComments();

    if (this.position >= this.input.length) {
      return this.createToken(TokenType.EOF, "EOF");
    }

    const char = this.input[this.position];

    // Newlines
    if (char === "\n") {
      const token = this.createToken(TokenType.NEWLINE, "\n");
      this.position++;
      this.line++;
      this.column = 1;
      return token;
    }

    // Numbers
    if (/[0-9]/.test(char)) {
      return this.readNumber();
    }

    // Identifiers and Keywords
    if (/[a-zA-Z_]/.test(char)) {
      return this.readIdentifierOrKeyword();
    }

    // Strings
    if (char === '"' || char === "'") {
      return this.readString(char);
    }

    // Operators and Punctuation
    if (/[+\-*/=<>()[\],!]/.test(char)) {
      return this.readOperator();
    }

    throw new LexerError(
      `Unexpected character: '${char}'`,
      this.line,
      this.column,
    );
  }

  skipWhitespaceAndComments() {
    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (char === " " || char === "\t" || char === "\r") {
        this.position++;
        this.column++;
      } else if (char === "#") {
        // Skip comment until newline
        while (
          this.position < this.input.length &&
          this.input[this.position] !== "\n"
        ) {
          this.position++;
        }
      } else {
        break;
      }
    }
  }

  readNumber() {
    let value = "";
    const startCol = this.column;
    while (
      this.position < this.input.length &&
      /[0-9.]/.test(this.input[this.position])
    ) {
      value += this.input[this.position];
      this.position++;
      this.column++;
    }
    return {
      type: TokenType.NUMBER,
      value: parseFloat(value),
      line: this.line,
      column: startCol,
    };
  }

  readIdentifierOrKeyword() {
    let value = "";
    const startCol = this.column;
    while (
      this.position < this.input.length &&
      /[a-zA-Z0-9_]/.test(this.input[this.position])
    ) {
      value += this.input[this.position];
      this.position++;
      this.column++;
    }

    if (KEYWORDS.has(value)) {
      return {
        type: TokenType.KEYWORD,
        value,
        line: this.line,
        column: startCol,
      };
    }
    return {
      type: TokenType.IDENTIFIER,
      value,
      line: this.line,
      column: startCol,
    };
  }

  readString(quote) {
    let value = "";
    const startCol = this.column;
    this.position++; // Skip opening quote
    this.column++;

    while (
      this.position < this.input.length &&
      this.input[this.position] !== quote
    ) {
      value += this.input[this.position];
      this.position++;
      this.column++;
    }

    if (this.position >= this.input.length) {
      throw new LexerError("Unterminated string", this.line, startCol);
    }

    this.position++; // Skip closing quote
    this.column++;
    return { type: TokenType.STRING, value, line: this.line, column: startCol };
  }

  readOperator() {
    const startCol = this.column;
    let op = this.input[this.position];
    this.position++;
    this.column++;

    // Check for two-character operators
    if (this.position < this.input.length) {
      const nextChar = this.input[this.position];
      const twoCharOp = op + nextChar;
      if (OPERATORS.has(twoCharOp) && twoCharOp.length === 2) {
        op = twoCharOp;
        this.position++;
        this.column++;
      }
    }

    return {
      type: TokenType.OPERATOR,
      value: op,
      line: this.line,
      column: startCol,
    };
  }

  createToken(type, value) {
    return { type, value, line: this.line, column: this.column };
  }
}
