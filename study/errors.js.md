# `errors.js` — Engine study notes

## Purpose in the engine
This file defines a small error hierarchy used by every stage of the engine:

- **Lexing** (`lexer.js`) throws `LexerError`
- **Parsing** (`parser.js`) throws `ParseError`
- **Runtime evaluation** (`runtime.js`, `interpreter.js`) throws `RuntimeError`

All of them share a common shape (`message`, and optional `line`/`column`) so callers can report consistent, location-aware diagnostics.

---

## Exports

### `EazeError` (base class)
`EazeError` extends the built-in JavaScript `Error`.

#### `constructor(message, line, column)`
- **`message`**: Human-readable explanation of what went wrong.
- **`line`**: Source line number (int, expected 1-based) where the error occurred.
- **`column`**: Source column number (int, expected 1-based) where the error occurred.

Implementation details:
- Calls `super(message)` to initialize the underlying `Error`.
- Sets `this.name = 'EazeError'` so error classification is visible in logs and stringification.
- Copies `line` and `column` onto the instance.

This makes the error instance both:
- A standard `Error` (has stack trace, message, etc.)
- A structured diagnostic (can show “line/col” reliably)

#### `toString()`
Returns a formatted string intended for display.

Key behaviors:
- Builds a `location` suffix only if `this.line` is truthy.
  - If a `column` is also present/truthy, it prints `line X, col Y`.
  - If only `line` is present, it prints just `line X`.
- Produces a final message like:
  - `❌ RuntimeError (line 3, col 10): Division by zero`

Notes:
- The `line`/`column` checks use JavaScript truthiness.
  - That’s fine given this engine tracks `line`/`column` starting at `1`.
  - If you ever pass `0`, it would be omitted.

---

### `LexerError`
Specialization of `EazeError` used by the lexer.

#### `constructor(message, line, column)`
- Delegates to `super(message, line, column)`.
- Then overrides `this.name = 'LexerError'`.

This is mainly for categorization—behavior and structure remain identical to `EazeError`.

---

### `ParseError`
Specialization of `EazeError` used by the parser.

#### `constructor(message, line, column)`
- Delegates to `super(message, line, column)`.
- Overrides `this.name = 'ParseError'`.

---

### `RuntimeError`
Specialization of `EazeError` used during interpretation/execution.

#### `constructor(message, line, column)`
- Delegates to `super(message, line, column)`.
- Overrides `this.name = 'RuntimeError'`.

---

## How other files use these errors
- `lexer.js` throws `LexerError` when it encounters an unexpected character or an unterminated string.
- `parser.js` constructs `ParseError` via `Parser#error(token, message)` and includes token `line`/`column`.
- `runtime.js` throws `RuntimeError` for undefined variables.
- `interpreter.js` throws `RuntimeError` for semantic/runtime issues (division by zero, indexing a non-array, calling non-functions, `return` outside function, etc.).
