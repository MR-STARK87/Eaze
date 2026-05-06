# Eaze Language - Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Core Components](#core-components)
4. [Lexical Analysis (Lexer)](#lexical-analysis-lexer)
5. [Syntax Analysis (Parser)](#syntax-analysis-parser)
6. [Interpretation & Execution](#interpretation--execution)
7. [Runtime Environment](#runtime-environment)
8. [Error Handling System](#error-handling-system)
9. [I/O and CLI System](#io-and-cli-system)
10. [AI Assistant Integration](#ai-assistant-integration)

---

## System Overview

Eaze is a **custom interpreted programming language** designed with beginner-friendly syntax. It implements a classic three-stage interpreter architecture:

```
Source Code
    ↓
[Lexer] → Tokens
    ↓
[Parser] → Abstract Syntax Tree (AST)
    ↓
[Interpreter] → Execution Results
    ↓
Output
```

The entire system is built in **JavaScript (Node.js)** with ES modules. It can operate in two modes:
- **Interactive REPL**: Real-time command execution with environment tracking
- **File Execution**: Run pre-written .eaze program files

---

## Architecture Diagram

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Eaze System                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Lexer      │───→│   Parser     │───→│ Interpreter  │       │
│  │              │    │              │    │              │       │
│  │ Tokenization │    │ AST Building │    │  Execution   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         ▲                                        │                │
│         │                                        ▼                │
│         │                                  ┌──────────────┐       │
│         └──────────────────────────────────│ Environment  │       │
│                                            │ (Runtime)    │       │
│                                            └──────────────┘       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   CLI Interface                           │   │
│  │  ├─ Interactive REPL with Readline                      │   │
│  │  ├─ File Execution                                      │   │
│  │  ├─ Variable Inspection                                 │   │
│  │  └─ Error Display & Formatting                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            AI Assistant Server (Express)                 │   │
│  │  ├─ /api/ai/explain   (Code Explanation)                │   │
│  │  ├─ /api/ai/debug     (Error Debugging)                 │   │
│  │  └─ /api/ai/convert   (Eaze to JavaScript)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. **Lexer** (`engine/lexer.js`)
**Purpose**: Tokenizes source code into a stream of tokens

**Key Responsibilities**:
- Break input string into meaningful tokens
- Classify tokens (keywords, identifiers, operators, literals, etc.)
- Track line and column information for error reporting
- Handle comments (lines starting with `#`)
- Support multi-character operators (==, !=, <=, >=)

**Token Types**:
```javascript
KEYWORD      // set, to, show, if, else, repeat, while, etc.
IDENTIFIER   // Variable/function names
NUMBER       // Numeric literals (integers and floats)
STRING       // String literals (single or double-quoted)
OPERATOR    // +, -, *, /, =, ==, !=, <, >, <=, >=, (, ), [, ], ,
NEWLINE     // End of statement marker
EOF         // End of file marker
```

**Example**:
```
Input:  set x to 5
Tokens: [KEYWORD(set), IDENTIFIER(x), KEYWORD(to), NUMBER(5), NEWLINE]
```

### 2. **Parser** (`engine/parser.js`)
**Purpose**: Builds an Abstract Syntax Tree (AST) from tokens

**Key Responsibilities**:
- Consume tokens in sequence
- Enforce language grammar rules
- Build hierarchical AST structure
- Handle operator precedence and associativity
- Support multi-line blocks (repeat, while, if, functions)

**Parser Strategy**: **Recursive Descent Parser**
- Each grammar rule has a corresponding function
- Functions call other functions based on token lookahead
- Expressions use precedence climbing (parseExpression hierarchy)

**Operator Precedence** (lowest to highest):
1. Logical OR (`or`)
2. Logical AND (`and`)
3. Comparisons (`==`, `!=`, `<`, `>`, `<=`, `>=`)
4. Additive (`+`, `-`)
5. Multiplicative (`*`, `/`)
6. Unary (`not`, `-`)
7. Call/Index (function calls, array indexing)
8. Primary (literals, identifiers, parentheses)

**AST Node Types**:
- `Program`: Root node containing statements
- `Assignment`: Variable or array element assignment
- `Show`: Output statement
- `Ask`: Input statement
- `RepeatLoop`, `WhileLoop`: Loop structures
- `IfStatement`: Conditional with optional else block
- `FunctionDeclaration`: Function definition
- `FunctionCall`: Function invocation
- `ReturnStatement`: Return from function
- `BinaryExpression`: Binary operations (+, -, *, /, ==, etc.)
- `UnaryExpression`: Unary operations (not, -)
- `LogicalExpression`: Logical operations (and, or)
- `ArrayLiteral`: Array creation
- `IndexExpression`: Array/string indexing
- `Identifier`, `NumberLiteral`, `StringLiteral`: Primitives

### 3. **Interpreter** (`engine/interpreter.js`)
**Purpose**: Executes the AST and produces results

**Key Responsibilities**:
- Traverse AST nodes recursively
- Maintain execution state through the environment
- Handle control flow (loops, conditionals)
- Manage function calls and returns
- Collect output for display

**Evaluation Strategy**:
- Uses the **Visitor pattern**: each AST node type has a case in `evaluate()`
- Maintains an execution environment stack for variable scoping
- Throws exceptions for control flow (ReturnValue exception for returns)

**Special Features**:
- **Return Handling**: Implemented via exception throwing (ReturnValue class)
- **Input Handling**: Customizable input handler for REPL vs file execution
- **Type Coercion**: Automatic string-to-number conversion for user input
- **Closure Support**: Functions capture their defining environment

### 4. **Runtime Environment** (`engine/runtime.js`)
**Purpose**: Manages variable scope and lookup

**Environment Hierarchy**:
```
Global Environment (root)
    ├─ Function Closure Environment (captured at function definition)
    │    └─ Function Call Environment (created at call time)
    ├─ Loop Environment (for local loop variables)
    └─ Block Environment (for if/else blocks)
```

**Key Methods**:
- `set(name, value)`: Assign variable (creates new or updates existing in innermost scope)
- `get(name)`: Retrieve variable (walks up scope chain)
- `has(name)`: Check if variable exists (anywhere in scope chain)

**Scope Resolution**:
1. Check current environment's variables map
2. If found, return value or update
3. If not found, recursively check parent environment
4. If reached root without finding, throw RuntimeError

### 5. **Error Handling** (`engine/errors.js`)
**Purpose**: Structured error reporting with location information

**Error Types**:
- `LexerError`: Invalid characters or unterminated strings
- `ParseError`: Grammar violations
- `RuntimeError`: Execution failures (undefined variables, type errors, division by zero)

**Error Features**:
- Line and column tracking
- Pretty formatted error messages with location
- Unicode error indicators (❌)

---

## Lexical Analysis (Lexer)

### Tokenization Process

```
Input String
    ↓
Character Classification
    ├─ Whitespace/Comment? → Skip
    ├─ Digit? → readNumber()
    ├─ Letter/Underscore? → readIdentifierOrKeyword()
    ├─ Quote? → readString()
    ├─ Operator? → readOperator()
    └─ Invalid? → LexerError
    ↓
Token Stream
```

### Keywords Recognition
Eaze recognizes 17 keywords:
```
set, to, show, if, else, end, repeat, times, while, and, or, not, 
ask, into, define, return, call
```

### String Handling
- Supports both single (`'`) and double (`"`) quotes
- No escape sequences (basic implementation)
- Requires termination on same line (error if unterminated)

### Operator Tokenization
Two-character operators are checked before single-character ones:
```javascript
"==" before "="
"!=" before "!"
"<=" before "<"
">=" before ">"
```

---

## Syntax Analysis (Parser)

### Grammar Overview

```
Program         → Statement*

Statement       → SetStatement
                | ShowStatement
                | AskStatement
                | RepeatStatement
                | WhileStatement
                | IfStatement
                | FunctionDeclaration
                | ReturnStatement
                | ExpressionStatement

SetStatement    → "set" AssignmentTarget "to" Expression NEWLINE
ShowStatement   → "show" Expression NEWLINE
AskStatement    → "ask" Expression "into" IDENTIFIER NEWLINE
RepeatStatement → "repeat" Expression "times" NEWLINE Block
WhileStatement  → "while" Expression NEWLINE Block
IfStatement     → "if" Expression NEWLINE Block 
                  ("else" NEWLINE Block)? 
                  "end" NEWLINE

FunctionDecl    → "define" IDENTIFIER "(" Parameters? ")" NEWLINE Block
Block           → Statement* "end" NEWLINE

Expression      → LogicalOr
LogicalOr       → LogicalAnd ("or" LogicalAnd)*
LogicalAnd      → Comparison ("and" Comparison)*
Comparison      → Additive ((== | != | < | > | <= | >=) Additive)*
Additive        → Multiplicative ((+ | -) Multiplicative)*
Multiplicative  → Unary ((* | /) Unary)*
Unary           → ("not" | "-") Unary | CallOrIndex
CallOrIndex     → "call" IDENTIFIER "(" Arguments? ")" 
                | Primary IndexOp*
Primary         → NUMBER | STRING | IDENTIFIER | "(" Expression ")"
                | "[" Expression (, Expression)* "]"
```

### Multi-line Block Handling

Blocks for loops, conditionals, and functions are detected by:
1. Finding the opening keyword (repeat, while, if, define)
2. Parsing statements until reaching "end" keyword
3. Consuming "end" and statement terminator (NEWLINE)

This allows proper nesting and multi-line code structures.

---

## Interpretation & Execution

### Execution Flow

```
AST Node
    ↓
evaluate(node, environment)
    ├─ Check node.type
    ├─ Evaluate children recursively
    ├─ Perform operation
    └─ Return result
    ↓
Output or State Change
```

### Key Execution Patterns

#### Variable Assignment
```javascript
case "Assignment":
  value = evaluate(node.value, env)
  if (target is Identifier) env.set(name, value)
  if (target is IndexExpression) array[index] = value
```

#### Function Definition
```javascript
case "FunctionDeclaration":
  fn = {
    isFunction: true,
    name: node.name,
    params: node.params,
    body: node.body,
    closure: env  // Capture current environment
  }
  env.set(node.name, fn)
```

#### Function Call
```javascript
case "FunctionCall":
  fn = env.get(node.name)
  callEnv = new Environment(fn.closure)  // Create new scope
  For each param: callEnv.set(param, evaluate(arg, env))
  Execute fn.body in callEnv
  Handle ReturnValue exception
```

#### Return Mechanism
```javascript
case "ReturnStatement":
  value = evaluate(node.value, env)
  throw new ReturnValue(value)  // Control flow via exception
```

When caught in function call handler, the thrown value is returned to caller.

---

## Runtime Environment

### Scope Chain Example

```javascript
// Global scope
set x to 10

define add(a, b)
  set sum to a + b    // Uses closure + call environment
  return sum
end

// Call site
call add(5, 3)
```

**Scope during `add(5, 3)` execution**:
```
Call Environment (created for this function call)
  ├─ a: 5
  ├─ b: 3
  ├─ sum: (uninitialized)
  └─ parent: Closure Environment
        └─ parent: Global Environment
              ├─ x: 10
              ├─ add: [Function object]
              └─ parent: null
```

### Variable Lookup
When `a + b` is evaluated:
1. Look for `a` in call environment → found (5)
2. Look for `b` in call environment → found (3)
3. Return 5 + 3 = 8

---

## Error Handling System

### Three-Stage Error Architecture

**Stage 1: Lexical Errors**
- Invalid characters: `@`, `$`, `~`
- Unterminated strings: `"hello` without closing quote
- Example: `LexerError: Unexpected character: '@' (line 1, col 5)`

**Stage 2: Syntax Errors**
- Missing keywords: `set x 5` (missing "to")
- Mismatched blocks: `if x > 0 ... else ... end end`
- Invalid expressions: `( 5 +`
- Example: `ParseError: Expected ')' after expression (line 2, col 15)`

**Stage 3: Runtime Errors**
- Undefined variables: `show y` when y not defined
- Type errors: `array[string_index]`
- Division by zero: `set z to 10 / 0`
- Function arity mismatch: `call add(5)` when add expects 2 params
- Example: `RuntimeError: I don't know what 'y' is (line 3, col 6)`

### Error Recovery
Current implementation: **Fail-fast**
- Any error stops execution immediately
- Error details displayed to user
- REPL continues for next input

---

## I/O and CLI System

### CLI Component (`cli/index.js`)

#### Features

1. **Interactive REPL**
   - Welcome banner with ASCII art
   - Primary prompt (`Eaze> `)
   - Continuation prompt for multi-line statements (`  ⋮> `)
   - Command history (via readline)

2. **Commands**
   - `help`: Display command reference and language features
   - `vars`: Show all defined variables and functions
   - `clear`: Clear screen and redisplay banner
   - `exit`: Quit REPL gracefully
   - `Eaze`: Easter egg message

3. **Multi-line Statement Handling**
   ```javascript
   isStatementComplete(code) {
     blockOpeners = count("repeat", "while", "if", "define")
     blockClosers = count("end")
     return blockOpeners === blockClosers
   }
   ```
   - Buffers incomplete statements
   - Shows continuation prompt until block closes
   - Executes complete statement

4. **File Execution**
   - `node cli/index.js <filename.eaze>`
   - Reads file, lexes, parses, interprets
   - Displays output directly

5. **Styling & Formatting**
   - Color palette (primary, secondary, success, error, warning)
   - Unicode symbols (✨, ☑, ⚡, →, ✖)
   - Box drawing for organized output
   - ANSI color code handling for proper line width calculation

### Input Handling Strategy

**REPL Mode**:
- Uses `Interpreter.setInputHandler()` to inject custom handler
- Handler prompts user, reads response, converts numeric strings

**File Mode**:
- Default input handler returns "0"
- Files typically don't use `ask` statements

---

## AI Assistant Integration

### AI Server (`server/index.js`)

Express.js server providing AI-powered features via OpenAI API.

#### Endpoint 1: `/api/ai/explain` (POST)

**Purpose**: Explain Eaze code in natural language

**Request**:
```json
{
  "code": "set x to 5\nshow x",
  "ast": { ... }
}
```

**Response**:
```json
{
  "explanation": "This code creates a variable x with value 5, then displays it."
}
```

**Implementation**:
- Sends code + AST to GPT-4o
- Includes system prompt with Eaze syntax information
- Returns concise explanation of logic flow

#### Endpoint 2: `/api/ai/debug` (POST)

**Purpose**: Provide debugging suggestions for errors

**Request**:
```json
{
  "code": "set x to \"hello\"\nshow x + 5",
  "error": "TypeError: Cannot add string and number"
}
```

**Response**:
```json
{
  "suggestion": "You're trying to add a number to a string. Either convert x to a number or make sure you're adding numbers together."
}
```

**Implementation**:
- Sends code + error message to GPT-4o with lower temperature (0.5)
- System prompt emphasizes concise, direct debugging help
- Returns fix suggestions

#### Endpoint 3: `/api/ai/convert` (POST)

**Purpose**: Convert Eaze code to JavaScript

**Request**:
```json
{
  "code": "set x to 5\nshow x"
}
```

**Response**:
```json
{
  "javascript": "let x = 5;\nconsole.log(x);"
}
```

**Implementation**:
- Sends Eaze code with syntax mapping hints
- Uses low temperature (0.3) for deterministic conversion
- Strips markdown wrappers from response
- Returns clean JavaScript code

### Configuration
- Uses environment variable `OPENAI_API_KEY`
- Loads from `server/.env` file
- Returns 500 error if API key missing

---

## Web Playground Integration

### Interactive Editor (`Eaze Playground/kids_code_editor.html`)

HTML5-based visual code editor with:
- Code editor pane (left side)
- Live output pane (right side)
- Real-time syntax highlighting
- Execution button
- Integration with AI endpoints

**Features**:
- Responsive design for mobile
- Google Fonts (DM Sans, JetBrains Mono)
- Custom color scheme for beginner-friendly UI
- Integration with `/api/ai/explain` endpoint
- Integration with `/api/ai/debug` endpoint

---

## Data Flow Summary

### Simple Program Execution

```
"set x to 5" 
    ↓ [Lexer]
[KEYWORD(set), IDENTIFIER(x), KEYWORD(to), NUMBER(5)]
    ↓ [Parser]
Assignment {
  target: Identifier { name: "x" },
  value: NumberLiteral { value: 5 }
}
    ↓ [Interpreter]
globalEnv.set("x", 5)
    ↓ [Output]
(No output - assignment complete)
```

### With Output

```
"show x"
    ↓ [Lexer]
[KEYWORD(show), IDENTIFIER(x)]
    ↓ [Parser]
Show {
  value: Identifier { name: "x" }
}
    ↓ [Interpreter]
value = env.get("x") → 5
output.push(5)
    ↓ [CLI]
Print: → 5
```

---

## Summary

Eaze implements a **complete interpreter architecture** with:

- **Lexer**: Character-by-character tokenization
- **Parser**: Recursive descent with precedence climbing for expressions
- **Interpreter**: Tree-walking evaluator with environment-based scoping
- **Runtime**: Environment chain for scope management
- **CLI**: Feature-rich REPL with multi-line support
- **AI Integration**: Three AI-powered assistants for learning
- **Error System**: Structured error reporting with location tracking

This design prioritizes **simplicity for beginners** while maintaining **correct semantics** for a Turing-complete language.