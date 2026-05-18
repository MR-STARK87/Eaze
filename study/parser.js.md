# `parser.js` — Engine study notes

## Purpose in the engine
The parser turns a flat stream of tokens (from `lexer.js`) into an **AST (Abstract Syntax Tree)** that the interpreter (`interpreter.js`) can evaluate.

This is a hand-written recursive descent parser with explicit operator precedence for expressions.

---

## Imports
- `TokenType` from `./lexer.js`
  - Used to identify token categories (`KEYWORD`, `IDENTIFIER`, `OPERATOR`, etc.).
- `ParseError` from `./errors.js`
  - Used to produce structured parse errors with token `line`/`column`.

---

## AST shapes produced
The parser produces nodes with a `type` field and additional properties depending on the node.

Top-level:
- `Program`: `{ type: 'Program', body: Statement[] }`

Statements:
- `Assignment`: `{ type: 'Assignment', target, value }`
- `Show`: `{ type: 'Show', value }`
- `Ask`: `{ type: 'Ask', message, identifier }`
- `RepeatLoop`: `{ type: 'RepeatLoop', times, body }`
- `WhileLoop`: `{ type: 'WhileLoop', condition, body }`
- `IfStatement`: `{ type: 'IfStatement', condition, body, elseBody }`
- `FunctionDeclaration`: `{ type: 'FunctionDeclaration', name, params, body }`
- `ReturnStatement`: `{ type: 'ReturnStatement', value }`
- `ExpressionStatement`: `{ type: 'ExpressionStatement', value }`

Expressions:
- `LogicalExpression`: `{ type: 'LogicalExpression', operator: 'and'|'or', left, right }`
- `BinaryExpression`: `{ type: 'BinaryExpression', operator, left, right }`
- `UnaryExpression`: `{ type: 'UnaryExpression', operator: 'not'|'-', right }`
- `FunctionCall`: `{ type: 'FunctionCall', name, arguments }`
- `IndexExpression`: `{ type: 'IndexExpression', object, index }`
- `ArrayLiteral`: `{ type: 'ArrayLiteral', elements }`
- `Identifier`: `{ type: 'Identifier', name }`
- `NumberLiteral`: `{ type: 'NumberLiteral', value }`
- `StringLiteral`: `{ type: 'StringLiteral', value }`

---

## Exported API

## `class Parser`

### `constructor(tokens)`
- `tokens` is an array produced by `Lexer#tokenize()`.
- Initializes `this.current = 0` as the cursor index.

---

### `parse()`
Parses an entire program.

Algorithm:
- Create `body = []`.
- While not at end (`!isAtEnd()`):
  - Skip standalone newlines.
  - Otherwise parse one statement with `parseStatement()`.
- Return `{ type: 'Program', body }`.

This treats the whole input as a sequence of newline-separated statements.

---

## Statement parsing

### `parseStatement()`
Dispatches based on the next keyword:
- `set` → `parseSet()`
- `show` → `parseShow()`
- `repeat` → `parseRepeat()`
- `while` → `parseWhile()`
- `if` → `parseIf()`
- `ask` → `parseAsk()`
- `define` → `parseDefine()`
- `return` → `parseReturn()`

Special case: expression statement starting with `call`:
- If the next token is the keyword `call`, it parses an expression (`parseExpression()`), then enforces statement end, and wraps it in an `ExpressionStatement`.
- This is how a function call can appear “as a statement” (ignoring its return value).

If none match, it throws a `ParseError` pointing at the current token.

---

### `parseSet()`
Parses assignment statements of the form:
- `set <target> to <expression>`

Steps:
1. `target = parseAssignmentTarget()`
2. Consume keyword `to`.
3. Parse `value = parseExpression()`
4. Consume end-of-statement (`NEWLINE` or `EOF`).

Returns an `Assignment` AST node.

---

### `parseAssignmentTarget()`
Parses the left-hand side of `set ... to ...`.

Supported forms:
- Variable assignment: `set x to 5`
- Array index assignment: `set x[0] to 5`

Steps:
1. Consume an `IDENTIFIER` and create `{ type: 'Identifier', name }`.
2. If the next token is `[`:
   - Parse an expression for the index.
   - Require a closing `]`.
   - Wrap into `{ type: 'IndexExpression', object: <identifier>, index }`.

Note:
- This only supports a single bracket after the identifier. It does not loop for `x[0][1]` on assignment targets.

---

### `parseShow()`
Parses:
- `show <expression>`

Returns `{ type: 'Show', value }`.

---

### `parseAsk()`
Parses:
- `ask <expression> into <identifier>`

Steps:
1. Parse the message expression.
2. Consume keyword `into`.
3. Consume identifier token.
4. Consume statement end.

Returns `{ type: 'Ask', message, identifier: <string> }`.

---

### `parseRepeat()`
Parses a counted loop:
- `repeat <expression> times`
- followed by a newline
- followed by a block
- terminated by `end`

Steps:
1. Parse `times` expression.
2. Consume keyword `times`.
3. Consume statement end.
4. Parse `body = parseBlock()`.

Returns `{ type: 'RepeatLoop', times, body }`.

---

### `parseWhile()`
Parses:
- `while <expression>`
- newline
- block
- `end`

Steps:
1. Parse condition expression.
2. Consume statement end.
3. Parse `body = parseBlock()`.

Returns `{ type: 'WhileLoop', condition, body }`.

---

### `parseIf()`
Parses an if/else block:

- `if <expression>`
- newline
- statements...
- optional `else` block
- `end`

Implementation details:
- After parsing `condition`, it reads statements into `body` until it sees `else` or `end`.
- If it sees `else`, it consumes statement end, then reads statements into `elseBody` until `end`.
- Finally it consumes `end` and a statement end.

Returns `{ type: 'IfStatement', condition, body, elseBody }` where `elseBody` is either `null` or an array of statements.

---

### `parseDefine()`
Parses a function declaration:

- `define <name>(<params...>)`
- newline
- block
- `end`

Details:
1. Consume the function name (identifier).
2. Consume `(`.
3. Parse a comma-separated list of parameter identifiers until `)`.
4. Consume `)`.
5. Consume statement end.
6. Parse function body via `parseBlock()`.

Returns `{ type: 'FunctionDeclaration', name, params, body }`.

Notes:
- Parameter parsing is tolerant: if the next token is `)`, it accepts an empty parameter list.

---

### `parseReturn()`
Parses a return statement:
- `return` optionally followed by an expression.

Rules implemented:
- If the next token is not `NEWLINE` and not `EOF`, parse an expression as the return value.
- Otherwise the return value is `null`.
- Always consumes statement end.

Returns `{ type: 'ReturnStatement', value }`.

---

### `parseBlock()`
Parses a sequence of statements terminated by `end`.

Algorithm:
- Accumulate statements until the next keyword is `end`.
- Skip blank newlines.
- Consume `end` and then consume statement end.

This is used for `repeat`, `while`, and `define` bodies.

Important: `parseIf()` implements its own body parsing because it needs to stop on either `else` or `end`.

---

## Expression parsing and precedence
`parseExpression()` delegates to `parseLogicalOr()`, starting the precedence chain.

From lowest precedence to highest (loosest-binding to tightest-binding):
1. `or` (`parseLogicalOr`)
2. `and` (`parseLogicalAnd`)
3. comparisons (`==`, `!=`, `<`, `>`, `<=`, `>=`) (`parseComparison`)
4. additive (`+`, `-`) (`parseAdditive`)
5. multiplicative (`*`, `/`) (`parseMultiplicative`)
6. unary (`not`, unary `-`) (`parseUnary`)
7. calls and indexing (`parseCallOrIndex`)
8. primary literals and grouping (`parsePrimary`)

Each level uses a loop to parse left-associative chains.

### `parseLogicalOr()` / `parseLogicalAnd()`
Builds `LogicalExpression` nodes and preserves short-circuit semantics at the interpreter level.

### `parseComparison()` / `parseAdditive()` / `parseMultiplicative()`
Builds `BinaryExpression` nodes.

### `parseUnary()`
Builds `UnaryExpression` for:
- `not <expr>`
- `-<expr>`

Otherwise falls through to `parseCallOrIndex()`.

### `parseCallOrIndex()`
Supports two expression forms:

1. **Function call expression** starting with keyword `call`:
   - `call <identifier>(<args...>)`
   - Produces `{ type: 'FunctionCall', name, arguments }`.

2. **Indexing** on any primary expression:
   - `<expr>[<index>]` (can repeat, because the parser loops)
   - Produces nested `{ type: 'IndexExpression', object, index }`.

This design allows indexing an identifier, a function call result, or even an array literal.

### `parsePrimary()`
Handles the base cases:
- number literal → `NumberLiteral`
- string literal → `StringLiteral`
- identifier → `Identifier`
- parenthesized expression `( ... )`
- array literal `[a, b, c]` → `ArrayLiteral`

If none match, it throws `ParseError`.

---

## Statement termination

### `consumeStatementEnd()`
Enforces that statements end with either:
- a `NEWLINE`, or
- `EOF`

If neither is present, parsing fails.

This is what makes the language line-oriented.

---

## Helper methods (cursor management)

These are typical for a hand-written parser:
- `match(type)`: if next token is of `type`, advance and return true.
- `matchKeyword(keyword)`: same but for keyword tokens.
- `matchOperator(op)`: same but for operator tokens.
- `check(type)`: lookahead for token type without consuming.
- `checkKeyword(keyword)`: lookahead for keyword without consuming.
- `advance()`, `peek()`, `previous()`, `isAtEnd()`.
- `consume(type, message)`, `consumeKeyword(...)`, `consumeOperator(...)`:
  - “Assert next token is X; otherwise throw a `ParseError`.”

### `error(token, message)`
Creates a `ParseError(message, token.line, token.column)`.

This is the central place where token location becomes an error location.
