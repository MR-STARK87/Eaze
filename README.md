# 🧠⚡ Eaze

> Eaze isn't just a language. It's a way to think in code. Less syntax. More ideas.

**Eaze** is a custom, beginner-friendly programming language designed with an English-like syntax to make coding intuitive and accessible. It comes with an interactive REPL, real-time variable tracking, beautiful syntax-aware output, and an optional AI-powered assistant for debugging and learning.

---

## ✨ Features

- **Beginner-Friendly Syntax**: English-like commands (`set`, `show`, `ask`, `repeat`).
- **Interactive REPL**: Instant code execution with beautiful CLI output.
- **Real-Time Variable Tracking**: Use the `vars` command to see everything in memory.
- **Multi-line Support**: Seamlessly write loops, conditionals, and functions.
- **AI Assistant Server**: Optional backend to explain code, debug errors, and convert Eaze to JavaScript.
- **Zero-Dependency Future**: Currently Node.js based, but a transition to a single standalone executable (Windows/macOS/Linux) is [in progress](PLAN_OVERVIEW.md).

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/eaze.git
   cd eaze
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Eaze

**Start the REPL:**
```bash
npm start
```
*Or directly: `node cli/index.js`*

**Run a specific file:**
```bash
node cli/index.js examples/fibonacci.eaze
```

---

## 📖 Language Syntax

Eaze is designed to be easily readable. Here is a quick primer on its syntax.

### Variables
```eaze
set x to 10
set name to "Alice"
```

### Input & Output
```eaze
show "Hello World!"
show x

ask "What is your age?" into age
```

### Conditionals
```eaze
if x > 5
  show "x is greater than 5"
else
  show "x is 5 or less"
end
```

### Loops
```eaze
# Repeat a specific number of times
repeat 5 times
  show "Looping..."
end

# While loop
while x > 0
  show x
  set x to x - 1
end
```

### Functions
```eaze
define add(a, b)
  return a + b
end

set result to call add(5, 10)
show result
```

Check out the `examples/` directory for full programs like a Fibonacci generator and a calculator!

---

## 🤖 AI Server (Optional)

Eaze comes with an optional AI backend powered by OpenAI to help you learn and debug. 

### Setup the AI Server
1. Navigate to the server directory:
   ```bash
   cd server
   npm install
   ```
2. Create a `.env` file in the `server` directory and add your API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```
3. Start the server:
   ```bash
   npm start
   ```

### AI Features (API Endpoints)
- `POST /api/ai/explain`: Get a plain-English explanation of Eaze code.
- `POST /api/ai/debug`: Submit broken Eaze code and an error message to receive a fix.
- `POST /api/ai/convert`: Translate Eaze code directly into standard JavaScript.

---

## 🛠 REPL Commands

When inside the Eaze REPL, you can use these built-in commands:

- `help` - Show the help menu and language feature reference.
- `vars` - Display all currently defined variables and functions.
- `clear` - Clear the terminal screen.
- `exit` - Exit the REPL.

---

## 📦 Roadmap: Standalone Binaries

We are currently executing a plan to ship Eaze as a **single-file, zero-dependency executable** for Windows, macOS, and Linux. This will allow users to run Eaze without needing Node.js installed. 

For full details on this deployment plan, please read the [Executive Summary](EXECUTIVE_SUMMARY.md) and the [Deployment Plan](BINARY_DEPLOYMENT_PLAN.md).

---

## 📄 License

This project is licensed under the ISC License.
