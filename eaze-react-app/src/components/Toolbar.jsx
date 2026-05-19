import React from "react";
import { useAppContext } from "../context/AppContext";
import { useInterpreter } from "../hooks/useInterpreter";

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

  return (
    <header className="toolbar">
      <div className="logo">
        <div className="logo-icon">E</div>
        Eaze Playground
      </div>
      <div className="actions">
        <button
          className="btn"
          title="Undo (Ctrl+Z)"
          onClick={undo}
          disabled={!canUndo}
        >
          ↩️ Undo
        </button>
        <button
          className="btn"
          title="Redo (Ctrl+Y)"
          onClick={redo}
          disabled={!canRedo}
        >
          ↪️ Redo
        </button>
        <button className="btn" title="Format Code (Ctrl+Shift+F)">
          ✨ Format
        </button>
        <button
          className="btn"
          title="Templates"
          onClick={() => openModal("templates")}
        >
          📚 Templates
        </button>
        <button
          className="btn"
          title="Settings"
          onClick={() => openModal("settings")}
        >
          ⚙️ Settings
        </button>
        <button
          className="btn"
          title="Help Documentation"
          onClick={() => openModal("help")}
        >
          ❓ Help
        </button>
        <button
          className="btn btn-ai"
          onClick={() => setAiPanelOpen((prev) => !prev)}
        >
          ✨ Ask AI
        </button>
        <button className="btn" title="Run in CLI" onClick={handleRunInCli}>
          💻 Run in CLI
        </button>
        <button className="btn btn-primary" onClick={handleRun}>
          ▶️ Run
        </button>
      </div>
    </header>
  );
};

export default Toolbar;
