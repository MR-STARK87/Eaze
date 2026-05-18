# `interpreter.js` — Engine study notes

## Purpose in the engine
This file implements the **evaluator** for the language.

Given an AST from `parser.js`, the interpreter walks the tree and executes:
- statements (`set`, `show`, `if`, loops, function definitions/calls)
- expressions (math, comparisons, booleans, indexing, literals)

It uses:
- `Environment` from `runtime.js` to store variables and implement scoping
- `RuntimeError` from `errors.js` for runtime failures

It also collects output from `show` statements into an array.

---

## Imports
- `{ Environment }` from `./runtime.js`
- `{ RuntimeError }` from `./errors.js`

---

## Internal helper type: `ReturnValue`
`ReturnValue` is an internal control-flow mechanism used to implement `return`.

### Why it exists
A `return` statement needs to unwind nested evaluation calls back to the nearest function call site.

Instead of checking return flags after every statement, this interpreter uses a common approach:
- When a `ReturnStatement` executes, it **throws** a `ReturnValue` object.
- The function-call evaluator catches `ReturnValue` and converts it into the function’s returned result.

### `class ReturnValue`
- Stores the returned value in `this.value`.
- Only used for control flow; it’s not meant to be shown to users.

---

## Exported API

## `class Interpreter`

### Constructor: `constructor()`
Initializes interpreter-wide state:

- `this.globalEnv = new Environment()`
  - The root scope for a run.
- `this.output = []`
  - A list of values produced by `show`.
- `this.inputHandler = (message) => { ... }`
  - Default input handler for `ask`.
  - The default implementation logs the message and returns the string `"0"`.

Design note:
- The interpreter is designed to be embedded.
- You can override `inputHandler` to integrate with a UI, tests, or a CLI.

---

### `setInputHandler(handler)`
Replaces the input handler used by `Ask` statements.

- `handler` should be a function `(message) => string | number`.
- The interpreter will attempt to convert numeric-looking strings to numbers.

---

### `run(ast)`
Executes a full program AST and returns collected output.

Steps:
1. Reset `this.output = []`.
2. Call `this.evaluate(ast, this.globalEnv)`.
3. Special error handling:
   - If a `ReturnValue` escapes to the top level, that means a `return` occurred outside a function.
   - The interpreter converts that into a `RuntimeError("Return statement outside function")`.
4. Returns `this.output`.

This method is the typical entry point after parsing.

---

## Core evaluation

### `evaluate(node, env)`
Evaluates an AST node in a given environment.

- `node` is an AST node from `parser.js`.
- `env` is an `Environment` representing the current scope.

If `node` is falsy, it returns `null`.

The implementation is a `switch(node.type)` that handles every AST node kind.

Below is a breakdown of each supported `node.type`.

---

## Program structure

### `Program`
- Delegates to `evaluateBlock(node.body, env)`.
- Returns the last statement result (usually not used at top level).

---

## Statements

### `Assignment`
Evaluates the right-hand side, then assigns it to the target.

Supported targets:
1. `Identifier` target:
   - `env.set(node.target.name, value)`.
2. `IndexExpression` target (array element assignment):
   - Evaluate `node.target.object` to get the array.
   - Evaluate `node.target.index` to get the index.
   - Validate:
     - `array` must be a real JavaScript array.
     - `index` must be a number.
   - Perform `array[index] = value`.

If the target type is neither supported, it throws `RuntimeError("Invalid assignment target")`.

Design implications:
- Arrays are mutable and assignments mutate the existing array object.
- Index assignment does not bounds-check; JavaScript will create sparse arrays if the index is out of range.

---

### `Show`
- Evaluates `node.value`.
- Pushes the resulting value into `this.output`.
- Returns `null`.

This is how the engine “prints” without directly doing I/O.

---

### `Ask`
Implements input.

Steps:
1. Evaluate `node.message`.
2. Call `this.inputHandler(message)` to get an answer.
3. If the answer looks numeric (via `parseFloat` and `isFinite` checks), convert it to a number.
4. Store the answer in `env` under `node.identifier`.

Returns `null`.

Notes:
- The numeric conversion is best-effort; non-numeric input stays as a string.
- The message expression can be any expression, not just a string literal.

---

### `RepeatLoop`
Executes a block a fixed number of times.

Steps:
1. Evaluate `node.times`.
2. Ensure it’s a number; otherwise throw a `RuntimeError`.
3. For `i` in `[0, times)`:
   - Create a fresh `loopEnv = new Environment(env)`.
   - Execute the body with `evaluateBlock(node.body, loopEnv)`.

Scoping behavior:
- Each iteration gets its own child scope.
- With the `Environment#set` rules, assignments to existing outer variables still update the outer variable.
- Assignments to new variable names become per-iteration locals.

---

### `WhileLoop`
Executes a block repeatedly while a condition is truthy.

Steps:
- While `evaluate(node.condition, env)` is truthy:
  - Create `loopEnv = new Environment(env)`.
  - Execute the body in `loopEnv`.

Notes:
- The condition is evaluated in the *outer* environment `env` each time.
- The body uses a child environment.

---

### `IfStatement`
Conditional execution.

Steps:
1. Evaluate the condition.
2. If truthy:
   - Execute `node.body` in a fresh child env `new Environment(env)`.
3. Else if `node.elseBody` exists:
   - Execute `node.elseBody` in a fresh child env `new Environment(env)`.

Returns `null`.

Scoping behavior:
- Each branch uses a child environment, isolating “new” variables created only inside that branch.

---

### `ExpressionStatement`
Evaluates `node.value` and returns it.

In practice this is mainly used for function calls written as statements:
- `call foo(1, 2)`

---

### `FunctionDeclaration`
Defines a function and stores it in the current environment.

The interpreter represents a function as a plain object:
- `isFunction: true` — a tag used at call time
- `name`: function name
- `params`: array of parameter names
- `body`: array of statements (the parsed block)
- `closure`: the environment where the function was declared

This `closure` is what enables lexical scoping: functions “remember” the scope in which they were defined.

---

### `FunctionCall`
Invokes a function previously stored in the environment.

Steps:
1. Resolve `fn = env.get(node.name)`.
2. Validate it exists and has `isFunction: true`.
3. Validate arity: `fn.params.length === node.arguments.length`.
4. Create `callEnv = new Environment(fn.closure)`.
   - This sets the function’s outer scope to the declaration-time environment.
5. For each parameter:
   - Evaluate the corresponding argument in the *caller* environment (`env`).
   - Bind it into `callEnv` under the parameter name.
6. Execute the function body in `callEnv`.
7. If evaluation throws a `ReturnValue`, catch it and return its `.value`.
8. If the body finishes without returning, the call expression returns `null`.

Notes:
- Argument evaluation happens in the caller’s environment, which is typical.
- Function bodies execute in an environment that chains to the closure.
- Return values are implemented via the `ReturnValue` throw/catch mechanism.

---

### `ReturnStatement`
Implements returning from a function.

Steps:
- If there is a `node.value`, evaluate it; otherwise use `null`.
- Throw `new ReturnValue(value)`.

If this escapes a function call context, `run()` converts it to a user-facing runtime error.

---

## Expressions

### `LogicalExpression`
Implements `and` / `or` with **short-circuiting**.

- Evaluate `left`.
- For `or`:
  - If `left` is truthy, return it.
  - Else evaluate and return `right`.
- For `and`:
  - If `left` is falsy, return it.
  - Else evaluate and return `right`.

The interpreter uses JavaScript truthiness, so values like `0`, `""`, `null` are falsy.

---

### `UnaryExpression`
Supports:
- `not <expr>` → logical negation (`!right`)
- `-<expr>` → numeric negation (`-right`)

If the operator is unknown, throws `RuntimeError`.

---

### `BinaryExpression`
Evaluates `left` and `right`, then applies an operator.

Supported operators:
- Arithmetic: `+`, `-`, `*`, `/`
  - `/` checks `right === 0` and throws `RuntimeError("Division by zero")`.
- Equality: `==`, `!=` implemented as **strict** comparison `===` / `!==`.
- Comparisons: `<`, `>`, `<=`, `>=`.

Important nuance:
- `+` uses JavaScript semantics. That means it can concatenate strings as well as add numbers.

---

### `ArrayLiteral`
Returns a JavaScript array by evaluating each element expression:
- `node.elements.map(el => evaluate(el, env))`

---

### `IndexExpression`
Implements array indexing.

Steps:
1. Evaluate `node.object` to get the array.
2. Evaluate `node.index`.
3. Validate:
   - object must be an array
   - index must be a number
4. Return `array[index]`.

No bounds-checking is performed.

---

### `NumberLiteral` / `StringLiteral`
Return `node.value` directly.

---

### `Identifier`
Resolves a variable by name:
- `env.get(node.name)`

If not found, `Environment#get` throws a `RuntimeError`.

---

## Block evaluation

### `evaluateBlock(statements, env)`
Executes an array of statements in order.

- Iterates through `statements`.
- Keeps track of the last evaluation result and returns it.

Control flow note:
- If any statement triggers a `return`, it throws `ReturnValue` and unwinds out immediately.

---

## How the pieces compose (end-to-end)
Typical execution pipeline:
1. `Lexer` tokenizes source text.
2. `Parser` builds an AST.
3. `Interpreter#run(ast)` evaluates the AST in `globalEnv`.
4. `show` statements append values to `output`, which `run()` returns.
