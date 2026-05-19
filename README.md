# 🧠 Eaze: The Human-Centric Programming Language

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D%2018.x-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![AI Powered](https://img.shields.io/badge/AI-Assistant-8A2BE2.svg?logo=openai&logoColor=white)](https://openai.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)

**Eaze** is an interpreted, English-like programming language designed to bridge the gap between human thought and machine execution. Built with a focus on education and accessibility, Eaze removes the "syntax tax" of traditional languages while maintaining the core principles of computer science.

---

## ✨ The Philosophy

Programming should feel like explaining a task to a friend. Eaze replaces cryptic symbols with meaningful keywords, allowing beginners to focus on **logic and flow** rather than semicolon placement and brace nesting.

```eaze
# Simple, readable logic
set score to 10
if score > 5
  show "You passed!"
end

# Intuitive loops
repeat 3 times
  show "Eaze makes coding simple."
end
```

---

## 🚀 Technical Architecture

Eaze is powered by a custom-built, multi-stage interpretation engine written in modern JavaScript (ES Modules).

### 1. Lexical Analysis (Lexer)
*   **Tokenization:** Converts raw source code into a stream of typed tokens.
*   **Safety:** Tracks line and column data for precise error reporting.
*   **Support:** Handles multi-character operators (`==`, `!=`, `<=`, `>=`), string literals (single and double quotes), and comments.

### 2. Syntax Analysis (Parser)
*   **Strategy:** A hand-coded **Recursive Descent Parser**.
*   **Precedence:** Implements a robust operator precedence hierarchy (Logical → Comparison → Additive → Multiplicative → Unary).
*   **Structure:** Generates a comprehensive **Abstract Syntax Tree (AST)** that represents the program's hierarchy.

### 3. Tree-Walking Interpreter
*   **Execution:** Recursively evaluates the AST with support for asynchronous operations (like user input).
*   **Scoping:** Uses a hierarchical **Environment System** supporting local scope and **lexical closures**.
*   **Control Flow:** Sophisticated handling of loops, conditionals, and function calls via specialized exceptions for return values.

---

## 🤖 AI-First Education

Eaze isn't just a language; it's a learning ecosystem. Our integrated AI server (powered by GPT-4o) provides three essential assistants:

*   **🔍 The Explainer:** Decodes complex Eaze logic into plain English by analyzing both the raw code and the generated AST.
*   **🐞 The Debugger:** Provides surgical fix suggestions when runtime errors occur, explaining *why* the error happened.
*   **🔄 The Transpiler:** Shows the path to professional development by converting Eaze logic into clean, idiomatic JavaScript.

---

## 🖥️ The Eaze Ecosystem

### 💎 Professional CLI & REPL
A high-fidelity terminal experience featuring:
*   **Visual Syntax:** Custom box-drawing UI for environment inspection.
*   **Multi-line Buffering:** Intelligent detection of incomplete blocks (loops/functions).
*   **Variable Tracking:** Use the `vars` command to see the current state of the global environment in real-time.
*   **Interactive Help:** A built-in command reference styled for readability.

### 🎨 Visual IDE (React)
A modern, browser-based playground that features:
*   Real-time execution of Eaze code.
*   Direct integration with AI assistants.
*   Syntax-highlighted editor and formatted output console.

---

## 🛠️ Installation & Usage

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) installed.

### 2. Quick Start
```bash
# Clone the repository
git clone https://github.com/yourusername/eaze.git
cd eaze

# Install dependencies
npm install

# Launch the interactive REPL
npm start
```

### 3. Run a File
```bash
node cli/index.js examples/fibonacci.eaze
```

---

## 📁 Project Roadmap

- [x] Core Interpreter (Lexer, Parser, Runtime)
- [x] Multi-line REPL with ANSI Styling
- [x] AI Assistant Server (Explain, Debug, Convert)
- [x] React IDE Playground
- [ ] Arrays and Complex Data Structures
- [ ] Standard Library (Math, String utilities)
- [ ] Local File System I/O

---

## 🤝 Contributing

Eaze is an open-source project. We welcome contributions that improve the engine, enhance the documentation, or add new examples. Please feel free to open a Pull Request!

---

<p align="center">
  Built with ❤️ for the next generation of creators.
</p>
