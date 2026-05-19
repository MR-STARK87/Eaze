import React from "react";
import { AppProvider, useAppContext } from "./context/AppContext";
import Toolbar from "./components/Toolbar";
import Sidebar from "./components/Sidebar";
import BlocksBar from "./components/BlocksBar";
import Editor from "./components/Editor";
import Console from "./components/Console";
import SettingsModal from "./components/SettingsModal";
import TemplatesModal from "./components/TemplatesModal";
import HelpModal from "./components/HelpModal";
import "./App.css";

const AppContent = () => {
  const {
    activeFile,
    updateActiveFileContent,
    aiPanelOpen,
    setAiPanelOpen,
    modals,
    setModals,
  } = useAppContext();

  const handleInsertSnippet = (snippet) => {
    updateActiveFileContent(
      activeFile.content + (activeFile.content ? "\n" : "") + snippet,
    );
  };

  const closeModal = (name) => {
    setModals((prev) => ({ ...prev, [name]: false }));
  };

  return (
    <>
      <Toolbar />
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <BlocksBar onInsert={handleInsertSnippet} />
          <div className="workspace">
            <Editor
              code={activeFile.content}
              onCodeChange={updateActiveFileContent}
            />
            <div className="resizer"></div>
            <Console />
          </div>
        </main>

        <aside className={`ai-panel ${aiPanelOpen ? "open" : ""}`}>
          <div className="panel-header">
            <span className="panel-title">Eaze AI Companion</span>
            <button
              className="btn"
              style={{ border: "none" }}
              onClick={() => setAiPanelOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="ai-chat">
            <div className="msg msg-bot">
              Hi! I'm your Eaze coding buddy. Ask me how to make a loop or use a
              variable!
            </div>
          </div>
          <div className="ai-footer">
            <input
              type="text"
              className="ai-input"
              placeholder="Ask a question..."
            />
            <button
              className="btn btn-primary"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                padding: 0,
                justifyContent: "center",
              }}
            >
              🚀
            </button>
          </div>
        </aside>
      </div>

      <SettingsModal
        isOpen={modals.settings}
        onClose={() => closeModal("settings")}
      />
      <TemplatesModal
        isOpen={modals.templates}
        onClose={() => closeModal("templates")}
      />
      <HelpModal isOpen={modals.help} onClose={() => closeModal("help")} />
    </>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
