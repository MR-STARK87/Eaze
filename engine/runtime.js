import { RuntimeError } from "./errors.js";

export class Environment {
  constructor(parent = null) {
    this.variables = new Map();
    this.parent = parent;
  }

  set(name, value) {
    if (this.variables.has(name)) {
      this.variables.set(name, value);
      return;
    }
    if (this.parent !== null && this.parent.has(name)) {
      this.parent.set(name, value);
      return;
    }
    this.variables.set(name, value);
  }

  get(name, line, column) {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }

    if (this.parent !== null) {
      return this.parent.get(name, line, column);
    }

    throw new RuntimeError(`I don't know what '${name}' is`, line, column);
  }

  has(name) {
    if (this.variables.has(name)) {
      return true;
    }
    if (this.parent !== null) {
      return this.parent.has(name);
    }
    return false;
  }
}
