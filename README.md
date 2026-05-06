# 🧠⚡ Eaze

> Eaze isn't just a language. It's a way to think in code. Less syntax. More ideas.

**Eaze** is a custom, beginner-friendly programming language with an English-like syntax designed to make coding intuitive and accessible for everyone. It comes with a full interpreter pipeline (Lexer → Parser → Interpreter), an interactive REPL with real-time variable tracking, a web-based playground, and an optional AI-powered assistant for debugging, explaining, and converting code.

---

## 📑 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Language Reference](#-language-reference)
  - [Variables](#variables)
  - [Data Types](#data-types)
  - [Operators](#operators)
  - [Output & Input](#output--input)
  - [Conditionals](#conditionals)
  - [Loops](#loops)
  - [Functions](#functions)
  - [Arrays](#arrays)
  - [Comments](#comments)
- [REPL Commands](#-repl-commands)
- [Running Files](#-running-files)
- [Example Programs](#-example-programs)
- [AI Assistant Server](#-ai-assistant-server-optional)
- [Web Playground](#-web-playground)
- [Error Handling](#-error-handling)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗣 **English-Like Syntax** | Readable keywords: `set`, `show`, `ask`, `repeat`, `define`, `call` |
| ⚡ **Interactive REPL** | Live code execution with color-coded output and multi-line support |
| 🔍 **Variable Inspector** | `vars` command shows all live variables and function signatures |
| 🔁 **Multi-line Blocks** | Loops, conditionals, and functions span multiple lines naturally |
| 🤖 **AI Assistant** | Optional OpenAI-powered backend for explaining, debugging, and converting code |
| 🌐 **Web Playground** | Browser-based editor with live output and AI integration |
| 📦 **Minimal Dependencies** | Core runtime only needs `chalk` and `figures` for styling |
| 🚀 **Standalone Binary Roadmap** | Plan in place to ship zero-dependency executables for Windows/macOS/Linux |

---

## 📁 Project Structure

```
Eaze/
├── cli/
│   └── index.js              # CLI entry point, REPL, and file execution
├── engine/
│   ├── lexer.js              # Tokenizer: source code → token stream
│   ├── parser.js             # Parser: tokens → Abstract Syntax Tree (AST)
│   ├── interpreter.js        # Tree-walking interpreter: AST → execution
│   ├── runtime.js            # Environment: variable scope management
│   └── errors.js             # Structured error types (Lexer/Parse/Runtime)
├── server/
│   └── index.js              # Express AI server (OpenAI integration)
├── examples/
│   ├── calculator.eaze       # Arithmetic calculator example
│   ├── fibonacci.eaze        # Fibonacci sequence generator
│   └── guessing_game.eaze    # Interactive number guessing game
├── Eaze Playground/
│   └── kids_code_editor.html # Browser-based code editor
├── documentation/
│   ├── ARCHITECTURE.md       # Detailed architecture documentation
│   ├── FEATURES.md           # Complete feature reference
│   ├── FUTURE_ENHANCEMENTS.md# Roadmap and enhancement ideas
│   └── COMPREHENSIVE_GUIDE.md# Full language guide
└── package.json
```

---

## 🏗 Architecture

Eaze implements a classic three-stage interpreter pipeline:

```
Source Code (.eaze file or REPL input)
        │
        ▼
  ┌───────────┐
  │   Lexer   │  ──►  Token Stream
  │ lexer.js  │       (KEYWORD, IDENTIFIER, NUMBER, STRING, OPERATOR, …)
  └───────────┘
        │
        ▼
  ┌───────────┐
  │  Parser   │  ──►  Abstract Syntax Tree (AST)
  │ parser.js │       (Assignment, ShowStmt, IfStatement, FunctionCall, …)
  └───────────┘
        │
        ▼
  ┌─────────────┐
  │ Interpreter │  ──►  Output / Side Effects
  │interpreter.js│      (tree-walking evaluator with scoped environments)
  └─────────────┘
```

**Key design decisions:**
- **Recursive Descent Parser** with precedence climbing for expressions
- **Tree-walking interpreter** using the Visitor pattern
- **Environment chain** for lexical scoping and closures
- **Exception-based return flow** (`ReturnValue` exception for `return` statements)

For the full architecture breakdown, see [documentation/ARCHITECTURE.md](documentation/ARCHITECTURE.md).

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/MR-STARK87/Eaze.git
cd Eaze

# 2. Install dependencies
npm install
```

### Start the Interactive REPL

```bash
npm start
# or
node cli/index.js
```

You'll see the Eaze welcome banner and a prompt:

```
  ╔══════════════════════════════════╗
  ║     🧠⚡ Welcome to Eaze         ║
  ╚══════════════════════════════════╝

  Eaze> 
```

### Run a `.eaze` File

```bash
node cli/index.js examples/fibonacci.eaze
```

---

## 📖 Language Reference

Eaze uses 17 keywords: `set`, `to`, `show`, `if`, `else`, `end`, `repeat`, `times`, `while`, `and`, `or`, `not`, `ask`, `into`, `define`, `return`, `call`.

### Variables

Variables are created and assigned with `set ... to`:

```eaze
set age to 25
set name to "Alice"
set price to 9.99
set total to age + price
```

Variables are mutable and can be reassigned at any time:

```eaze
set x to 10
set x to x + 5   # x is now 15
```

---

### Data Types

| Type | Example | Notes |
|------|---------|-------|
| **Number** | `42`, `3.14`, `-7` | Integers and floating-point |
| **String** | `"hello"`, `'world'` | Single or double quotes |
| **Array** | `[1, 2, 3]`, `["a", "b"]` | Zero-indexed, mixed types allowed |

---

### Operators

**Arithmetic**

| Operator | Description | Example |
|----------|-------------|---------|
| `+` | Addition / String concat | `5 + 3` → `8` |
| `-` | Subtraction | `10 - 4` → `6` |
| `*` | Multiplication | `6 * 7` → `42` |
| `/` | Division | `20 / 4` → `5` |

**Comparison**

| Operator | Description |
|----------|-------------|
| `==` | Equal to |
| `!=` | Not equal to |
| `<` | Less than |
| `>` | Greater than |
| `<=` | Less than or equal |
| `>=` | Greater than or equal |

**Logical**

| Operator | Description |
|----------|-------------|
| `and` | Logical AND |
| `or` | Logical OR |
| `not` | Logical NOT |

**Operator precedence** (lowest → highest): `or` → `and` → comparisons → `+`/`-` → `*`/`/` → unary → call/index → primary

---

### Output & Input

```eaze
# Print a value
show "Hello, World!"
show x
show 5 + 3        # prints 8

# Read user input
ask "What is your name?" into name
show name

ask "Enter a number:" into num
show num + 10     # auto-converts numeric input to a number
```

---

### Conditionals

```eaze
if x > 10
  show "x is big"
end

if score >= 80
  show "Great job!"
else
  show "Keep practicing"
end
```

Conditions support any expression, including logical operators:

```eaze
if age >= 18 and has_id == 1
  show "Access granted"
else
  show "Access denied"
end
```

Conditionals can be nested:

```eaze
if temperature < 0
  show "Freezing"
else
  if temperature < 15
    show "Cold"
  else
    show "Warm"
  end
end
```

---

### Loops

**`repeat ... times`** — execute a block a fixed number of times:

```eaze
repeat 5 times
  show "Hello!"
end

# Use a variable or expression as the count
set n to 3
repeat n times
  show "Looping"
end
```

**`while`** — execute while a condition is true:

```eaze
set count to 0
while count < 5
  show count
  set count to count + 1
end
```

```eaze
# Countdown
set n to 10
while n > 0
  show n
  set n to n - 1
end
show "Blastoff!"
```

---

### Functions

Define functions with `define`, call them with `call`, and return values with `return`:

```eaze
define greet(name)
  show "Hello, "
  show name
end

call greet("Alice")
```

```eaze
define add(a, b)
  return a + b
end

set result to call add(5, 10)
show result    # → 15
```

Functions support recursion:

```eaze
define factorial(n)
  if n <= 1
    return 1
  else
    return n * call factorial(n - 1)
  end
end

show call factorial(5)    # → 120
```

Functions capture their surrounding scope (closures are supported).

---

### Arrays

```eaze
set numbers to [1, 2, 3, 4, 5]
set colors to ["red", "green", "blue"]
set mixed to [1, "hello", 2.5]

# Access by index (zero-based)
show numbers[0]    # → 1
show colors[2]     # → blue

# Modify an element
set numbers[1] to 99
show numbers       # → [1, 99, 3, 4, 5]

# Iterate with while
set i to 0
while i < 3
  show colors[i]
  set i to i + 1
end
```

---

### Comments

Lines (or partial lines) starting with `#` are ignored:

```eaze
# This is a full-line comment
set x to 5    # This is an inline comment

# Comments are ignored by the lexer entirely
```

---

## 🛠 REPL Commands

When inside the Eaze REPL, the following built-in commands are available:

| Command | Description |
|---------|-------------|
| `help`  | Show the help menu with language features and syntax reference |
| `vars`  | Display all currently defined variables and function signatures |
| `clear` | Clear the terminal and redisplay the welcome banner |
| `exit`  | Exit the REPL gracefully |

### Multi-line Input

The REPL automatically detects incomplete blocks (loops, conditionals, functions) and shows a continuation prompt (`⋮>`) until the block is closed with `end`:

```
Eaze> repeat 3 times
  ⋮>   show "Hello"
  ⋮> end
  → Hello
  → Hello
  → Hello
```

---

## ▶ Running Files

Any Eaze program saved in a `.eaze` file can be executed directly:

```bash
node cli/index.js path/to/program.eaze
```

**Example output:**

```bash
$ node cli/index.js examples/calculator.eaze
  ▶ Running file: calculator.eaze

  → === Eaze Calculator ===
  → 10 + 5 =
  → 15
  → 10 - 5 =
  → 5
  → 10 * 5 =
  → 50
  → 10 / 5 =
  → 2
```

---

## 📚 Example Programs

Three example programs are included in the `examples/` directory:

### `fibonacci.eaze` — Fibonacci Sequence

```eaze
ask "How many Fibonacci numbers?" into n
set a to 0
set b to 1

show "Fibonacci Sequence:"
repeat n times
  show a
  set temp to a + b
  set a to b
  set b to temp
end
show "Done!"
```

### `calculator.eaze` — Basic Calculator

```eaze
define add(a, b)
  return a + b
end

show "10 + 5 = "
show call add(10, 5)
```

### `guessing_game.eaze` — Number Guessing Game

```eaze
set secret to 42
set found to 0

while found == 0
  ask "What's your guess?" into guess
  if guess == secret
    show "You got it!"
    set found to 1
  else
    if guess < secret
      show "Too low! Try higher"
    else
      show "Too high! Try lower"
    end
  end
end
```

---

## 🤖 AI Assistant Server (Optional)

Eaze ships with an optional Express.js backend powered by the OpenAI API that provides three AI features for learners.

### Setup

```bash
# 1. Navigate to the server directory
cd server
npm install

# 2. Create a .env file
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
echo "PORT=3001" >> .env

# 3. Start the server
npm start
# or in development: npm run dev
```

The server runs on `http://localhost:3001` by default.

### API Endpoints

#### `POST /api/ai/explain`
Get a plain-English explanation of Eaze code.

```json
// Request
{ "code": "set x to 5\nshow x" }

// Response
{ "explanation": "This code stores the value 5 in a variable called x, then prints it to the screen." }
```

#### `POST /api/ai/debug`
Submit broken code and an error message to receive a fix suggestion.

```json
// Request
{ "code": "set x to \"hello\"\nshow x + 5", "error": "Cannot add string and number" }

// Response
{ "suggestion": "You're trying to add a number to a string. Make sure x is a number, or concatenate strings and numbers separately." }
```

#### `POST /api/ai/convert`
Translate Eaze code into standard JavaScript.

```json
// Request
{ "code": "repeat 3 times\n  show \"Hello\"\nend" }

// Response
{ "javascript": "for (let i = 0; i < 3; i++) {\n  console.log(\"Hello\");\n}" }
```

---

## 🌐 Web Playground

An HTML5-based code editor is included at `Eaze Playground/kids_code_editor.html`. Open it in any modern browser to:

- Write and run Eaze code live in the browser
- See syntax-highlighted output in real time
- Use the **Explain**, **Debug**, and **Convert to JS** buttons (requires the AI server to be running)

> **Note:** The playground communicates with `http://localhost:3001` for AI features. Start the AI server before using those buttons.

---

## ⚠ Error Handling

Eaze provides structured error messages at three stages:

| Stage | Error Type | Example |
|-------|-----------|---------|
| **Lexing** | `LexerError` | `Unexpected character: '@' (line 1, col 5)` |
| **Parsing** | `ParseError` | `Expected 'to' after variable name (line 2, col 8)` |
| **Runtime** | `RuntimeError` | `I don't know what 'y' is (line 3, col 6)` |

All errors include the **line and column number** for easy debugging. In the REPL, errors are displayed inline and execution continues from the next input.

**Common runtime errors:**
- Using a variable before it is defined
- Dividing by zero
- Calling a function with the wrong number of arguments
- Accessing an array with a non-numeric index

---

## 🗺 Roadmap

Eaze is evolving. Here are the key milestones planned:

### 🔜 Near Term
- **Standalone Binary** — Single-file zero-dependency executables for Windows, macOS, and Linux (via `pkg`). See [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md) and [BINARY_DEPLOYMENT_PLAN.md](BINARY_DEPLOYMENT_PLAN.md) for the full plan.
- **String escape sequences** — `\n`, `\t`, `\"` support
- **Math standard library** — `Math.sqrt`, `Math.abs`, `Math.random`, etc.
- **Array & string methods** — `.length`, `.push`, `.pop`, `.split`, etc.

### 📅 Medium Term
- `for` loop syntax
- `switch/case` statements
- VS Code extension with syntax highlighting
- Linter and formatter
- Enhanced REPL with history and auto-complete

### 🔭 Long Term
- Object literals and classes
- `try/catch` error handling
- Module/import system
- Higher-order functions & lambdas
- Language Server Protocol (LSP) for IDE integration
- Interactive tutorial system
- Package manager

For the complete roadmap, see [documentation/FUTURE_ENHANCEMENTS.md](documentation/FUTURE_ENHANCEMENTS.md).

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository and clone your fork.
2. **Install** dependencies with `npm install`.
3. **Explore** the `engine/` directory — the interpreter pipeline lives there.
4. **Write your changes** and test them manually with the REPL or example files.
5. **Open a pull request** with a clear description of what you've changed.

Some good first areas to contribute:
- Adding a new built-in function or operator
- Improving error messages
- Writing more example programs in `examples/`
- Expanding the documentation in `documentation/`

---

## 📄 License

This project is licensed under the **ISC License**.
