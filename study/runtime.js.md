# `runtime.js` — Engine study notes

## Purpose in the engine
This file defines `Environment`, the runtime data structure that stores variables and supports **nested scopes**.

In this engine:
- The **parser** produces an AST with identifiers.
- The **interpreter** evaluates the AST.
- When evaluating an identifier (or assigning to it), the interpreter uses an `Environment` to resolve or update the variable.

`Environment` is essentially a scope frame:
- A map of local variables (`variables`)
- A link to an optional parent scope (`parent`)

---

## Imports
- `RuntimeError` from `./errors.js`
  - Used for “unknown variable” errors.

---

## Exported API

## `class Environment`

### `constructor(parent = null)`
Creates a new scope.

Fields:
- `this.variables = new Map()`
  - Stores bindings: `name -> value`.
  - Values can be numbers, strings, arrays, or the function objects created by `interpreter.js`.
- `this.parent = parent`
  - `null` means this is a top-level/global environment.
  - Otherwise it points to the enclosing scope.

This is what enables lexical scoping:
- A variable can be looked up by walking `parent` links.

---

### `set(name, value)`
Assigns a value to a variable, with “update outer variable if it already exists” semantics.

Behavior in order:
1. **If the name exists in the current scope** (`this.variables.has(name)`):
   - Update it in-place in this scope.
2. **Else if there is a parent scope and the name exists somewhere above** (`this.parent !== null && this.parent.has(name)`):
   - Delegate the assignment to the parent chain via `this.parent.set(name, value)`.
   - This updates the *nearest* scope where the variable already exists.
3. **Else**:
   - Create a new variable in the current scope (`this.variables.set(name, value)`).

Why this matters:
- Blocks/loops/functions often execute with child environments.
- With this `set` logic, code inside a block can still mutate an outer variable *if that variable already exists*.
- Otherwise, the assignment becomes a new local variable in the current scope.

This gives you a pragmatic “declare-on-first-set” model:
- There’s no separate declaration syntax.
- Assignment creates variables unless the variable already exists in an outer scope.

---

### `get(name, line, column)`
Resolves a variable value.

Behavior:
1. If the current scope contains `name`, return it.
2. Else if there is a parent, ask the parent (`return this.parent.get(...)`).
3. Else throw a `RuntimeError`:
   - Message: `I don't know what '<name>' is`
   - Location: uses the provided `line` and `column` (if passed by the caller).

Notes:
- `line`/`column` are optional in practice.
  - In the current interpreter implementation, identifier lookups typically call `env.get(node.name)` without location info.
  - The method supports locations anyway, so future AST nodes could pass them through.

---

### `has(name)`
Checks whether a name exists in the current environment or any parent.

Behavior:
- If in local `variables`, return `true`.
- Else if there is a parent, return `parent.has(name)`.
- Else return `false`.

This is used by `set(...)` to decide whether an assignment should update an outer binding or create a new local one.

---

## How `Environment` is used by `interpreter.js`
Common patterns:
- **Global scope**: `Interpreter` creates `this.globalEnv = new Environment()`.
- **Block scoping**: for `if` and loop bodies, the interpreter creates `new Environment(env)` so inner assignments can be isolated unless they target an existing outer variable.
- **Function calls**: the interpreter creates `callEnv = new Environment(fn.closure)` to implement lexical scoping (closures). Parameters are bound inside `callEnv`.

Together, these rules define variable visibility and mutation across blocks and function calls.
