import { TokenType } from "./lexer.js";
import { ParseError } from "./errors.js";

export class Parser {
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
