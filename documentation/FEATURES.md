# Eaze Language - Complete Feature Set

## Table of Contents
1. [Variables & Assignment](#variables--assignment)
2. [Data Types](#data-types)
3. [Operators](#operators)
4. [Output & Display](#output--display)
5. [Input & User Interaction](#input--user-interaction)
6. [Control Flow - Conditionals](#control-flow---conditionals)
7. [Control Flow - Loops](#control-flow---loops)
8. [Functions](#functions)
9. [Arrays](#arrays)
10. [Comments](#comments)
11. [REPL Features](#repl-features)
12. [AI Assistant Features](#ai-assistant-features)

---

## Variables & Assignment

### Feature: `set ... to ...`
Create and assign values to variables with intuitive, English-like syntax.

**Syntax**:
```
set <variable_name> to <expression>
```

**Examples**:

Basic number assignment:
```
set age to 25
set price to 99.99
set count to 0
```

String assignment:
```
set name to "Alice"
set greeting to 'Hello World'
```

Expression assignment:
```
set x to 5 + 3
set result to 10 * 2
set combined to x + result
```

Array assignment:
```
set numbers to [1, 2, 3, 4, 5]
set mixed to [1, "hello", 2.5]
```

**Features**:
- Variables are created on first assignment
- Variables can be reassigned (mutable)
- Support for all data types (numbers, strings, arrays)
- Expressions evaluated before assignment
- Support for array element assignment

**Variable Reassignment**:
```
set x to 10
show x           # Output: 10
set x to 20      # Reassign x
show x           # Output: 20
```

**Array Element Assignment**:
```
set arr to [1, 2, 3]
set arr[0] to 100
show arr         # Output: [100, 2, 3]
```

---

## Data Types

### Supported Types

#### 1. **Numbers**
Numeric values (integers and floating-point)

```
set int_val to 42
set float_val to 3.14159
set negative to -100
set zero to 0
```

**Characteristics**:
- Both integers and decimals are supported
- Negative numbers with unary `-` operator
- Arithmetic operations: `+`, `-`, `*`, `/`
- Comparison operations: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Division by zero throws RuntimeError

#### 2. **Strings**
Text values enclosed in single or double quotes

```
set name to "John"
set message to 'Single quotes work too'
set empty to ""
```

**Characteristics**:
- Both `"..."` and `'...'` syntax supported
- No escape sequences in current implementation
- Concatenation via `+` operator
- Comparison: `==`, `!=`
- Can be used in show statements for output

**String Concatenation**:
```
set first to "Hello"
set last to "World"
set combined to first + " " + last
show combined    # Output: Hello World
```

#### 3. **Arrays**
Ordered collections of values (mixed types allowed)

```
set numbers to [1, 2, 3, 4, 5]
set strings to ["apple", "banana", "cherry"]
set mixed to [1, "hello", 2.5, [1, 2]]
set empty to []
```

**Characteristics**:
- Zero-indexed (first element at index 0)
- Support mixed data types in same array
- Support nested arrays
- Indexed access: `array[index]`
- Indexed assignment: `array[index] to value`
- Show statement displays as `[1, 2, 3]`

---

## Operators

### Arithmetic Operators

| Operator | Name | Example | Result |
|----------|------|---------|--------|
| `+` | Addition | `5 + 3` | `8` |
| `-` | Subtraction | `10 - 4` | `6` |
| `*` | Multiplication | `6 * 7` | `42` |
| `/` | Division | `20 / 4` | `5` |

**Special Cases**:
- String concatenation with `+`: `"hello" + " " + "world"` → `"hello world"`
- Division by zero raises RuntimeError

### Comparison Operators

| Operator | Name | Example | Result |
|----------|------|---------|--------|
| `==` | Equal to | `5 == 5` | `true` |
| `!=` | Not equal to | `5 != 3` | `true` |
| `<` | Less than | `3 < 5` | `true` |
| `>` | Greater than | `10 > 5` | `true` |
| `<=` | Less than or equal | `5 <= 5` | `true` |
| `>=` | Greater than or equal | `10 >= 5` | `true` |

**Type Behavior**:
- Number comparison works as expected
- String comparison uses lexicographic ordering
- Cross-type comparison may have unpredictable results

### Logical Operators

| Operator | Name | Example | Result |
|----------|------|---------|--------|
| `and` | Logical AND | `1 and 1` | `true` |
| `or` | Logical OR | `0 or 1` | `true` |
| `not` | Logical NOT | `not 0` | `true` |

**Truthy/Falsy Values**:
- `0`, `""`, `false` are falsy
- All other values (including empty arrays) are truthy
- JavaScript-like truthiness evaluation

### Operator Precedence (Lowest to Highest)

1. Logical OR (`or`)
2. Logical AND (`and`)
3. Comparisons (`==`, `!=`, `<`, `>`, `<=`, `>=`)
4. Additive (`+`, `-`)
5. Multiplicative (`*`, `/`)
6. Unary (`not`, `-`)
7. Exponentiation (not supported)
8. Call/Index (function calls, array indexing)
9. Primary (literals, identifiers, parentheses)

**Example with Precedence**:
```
set result to 2 + 3 * 4      # 3*4 first, then +2 = 14
set result to (2 + 3) * 4    # Parentheses override = 20
set result to 10 and 5 or 0  # (10 and 5) or 0 = 5
```

---

## Output & Display

### Feature: `show`
Display values to the console/output

**Syntax**:
```
show <expression>
```

**Examples**:

Simple values:
```
show 42
show "Hello"
show true
```

Variables:
```
set name to "Alice"
show name
```

Expressions:
```
show 5 + 3
show "The answer is "
show 42
```

Arrays:
```
set arr to [1, 2, 3]
show arr                # Output: [1, 2, 3]
```

Multiple statements:
```
show "Hello"
show "World"
# Output:
#   → Hello
#   → World
```

**Output Formatting**:
- Each `show` produces one output line
- Outputs prefixed with `→` in REPL
- Values converted to string representation
- Arrays shown as JSON-like format

---

## Input & User Interaction

### Feature: `ask ... into ...`
Prompt user for input and store in variable

**Syntax**:
```
ask <message> into <variable_name>
```

**Examples**:

Simple input:
```
ask "What is your name?" into name
show name
```

Numeric input:
```
ask "Enter a number:" into num
show num + 10
```

Multiple inputs:
```
ask "Enter age:" into age
ask "Enter height:" into height
show "Age: "
show age
show "Height: "
show height
```

**Behavior**:
- Message is displayed to user
- User input is read from console
- Input automatically parsed to number if it looks like one
- String input preserved if not numeric
- Value stored in specified variable
- Variable created if doesn't exist

**Type Coercion**:
```
ask "Enter number:" into x
# User types: 42
# x becomes: 42 (number type)

ask "Enter text:" into y
# User types: hello
# y becomes: "hello" (string type)
```

---

## Control Flow - Conditionals

### Feature: `if ... else ... end`
Conditional execution based on boolean expressions

**Syntax**:
```
if <condition>
  <statements>
end
```

```
if <condition>
  <statements>
else
  <statements>
end
```

**Examples**:

Simple if:
```
set age to 18
if age >= 18
  show "You are an adult"
end
```

If-else:
```
set score to 75
if score >= 80
  show "Great job!"
else
  show "Keep practicing"
end
```

Nested conditionals:
```
set age to 25
set license to 1
if age >= 18
  if license == 1
    show "You can drive"
  else
    show "Get a license first"
  end
else
  show "Too young to drive"
end
```

Multiple conditions:
```
set temperature to 25
if temperature < 0
  show "Freezing"
else
  if temperature < 15
    show "Cold"
  else
    if temperature < 25
      show "Cool"
    else
      show "Warm"
    end
  end
end
```

**Condition Types**:
- Comparison: `if x > 5`
- Logical: `if x > 0 and x < 10`
- Variable: `if found` (truthy check)
- Expression: `if x + y == 10`

---

## Control Flow - Loops

### Feature 1: `repeat ... times ... end`
Execute code a fixed number of times

**Syntax**:
```
repeat <count> times
  <statements>
end
```

**Examples**:

Simple repetition:
```
repeat 3 times
  show "Hello"
end
# Output:
#   → Hello
#   → Hello
#   → Hello
```

With variables:
```
set greeting to "Hi"
repeat 5 times
  show greeting
end
```

Using expression for count:
```
set n to 10
repeat n / 2 times
  show "Loop"
end
# Repeats 5 times
```

Building output:
```
set result to ""
repeat 4 times
  set result to result + "*"
end
show result
# Output: ****
```

**Features**:
- Executes body exactly N times
- Count must evaluate to a number
- Creates new environment for each iteration (local scope)
- Can access variables from outer scope
- Can modify outer variables

### Feature 2: `while ... end`
Execute code while condition is true

**Syntax**:
```
while <condition>
  <statements>
end
```

**Examples**:

Counter-based loop:
```
set count to 0
while count < 5
  show count
  set count to count + 1
end
# Output: 0, 1, 2, 3, 4
```

User-controlled loop:
```
set response to "yes"
while response == "yes"
  ask "Continue? (yes/no)" into response
end
show "Done"
```

Fibonacci generation:
```
set a to 0
set b to 1
while a < 100
  show a
  set temp to a + b
  set a to b
  set b to temp
end
```

Countdown:
```
set n to 10
while n > 0
  show n
  set n to n - 1
end
show "Blastoff!"
```

**Features**:
- Tests condition before each iteration
- If condition is false initially, body never executes
- Can be infinite loop if condition never becomes false
- Creates new environment for each iteration (local scope)
- Can access and modify outer variables

**Common Pattern - Manual For Loop**:
```
set i to 0
while i < 10
  show i
  set i to i + 1
end
# Equivalent to: repeat 10 times ... end
```

---

## Functions

### Feature: `define ... return`
Define reusable functions with parameters and return values

**Syntax**:
```
define <function_name>(<param1>, <param2>, ...)
  <statements>
  return <expression>
end
```

**Examples**:

Simple function:
```
define greet()
  show "Hello!"
end

call greet()
# Output: Hello!
```

Function with parameters:
```
define add(a, b)
  return a + b
end

set result to call add(5, 3)
show result
# Output: 8
```

Function without return:
```
define printTwice(msg)
  show msg
  show msg
end

call printTwice("Hi")
# Output: Hi, Hi
```

Multiple parameters:
```
define greetPerson(name, age)
  show "Hello, "
  show name
  show "You are "
  show age
  show " years old"
end

call greetPerson("Alice", 25)
```

Recursive function:
```
define factorial(n)
  if n <= 1
    return 1
  else
    return n * call factorial(n - 1)
  end
end

show call factorial(5)
# Output: 120
```

Closure example:
```
define makeMultiplier(factor)
  define multiply(x)
    return x * factor
  end
  return call multiply(10)
end

show call makeMultiplier(3)
# Output: 30
```

**Features**:
- Functions are first-class values (can be stored, passed)
- Parameters captured when function defined
- Local scope for function body
- Return statement exits function early
- Implicit return of null if no return statement
- Support closures (capture surrounding environment)
- No arrow function syntax

**Function Call Syntax**:
```
call <function_name>(<arg1>, <arg2>, ...)
```

**Arity Checking**:
```
define add(a, b)
  return a + b
end

call add(5)
# RuntimeError: Function 'add' expects 2 arguments but got 1
```

---

## Arrays

### Feature: Array Literals
Create and use arrays

**Syntax**:
```
set <array_var> to [<expr1>, <expr2>, ...]
```

**Examples**:

Number array:
```
set numbers to [1, 2, 3, 4, 5]
show numbers
# Output: [1, 2, 3, 4, 5]
```

String array:
```
set colors to ["red", "green", "blue"]
```

Mixed type array:
```
set data to [1, "hello", 2.5, [1, 2]]
show data
```

Dynamic array:
```
set values to []
set values[0] to 10
set values[1] to 20
show values
# Output: [10, 20]
```

Empty array:
```
set empty to []
```

### Feature: Array Indexing
Access and modify array elements

**Syntax**:
```
<array>[<index>]          # Access
set <array>[<index>] to <value>  # Modify
```

**Examples**:

Reading elements:
```
set arr to ["a", "b", "c"]
show arr[0]      # Output: a
show arr[1]      # Output: b
show arr[2]      # Output: c
```

Modifying elements:
```
set arr to [10, 20, 30]
set arr[1] to 99
show arr[1]      # Output: 99
```

Using expressions:
```
set arr to [5, 10, 15, 20]
set i to 2
show arr[i]      # Output: 15

set sum to 0
set j to 0
while j < 4
  set sum to sum + arr[j]
  set j to j + 1
end
show sum         # Output: 50
```

Array in loop:
```
set items to [1, 2, 3, 4, 5]
set i to 0
while i < 5
  show items[i]
  set i to i + 1
end
```

**Features**:
- Zero-based indexing (first element at 0)
- Dynamic array element assignment (creates element if doesn't exist)
- Out-of-bounds access returns undefined

---

## Comments

### Feature: `#` Comments
Add explanatory text that is ignored by interpreter

**Syntax**:
```
# This is a comment
```

**Examples**:

Basic comment:
```
set x to 5  # Store the value 5
show x      # Display the value
```

Line comments:
```
# Initialize variables
set count to 0
set sum to 0

# Process data
set count to count + 1
```

Code explanation:
```
# Calculate factorial
define factorial(n)
  # Base case: factorial of 0 or 1 is 1
  if n <= 1
    return 1
  else
    # Recursive case: n * factorial(n-1)
    return n * call factorial(n - 1)
  end
end
```

Multiple comment types:
```
# Main program logic
set total to 0  # Initialize accumulator

# Process numbers
repeat 10 times  # Run 10 times
  set total to total + 1
end

show total       # Display result
```

**Features**:
- Comments start with `#` and continue to end of line
- Comments can appear anywhere in code
- Comments are completely ignored by lexer
- Useful for documentation and code clarity
- No multi-line comment syntax

---

## REPL Features

### Interactive Mode
Run Eaze in interactive REPL (Read-Eval-Print Loop)

**Starting REPL**:
```bash
node cli/index.js
```

**Features**:

#### 1. **Multi-line Statement Support**
```
Eaze> repeat 3 times
  ⋮> show "Hello"
  ⋮> end
  → Hello
  → Hello
  → Hello
```

The REPL automatically detects incomplete blocks and prompts for continuation.

#### 2. **Command Reference: `help`**
```
Eaze> help
```

Displays:
- Command list (help, vars, clear, exit)
- Language features with examples
- Operator reference

#### 3. **Variable Inspection: `vars`**
```
Eaze> set x to 5
Eaze> set name to "Alice"
Eaze> define greet()
...
Eaze> vars
```

Displays all defined variables and functions with their values/signatures.

#### 4. **Clear Screen: `clear`**
```
Eaze> clear
```

Clears terminal and redisplays welcome banner.

#### 5. **Exit REPL: `exit`**
```
Eaze> exit
```

Gracefully exits the REPL and returns control to shell.

#### 6. **Easter Egg: `Eaze`**
```
Eaze> Eaze
```

Displays a hidden message about the language philosophy.

### File Execution Mode

Run Eaze programs from file:
```bash
node cli/index.js program.eaze
```

**Example: calculator.eaze**
```
define add(a, b)
  return a + b
end

show "5 + 3 = "
show call add(5, 3)
```

**Running**:
```bash
$ node cli/index.js calculator.eaze
  ▶ Running file: calculator.eaze

  → 5 + 3 =
  → 8
```

### Output Formatting
- Each `show` statement output prefixed with `→`
- Error messages prefixed with `✖`
- Proper spacing and alignment
- Color-coded for readability (in terminal supporting colors)

---

## AI Assistant Features

### Feature 1: Code Explanation
Get AI-powered explanations of Eaze code

**Endpoint**: `POST /api/ai/explain`

**Request**:
```json
{
  "code": "set x to 5\nshow x",
  "ast": { /* AST object */ }
}
```

**Response**:
```json
{
  "explanation": "This code creates a variable x with the value 5, then outputs that value to the console."
}
```

**Use Cases**:
- Learning how code works
- Understanding others' code
- Teaching explanation of concepts
- Verifying code logic

### Feature 2: Debugging Assistance
Get help identifying and fixing errors

**Endpoint**: `POST /api/ai/debug`

**Request**:
```json
{
  "code": "set x to \"hello\"\nshow x + 5",
  "error": "Cannot add string and number"
}
```

**Response**:
```json
{
  "suggestion": "You're trying to add a number to a string. Either convert the string to a number first, or concatenate strings with strings. Use show to combine text and numbers separately."
}
```

**Use Cases**:
- Understanding why code failed
- Learning correct usage
- Getting fix suggestions
- Type system education

### Feature 3: Code Conversion
Convert Eaze code to JavaScript

**Endpoint**: `POST /api/ai/convert`

**Request**:
```json
{
  "code": "repeat 3 times\n  show \"Hello\"\nend"
}
```

**Response**:
```json
{
  "javascript": "for (let i = 0; i < 3; i++) {\n  console.log(\"Hello\");\n}"
}
```

**Use Cases**:
- Learning JavaScript from Eaze
- Converting learning programs to real language
- Understanding language translation
- Transitioning to advanced languages

### Configuration

The AI server requires OpenAI API key:

1. Create `.env` file in `server/` directory:
```
OPENAI_API_KEY=your_key_here
```

2. Start server:
```bash
node server/index.js
```

3. Server runs on `http://localhost:3001`

### Web Playground Integration

The HTML playground (`Eaze Playground/kids_code_editor.html`) integrates these AI features:
- "Explain" button calls `/api/ai/explain`
- "Debug" button calls `/api/ai/debug`
- "Convert to JS" button calls `/api/ai/convert`
- Live code editor with syntax highlighting
- Real-time output display
- Responsive mobile-friendly design

---

## Feature Completeness Matrix

| Feature | Status | Example |
|---------|--------|---------|
| Variables | ✅ Complete | `set x to 5` |
| Numbers | ✅ Complete | `42`, `3.14`, `-10` |
| Strings | ✅ Complete | `"hello"`, `'world'` |
| Arrays | ✅ Complete | `[1, 2, 3]` |
| Arithmetic | ✅ Complete | `+`, `-`, `*`, `/` |
| Comparison | ✅ Complete | `==`, `!=`, `<`, `>`, `<=`, `>=` |
| Logical | ✅ Complete | `and`, `or`, `not` |
| Output | ✅ Complete | `show` |
| Input | ✅ Complete | `ask ... into` |
| If-Else | ✅ Complete | `if ... else ... end` |
| Repeat | ✅ Complete | `repeat ... times ... end` |
| While | ✅ Complete | `while ... end` |
| Functions | ✅ Complete | `define ... return ... end` |
| Comments | ✅ Complete | `#` |
| REPL | ✅ Complete | Interactive mode |
| AI Explain | ✅ Complete | OpenAI integration |
| AI Debug | ✅ Complete | OpenAI integration |
| AI Convert | ✅ Complete | Eaze → JavaScript |

---

## Language Limitations

Current version does not support:
- Classes or objects
- Modules/imports
- Exceptions (try-catch)
- Generators or iterators
- Type annotations
- Destructuring
- Spread operator
- Template literals (backticks)
- Regular expressions
- Native library functions (Math, Date, etc.)
- Floating-point edge cases handling
- Multi-line strings
- Escape sequences in strings

---

## Summary

Eaze provides a complete, beginner-friendly feature set supporting:
- **Data**: Numbers, strings, arrays
- **Operations**: Arithmetic, logical, comparison
- **Control**: Conditionals, loops, functions
- **I/O**: User input and output
- **Learning**: AI-powered explanations, debugging, conversion

All features use simple, English-like syntax making programming accessible to beginners.