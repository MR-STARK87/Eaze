// Eaze Engine - Browser Bundle
// This file bundles all Eaze engine components into a single file
// exposing them to window.EazeEngine

(function() {
  // ===== Error Classes =====
  class EazeError extends Error {
    constructor(message, line, column) {
      super(message);
      this.name = 'EazeError';
      this.line = line;
      this.column = column;
    }

    toString() {
      const location = this.line ? ` (line ${this.line}${this.column ? `, col ${this.column}` : ''})` : '';
      return `❌ ${this.name}${location}: ${this.message}`;
    }
  }

  class LexerError extends EazeError {
    constructor(message, line, column) {
      super(message, line, column);
      this.name = 'LexerError';
    }
  }

  class ParseError extends EazeError {
    constructor(message, line, column) {
      super(message, line, column);
      this.name = 'ParseError';
    }
  }

  class RuntimeError extends EazeError {
    constructor(message, line, column) {
      super(message, line, column);
      this.name = 'RuntimeError';
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
      if (this.matchKeyword("show")) return this.parseShow();
      if (this.matchKeyword("repeat")) return this.parseRepeat();
      if (this.matchKeyword("while")) return this.parseWhile();
      if (this.matchKeyword("if")) return this.parseIf();
      if (this.matchKeyword("ask")) return this.parseAsk();
      if (this.matchKeyword("define")) return this.parseDefine();
      if (this.matchKeyword("return")) return this.parseReturn();
      if (this.checkKeyword("call")) {
        const expr = this.parseExpression();
        this.consumeStatementEnd();
        return {
          type: "ExpressionStatement",
          value: expr,
        };
      }

      throw this.error(this.peek(), `Unexpected token: '${this.peek().value}'`);
    }

    parseSet() {
      const target = this.parseAssignmentTarget();
      this.consumeKeyword("to", "Expected 'to' after variable name.");
      const value = this.parseExpression();
      this.consumeStatementEnd();

      return {
        type: "Assignment",
        target,
        value,
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
      const value = this.parseExpression();
      this.consumeStatementEnd();

      return {
        type: "Show",
        value,
      };
    }

    parseAsk() {
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
      };
    }

    parseRepeat() {
      const times = this.parseExpression();
      this.consumeKeyword("times", "Expected 'times' after repeat count.");
      this.consumeStatementEnd();

      const body = this.parseBlock();

      return {
        type: "RepeatLoop",
        times,
        body,
      };
    }

    parseWhile() {
      const condition = this.parseExpression();
      this.consumeStatementEnd();

      const body = this.parseBlock();

      return {
        type: "WhileLoop",
        condition,
        body,
      };
    }

    parseIf() {
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
      };
    }

    parseDefine() {
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
      };
    }

    parseReturn() {
      let value = null;
      if (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
        value = this.parseExpression();
      }
      this.consumeStatementEnd();

      return {
        type: "ReturnStatement",
        value,
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
      this.inputHandler = (message) => {
        // Default input handler if not overridden
        console.log(message);
        return "0";
      };
    }

    setInputHandler(handler) {
      this.inputHandler = handler;
    }

    run(ast) {
      this.output = [];
      try {
        this.evaluate(ast, this.globalEnv);
      } catch (e) {
        if (e instanceof ReturnValue) {
          throw new RuntimeError("Return statement outside function");
        }
        throw e;
      }
      return this.output;
    }

    evaluate(node, env) {
      if (!node) return null;

      switch (node.type) {
        case "Program":
          return this.evaluateBlock(node.body, env);

        case "Assignment": {
          const value = this.evaluate(node.value, env);
          if (node.target.type === "Identifier") {
            env.set(node.target.name, value);
          } else if (node.target.type === "IndexExpression") {
            const array = this.evaluate(node.target.object, env);
            const index = this.evaluate(node.target.index, env);
            if (!Array.isArray(array)) {
              throw new RuntimeError("Can only index arrays");
            }
            if (typeof index !== "number") {
              throw new RuntimeError("Array index must be a number");
            }
            array[index] = value;
          } else {
            throw new RuntimeError("Invalid assignment target");
          }
          return value;
        }

        case "Show": {
          const value = this.evaluate(node.value, env);
          this.output.push(value);
          return null;
        }

        case "Ask": {
          const message = this.evaluate(node.message, env);
          let answer = this.inputHandler(message);
          // Attempt to parse to number if it looks like one
          if (!isNaN(parseFloat(answer)) && isFinite(answer)) {
            answer = parseFloat(answer);
          }
          env.set(node.identifier, answer);
          return null;
        }

        case "RepeatLoop": {
          const times = this.evaluate(node.times, env);
          if (typeof times !== "number") {
            throw new RuntimeError(
              `Repeat count must be a number, got ${typeof times}`,
            );
          }
          for (let i = 0; i < times; i++) {
            const loopEnv = new Environment(env);
            this.evaluateBlock(node.body, loopEnv);
          }
          return null;
        }

        case "WhileLoop": {
          while (this.evaluate(node.condition, env)) {
            const loopEnv = new Environment(env);
            this.evaluateBlock(node.body, loopEnv);
          }
          return null;
        }

        case "IfStatement": {
          const condition = this.evaluate(node.condition, env);
          if (condition) {
            const blockEnv = new Environment(env);
            this.evaluateBlock(node.body, blockEnv);
          } else if (node.elseBody) {
            const blockEnv = new Environment(env);
            this.evaluateBlock(node.elseBody, blockEnv);
          }
          return null;
        }

        case "ExpressionStatement": {
          return this.evaluate(node.value, env);
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

          const callEnv = new Environment(fn.closure);
          for (let i = 0; i < fn.params.length; i++) {
            callEnv.set(fn.params[i], this.evaluate(node.arguments[i], env));
          }

          try {
            this.evaluateBlock(fn.body, callEnv);
          } catch (e) {
            if (e instanceof ReturnValue) {
              return e.value;
            }
            throw e;
          }
          return null;
        }

        case "ReturnStatement": {
          let value = null;
          if (node.value) {
            value = this.evaluate(node.value, env);
          }
          throw new ReturnValue(value);
        }

        case "LogicalExpression": {
          const left = this.evaluate(node.left, env);
          if (node.operator === "or") {
            if (left) return left;
            return this.evaluate(node.right, env);
          } else if (node.operator === "and") {
            if (!left) return left;
            return this.evaluate(node.right, env);
          }
          throw new RuntimeError(`Unknown logical operator: ${node.operator}`);
        }

        case "UnaryExpression": {
          const right = this.evaluate(node.right, env);
          if (node.operator === "not") {
            return !right;
          } else if (node.operator === "-") {
            return -right;
          }
          throw new RuntimeError(`Unknown unary operator: ${node.operator}`);
        }

        case "BinaryExpression": {
          const left = this.evaluate(node.left, env);
          const right = this.evaluate(node.right, env);

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
          return node.elements.map((el) => this.evaluate(el, env));
        }

        case "IndexExpression": {
          const array = this.evaluate(node.object, env);
          const index = this.evaluate(node.index, env);
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

    evaluateBlock(statements, env) {
      let result = null;
      for (const statement of statements) {
        result = this.evaluate(statement, env);
      }
      return result;
    }
  }

  // ===== Expose to window.EazeEngine =====
  window.EazeEngine = {
    Lexer,
    Parser,
    Interpreter,
    TokenType,
    Environment,
  };

  console.log("✅ Eaze Engine loaded successfully!");
})();
