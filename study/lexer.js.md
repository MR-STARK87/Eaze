# `lexer.js` — Engine study notes

## Purpose in the engine
The lexer (tokenizer) converts raw source text into a stream of **tokens**. The parser (`parser.js`) operates on tokens instead of characters.

This lexer is designed for a small, line-oriented language:
- Newlines are meaningful: they end statements.
- Comments start with `#` and run to end-of-line.
- Keywords are words like `set`, `show`, `repeat`, `end`, etc.
- Operators include arithmetic and punctuation like `+`, `==`, `(`, `)`, `[`, `]`, `,`.

---

## Imports
- `LexerError` from `./errors.js`
  - Thrown for invalid characters and unterminated strings.

---

## Token model

### `TokenType`
Exported constant object describing token categories:
- `KEYWORD`: Reserved words (e.g., `set`, `if`, `end`).
- `IDENTIFIER`: Variable/function names.
- `NUMBER`: Numeric literals.
- `STRING`: String literals.
- `OPERATOR`: Operators and punctuation (`+`, `==`, `(`, `[`, `,`, etc.).
- `NEWLINE`: A `\n` character.
- `EOF`: End-of-file marker.

Each produced token is a plain object with at least:
- `type`: one of `TokenType` values
- `value`: parsed value (number/string/operator text/etc.)
- `line`, `column`: source location (1-based)

---

## Language vocabulary tables

### `KEYWORDS`
A `Set` of reserved words recognized as `TokenType.KEYWORD`:

- `set`, `to`
- `show`
- `if`, `else`, `end`
- `repeat`, `times`
- `while`
- `and`, `or`, `not`
- `ask`, `into`
- `define`, `return`, `call`

Anything matching identifier rules but not in this set becomes an `IDENTIFIER`.

### `OPERATORS`
A `Set` of operator/punctuation strings recognized by `readOperator()`:

Arithmetic / comparison:
- `+`, `-`, `*`, `/`
- `==`, `!=`, `<`, `>`, `<=`, `>=`

Assignment and punctuation:
- `=` (note: parsing uses keyword-based assignment `set x to ...`, but `=` is still tokenized)
- `(`, `)`
- `[`, `]`
- `,`

`readOperator()` can return 1-character or 2-character operator tokens.

---

## Exported API

## `class Lexer`

### State tracked by the lexer
- `input`: the full source string
- `position`: current index into `input`
- `line`: current line number (starts at `1`)
- `column`: current column number (starts at `1`)

The lexer increments `position` and `column` for most characters, and increments `line` + resets `column` on newline.

---

### `tokenize()`
High-level API that returns an array of tokens.

Algorithm:
1. Initialize an empty array `tokens`.
2. Repeatedly call `nextToken()`.
3. Stop when `nextToken()` returns an `EOF` token.
4. Append the `EOF` token to the list.

This guarantees the parser can always safely look for an explicit end marker.

---

### `nextToken()`
Returns the next token from the input based on the current `position`.

Steps:
1. Calls `skipWhitespaceAndComments()` to ignore spaces/tabs/CR and `# ...` comments.
2. If `position` is at or past the end of input, returns an `EOF` token.
3. Reads the current character and dispatches:
   - `\n` → returns a `NEWLINE` token and advances line/column counters.
   - `[0-9]` → `readNumber()`
   - `[a-zA-Z_]` → `readIdentifierOrKeyword()`
   - `'"'` or `'\''` → `readString(quote)`
   - operator/punctuation characters (`[+\-*/=<>()[\],!]`) → `readOperator()`
4. If no rule matches, throws `LexerError("Unexpected character: ...")` with current `line`/`column`.

Important detail: Newlines are tokenized *before* whitespace skipping handles them (whitespace skipping does not consume `\n`). That’s why newlines remain meaningful to the parser.

---

### `skipWhitespaceAndComments()`
Advances the cursor over:
- Spaces (`' '`), tabs (`'\t'`), and carriage returns (`'\r'`)
- Comments that start with `#` and continue until `\n` or end-of-file

Behavior notes:
- For whitespace characters it consumes, it increments `position` and `column`.
- For comments, it advances `position` until a newline, but does not update `column` for each character in the comment.
  - This is “good enough” for most lexers because the next significant token starts after the newline.
  - If you wanted column-perfect positions after comments on the same line, you’d increment `column` inside the comment loop too.

---

### `readNumber()`
Consumes a run of characters matching `/[0-9.]/` and returns a `NUMBER` token.

Details:
- Records `startCol` so the token’s `column` points to the beginning of the number.
- Builds a string `value` and then returns `parseFloat(value)`.

Caveat:
- Because it accepts any sequence of digits and dots, inputs like `1..2` are consumed as one token and `parseFloat` will parse a prefix.
  - If you need stricter numeric syntax, you’d validate the string before parsing.

---

### `readIdentifierOrKeyword()`
Consumes `/[a-zA-Z0-9_]/` starting from an initial `[a-zA-Z_]`.

- If the resulting string is in `KEYWORDS`, returns a `KEYWORD` token.
- Otherwise returns an `IDENTIFIER` token.

This is the standard “keyword table” approach.

---

### `readString(quote)`
Parses a string literal delimited by either `'` or `"`.

Algorithm:
1. Skip the opening quote.
2. Consume characters until the same quote character is seen.
3. If EOF is reached first, throw `LexerError("Unterminated string")`.
4. Skip the closing quote.
5. Return a `STRING` token whose `value` is the raw content.

Caveats / simplifications:
- No escape sequences are supported (e.g., `\"` inside a `"..."` string will not work as an escape).
- Newlines inside strings are not handled specially; they would be consumed as part of the value until a closing quote appears (or EOF).

---

### `readOperator()`
Returns an `OPERATOR` token.

Algorithm:
1. Read the current character as `op`.
2. Look ahead one character and form `twoCharOp`.
3. If `twoCharOp` exists in `OPERATORS` and has length `2`, use it and consume the extra char.
4. Return token `{ type: OPERATOR, value: op, line, column: startCol }`.

This supports `==`, `!=`, `<=`, `>=` while still allowing single-character operators.

---

### `createToken(type, value)`
Small helper used mainly for `NEWLINE` and `EOF` tokens.

Returns a token object containing:
- `type`, `value`
- current `line`/`column`

Note: Some other token readers (`readNumber`, etc.) set `column` to the *start* column rather than current column.

---

## How the lexer and parser fit together
- The parser relies on `NEWLINE` tokens to determine statement boundaries.
- The lexer guarantees an `EOF` token so the parser can stop cleanly.
- Errors from the lexer are location-aware due to the tracked `line`/`column`.
