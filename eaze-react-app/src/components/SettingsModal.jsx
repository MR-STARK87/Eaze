import React from "react";
import Modal from "./Modal";
import { useAppContext } from "../context/AppContext";

const keyboardShortcuts = [
  { key: "Ctrl+Z", desc: "Undo" },
  { key: "Ctrl+Y", desc: "Redo" },
  { key: "Ctrl+S", desc: "Save" },
  { key: "Ctrl+Shift+F", desc: "Format Code" },
  { key: "Tab", desc: "Indent" },
  { key: "Ctrl+/", desc: "Comment" },
];

const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSettings, files } = useAppContext();

  const handleChange = (key, value) => {
    updateSettings({ [key]: value });
  };

  const exportData = () => {
    const data = {
      files,
      settings,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eaze-playground-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    const ok = window.confirm(
      "This will delete ALL your files and reset all settings to default. This cannot be undone. Continue?",
    );
    if (!ok) return;
    localStorage.clear();
    window.location.reload();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="settings-section">
        <div className="settings-title">⚙️ Appearance</div>
        <div className="settings-row">
          <span className="settings-label">Dark Mode</span>
          <div className="settings-value">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.theme === "dark"}
                onChange={(e) =>
                  handleChange("theme", e.target.checked ? "dark" : "light")
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-label">Layout Density</span>
          <div className="settings-value">
            <select
              value={settings.layoutDensity}
              onChange={(e) => handleChange("layoutDensity", e.target.value)}
            >
              <option value="spacious">Spacious</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-label">Sidebar Position</span>
          <div className="settings-value">
            <select
              value={settings.sidebarPosition}
              onChange={(e) => handleChange("sidebarPosition", e.target.value)}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-title">📝 Editor</div>
        <div className="settings-row">
          <span className="settings-label">Font Size</span>
          <div className="settings-value">
            <input
              type="range"
              min="12"
              max="24"
              value={settings.fontSize}
              className="range-slider"
              onChange={(e) =>
                handleChange("fontSize", parseInt(e.target.value))
              }
            />
            <span className="value-display">{settings.fontSize}px</span>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-label">Font Family</span>
          <div className="settings-value">
            <select
              value={settings.fontFamily}
              onChange={(e) => handleChange("fontFamily", e.target.value)}
            >
              <option value="JetBrains Mono">JetBrains Mono</option>
              <option value="Fira Code">Fira Code</option>
              <option value="Consolas">Consolas</option>
              <option value="Courier">Courier</option>
            </select>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-label">Line Numbers</span>
          <div className="settings-value">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showLineNumbers}
                onChange={(e) =>
                  handleChange("showLineNumbers", e.target.checked)
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-label">Word Wrap</span>
          <div className="settings-value">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.wordWrap}
                onChange={(e) => handleChange("wordWrap", e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-label">Tab Size</span>
          <div className="settings-value">
            <select
              value={settings.tabSize}
              onChange={(e) =>
                handleChange("tabSize", parseInt(e.target.value))
              }
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={8}>8 spaces</option>
            </select>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-label">Auto-close Brackets</span>
          <div className="settings-value">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.autoCloseBrackets}
                onChange={(e) =>
                  handleChange("autoCloseBrackets", e.target.checked)
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-title">🚀 Execution</div>
        <div className="settings-row">
          <span className="settings-label">Live Mode (Auto-run)</span>
          <div className="settings-value">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.liveMode}
                onChange={(e) => handleChange("liveMode", e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-label">Trace Step Limit</span>
          <div className="settings-value">
            <input
              type="number"
              value={settings.traceLimit}
              onChange={(e) =>
                handleChange("traceLimit", parseInt(e.target.value))
              }
              style={{ width: "80px" }}
            />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-title">💾 System</div>
        <div className="settings-row">
          <span className="settings-label">Auto-Save</span>
          <div className="settings-value">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => handleChange("autoSave", e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div className="settings-row">
          <button
            className="btn"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={exportData}
          >
            📤 Export All Data (.json)
          </button>
        </div>
        <div
          className="settings-row"
          style={{ background: "oklch(90% 0.1 20)" }}
        >
          <button
            className="btn"
            style={{
              width: "100%",
              justifyContent: "center",
              color: "white",
              background: "oklch(50% 0.2 20)",
              border: "none",
            }}
            onClick={resetAll}
          >
            🧨 Reset Everything
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-title">⌨️ Keyboard Shortcuts</div>
        <div className="shortcuts-grid">
          {keyboardShortcuts.map((s) => (
            <div key={s.key} className="shortcut-item">
              <div className="shortcut-key">{s.key}</div>
              <div className="shortcut-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
