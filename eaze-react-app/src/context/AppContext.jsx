import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  isDesktop,
  openFolderDialog,
  readFolder,
  readTree,
  readFile,
  writeFile,
  createFileOnDisk,
  deleteFileOnDisk,
  renameFileOnDisk,
  saveAsDialog,
  joinPath,
  createFolderOnDisk,
  renamePathOnDisk,
  deletePathOnDisk,
  setWindowTheme,
} from "../lib/desktop";

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

/** File object shape:
 *  { name: string, content: string, path?: string (absolute, if on disk) }
 *  Files without `path` are browser-only (localStorage) files.
 */

export const AppProvider = ({ children }) => {
  // ---- persisted workspace (folder + disk-backed flag) ----
  const [workspace, setWorkspace] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("eaze_workspace"));
      if (saved && typeof saved === "object") return saved; // { folder?: string }
    } catch {
      /* ignore */
    }
    return { folder: null };
  });

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
            content: "set i to 1\nrepeat 5 times\n    say i\n    set i to i + 1\nend",
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

  // Disk sync state
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const saveTimersRef = useRef(new Map()); // name -> timeout id

  // Workspace explorer tree (desktop only): [{ name, path, type, children? }]
  const [tree, setTree] = useState([]);
  const [workspaceError, setWorkspaceError] = useState(null);

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
    // Keep the native window caption bar (- □ ✕) matching the theme.
    setWindowTheme(settings.theme);
  }, [settings]);

  // Persist workspace (folder path)
  useEffect(() => {
    localStorage.setItem("eaze_workspace", JSON.stringify(workspace));
  }, [workspace]);

  // ------------------------------------------------------------------
  // Disk I/O
  // ------------------------------------------------------------------

  const writeBufferToDisk = useCallback(async (file) => {
    if (!isDesktop || !file?.path) return false;
    try {
      setSaveStatus("saving");
      const ok = await writeFile(file.path, file.content ?? "");
      setSaveStatus(ok ? "saved" : "error");
      return ok;
    } catch (err) {
      console.error("Failed to write", file.path, err);
      setSaveStatus("error");
      return false;
    }
  }, []);

  // Debounced autosave to disk for files that live on disk
  const scheduleDiskSave = useCallback(
    (file) => {
      if (!isDesktop || !file?.path) return;
      const timers = saveTimersRef.current;
      const prev = timers.get(file.name);
      if (prev) clearTimeout(prev);
      timers.set(
        file.name,
        setTimeout(() => {
          timers.delete(file.name);
          writeBufferToDisk(file);
        }, 600),
      );
    },
    [writeBufferToDisk],
  );

  // ------------------------------------------------------------------
  // History helpers
  // ------------------------------------------------------------------

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
        const file = { ...next[activeIdx], content };
        next[activeIdx] = file;
        // Schedule a disk write for disk-backed files (debounced).
        if (options.skipDiskSave !== true) {
          scheduleDiskSave(file);
        }
        return next;
      });
      if (options.recordHistory !== false) {
        recordHistory(content);
      }
    },
    [activeIdx, recordHistory, scheduleDiskSave],
  );

  // ------------------------------------------------------------------
  // Folder open / refresh
  // ------------------------------------------------------------------

  const loadFolderIntoFiles = useCallback(async (folder) => {
    const entries = await readFolder(folder);
    const loaded = [];
    for (const entry of entries) {
      try {
        const content = await readFile(entry.path);
        loaded.push({ name: entry.name, path: entry.path, content });
      } catch {
        loaded.push({ name: entry.name, path: entry.path, content: "" });
      }
    }
    if (loaded.length === 0) {
      // Folder with no .eaze files: seed one so the workspace isn't empty.
      const firstPath = await joinPath(folder, "untitled.eaze");
      try {
        await createFileOnDisk(firstPath, 'say "Hello from Eaze!"');
        loaded.push({
          name: "untitled.eaze",
          path: firstPath,
          content: 'say "Hello from Eaze!"',
        });
      } catch {
        /* read-only folder — just show the empty tree */
      }
    }
    setFiles(loaded);
    try {
      setTree(await readTree(folder));
      setWorkspaceError(null);
    } catch (err) {
      setWorkspaceError(String(err.message || err));
    }
    historyRef.current.clear();
    setActiveIdx(0);
    setWorkspace({ folder });
    setHistoryState({ canUndo: false, canRedo: false });
  }, []);

  const openFolder = useCallback(async () => {
    if (!isDesktop) return null;
    const result = await openFolderDialog();
    if (!result) return null;
    await loadFolderIntoFiles(result.folder);
    return result.folder;
  }, [loadFolderIntoFiles]);

  const refreshFolder = useCallback(async () => {
    if (!isDesktop || !workspace.folder) return;
    try {
      setTree(await readTree(workspace.folder));
      setWorkspaceError(null);
    } catch (err) {
      setWorkspaceError(String(err.message || err));
    }
  }, [workspace.folder]);

  const closeFolder = useCallback(() => {
    setWorkspace({ folder: null });
    setFiles((prev) => prev.map(({ path, ...rest }) => rest)); // detach from disk
    setTree([]);
    setSaveStatus("idle");
  }, []);

  // ------------------------------------------------------------------
  // File ops (disk-aware)
  // ------------------------------------------------------------------

  const addFile = useCallback(
    async (name, content = "") => {
      const safeName = name.endsWith(".eaze") ? name : name + ".eaze";

      // In a desktop workspace, create the file on disk.
      if (isDesktop && workspace.folder) {
        const filePath = await joinPath(workspace.folder, safeName);
        const created = await createFileOnDisk(filePath, content);
        if (!created) return null;
        const file = { name: created.name ?? safeName, path: created.path, content };
        setFiles((prev) => [...prev, file]);
        setActiveIdx(prev => prev + 1);
        ensureHistory(file.name, content);
        setHistoryState({ canUndo: false, canRedo: false });
        return file;
      }

      setFiles((prev) => [...prev, { name: safeName, content }]);
      setActiveIdx(files.length);
      ensureHistory(safeName, content);
      setHistoryState({ canUndo: false, canRedo: false });
      return { name: safeName, content };
    },
    [createFileOnDisk, ensureHistory, files.length, joinPath, workspace.folder],
  );

  const deleteFile = useCallback(
    async (index) => {
      if (files.length <= 1) return;
      const fileToDelete = files[index];
      if (fileToDelete?.path && isDesktop) {
        try {
          await deleteFileOnDisk(fileToDelete.path);
        } catch (err) {
          console.error("Failed to delete from disk:", err);
          return; // keep file in list if disk delete failed
        }
      }
      setFiles((prev) => prev.filter((_, i) => i !== index));
      if (fileToDelete?.name) {
        historyRef.current.delete(fileToDelete.name);
      }
      if (activeIdx >= index && activeIdx > 0) {
        setActiveIdx(activeIdx - 1);
      }
    },
    [activeIdx, deleteFileOnDisk, files],
  );

  const renameFile = useCallback(
    async (index, newName) => {
      const trimmed = String(newName || "").trim();
      if (!trimmed) return;
      const safeName = trimmed.endsWith(".eaze") ? trimmed : `${trimmed}.eaze`;

      const target = files[index];
      if (!target) return;

      // On disk: rename via fs and update the stored path.
      if (target.path && isDesktop) {
        try {
          const res = await renameFileOnDisk(target.path, safeName);
          if (!res) return;
          setFiles((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], name: res.name, path: res.path };
            return next;
          });
          const entry = historyRef.current.get(target.name);
          if (entry) {
            historyRef.current.delete(target.name);
            historyRef.current.set(res.name, entry);
          }
          return;
        } catch (err) {
          console.error("Rename failed on disk:", err);
          return;
        }
      }

      // Browser-only fallback
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
    },
    [files, renameFileOnDisk],
  );

  // ------------------------------------------------------------------
  // Workspace explorer operations (desktop)
  // ------------------------------------------------------------------

  /** Open a file by absolute path (from the explorer tree). */
  const openFileByPath = useCallback(
    async (filePath, name) => {
      const existingIdx = files.findIndex((f) => f.path === filePath);
      if (existingIdx >= 0) {
        setActiveIdx(existingIdx);
        return;
      }
      try {
        const content = await readFile(filePath);
        setFiles((prev) => [...prev, { name: name || filePath.split(/[\\/]/).pop(), path: filePath, content }]);
        setActiveIdx(files.length);
      } catch (err) {
        console.error("Cannot open file:", err);
      }
      setHistoryState({ canUndo: false, canRedo: false });
    },
    [files],
  );

  /** Create a file inside a workspace folder ("" = workspace root). */
  const createWorkspaceFile = useCallback(
    async (name, parentPath = "") => {
      if (!isDesktop || !workspace.folder) return null;
      const dir = parentPath || workspace.folder;
      const filePath = await joinPath(dir, name);
      const created = await createFileOnDisk(filePath, '');
      if (!created) return null;
      try {
        setTree(await readTree(workspace.folder));
      } catch { /* tree refresh is best-effort */ }
      setFiles((prev) => [...prev, { name: created.name, path: created.path, content: "" }]);
      setActiveIdx(prev => {
        ensureHistory(created.name, "");
        setHistoryState({ canUndo: false, canRedo: false });
        return prev + 1;
      });
      return created;
    },
    [createFileOnDisk, ensureHistory, joinPath, workspace.folder],
  );

  /** Create a folder inside a workspace folder ("" = workspace root). */
  const createWorkspaceFolder = useCallback(
    async (name, parentPath = "") => {
      if (!isDesktop || !workspace.folder) return null;
      const dir = parentPath || workspace.folder;
      const folderPath = await joinPath(dir, name);
      const created = await createFolderOnDisk(folderPath);
      if (!created) return null;
      try {
        setTree(await readTree(workspace.folder));
      } catch { /* best-effort */ }
      return created;
    },
    [createFolderOnDisk, joinPath, workspace.folder],
  );

  /** Rename a file or folder on disk and refresh the tree. */
  const renameWorkspacePath = useCallback(
    async (oldPath, newName) => {
      if (!isDesktop) return;
      try {
        const res = await renamePathOnDisk(oldPath, newName);
        if (!res) return;
        // Update any open file entries that lived under the old path.
        setFiles((prev) =>
          prev.map((f) =>
            f.path === oldPath
              ? { ...f, name: res.name, path: res.path }
              : f.path && f.path.startsWith(oldPath + /\\/.test(oldPath) ? "\\" : "/")
                ? { ...f, path: res.path + f.path.slice(oldPath.length), name: f.name }
                : f,
          ),
        );
        setTree(await readTree(workspace.folder));
      } catch (err) {
        setWorkspaceError(String(err.message || err));
      }
    },
    [renamePathOnDisk, workspace.folder],
  );

  /** Delete a file or folder (to recycle bin) and refresh the tree. */
  const deleteWorkspacePath = useCallback(
    async (targetPath) => {
      if (!isDesktop) return;
      try {
        await deletePathOnDisk(targetPath);
        // Close any open editors for the removed path(s).
        setFiles((prev) => {
          const next = prev.filter(
            (f) => f.path !== targetPath && !(f.path && f.path.startsWith(targetPath + /\\/.test(targetPath) ? "\\" : "/")),
          );
          return next.length ? next : [{ name: "untitled.eaze", content: "" }];
          
        });
        setActiveIdx(0);
        setTree(await readTree(workspace.folder));
      } catch (err) {
        setWorkspaceError(String(err.message || err));
      }
    },
    [deletePathOnDisk, workspace.folder],
  );

  /** Save current file. If it has no path yet, fall back to Save As. */
  const saveActiveFile = useCallback(async () => {
    const file = files[activeIdx];
    if (!file) return false;

    if (file.path) {
      return writeBufferToDisk(file);
    }

    // No disk path yet → Save As dialog (desktop only)
    const res = await saveAsDialog(file.name, file.content ?? "");
    if (!res) return false;
    setFiles((prev) => {
      const next = [...prev];
      next[activeIdx] = { ...next[activeIdx], name: res.name, path: res.path };
      return next;
    });
    setSaveStatus("saved");
    return true;
  }, [activeIdx, files, saveAsDialog, writeBufferToDisk]);

  const saveActiveFileAs = useCallback(async () => {
    const file = files[activeIdx];
    if (!file) return false;
    const res = await saveAsDialog(file.name, file.content ?? "");
    if (!res) return false;
    setFiles((prev) => {
      const next = [...prev];
      next[activeIdx] = { ...next[activeIdx], name: res.name, path: res.path };
      return next;
    });
    setSaveStatus("saved");
    return true;
  }, [activeIdx, files, saveAsDialog]);

  // Ctrl/Cmd+S → save
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveActiveFile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveActiveFile]);

  // ------------------------------------------------------------------
  // Settings / undo-redo / CLI (unchanged behavior)
  // ------------------------------------------------------------------

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
    // Desktop / disk features
    isDesktop,
    workspaceFolder: workspace.folder,
    saveStatus,
    openFolder,
    refreshFolder,
    closeFolder,
    saveActiveFile,
    saveActiveFileAs,
    // Workspace explorer
    tree,
    workspaceError,
    openFileByPath,
    createWorkspaceFile,
    createWorkspaceFolder,
    renameWorkspacePath,
    deleteWorkspacePath,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
