import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // File system state
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem("eaze_files");
    return saved
      ? JSON.parse(saved)
      : [
          {
            name: "hello.eaze",
            content:
              'say "Welcome to Eaze!"\n\nset player to "Zaid"\nsay "Hello, "\nsay player',
          },
          {
            name: "counter.eaze",
            content:
              "set i to 1\nrepeat 5 times\n    say i\n    set i to i + 1\nend",
          },
        ];
  });
  const [activeIdx, setActiveIdx] = useState(0);

  // App settings
  const [settings, setSettings] = useState(() => {
    return {
      theme: localStorage.getItem("eaze_theme") || "light",
      fontSize: parseInt(localStorage.getItem("eaze_fontSize")) || 15,
      fontFamily: localStorage.getItem("eaze_fontFamily") || "JetBrains Mono",
      showLineNumbers: localStorage.getItem("eaze_showLineNumbers") !== "false",
      autoSave: localStorage.getItem("eaze_autoSave") !== "false",
      wordWrap: localStorage.getItem("eaze_wordWrap") === "true",
      tabSize: parseInt(localStorage.getItem("eaze_tabSize")) || 4,
      autoCloseBrackets:
        localStorage.getItem("eaze_autoCloseBrackets") !== "false",
      layoutDensity: localStorage.getItem("eaze_layoutDensity") || "spacious",
      sidebarPosition: localStorage.getItem("eaze_sidebarPosition") || "left",
      liveMode: localStorage.getItem("eaze_liveMode") === "true",
      traceLimit: parseInt(localStorage.getItem("eaze_traceLimit")) || 1000,
    };
  });

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("output");
  const [isConsoleFull, setIsConsoleFull] = useState(false);
  const [modals, setModals] = useState({
    settings: false,
    templates: false,
    help: false,
  });

  // CLI run requests
  const [cliRunRequest, setCliRunRequest] = useState(null);

  // Execution state
  const [outputs, setOutputs] = useState([]);
  const [variables, setVariables] = useState(new Map());
  const [trace, setTrace] = useState([]);

  // Undo/Redo state (tracked per file)
  const historyRef = useRef(new Map());
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
  });

  const ensureHistory = useCallback((fileName, content) => {
    if (!fileName) return null;
    let entry = historyRef.current.get(fileName);
    if (!entry) {
      entry = { stack: [content || ""], index: 0 };
      historyRef.current.set(fileName, entry);
    }
    return entry;
  }, []);

  const syncHistoryState = useCallback(
    (fileName, content) => {
      const entry = ensureHistory(fileName, content);
      if (!entry) return;
      setHistoryState({
        canUndo: entry.index > 0,
        canRedo: entry.index < entry.stack.length - 1,
      });
    },
    [ensureHistory],
  );

  // Persist files (respect auto-save)
  useEffect(() => {
    if (!settings.autoSave) return;
    localStorage.setItem("eaze_files", JSON.stringify(files));
  }, [files, settings.autoSave]);

  // Persist settings
  useEffect(() => {
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(`eaze_${key}`, value);
    });
    document.body.setAttribute("data-theme", settings.theme);
    document.body.setAttribute("data-density", settings.layoutDensity);
    document.body.setAttribute("data-sidebar", settings.sidebarPosition);
  }, [settings]);

  const recordHistory = useCallback(
    (content, fileNameOverride) => {
      const fileName = fileNameOverride || files[activeIdx]?.name;
      if (!fileName) return;
      const entry = ensureHistory(fileName, content);
      if (!entry) return;
      if (entry.stack[entry.index] === content) return;
      entry.stack = entry.stack.slice(0, entry.index + 1);
      entry.stack.push(content);
      entry.index = entry.stack.length - 1;
      setHistoryState({
        canUndo: entry.index > 0,
        canRedo: entry.index < entry.stack.length - 1,
      });
    },
    [activeIdx, ensureHistory, files],
  );

  const updateActiveFileContent = useCallback(
    (content, options = {}) => {
      setFiles((prev) => {
        const next = [...prev];
        next[activeIdx] = { ...next[activeIdx], content };
        return next;
      });
      if (options.recordHistory !== false) {
        recordHistory(content);
      }
    },
    [activeIdx, recordHistory],
  );

  const addFile = useCallback(
    (name, content = "") => {
      const safeName = name.endsWith(".eaze") ? name : name + ".eaze";
      setFiles((prev) => [...prev, { name: safeName, content }]);
      setActiveIdx(files.length);
      ensureHistory(safeName, content);
      setHistoryState({ canUndo: false, canRedo: false });
    },
    [ensureHistory, files.length],
  );

  const deleteFile = useCallback(
    (index) => {
      if (files.length <= 1) return;
      const fileToDelete = files[index];
      setFiles((prev) => prev.filter((_, i) => i !== index));
      if (fileToDelete?.name) {
        historyRef.current.delete(fileToDelete.name);
      }
      if (activeIdx >= index && activeIdx > 0) {
        setActiveIdx(activeIdx - 1);
      }
    },
    [activeIdx, files],
  );

  const renameFile = useCallback((index, newName) => {
    const trimmed = String(newName || "").trim();
    if (!trimmed) return;
    const safeName = trimmed.endsWith(".eaze") ? trimmed : `${trimmed}.eaze`;

    setFiles((prev) => {
      const exists = prev.some(
        (f, i) =>
          i !== index && f.name.toLowerCase() === safeName.toLowerCase(),
      );
      if (exists) return prev;

      const next = [...prev];
      const oldName = next[index]?.name;
      next[index] = { ...next[index], name: safeName };

      if (oldName && oldName !== safeName) {
        const entry = historyRef.current.get(oldName);
        if (entry) {
          historyRef.current.delete(oldName);
          historyRef.current.set(safeName, entry);
        }
      }
      return next;
    });
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const undo = useCallback(() => {
    const fileName = files[activeIdx]?.name;
    const content = files[activeIdx]?.content;
    if (!fileName) return;
    const entry = ensureHistory(fileName, content);
    if (!entry || entry.index <= 0) return;
    entry.index -= 1;
    updateActiveFileContent(entry.stack[entry.index], { recordHistory: false });
    setHistoryState({
      canUndo: entry.index > 0,
      canRedo: entry.index < entry.stack.length - 1,
    });
  }, [activeIdx, ensureHistory, files, updateActiveFileContent]);

  const redo = useCallback(() => {
    const fileName = files[activeIdx]?.name;
    const content = files[activeIdx]?.content;
    if (!fileName) return;
    const entry = ensureHistory(fileName, content);
    if (!entry || entry.index >= entry.stack.length - 1) return;
    entry.index += 1;
    updateActiveFileContent(entry.stack[entry.index], { recordHistory: false });
    setHistoryState({
      canUndo: entry.index > 0,
      canRedo: entry.index < entry.stack.length - 1,
    });
  }, [activeIdx, ensureHistory, files, updateActiveFileContent]);

  const requestCliRun = useCallback((code, filename) => {
    setCliRunRequest({ id: Date.now(), code, filename });
  }, []);

  useEffect(() => {
    const activeFile = files[activeIdx];
    if (!activeFile) return;
    syncHistoryState(activeFile.name, activeFile.content);
  }, [activeIdx, files, syncHistoryState]);

  const value = {
    files,
    activeIdx,
    setActiveIdx,
    activeFile: files[activeIdx],
    updateActiveFileContent,
    addFile,
    deleteFile,
    renameFile,
    settings,
    updateSettings,
    sidebarCollapsed,
    setSidebarCollapsed,
    aiPanelOpen,
    setAiPanelOpen,
    activeTab,
    setActiveTab,
    isConsoleFull,
    setIsConsoleFull,
    modals,
    setModals,
    outputs,
    setOutputs,
    variables,
    setVariables,
    trace,
    setTrace,
    undo,
    redo,
    canUndo: historyState.canUndo,
    canRedo: historyState.canRedo,
    cliRunRequest,
    requestCliRun,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
