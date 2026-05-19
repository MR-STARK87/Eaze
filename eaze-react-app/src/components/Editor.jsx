import React, { useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useInterpreter } from "../hooks/useInterpreter";

const HIGHLIGHT_KEYWORDS = new Set([
  "say",
  "set",
  "to",
  "show",
  "if",
  "else",
  "repeat",
  "while",
  "define",
  "call",
  "times",
  "end",
  "ask",
  "into",
  "return",
  "and",
  "or",
  "not",
]);

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightEaze(code) {
  let out = "";
  let i = 0;

  while (i < code.length) {
    const ch = code[i];

    if (ch === "\n") {
      out += "\n";
      i++;
      continue;
    }

    if (ch === "#") {
      const start = i;
      while (i < code.length && code[i] !== "\n") i++;
      out += `<span class="token comment">${escapeHtml(code.slice(start, i))}</span>`;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      const start = i;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === "\n") break;
        i++;
      }
      if (i < code.length && code[i] === quote) i++;
      out += `<span class="token string">${escapeHtml(code.slice(start, i))}</span>`;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const start = i;
      while (i < code.length && /[0-9]/.test(code[i])) i++;
      if (i < code.length && code[i] === ".") {
        const dotPos = i;
        i++;
        if (i < code.length && /[0-9]/.test(code[i])) {
          while (i < code.length && /[0-9]/.test(code[i])) i++;
        } else {
          i = dotPos;
        }
      }
      out += `<span class="token number">${escapeHtml(code.slice(start, i))}</span>`;
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      const start = i;
      i++;
      while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) i++;
      const word = code.slice(start, i);
      if (HIGHLIGHT_KEYWORDS.has(word)) {
        out += `<span class="token keyword">${escapeHtml(word)}</span>`;
      } else {
        out += escapeHtml(word);
      }
      continue;
    }

    out += escapeHtml(ch);
    i++;
  }

  return out;
}

const Editor = ({ code, onCodeChange }) => {
  const { settings, activeFile, undo, redo } = useAppContext();
  const { runCode } = useInterpreter();
  const textareaRef = useRef(null);
  const preRef = useRef(null);
  const gutterRef = useRef(null);
  const liveTimerRef = useRef(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const updateCursorPos = () => {
    const text = textareaRef.current.value;
    const selStart = textareaRef.current.selectionStart;
    const lines = text.substring(0, selStart).split("\n");
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  const syncScroll = () => {
    preRef.current.scrollTop = gutterRef.current.scrollTop =
      textareaRef.current.scrollTop;
    preRef.current.scrollLeft = textareaRef.current.scrollLeft;
  };

  const handleInput = (e) => {
    const nextValue = e.target.value;
    onCodeChange(nextValue);
    updateCursorPos();

    if (settings.liveMode) {
      if (liveTimerRef.current) {
        clearTimeout(liveTimerRef.current);
      }
      liveTimerRef.current = setTimeout(() => {
        runCode(nextValue);
      }, 500);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const spaces = " ".repeat(settings.tabSize || 4);
      const newValue = code.substring(0, start) + spaces + code.substring(end);
      onCodeChange(newValue);

      // Set cursor position after update
      setTimeout(() => {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
          start + spaces.length;
        updateCursorPos();
      }, 0);
      return;
    }

    if (settings.autoCloseBrackets) {
      const pairs = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'" };
      if (pairs[e.key]) {
        e.preventDefault();
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const val = code;

        let newValue = "";
        let newStart = start + 1;
        let newEnd = end + 1;

        if (start !== end) {
          newValue =
            val.substring(0, start) +
            e.key +
            val.substring(start, end) +
            pairs[e.key] +
            val.substring(end);
        } else {
          newValue =
            val.substring(0, start) +
            e.key +
            pairs[e.key] +
            val.substring(start);
          newEnd = newStart;
        }

        onCodeChange(newValue);
        setTimeout(() => {
          textareaRef.current.selectionStart = newStart;
          textareaRef.current.selectionEnd = newEnd;
          updateCursorPos();
        }, 0);
      }
    }
  };

  const lineCount = code.split("\n").length;
  const highlighted = highlightEaze(code + (code.endsWith("\n") ? " " : ""));

  const editorStyles = {
    fontSize: settings.fontSize + "px",
    fontFamily: settings.fontFamily + ", monospace",
    whiteSpace: settings.wordWrap ? "pre-wrap" : "pre",
  };

  return (
    <div className="panel editor-panel">
      <div className="panel-header">
        <span className="panel-title">{activeFile?.name || "main.eaze"}</span>
        <span style={{ fontSize: "10px", color: "var(--muted)" }}>
          Ln {cursorPos.line}, Col {cursorPos.col}
        </span>
      </div>
      <div className="editor-area">
        {settings.showLineNumbers && (
          <div className="gutter" ref={gutterRef}>
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} style={{ height: "24px" }}>
                {i + 1}
              </div>
            ))}
          </div>
        )}
        <div className="scroll-container">
          <pre
            className="editor-pre"
            ref={preRef}
            style={editorStyles}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
          <textarea
            className="editor-textarea"
            ref={textareaRef}
            style={editorStyles}
            value={code}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            onClick={updateCursorPos}
            onKeyUp={updateCursorPos}
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
};

export default Editor;
