import React from "react";
import { useAppContext } from "../context/AppContext";
import { useInterpreter } from "../hooks/useInterpreter";
import Icon from "./Icon";

const ToolButton = ({ icon, label, title, onClick, disabled, tone }) => (
  <button
    type="button"
    className={`tool${tone ? ` tool-${tone}` : ""}`}
    title={title || label}
    onClick={onClick}
    disabled={disabled}
  >
    <span className="tool-icon">
      <Icon name={icon} size={21} />
    </span>
    <span className="tool-label">{label}</span>
  </button>
);

const Toolbar = () => {
  const {
    setAiPanelOpen,
    activeFile,
    setModals,
    setActiveTab,
    requestCliRun,
    undo,
    redo,
    canUndo,
    canRedo,
    isDesktop,
    saveStatus,
    saveActiveFile,
    saveActiveFileAs,
  } = useAppContext();
  const { runCode } = useInterpreter();

  const handleRun = () => {
    runCode(activeFile.content);
  };

  const handleRunInCli = () => {
    setActiveTab("cli");
    requestCliRun(activeFile.content, activeFile.name);
  };

  const openModal = (name) => {
    setModals((prev) => ({ ...prev, [name]: true }));
  };

  const saveLabel =
    saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Save failed" : "Save";

  return (
    <header className="toolbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="30" height="30">
            <path
              d="M12.4 6.2 5 16l7.4 9.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19.6 6.2 27 16l-7.4 9.8"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="brand-text">
          <span className="brand-name">
            Eaze <b>Playground</b>
          </span>
          <span className="brand-tag">Learn Build Create</span>
        </span>
      </div>

      <div className="toolbar-actions">
        {isDesktop && (
          <div className="tool-group">
            <ToolButton
              icon="save"
              label={saveLabel}
              title="Save current file (Ctrl+S)"
              onClick={saveActiveFile}
              tone={saveStatus === "error" ? "danger" : undefined}
            />
            <ToolButton
              icon="save-as"
              label="Save As"
              title="Save current file to a new location"
              onClick={saveActiveFileAs}
            />
          </div>
        )}

        <div className="tool-group">
          <ToolButton
            icon="undo"
            label="Undo"
            title="Undo (Ctrl+Z)"
            onClick={undo}
            disabled={!canUndo}
          />
          <ToolButton
            icon="redo"
            label="Redo"
            title="Redo (Ctrl+Y)"
            onClick={redo}
            disabled={!canRedo}
          />
        </div>

        <div className="tool-group">
          <ToolButton
            icon="format"
            label="Format"
            title="Format code (Ctrl+Shift+F)"
          />
          <ToolButton
            icon="templates"
            label="Templates"
            title="Start from a template"
            onClick={() => openModal("templates")}
          />
          <ToolButton
            icon="settings"
            label="Settings"
            onClick={() => openModal("settings")}
          />
          <ToolButton
            icon="help"
            label="Help"
            title="Help & documentation"
            onClick={() => openModal("help")}
          />
        </div>

        <div className="tool-group">
          <ToolButton
            icon="sparkle"
            label="Ask AI"
            title="Open the Eaze AI companion"
            onClick={() => setAiPanelOpen((prev) => !prev)}
            tone="ai"
          />
          <ToolButton
            icon="terminal"
            label="Run in CLI"
            title="Run this file in the terminal"
            onClick={handleRunInCli}
          />
        </div>

        <button
          type="button"
          className="run-btn"
          onClick={handleRun}
          title="Run your program (F5)"
        >
          <Icon name="play" size={15} />
          Run
        </button>
      </div>
    </header>
  );
};

export default Toolbar;
