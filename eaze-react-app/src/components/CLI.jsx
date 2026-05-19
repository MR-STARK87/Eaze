import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { Lexer } from "../engine/lexer";
import { Parser } from "../engine/parser";
import { Interpreter } from "../engine/interpreter";

const CLI = () => {
  const { activeTab, cliRunRequest } = useAppContext();
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [prompt, setPrompt] = useState(">");
  const [buffer, setBuffer] = useState("");
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const outputRef = useRef(null);
  const inputRef = useRef(null);
  const interpreterRef = useRef(new Interpreter());
  const inputResolverRef = useRef(null);

  const appendLine = useCallback((content, className = "") => {
    setHistory((prev) => [...prev, { content, className }]);
  }, []);

  const printWelcome = useCallback(() => {
    appendLine(<span className="cli-secondary">Welcome to Eaze CLI!</span>);
    appendLine(
      <span className="cli-muted">
        Type <span className="cli-primary">"help"</span> for commands or{" "}
        <span className="cli-primary">"exit"</span> to reset.
      </span>,
    );
    appendLine(" ");
  }, [appendLine]);

  useEffect(() => {
    printWelcome();
  }, [printWelcome]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (activeTab === "cli" && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 10);
    }
  }, [activeTab]);

  useEffect(() => {
    const interpreter = interpreterRef.current;
    interpreter.setInputHandler((message) => {
      return new Promise((resolve) => {
        appendLine(
          <span className="cli-secondary">{message}</span>,
          "ask-line",
        );
        setIsWaitingForInput(true);
        inputResolverRef.current = resolve;
        if (inputRef.current) inputRef.current.focus();
      });
    });
    interpreter.setOutputHandler((value) => {
      appendLine(
        <span className="cli-success">→ {String(value)}</span>,
        "output-line",
      );
    });
  }, [appendLine]);

  const resetInterpreter = useCallback(() => {
    interpreterRef.current = new Interpreter();
    const interpreter = interpreterRef.current;
    interpreter.setInputHandler((message) => {
      return new Promise((resolve) => {
        appendLine(
          <span className="cli-secondary">{message}</span>,
          "ask-line",
        );
        setIsWaitingForInput(true);
        inputResolverRef.current = resolve;
        if (inputRef.current) inputRef.current.focus();
      });
    });
    interpreter.setOutputHandler((value) => {
      appendLine(
        <span className="cli-success">→ {String(value)}</span>,
        "output-line",
      );
    });
  }, [appendLine]);

  const isStatementComplete = (code) => {
    const blockOpeners = /\b(repeat|while|if|define)\b/g;
    const blockClosers = /\bend\b/g;
    const openers = (code.match(blockOpeners) || []).length;
    const closers = (code.match(blockClosers) || []).length;
    return openers === closers;
  };

  const handleExecute = useCallback(
    async (code) => {
      try {
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        await interpreterRef.current.run(ast);
      } catch (err) {
        appendLine(<span className="cli-error">✖ {err.toString()}</span>);
      }
    },
    [appendLine],
  );

  const handleKeyDown = async (e) => {
    if (e.key !== "Enter") return;

    const currentInput = input;
    const cmd = currentInput.trim();
    setInput("");

    if (isWaitingForInput) {
      appendLine(<span className="cli-primary">{cmd}</span>);
      setIsWaitingForInput(false);
      const resolver = inputResolverRef.current;
      inputResolverRef.current = null;
      if (resolver) resolver(cmd);
      return;
    }

    appendLine(
      <span className="cli-secondary">
        {prompt} {currentInput}
      </span>,
    );

    if (cmd === "clear") {
      setHistory([]);
      printWelcome();
      return;
    }
    if (cmd === "help") {
      appendLine(
        <span className="cli-primary">
          Available commands: help, vars, clear, exit
        </span>,
      );
      return;
    }
    if (cmd === "vars") {
      const vars = Array.from(
        interpreterRef.current.globalEnv.variables.entries(),
      );
      if (vars.length === 0) {
        appendLine(<span className="cli-muted">No variables defined.</span>);
      } else {
        vars.forEach(([k, v]) => {
          appendLine(
            <span className="cli-primary">
              {k} → {JSON.stringify(v)}
            </span>,
          );
        });
      }
      return;
    }
    if (cmd === "exit") {
      resetInterpreter();
      appendLine(<span className="cli-warning">Environment reset.</span>);
      return;
    }

    const newBuffer = buffer ? buffer + "\n" + currentInput : currentInput;
    if (isStatementComplete(newBuffer)) {
      setBuffer("");
      setPrompt(">");
      await handleExecute(newBuffer);
    } else {
      setBuffer(newBuffer);
      setPrompt("..");
    }
  };

  useEffect(() => {
    if (!cliRunRequest) return;
    appendLine(
      <span className="cli-primary">
        ▶ Running file:{" "}
        <span className="cli-secondary">{cliRunRequest.filename}</span>
      </span>,
    );
    handleExecute(cliRunRequest.code).then(() => {
      appendLine(" ");
      if (inputRef.current) inputRef.current.focus();
    });
  }, [appendLine, cliRunRequest, handleExecute]);

  return (
    <div className="cli-container">
      <div className="cli-output" ref={outputRef}>
        {history.map((line, i) => (
          <div key={i} className={line.className}>
            {line.content}
          </div>
        ))}
      </div>
      <div className="cli-input-line">
        <span className="cli-prompt">{prompt}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="cli-input"
          spellCheck="false"
          autoComplete="off"
        />
      </div>
    </div>
  );
};

export default CLI;
