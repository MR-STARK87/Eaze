// Eaze Engine - Browser Bundle
// This file bundles all Eaze engine components into a single file
// exposing them to window.EazeEngine

(function () {
  // ===== Error Classes =====
  class EazeError extends Error {
    constructor(message, line, column) {
      super(message);
      this.name = "EazeError";
      this.line = line;
      this.column = column;
    }

    toString() {
      const location = this.line
        ? ` (line ${this.line}${this.column ? `, col ${this.column}` : ""})`
        : "";
      return `❌ ${this.name}${location}: ${this.message}`;
    }
  }

  class LexerError extends EazeError {
    constructor(message, line, column) {
      super(message, line, column);
      this.name = "LexerError";
    }
  }

  class ParseError extends EazeError {
    constructor(message, line, column) {
      super(message, line, column);
      this.name = "ParseError";
    }
  }

  class RuntimeError extends EazeError {
    constructor(message, line, column) {
      super(message, line, column);
      this.name = "RuntimeError";
    }
  }

  // ===== Runtime Environment =====
  class Environment {
    constructor(parent = null) {
      this.variables = new Map();
      this.parent = parent;
    }

    set(name, value) {
      if (this.variables.has(name)) {
        this.variables.set(name, value);
        return;
      }
      if (this.parent !== null && this.parent.has(name)) {
        this.parent.set(name, value);
        return;
      }
      this.variables.set(name, value);
    }

    get(name, line, column) {
      if (this.variables.has(name)) {
        return this.variables.get(name);
      }

      if (this.parent !== null) {
        return this.parent.get(name, line, column);
      }

      throw new RuntimeError(`I don't know what '${name}' is`, line, column);
    }

    has(name) {
      if (this.variables.has(name)) {
        return true;
      }
      if (this.parent !== null) {
        return this.parent.has(name);
      }
      return false;
    }
  }

  // ===== Lexer =====
  const TokenType = {
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
    "say",
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

  class Lexer {
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
      return {
        type: TokenType.STRING,
        value,
        line: this.line,
        column: startCol,
      };
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

  // ===== Parser =====
  class Parser {
    constructor(tokens) {
      this.tokens = tokens;
      this.current = 0;
    }

    parse() {
      const body = [];
      while (!this.isAtEnd()) {
        if (this.match(TokenType.NEWLINE)) continue;
        body.push(this.parseStatement());
      }
      return { type: "Program", body };
    }

    parseStatement() {
      if (this.matchKeyword("set")) return this.parseSet();
      if (this.matchKeyword("show") || this.matchKeyword("say"))
        return this.parseShow();
      if (this.matchKeyword("repeat")) return this.parseRepeat();
      if (this.matchKeyword("while")) return this.parseWhile();
      if (this.matchKeyword("if")) return this.parseIf();
      if (this.matchKeyword("ask")) return this.parseAsk();
      if (this.matchKeyword("define")) return this.parseDefine();
      if (this.matchKeyword("return")) return this.parseReturn();
      if (this.checkKeyword("call")) {
        const startToken = this.peek();
        const expr = this.parseExpression();
        this.consumeStatementEnd();
        return {
          type: "ExpressionStatement",
          value: expr,
          loc: { line: startToken.line, column: startToken.column },
        };
      }

      throw this.error(this.peek(), `Unexpected token: '${this.peek().value}'`);
    }

    parseSet() {
      const startToken = this.previous();
      const target = this.parseAssignmentTarget();
      this.consumeKeyword("to", "Expected 'to' after variable name.");
      const value = this.parseExpression();
      this.consumeStatementEnd();

      return {
        type: "Assignment",
        target,
        value,
        loc: { line: startToken.line, column: startToken.column },
      };
    }

    parseAssignmentTarget() {
      const nameToken = this.consume(
        TokenType.IDENTIFIER,
        "Expected variable name.",
      );
      let target = { type: "Identifier", name: nameToken.value };

      if (this.matchOperator("[")) {
        const index = this.parseExpression();
        this.consumeOperator("]", "Expected ']' after array index.");
        target = { type: "IndexExpression", object: target, index };
      }

      return target;
    }

    parseShow() {
      const startToken = this.previous();
      const value = this.parseExpression();
      this.consumeStatementEnd();

      return {
        type: "Show",
        value,
        keyword: startToken.value,
        loc: { line: startToken.line, column: startToken.column },
      };
    }

    parseAsk() {
      const startToken = this.previous();
      const message = this.parseExpression();
      this.consumeKeyword("into", "Expected 'into' after ask message.");
      const identifierToken = this.consume(
        TokenType.IDENTIFIER,
        "Expected variable name after 'into'.",
      );
      this.consumeStatementEnd();

      return {
        type: "Ask",
        message,
        identifier: identifierToken.value,
        loc: { line: startToken.line, column: startToken.column },
      };
    }

    parseRepeat() {
      const startToken = this.previous();
      const times = this.parseExpression();
      this.consumeKeyword("times", "Expected 'times' after repeat count.");
      this.consumeStatementEnd();

      const body = this.parseBlock();

      return {
        type: "RepeatLoop",
        times,
        body,
        loc: { line: startToken.line, column: startToken.column },
      };
    }

    parseWhile() {
      const startToken = this.previous();
      const condition = this.parseExpression();
      this.consumeStatementEnd();

      const body = this.parseBlock();

      return {
        type: "WhileLoop",
        condition,
        body,
        loc: { line: startToken.line, column: startToken.column },
      };
    }

    parseIf() {
      const startToken = this.previous();
      const condition = this.parseExpression();
      this.consumeStatementEnd();

      const body = [];
      let elseBody = null;

      while (
        !this.isAtEnd() &&
        !this.checkKeyword("end") &&
        !this.checkKeyword("else")
      ) {
        if (this.match(TokenType.NEWLINE)) continue;
        body.push(this.parseStatement());
      }

      if (this.matchKeyword("else")) {
        this.consumeStatementEnd();
        elseBody = [];
        while (!this.isAtEnd() && !this.checkKeyword("end")) {
          if (this.match(TokenType.NEWLINE)) continue;
          elseBody.push(this.parseStatement());
        }
      }

      this.consumeKeyword("end", "Expected 'end' to close if block.");
      this.consumeStatementEnd();

      return {
        type: "IfStatement",
        condition,
        body,
        elseBody,
        loc: { line: startToken.line, column: startToken.column },
      };
    }

    parseDefine() {
      const startToken = this.previous();
      const nameToken = this.consume(
        TokenType.IDENTIFIER,
        "Expected function name after 'define'.",
      );
      this.consumeOperator("(", "Expected '(' after function name.");

      const params = [];
      if (!this.check(TokenType.OPERATOR) || this.peek().value !== ")") {
        do {
          const paramToken = this.consume(
            TokenType.IDENTIFIER,
            "Expected parameter name.",
          );
          params.push(paramToken.value);
        } while (this.matchOperator(","));
      }

      this.consumeOperator(")", "Expected ')' after parameters.");
      this.consumeStatementEnd();

      const body = this.parseBlock();

      return {
        type: "FunctionDeclaration",
        name: nameToken.value,
        params,
        body,
        loc: { line: startToken.line, column: startToken.column },
      };
    }

    parseReturn() {
      const startToken = this.previous();
      let value = null;
      if (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
        value = this.parseExpression();
      }
      this.consumeStatementEnd();

      return {
        type: "ReturnStatement",
        value,
        loc: { line: startToken.line, column: startToken.column },
      };
    }

    parseBlock() {
      const body = [];

      while (!this.isAtEnd() && !this.checkKeyword("end")) {
        if (this.match(TokenType.NEWLINE)) continue;
        body.push(this.parseStatement());
      }

      this.consumeKeyword("end", "Expected 'end' to close block.");
      this.consumeStatementEnd();

      return body;
    }

    parseExpression() {
      return this.parseLogicalOr();
    }

    parseLogicalOr() {
      let expr = this.parseLogicalAnd();

      while (this.matchKeyword("or")) {
        const right = this.parseLogicalAnd();
        expr = {
          type: "LogicalExpression",
          operator: "or",
          left: expr,
          right,
        };
      }

      return expr;
    }

    parseLogicalAnd() {
      let expr = this.parseComparison();

      while (this.matchKeyword("and")) {
        const right = this.parseComparison();
        expr = {
          type: "LogicalExpression",
          operator: "and",
          left: expr,
          right,
        };
      }

      return expr;
    }

    parseComparison() {
      let expr = this.parseAdditive();

      while (
        this.matchOperator("==") ||
        this.matchOperator("!=") ||
        this.matchOperator("<") ||
        this.matchOperator(">") ||
        this.matchOperator("<=") ||
        this.matchOperator(">=")
      ) {
        const operator = this.previous().value;
        const right = this.parseAdditive();
        expr = {
          type: "BinaryExpression",
          operator,
          left: expr,
          right,
        };
      }

      return expr;
    }

    parseAdditive() {
      let expr = this.parseMultiplicative();

      while (this.matchOperator("+") || this.matchOperator("-")) {
        const operator = this.previous().value;
        const right = this.parseMultiplicative();
        expr = {
          type: "BinaryExpression",
          operator,
          left: expr,
          right,
        };
      }

      return expr;
    }

    parseMultiplicative() {
      let expr = this.parseUnary();

      while (this.matchOperator("*") || this.matchOperator("/")) {
        const operator = this.previous().value;
        const right = this.parseUnary();
        expr = {
          type: "BinaryExpression",
          operator,
          left: expr,
          right,
        };
      }

      return expr;
    }

    parseUnary() {
      if (this.matchKeyword("not")) {
        const right = this.parseUnary();
        return {
          type: "UnaryExpression",
          operator: "not",
          right,
        };
      }
      if (this.matchOperator("-")) {
        const right = this.parseUnary();
        return {
          type: "UnaryExpression",
          operator: "-",
          right,
        };
      }
      return this.parseCallOrIndex();
    }

    parseCallOrIndex() {
      if (this.matchKeyword("call")) {
        const startToken = this.previous();
        const nameToken = this.consume(
          TokenType.IDENTIFIER,
          "Expected function name after 'call'.",
        );
        this.consumeOperator("(", "Expected '(' after function name.");

        const args = [];
        if (!this.check(TokenType.OPERATOR) || this.peek().value !== ")") {
          do {
            args.push(this.parseExpression());
          } while (this.matchOperator(","));
        }

        this.consumeOperator(")", "Expected ')' after arguments.");
        return {
          type: "FunctionCall",
          name: nameToken.value,
          arguments: args,
          loc: { line: startToken.line, column: startToken.column },
        };
      }

      let expr = this.parsePrimary();

      while (true) {
        if (this.matchOperator("[")) {
          const index = this.parseExpression();
          this.consumeOperator("]", "Expected ']' after array index.");
          expr = {
            type: "IndexExpression",
            object: expr,
            index,
          };
        } else {
          break;
        }
      }

      return expr;
    }

    parsePrimary() {
      if (this.match(TokenType.NUMBER)) {
        return { type: "NumberLiteral", value: this.previous().value };
      }

      if (this.match(TokenType.STRING)) {
        return { type: "StringLiteral", value: this.previous().value };
      }

      if (this.match(TokenType.IDENTIFIER)) {
        return { type: "Identifier", name: this.previous().value };
      }

      if (this.matchOperator("(")) {
        const expr = this.parseExpression();
        this.consumeOperator(")", "Expected ')' after expression.");
        return expr;
      }

      if (this.matchOperator("[")) {
        const elements = [];
        if (!this.check(TokenType.OPERATOR) || this.peek().value !== "]") {
          do {
            elements.push(this.parseExpression());
          } while (this.matchOperator(","));
        }
        this.consumeOperator("]", "Expected ']' after array elements.");
        return { type: "ArrayLiteral", elements };
      }

      throw this.error(
        this.peek(),
        `Expected expression, got '${this.peek().value}'`,
      );
    }

    // --- Helper Methods ---

    consumeStatementEnd() {
      if (this.isAtEnd()) return;
      if (this.match(TokenType.NEWLINE)) return;
      if (this.peek().type === TokenType.EOF) return;
      throw this.error(
        this.peek(),
        "Expected end of statement (newline or EOF).",
      );
    }

    match(type) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
      return false;
    }

    matchKeyword(keyword) {
      if (this.checkKeyword(keyword)) {
        this.advance();
        return true;
      }
      return false;
    }

    matchOperator(op) {
      if (this.check(TokenType.OPERATOR) && this.peek().value === op) {
        this.advance();
        return true;
      }
      return false;
    }

    check(type) {
      if (this.isAtEnd()) return false;
      return this.peek().type === type;
    }

    checkKeyword(keyword) {
      if (this.isAtEnd()) return false;
      return (
        this.peek().type === TokenType.KEYWORD && this.peek().value === keyword
      );
    }

    advance() {
      if (!this.isAtEnd()) this.current++;
      return this.previous();
    }

    isAtEnd() {
      return this.peek().type === TokenType.EOF;
    }

    peek() {
      return this.tokens[this.current];
    }

    previous() {
      return this.tokens[this.current - 1];
    }

    consume(type, message) {
      if (this.check(type)) return this.advance();
      throw this.error(this.peek(), message);
    }

    consumeKeyword(keyword, message) {
      if (this.checkKeyword(keyword)) return this.advance();
      throw this.error(this.peek(), message);
    }

    consumeOperator(op, message) {
      if (this.check(TokenType.OPERATOR) && this.peek().value === op)
        return this.advance();
      throw this.error(this.peek(), message);
    }

    error(token, message) {
      return new ParseError(message, token.line, token.column);
    }
  }

  // ===== Interpreter =====
  class ReturnValue {
    constructor(value) {
      this.value = value;
    }
  }

  class Interpreter {
    constructor() {
      this.globalEnv = new Environment();
      this.output = [];
      this.outputHandler = null;

      // --- Tracing (for kid-friendly visualization) ---
      this.trace = [];
      this.traceHandler = null;
      this.traceDepth = 0;
      this.traceLimit = 2000;
      this._traceTruncated = false;

      this.inputHandler = (message) => {
        // Default input handler if not overridden
        console.log(message);
        return "0";
      };
    }

    setInputHandler(handler) {
      this.inputHandler = handler;
    }

    setOutputHandler(handler) {
      this.outputHandler = handler;
    }

    setTraceHandler(handler) {
      this.traceHandler = handler;
    }

    setTraceLimit(limit) {
      if (typeof limit === "number" && isFinite(limit) && limit > 0) {
        this.traceLimit = limit;
      }
    }

    _formatValue(value) {
      if (value && typeof value === "object" && value.isFunction) {
        const params = Array.isArray(value.params)
          ? value.params.join(", ")
          : "";
        return `function ${value.name || "(anonymous)"}(${params})`;
      }
      if (typeof value === "string") return JSON.stringify(value);
      if (typeof value === "number" || typeof value === "boolean")
        return String(value);
      if (value === null) return "null";
      if (value === undefined) return "undefined";
      if (Array.isArray(value)) {
        const inside = value.map((v) => this._formatValue(v)).join(", ");
        return `[${inside}]`;
      }
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    _exprToString(node) {
      if (!node) return "";
      switch (node.type) {
        case "NumberLiteral":
          return String(node.value);
        case "StringLiteral":
          return JSON.stringify(node.value);
        case "Identifier":
          return node.name;
        case "BinaryExpression":
          return `${this._exprToString(node.left)} ${node.operator} ${this._exprToString(node.right)}`;
        case "LogicalExpression":
          return `${this._exprToString(node.left)} ${node.operator} ${this._exprToString(node.right)}`;
        case "UnaryExpression":
          return `${node.operator} ${this._exprToString(node.right)}`;
        case "ArrayLiteral":
          return `[${(node.elements || []).map((e) => this._exprToString(e)).join(", ")}]`;
        case "IndexExpression":
          return `${this._exprToString(node.object)}[${this._exprToString(node.index)}]`;
        case "FunctionCall":
          return `call ${node.name}(${(node.arguments || []).map((a) => this._exprToString(a)).join(", ")})`;
        default:
          return node.type;
      }
    }

    _targetToString(node) {
      if (!node) return "";
      if (node.type === "Identifier") return node.name;
      if (node.type === "IndexExpression") {
        return `${this._targetToString(node.object)}[${this._exprToString(node.index)}]`;
      }
      return node.type;
    }

    _snapshotGlobals() {
      const out = [];
      this.globalEnv.variables.forEach((value, name) => {
        out.push({ name, value: this._formatValue(value) });
      });
      out.sort((a, b) => a.name.localeCompare(b.name));
      return out;
    }

    _snapshotOutputTail(limit = 20) {
      const tail = this.output.slice(Math.max(0, this.output.length - limit));
      return tail.map((v) => this._formatValue(v));
    }

    _emitTrace(kind, payload = {}) {
      if (this.trace.length >= this.traceLimit) {
        if (!this._traceTruncated) {
          this._traceTruncated = true;
          const ev = {
            id: this.trace.length,
            kind: "truncated",
            depth: this.traceDepth,
            message: "(Trace stopped: program is too long. Try fewer loops.)",
            loc: payload.loc || null,
            globals: this._snapshotGlobals(),
            outputTail: this._snapshotOutputTail(),
          };
          this.trace.push(ev);
          if (this.traceHandler) {
            try {
              this.traceHandler(ev);
            } catch {}
          }
        }
        return;
      }

      const ev = {
        id: this.trace.length,
        kind,
        depth: this.traceDepth,
        message: payload.message || "",
        loc: payload.loc || null,
        globals: this._snapshotGlobals(),
        outputTail: this._snapshotOutputTail(),
        data: payload.data || null,
      };

      this.trace.push(ev);
      if (this.traceHandler) {
        try {
          this.traceHandler(ev);
        } catch {}
      }
    }

    async run(ast) {
      this.output = [];
      this.trace = [];
      this.traceDepth = 0;
      this._traceTruncated = false;

      this._emitTrace("start", { message: "Start" });

      try {
        await this.evaluate(ast, this.globalEnv);
        this._emitTrace("end", { message: "Finished" });
      } catch (e) {
        if (e instanceof ReturnValue) {
          const err = new RuntimeError("Return statement outside function");
          this._emitTrace("error", {
            message: err.toString(),
            loc: null,
          });
          throw err;
        }

        const loc =
          e && typeof e.line === "number"
            ? { line: e.line, column: e.column }
            : null;
        this._emitTrace("error", {
          message: e && e.toString ? e.toString() : String(e),
          loc,
        });

        throw e;
      }

      return this.output;
    }

    async evaluate(node, env) {
      if (!node) return null;

      switch (node.type) {
        case "Program":
          return await this.evaluateBlock(node.body, env);

        case "Assignment": {
          const targetStr = this._targetToString(node.target);
          const value = await this.evaluate(node.value, env);

          if (node.target.type === "Identifier") {
            const name = node.target.name;
            const hadBefore = env.has(name);
            const before = hadBefore ? env.get(name) : undefined;

            env.set(name, value);

            const inGlobal = this.globalEnv.has(name);
            this._emitTrace("set", {
              loc: node.loc || null,
              message: `Set ${name} to ${this._formatValue(value)}`,
              data: {
                name,
                target: targetStr,
                before: hadBefore ? this._formatValue(before) : "(new)",
                after: this._formatValue(value),
                scope: inGlobal ? "global" : "local",
              },
            });
          } else if (node.target.type === "IndexExpression") {
            const array = await this.evaluate(node.target.object, env);
            const index = await this.evaluate(node.target.index, env);
            if (!Array.isArray(array)) {
              throw new RuntimeError("Can only index arrays");
            }
            if (typeof index !== "number") {
              throw new RuntimeError("Array index must be a number");
            }
            const before = array[index];
            array[index] = value;
            this._emitTrace("set", {
              loc: node.loc || null,
              message: `Set ${targetStr} to ${this._formatValue(value)}`,
              data: {
                target: targetStr,
                index,
                before: this._formatValue(before),
                after: this._formatValue(value),
                scope: "array",
              },
            });
          } else {
            throw new RuntimeError("Invalid assignment target");
          }

          return value;
        }

        case "Show": {
          const value = await this.evaluate(node.value, env);
          this.output.push(value);
          if (this.outputHandler) {
            await this.outputHandler(value);
          }
          const verb = node.keyword === "show" ? "show" : "say";
          this._emitTrace("say", {
            loc: node.loc || null,
            message: `${verb === "show" ? "Show" : "Say"} ${this._formatValue(value)}`,
            data: { verb, value: this._formatValue(value) },
          });
          return null;
        }

        case "Ask": {
          const messageValue = await this.evaluate(node.message, env);
          let answer = this.inputHandler(messageValue);
          if (answer instanceof Promise) {
            answer = await answer;
          }
          // Attempt to parse to number if it looks like one
          const trimmedAnswer = String(answer).trim();
          const parsedNumber = parseFloat(trimmedAnswer);
          if (
            !isNaN(parsedNumber) &&
            isFinite(parsedNumber) &&
            trimmedAnswer !== ""
          ) {
            answer = parsedNumber;
          }
          env.set(node.identifier, answer);
          this._emitTrace("ask", {
            loc: node.loc || null,
            message: `Ask ${this._formatValue(messageValue)} → ${node.identifier} = ${this._formatValue(answer)}`,
            data: {
              prompt: this._formatValue(messageValue),
              identifier: node.identifier,
              value: this._formatValue(answer),
            },
          });
          return null;
        }

        case "RepeatLoop": {
          const times = await this.evaluate(node.times, env);
          if (typeof times !== "number") {
            throw new RuntimeError(
              `Repeat count must be a number, got ${typeof times}`,
            );
          }

          this._emitTrace("repeat", {
            loc: node.loc || null,
            message: `Repeat ${times} times`,
            data: { times },
          });

          for (let i = 0; i < times; i++) {
            this._emitTrace("loop", {
              loc: node.loc || null,
              message: `Loop ${i + 1} of ${times}`,
              data: { i: i + 1, times },
            });

            const loopEnv = new Environment(env);
            this.traceDepth++;
            try {
              await this.evaluateBlock(node.body, loopEnv);
            } finally {
              this.traceDepth--;
            }
          }

          this._emitTrace("repeat", {
            loc: node.loc || null,
            message: "Done repeating",
            data: { times },
          });

          return null;
        }

        case "WhileLoop": {
          const expr = this._exprToString(node.condition);
          this._emitTrace("while", {
            loc: node.loc || null,
            message: `While ${expr}`,
            data: { expr },
          });

          let iter = 0;
          while (await this.evaluate(node.condition, env)) {
            iter++;
            this._emitTrace("loop", {
              loc: node.loc || null,
              message: `While loop: time ${iter}`,
              data: { iter },
            });
            const loopEnv = new Environment(env);
            this.traceDepth++;
            try {
              await this.evaluateBlock(node.body, loopEnv);
            } finally {
              this.traceDepth--;
            }
          }

          this._emitTrace("while", {
            loc: node.loc || null,
            message: "Done with while loop",
            data: { iter },
          });

          return null;
        }

        case "IfStatement": {
          const condition = await this.evaluate(node.condition, env);
          const condText = this._exprToString(node.condition);

          this._emitTrace("if", {
            loc: node.loc || null,
            message: `If ${condText} is ${condition ? "true" : "false"}`,
            data: {
              expr: condText,
              condition: !!condition,
              hasElse: !!node.elseBody,
            },
          });

          if (condition) {
            const blockEnv = new Environment(env);
            this.traceDepth++;
            try {
              await this.evaluateBlock(node.body, blockEnv);
            } finally {
              this.traceDepth--;
            }
          } else if (node.elseBody) {
            const blockEnv = new Environment(env);
            this.traceDepth++;
            try {
              await this.evaluateBlock(node.elseBody, blockEnv);
            } finally {
              this.traceDepth--;
            }
          }
          return null;
        }

        case "ExpressionStatement": {
          return await this.evaluate(node.value, env);
        }

        case "FunctionDeclaration": {
          const fn = {
            isFunction: true,
            name: node.name,
            params: node.params,
            body: node.body,
            closure: env,
          };
          env.set(node.name, fn);
          const paramsText = Array.isArray(node.params)
            ? node.params.join(", ")
            : "";
          this._emitTrace("define", {
            loc: node.loc || null,
            message: `Define ${node.name}(${paramsText})`,
            data: {
              name: node.name,
              params: Array.isArray(node.params) ? node.params.slice() : [],
            },
          });
          return null;
        }

        case "FunctionCall": {
          const fn = env.get(node.name);
          if (!fn || !fn.isFunction) {
            throw new RuntimeError(`'${node.name}' is not a function`);
          }
          if (fn.params.length !== node.arguments.length) {
            throw new RuntimeError(
              `Function '${node.name}' expects ${fn.params.length} arguments but got ${node.arguments.length}`,
            );
          }

          const args = [];
          for (const a of node.arguments) {
            args.push(await this.evaluate(a, env));
          }
          const argsFormatted = args.map((v) => this._formatValue(v));

          this._emitTrace("call", {
            loc: node.loc || null,
            message: `Call ${node.name}(${argsFormatted.join(", ")})`,
            data: { name: node.name, args: argsFormatted },
          });

          const callEnv = new Environment(fn.closure);
          for (let i = 0; i < fn.params.length; i++) {
            callEnv.set(fn.params[i], args[i]);
          }

          this.traceDepth++;
          try {
            await this.evaluateBlock(fn.body, callEnv);
          } catch (e) {
            if (e instanceof ReturnValue) {
              this._emitTrace("return", {
                loc: node.loc || null,
                message: `Return ${this._formatValue(e.value)}`,
                data: { value: this._formatValue(e.value) },
              });
              return e.value;
            }
            throw e;
          } finally {
            this.traceDepth--;
          }

          this._emitTrace("return", {
            loc: node.loc || null,
            message: "Return null",
            data: { value: "null" },
          });

          return null;
        }

        case "ReturnStatement": {
          let value = null;
          if (node.value) {
            value = await this.evaluate(node.value, env);
          }
          this._emitTrace("return", {
            loc: node.loc || null,
            message: `Return ${this._formatValue(value)}`,
            data: { value: this._formatValue(value) },
          });
          throw new ReturnValue(value);
        }

        case "LogicalExpression": {
          const left = await this.evaluate(node.left, env);
          if (node.operator === "or") {
            if (left) return left;
            return await this.evaluate(node.right, env);
          } else if (node.operator === "and") {
            if (!left) return left;
            return await this.evaluate(node.right, env);
          }
          throw new RuntimeError(`Unknown logical operator: ${node.operator}`);
        }

        case "UnaryExpression": {
          const right = await this.evaluate(node.right, env);
          if (node.operator === "not") {
            return !right;
          } else if (node.operator === "-") {
            return -right;
          }
          throw new RuntimeError(`Unknown unary operator: ${node.operator}`);
        }

        case "BinaryExpression": {
          const left = await this.evaluate(node.left, env);
          const right = await this.evaluate(node.right, env);

          switch (node.operator) {
            case "+":
              return left + right;
            case "-":
              return left - right;
            case "*":
              return left * right;
            case "/":
              if (right === 0) throw new RuntimeError("Division by zero");
              return left / right;
            case "==":
              return left === right;
            case "!=":
              return left !== right;
            case "<":
              return left < right;
            case ">":
              return left > right;
            case "<=":
              return left <= right;
            case ">=":
              return left >= right;
            default:
              throw new RuntimeError(`Unknown operator: ${node.operator}`);
          }
        }

        case "ArrayLiteral": {
          const elements = [];
          for (const el of node.elements) {
            elements.push(await this.evaluate(el, env));
          }
          return elements;
        }

        case "IndexExpression": {
          const array = await this.evaluate(node.object, env);
          const index = await this.evaluate(node.index, env);
          if (!Array.isArray(array)) {
            throw new RuntimeError("Can only index arrays");
          }
          if (typeof index !== "number") {
            throw new RuntimeError("Array index must be a number");
          }
          return array[index];
        }

        case "NumberLiteral":
        case "StringLiteral":
          return node.value;

        case "Identifier":
          return env.get(node.name);

        default:
          throw new RuntimeError(`Unknown AST node type: ${node.type}`);
      }
    }

    async evaluateBlock(statements, env) {
      let result = null;
      for (const statement of statements) {
        result = await this.evaluate(statement, env);
      }
      return result;
    }
  }

  // ===== Expose to window.EazeEngine =====
  window.EazeEngine = {
    Lexer,
    Parser,
    Interpreter,
  };

  console.log("✅ Eaze Engine loaded successfully!");
})();
