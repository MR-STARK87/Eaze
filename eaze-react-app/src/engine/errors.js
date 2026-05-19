export class EazeError extends Error {
  constructor(message, line, column) {
    super(message);
    this.name = 'EazeError';
    this.line = line;
    this.column = column;
  }

  toString() {
    const location = this.line ? ` (line ${this.line}${this.column ? `, col ${this.column}` : ''})` : '';
    return `❌ ${this.name}${location}: ${this.message}`;
  }
}

export class LexerError extends EazeError {
  constructor(message, line, column) {
    super(message, line, column);
    this.name = 'LexerError';
  }
}

export class ParseError extends EazeError {
  constructor(message, line, column) {
    super(message, line, column);
    this.name = 'ParseError';
  }
}

export class RuntimeError extends EazeError {
  constructor(message, line, column) {
    super(message, line, column);
    this.name = 'RuntimeError';
  }
}
