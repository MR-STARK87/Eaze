import fs from "fs";
import readline from "readline";
import chalk from "chalk";
import figures from "figures";
import { Lexer } from "../engine/lexer.js";
import { Parser } from "../engine/parser.js";
import { Interpreter } from "../engine/interpreter.js";
import { EazeError, ParseError } from "../engine/errors.js";

const interpreter = new Interpreter();

// ============================================================================
// COLOR PALETTE & STYLING
// ============================================================================
const colors = {
  primary: chalk.rgb(106, 153, 255),
  secondary: chalk.rgb(255, 159, 64),
  success: chalk.rgb(76, 175, 80),
  error: chalk.rgb(244, 67, 54),
  warning: chalk.rgb(255, 193, 7),
  accent: chalk.rgb(156, 39, 176),
  muted: chalk.rgb(158, 158, 158),
  highlight: chalk.rgb(255, 87, 34),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Strip ANSI color codes to get visible length
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

// Format content to fit perfectly in box
function boxLine(content) {
  const contentStr = content.toString();
  const visibleLength = stripAnsi(contentStr).length;
  // Total line: "  ║ " (4) + content (N) + padding (P) + "║" (1) = 66
  // So: N + P + 5 = 66, therefore P = 61 - N
  const targetWidth = 61;
  const padding = Math.max(0, targetWidth - visibleLength);

  return (
    colors.accent("  ║ ") +
    contentStr +
    " ".repeat(padding) +
    colors.accent("║")
  );
}

// ============================================================================
// EASTER EGG
// ============================================================================
function printEasterEgg() {
  console.log("");
  console.log(colors.secondary("  ✨ You found a hidden command... ✨"));
  console.log("");
  console.log(colors.primary("  Eaze isn't just a language."));
  console.log(colors.primary("  It's a way to think in code."));
  console.log("");
  console.log(colors.muted("  Less syntax."));
  console.log(colors.muted("  More ideas."));
  console.log("");
  console.log(colors.accent("  Welcome to Eaze 🧠⚡"));
  console.log("");
}

// ============================================================================
// BANNER & WELCOME
// ============================================================================
function printWelcomeBanner() {
  console.clear();

  console.log("");
  console.log(colors.primary("  ███████╗ █████╗ ███████╗███████╗"));
  console.log(colors.primary("  ██╔════╝██╔══██╗██╔════╝██╔════╝"));
  console.log(colors.secondary("  █████╗  ███████║███████╗█████╗  "));
  console.log(colors.secondary("  ██╔══╝  ██╔══██║╚════██║██╔══╝  "));
  console.log(colors.accent("  ███████╗██║  ██║███████║███████╗"));
  console.log(colors.accent("  ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝"));
  console.log("");

  console.log(colors.muted("  ┌──────────────────────────────────────┐"));
  console.log(colors.muted("  │          Eaze - v1.0.0               │"));
  console.log(colors.muted("  │    A Beginner-Friendly Language      │"));
  console.log(colors.muted("  └──────────────────────────────────────┘"));
  console.log("");

  console.log(colors.secondary("  Welcome to Eaze!"));
  console.log(
    colors.muted("  A simple, beginner-friendly programming language."),
  );
  console.log("");

  const features = [
    ["▶", "Multi-line support for loops, conditionals & functions"],
    ["✨", "Beautiful syntax-aware output"],
    ["☑", "Real-time variable tracking"],
    ["⚡", "Instant code execution"],
  ];

  features.forEach(([icon, feature]) => {
    console.log(`  ${colors.secondary(icon)} ${colors.muted(feature)}`);
  });

  console.log("");
  console.log(
    `  ${colors.muted("Type")} ${colors.primary('"help"')} ${colors.muted("for commands or")} ${colors.primary('"exit"')} ${colors.muted("to quit")}`,
  );
  console.log("");
}

// ============================================================================
// HELP MENU
// ============================================================================
function printHelpMenu() {
  console.log("");
  console.log(colors.accent("  ╔" + "═".repeat(62) + "╗"));
  console.log(boxLine(colors.primary("EAZE COMMAND REFERENCE")));
  console.log(colors.accent("  ╠" + "═".repeat(62) + "╣"));

  const commands = [
    ["help", "Show this help menu"],
    ["vars", "Display all defined variables and functions"],
    ["clear", "Clear the screen"],
    ["exit", "Exit the REPL"],
  ];

  commands.forEach(([cmd, desc]) => {
    const cmdCol = colors.primary(cmd.padEnd(12));
    const descCol = colors.muted(desc);
    const line = `${cmdCol} ${colors.muted("→")} ${descCol}`;
    console.log(boxLine(line));
  });

  console.log(colors.accent("  ╠" + "═".repeat(62) + "╣"));
  console.log(boxLine(colors.secondary("LANGUAGE FEATURES")));
  console.log(colors.accent("  ╠" + "═".repeat(62) + "╣"));

  const features = [
    ["Variables:", "set x to 5"],
    ["Output:", "show x"],
    ["Input:", 'ask "Name?" into name'],
    ["Loops:", "repeat 5 times / while x < 10"],
    ["Conditionals:", "if x > 0 / else / end"],
    ["Functions:", "define add(a, b) / return a + b"],
    ["Comments:", "# This is a comment"],
  ];

  features.forEach(([label, example]) => {
    const labelCol = colors.highlight(label.padEnd(16));
    const exampleCol = colors.muted(example);
    const line = `${labelCol} ${exampleCol}`;
    console.log(boxLine(line));
  });

  console.log(colors.accent("  ╚" + "═".repeat(62) + "╝"));
  console.log("");
}

// ============================================================================
// VARIABLES DISPLAY
// ============================================================================
function printVariables(env) {
  const variables = Array.from(env.variables.entries());

  if (variables.length === 0) {
    console.log("");
    console.log(colors.muted(`  ℹ  No variables defined yet`));
    console.log("");
    return;
  }

  console.log("");
  console.log(colors.accent("  ╔" + "═".repeat(62) + "╗"));
  console.log(boxLine(colors.primary("CURRENT VARIABLES")));
  console.log(colors.accent("  ╠" + "═".repeat(62) + "╣"));

  variables.forEach(([key, value]) => {
    let displayValue;

    if (value && value.isFunction) {
      displayValue = colors.accent(
        `[Function: ${value.name}(${value.params.join(", ")})]`,
      );
    } else if (Array.isArray(value)) {
      displayValue = colors.primary(`[${value.join(", ")}]`);
    } else {
      displayValue = colors.primary(JSON.stringify(value));
    }

    const keyCol = colors.secondary(key);
    const line = `${keyCol} ${colors.muted("→")} ${displayValue}`;
    console.log(boxLine(line));
  });

  console.log(colors.accent("  ╚" + "═".repeat(62) + "╝"));
  console.log("");
}

// ============================================================================
// PROMPTS
// ============================================================================
function showPrompt() {
  process.stdout.write(`${colors.primary("Eaze")}${colors.secondary(">")} `);
}

function showContinuationPrompt() {
  process.stdout.write(`${colors.muted("  ⋮")}${colors.secondary(">")} `);
}

// ============================================================================
// EXECUTION & ERROR HANDLING
// ============================================================================
function run(code) {
  try {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    interpreter.run(ast);

    if (interpreter.output.length > 0) {
      console.log("");
      interpreter.output.forEach((output) => {
        console.log(`  ${colors.success("→")} ${chalk.white(String(output))}`);
      });
      console.log("");
    }
  } catch (error) {
    if (error instanceof EazeError) {
      console.log("");
      console.log(`  ${colors.error("✖")} ${chalk.white(error.toString())}`);
      console.log("");
    } else {
      console.log("");
      console.log(
        `  ${colors.error("✖")} ${chalk.white("Unexpected Error: " + error.message)}`,
      );
      console.log("");
    }
  }
}

function runFile(filename) {
  try {
    console.log(
      `\n  ${colors.primary("▶")} Running file: ${colors.secondary(filename)}\n`,
    );
    const code = fs.readFileSync(filename, "utf-8");
    run(code);
  } catch (error) {
    console.log(
      `  ${colors.error("✖")} Could not read file ${filename}: ${error.message}\n`,
    );
    process.exit(1);
  }
}

// ============================================================================
// REPL LOGIC
// ============================================================================
function isStatementComplete(code) {
  const blockOpeners = /\b(repeat|while|if|define)\b/g;
  const blockClosers = /\bend\b/g;

  const openers = (code.match(blockOpeners) || []).length;
  const closers = (code.match(blockClosers) || []).length;

  return openers === closers;
}

function startREPL() {
  printWelcomeBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let buffer = "";
  let isAwaitingInput = false;

  showPrompt();

  rl.on("line", (line) => {
    const input = line.trim();

    // Handle special commands only if buffer is empty
    if (!buffer) {
      if (input === "exit") {
        console.log("");
        console.log(colors.secondary(`  ♥ Thanks for using Eaze!\n`));
        rl.close();
        return;
      } else if (input === "help") {
        printHelpMenu();
        showPrompt();
        return;
      } else if (input === "vars") {
        printVariables(interpreter.globalEnv);
        showPrompt();
        return;
      } else if (input === "clear") {
        printWelcomeBanner();
        showPrompt();
        return;
      } else if (input === "Eaze") {
        printEasterEgg();
        showPrompt();
        return;
      }
    }

    // Add input to buffer
    if (buffer) {
      buffer += "\n" + line;
    } else {
      buffer = input;
    }

    // Check if statement is complete
    if (buffer && isStatementComplete(buffer)) {
      run(buffer);
      buffer = "";
      isAwaitingInput = false;
      showPrompt();
    } else if (buffer) {
      isAwaitingInput = true;
      showContinuationPrompt();
    }
  }).on("close", () => {
    process.exit(0);
  });
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================
const args = process.argv.slice(2);
if (args.length > 0) {
  runFile(args[0]);
} else {
  startREPL();
}
