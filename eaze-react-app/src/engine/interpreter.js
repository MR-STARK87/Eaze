import { Environment } from "./runtime.js";
import { RuntimeError } from "./errors.js";

class ReturnValue {
  constructor(value) {
    this.value = value;
  }
}

export class Interpreter {
  constructor() {
    this.globalEnv = new Environment();
    this.output = [];
    this.outputHandler = null;
    this.inputHandler = (message) => {
      // Default input handler if not overridden
      console.log(message);
      return "0";
    };
    this.trace = [];
    this.traceLimit = 1000;
  }

  setInputHandler(handler) {
    this.inputHandler = handler;
  }

  setOutputHandler(handler) {
    this.outputHandler = handler;
  }

  setTraceLimit(limit) {
    this.traceLimit = limit;
  }

  async run(ast) {
    this.output = [];
    this.trace = [];
    this.logTrace(ast, "start", "Program started");
    try {
      await this.evaluate(ast, this.globalEnv);
    } catch (e) {
      if (e instanceof ReturnValue) {
        throw new RuntimeError("Return statement outside function");
      }
      this.logTrace(null, "error", e.message);
      throw e;
    }
    this.logTrace(ast, "end", "Program finished");
    return this.output;
  }

  logTrace(node, kind, message, data = {}) {
    if (this.trace.length >= this.traceLimit) {
      if (this.trace[this.trace.length - 1].kind !== "truncated") {
        this.trace.push({
          kind: "truncated",
          message: "Trace truncated (limit reached)",
          loc: node ? node.loc : null,
          depth: 0,
          globals: this.getGlobals(),
          outputTail: this.output.slice(-5),
        });
      }
      return;
    }

    this.trace.push({
      kind,
      message,
      data,
      loc: node ? node.loc : null,
      depth: 0, // Simplified depth for now
      globals: this.getGlobals(),
      outputTail: this.output.slice(-5),
    });
  }

  getGlobals() {
    const globals = [];
    for (const [name, value] of this.globalEnv.variables.entries()) {
      globals.push({
        name,
        value: typeof value === "object" && value.isFunction ? "[Function]" : value,
      });
    }
    return globals;
  }

  async evaluate(node, env) {
    if (!node) return null;

    switch (node.type) {
      case "Program":
        return await this.evaluateBlock(node.body, env);

      case "Assignment": {
        const value = await this.evaluate(node.value, env);
        let before;
        if (node.target.type === "Identifier") {
          before = env.variables.has(node.target.name) ? env.get(node.target.name) : "(new)";
          env.set(node.target.name, value);
          this.logTrace(node, "set", `${node.target.name} set to ${value}`, {
            name: node.target.name,
            before,
            after: value,
          });
        } else if (node.target.type === "IndexExpression") {
          const array = await this.evaluate(node.target.object, env);
          const index = await this.evaluate(node.target.index, env);
          if (!Array.isArray(array)) {
            throw new RuntimeError("Can only index arrays");
          }
          if (typeof index !== "number") {
            throw new RuntimeError("Array index must be a number");
          }
          before = array[index];
          array[index] = value;
          this.logTrace(node, "set", `item at ${index} set to ${value}`, {
            target: "array",
            index,
            before,
            after: value,
            scope: "array",
          });
        } else {
          throw new RuntimeError("Invalid assignment target");
        }
        return value;
      }

      case "Show": {
        const value = await this.evaluate(node.value, env);
        this.output.push(value);
        this.logTrace(node, "say", `show ${value}`, { value, verb: "show" });
        if (this.outputHandler) {
          await this.outputHandler(value);
        }
        return null;
      }

      case "Ask": {
        const message = await this.evaluate(node.message, env);
        this.logTrace(node, "ask", `ask "${message}"`, { prompt: message, identifier: node.identifier });
        let answer = this.inputHandler(message);
        if (answer instanceof Promise) {
          answer = await answer;
        }
        const trimmedAnswer = answer.toString().trim();
        const parsedNumber = parseFloat(trimmedAnswer);
        if (
          !isNaN(parsedNumber) &&
          isFinite(parsedNumber) &&
          trimmedAnswer !== ""
        ) {
          answer = parsedNumber;
        }
        env.set(node.identifier, answer);
        return null;
      }

      case "RepeatLoop": {
        const times = await this.evaluate(node.times, env);
        if (typeof times !== "number") {
          throw new RuntimeError(
            `Repeat count must be a number, got ${typeof times}`,
          );
        }
        this.logTrace(node, "repeat", `repeat ${times} times`, { times });
        for (let i = 0; i < times; i++) {
          this.logTrace(node, "loop", `turn ${i + 1} of ${times}`, { i: i + 1, times });
          const loopEnv = new Environment(env);
          await this.evaluateBlock(node.body, loopEnv);
        }
        this.logTrace(node, "repeat", "done repeating", { times });
        return null;
      }

      case "WhileLoop": {
        let iter = 0;
        this.logTrace(node, "while", "start while loop", { condition: true });
        while (await this.evaluate(node.condition, env)) {
          iter++;
          this.logTrace(node, "loop", `while turn ${iter}`, { iter });
          const loopEnv = new Environment(env);
          await this.evaluateBlock(node.body, loopEnv);
        }
        this.logTrace(node, "while", "end while loop", { iter });
        return null;
      }

      case "IfStatement": {
        const condition = await this.evaluate(node.condition, env);
        this.logTrace(node, "if", `if condition is ${condition}`, { condition, hasElse: !!node.elseBody });
        if (condition) {
          const blockEnv = new Environment(env);
          await this.evaluateBlock(node.body, blockEnv);
        } else if (node.elseBody) {
          const blockEnv = new Environment(env);
          await this.evaluateBlock(node.elseBody, blockEnv);
        }
        return null;
      }

      case "ExpressionStatement": {
        return this.evaluate(node.value, env);
      }

      case "FunctionDeclaration": {
        const fn = {
          isFunction: true,
          name: node.name,
          params: node.params,
          body: node.body,
          closure: env,
        };
        env.set(node.name, fn);
        return null;
      }

      case "FunctionCall": {
        const fn = env.get(node.name);
        if (!fn || !fn.isFunction) {
          throw new RuntimeError(`'${node.name}' is not a function`);
        }
        if (fn.params.length !== node.arguments.length) {
          throw new RuntimeError(
            `Function '${node.name}' expects ${fn.params.length} arguments but got ${node.arguments.length}`,
          );
        }

        const callEnv = new Environment(fn.closure);
        for (let i = 0; i < fn.params.length; i++) {
          callEnv.set(
            fn.params[i],
            await this.evaluate(node.arguments[i], env),
          );
        }

        try {
          await this.evaluateBlock(fn.body, callEnv);
        } catch (e) {
          if (e instanceof ReturnValue) {
            return e.value;
          }
          throw e;
        }
        return null;
      }

      case "ReturnStatement": {
        let value = null;
        if (node.value) {
          value = await this.evaluate(node.value, env);
        }
        throw new ReturnValue(value);
      }

      case "LogicalExpression": {
        const left = await this.evaluate(node.left, env);
        if (node.operator === "or") {
          if (left) return left;
          return await this.evaluate(node.right, env);
        } else if (node.operator === "and") {
          if (!left) return left;
          return await this.evaluate(node.right, env);
        }
        throw new RuntimeError(`Unknown logical operator: ${node.operator}`);
      }

      case "UnaryExpression": {
        const right = await this.evaluate(node.right, env);
        if (node.operator === "not") {
          return !right;
        } else if (node.operator === "-") {
          return -right;
        }
        throw new RuntimeError(`Unknown unary operator: ${node.operator}`);
      }

      case "BinaryExpression": {
        const left = await this.evaluate(node.left, env);
        const right = await this.evaluate(node.right, env);

        switch (node.operator) {
          case "+":
            return left + right;
          case "-":
            return left - right;
          case "*":
            return left * right;
          case "/":
            if (right === 0) throw new RuntimeError("Division by zero");
            return left / right;
          case "==":
            return left === right;
          case "!=":
            return left !== right;
          case "<":
            return left < right;
          case ">":
            return left > right;
          case "<=":
            return left <= right;
          case ">=":
            return left >= right;
          default:
            throw new RuntimeError(`Unknown operator: ${node.operator}`);
        }
      }

      case "ArrayLiteral": {
        return Promise.all(node.elements.map((el) => this.evaluate(el, env)));
      }

      case "IndexExpression": {
        const array = await this.evaluate(node.object, env);
        const index = await this.evaluate(node.index, env);
        if (!Array.isArray(array)) {
          throw new RuntimeError("Can only index arrays");
        }
        if (typeof index !== "number") {
          throw new RuntimeError("Array index must be a number");
        }
        return array[index];
      }

      case "NumberLiteral":
      case "StringLiteral":
        return node.value;

      case "Identifier":
        return env.get(node.name);

      default:
        throw new RuntimeError(`Unknown AST node type: ${node.type}`);
    }
  }

  async evaluateBlock(statements, env) {
    let result = null;
    for (const statement of statements) {
      result = await this.evaluate(statement, env);
    }
    return result;
  }
}
