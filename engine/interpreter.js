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
    this.inputHandler = (message) => {
      // Default input handler if not overridden
      console.log(message);
      return "0";
    };
  }

  setInputHandler(handler) {
    this.inputHandler = handler;
  }

  run(ast) {
    this.output = [];
    try {
      this.evaluate(ast, this.globalEnv);
    } catch (e) {
      if (e instanceof ReturnValue) {
        throw new RuntimeError("Return statement outside function");
      }
      throw e;
    }
    return this.output;
  }

  evaluate(node, env) {
    if (!node) return null;

    switch (node.type) {
      case "Program":
        return this.evaluateBlock(node.body, env);

      case "Assignment": {
        const value = this.evaluate(node.value, env);
        if (node.target.type === "Identifier") {
          env.set(node.target.name, value);
        } else if (node.target.type === "IndexExpression") {
          const array = this.evaluate(node.target.object, env);
          const index = this.evaluate(node.target.index, env);
          if (!Array.isArray(array)) {
            throw new RuntimeError("Can only index arrays");
          }
          if (typeof index !== "number") {
            throw new RuntimeError("Array index must be a number");
          }
          array[index] = value;
        } else {
          throw new RuntimeError("Invalid assignment target");
        }
        return value;
      }

      case "Show": {
        const value = this.evaluate(node.value, env);
        this.output.push(value);
        return null;
      }

      case "Ask": {
        const message = this.evaluate(node.message, env);
        let answer = this.inputHandler(message);
        // Attempt to parse to number if it looks like one
        if (!isNaN(parseFloat(answer)) && isFinite(answer)) {
          answer = parseFloat(answer);
        }
        env.set(node.identifier, answer);
        return null;
      }

      case "RepeatLoop": {
        const times = this.evaluate(node.times, env);
        if (typeof times !== "number") {
          throw new RuntimeError(
            `Repeat count must be a number, got ${typeof times}`,
          );
        }
        for (let i = 0; i < times; i++) {
          const loopEnv = new Environment(env);
          this.evaluateBlock(node.body, loopEnv);
        }
        return null;
      }

      case "WhileLoop": {
        while (this.evaluate(node.condition, env)) {
          const loopEnv = new Environment(env);
          this.evaluateBlock(node.body, loopEnv);
        }
        return null;
      }

      case "IfStatement": {
        const condition = this.evaluate(node.condition, env);
        if (condition) {
          const blockEnv = new Environment(env);
          this.evaluateBlock(node.body, blockEnv);
        } else if (node.elseBody) {
          const blockEnv = new Environment(env);
          this.evaluateBlock(node.elseBody, blockEnv);
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
          callEnv.set(fn.params[i], this.evaluate(node.arguments[i], env));
        }

        try {
          this.evaluateBlock(fn.body, callEnv);
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
          value = this.evaluate(node.value, env);
        }
        throw new ReturnValue(value);
      }

      case "LogicalExpression": {
        const left = this.evaluate(node.left, env);
        if (node.operator === "or") {
          if (left) return left;
          return this.evaluate(node.right, env);
        } else if (node.operator === "and") {
          if (!left) return left;
          return this.evaluate(node.right, env);
        }
        throw new RuntimeError(`Unknown logical operator: ${node.operator}`);
      }

      case "UnaryExpression": {
        const right = this.evaluate(node.right, env);
        if (node.operator === "not") {
          return !right;
        } else if (node.operator === "-") {
          return -right;
        }
        throw new RuntimeError(`Unknown unary operator: ${node.operator}`);
      }

      case "BinaryExpression": {
        const left = this.evaluate(node.left, env);
        const right = this.evaluate(node.right, env);

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
        return node.elements.map((el) => this.evaluate(el, env));
      }

      case "IndexExpression": {
        const array = this.evaluate(node.object, env);
        const index = this.evaluate(node.index, env);
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

  evaluateBlock(statements, env) {
    let result = null;
    for (const statement of statements) {
      result = this.evaluate(statement, env);
    }
    return result;
  }
}
