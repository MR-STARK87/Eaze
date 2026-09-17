const { app, BrowserWindow, Menu, ipcMain, dialog, shell, nativeTheme } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;

const isDev = !app.isPackaged;

/* ------------------------------------------------------------------
   Window chrome
   The frame is hidden and the caption buttons (- □ ✕) are drawn as an
   overlay, so their colours follow the app theme. Keep these two values
   in sync with --bg / --muted in src/index.css.
   ------------------------------------------------------------------ */

const WINDOW_BAR_HEIGHT = 40;

const WINDOW_CHROME = {
  light: { bar: "#eceef2", symbol: "#5d6b7d" },
  dark: { bar: "#0b0f16", symbol: "#9aa6b7" },
};

let currentTheme = "light";

/** Icon for the window / taskbar (falls back silently if missing). */
function resolveIcon() {
  const candidates = [
    path.join(__dirname, "..", "public", "icon.ico"),
    path.join(__dirname, "..", "build", "icon.ico"),
    process.resourcesPath ? path.join(process.resourcesPath, "icon.ico") : "",
  ].filter(Boolean);
  return candidates.find((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
}

/** Repaint the native caption bar + window background for a theme. */
function applyWindowTheme(win, theme) {
  const chrome = WINDOW_CHROME[theme] || WINDOW_CHROME.light;
  currentTheme = theme;
  nativeTheme.themeSource = theme === "dark" ? "dark" : "light";
  if (!win || win.isDestroyed()) return;
  try {
    win.setTitleBarOverlay({
      color: chrome.bar,
      symbolColor: chrome.symbol,
      height: WINDOW_BAR_HEIGHT,
    });
    win.setBackgroundColor(chrome.bar);
  } catch {
    /* older runtimes: the overlay simply keeps its creation colours */
  }
}

// Avoid fatal GPU-process crashes on machines with flaky graphics drivers
// (VMs, remote desktop, missing DLLs). The UI is simple DOM, so this costs little.
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("in-process-gpu");
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");

let mainWindow = null;

function createWindow() {
  Menu.setApplicationMenu(null); // no File/Edit/View/Help bar

  const chrome = WINDOW_CHROME[currentTheme];

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 940,
    minHeight: 600,
    title: "Eaze Playground",
    backgroundColor: chrome.bar,
    icon: resolveIcon(),
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: chrome.bar,
      symbolColor: chrome.symbol,
      height: WINDOW_BAR_HEIGHT,
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // --- F11 / Esc fullscreen, kept in sync with the renderer ---
  const notifyFullscreen = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("window:fullscreen", mainWindow.isFullScreen());
    }
  };

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return;
    if (input.key === "F11") {
      event.preventDefault();
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    } else if (input.key === "Escape" && mainWindow.isFullScreen()) {
      event.preventDefault();
      mainWindow.setFullScreen(false);
    }
  });

  mainWindow.on("enter-full-screen", notifyFullscreen);
  mainWindow.on("leave-full-screen", notifyFullscreen);

  // Open target=_blank links in the system browser instead of a new window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173/");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    mainWindow.webContents.on("will-navigate", (e, url) => {
      if (!url.startsWith("file://")) e.preventDefault();
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ---------- helpers ----------

const EAZE_RE = /\.eaze$/i;

/** List .eaze files directly in a folder (non-recursive). */
async function listEazeFiles(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && EAZE_RE.test(e.name))
    .map((e) => ({ name: e.name, path: path.join(dir, e.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ---------- IPC: dialogs ----------

ipcMain.handle("dialog:openFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Open Folder of Eaze Files",
    properties: ["openDirectory"],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const folder = result.filePaths[0];
  return { folder, files: await listEazeFiles(folder) };
});

ipcMain.handle("dialog:saveAs", async (_e, { defaultName, content }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Save Eaze File As",
    defaultPath: defaultName || "untitled.eaze",
    filters: [{ name: "Eaze Files", extensions: ["eaze"] }],
  });
  if (result.canceled || !result.filePath) return null;
  await fsp.writeFile(result.filePath, content, "utf-8");
  return { path: result.filePath, name: path.basename(result.filePath) };
});

// ---------- IPC: file operations ----------

ipcMain.handle("fs:readFolder", async (_e, folder) => {
  return listEazeFiles(folder);
});

ipcMain.handle("fs:readFile", async (_e, filePath) => {
  return fsp.readFile(filePath, "utf-8");
});

ipcMain.handle("fs:writeFile", async (_e, { filePath, content }) => {
  await fsp.writeFile(filePath, content, "utf-8");
  return { ok: true, path: filePath };
});

/** Recursive tree of a folder (skips dotfiles & node_modules). */
async function readTree(dir, depth = 0) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  const nodes = [];
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      nodes.push({
        name: e.name,
        path: full,
        type: "folder",
        children: depth < 8 ? await readTree(full, depth + 1) : [],
      });
    } else {
      nodes.push({ name: e.name, path: full, type: "file" });
    }
  }
  return nodes;
}

ipcMain.handle("fs:readTree", async (_e, folder) => {
  try {
    return await readTree(folder);
  } catch (err) {
    throw new Error(`Cannot read folder: ${err.message}`);
  }
});

ipcMain.handle("fs:createFolder", async (_e, folderPath) => {
  await fsp.mkdir(folderPath, { recursive: false });
  return { ok: true, path: folderPath, name: path.basename(folderPath) };
});

ipcMain.handle("fs:renamePath", async (_e, { oldPath, newName }) => {
  const trimmed = String(newName || "").trim();
  if (!trimmed || /[\\/]/.test(trimmed)) {
    throw new Error("Invalid name");
  }
  const target = path.join(path.dirname(oldPath), trimmed);
  try {
    await fsp.access(target);
    throw new Error(`'${trimmed}' already exists`);
  } catch (err) {
    if (!String(err.message).includes("already exists")) {
      // good, target free — fall through to rename
    } else {
      throw err;
    }
  }
  await fsp.rename(oldPath, target);
  return { ok: true, path: target, name: trimmed };
});

ipcMain.handle("fs:deletePath", async (_e, targetPath) => {
  // Move to OS trash (recycle bin) — safe & reversible for kids.
  await shell.trashItem(targetPath);
  return { ok: true };
});

ipcMain.handle("fs:createFile", async (_e, { filePath, content = "" }) => {
  let target = filePath;
  if (!EAZE_RE.test(target)) target += ".eaze";
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.writeFile(target, content, "utf-8");
  return { ok: true, path: target, name: path.basename(target) };
});

ipcMain.handle("fs:deleteFile", async (_e, filePath) => {
  await fsp.unlink(filePath);
  return { ok: true };
});

ipcMain.handle("fs:renameFile", async (_e, { oldPath, newName }) => {
  let target = path.join(path.dirname(oldPath), newName);
  if (!EAZE_RE.test(target)) target += ".eaze";
  await fsp.rename(oldPath, target);
  return { ok: true, path: target, name: path.basename(target) };
});

ipcMain.handle("fs:joinPath", (_e, { folder, name }) =>
  path.join(folder, name)
);

ipcMain.handle("fs:exists", async (_e, filePath) => {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle("app:isDesktop", () => true);

// ---------- IPC: window chrome ----------

ipcMain.handle("window:setTheme", (_e, theme) => {
  applyWindowTheme(mainWindow, theme === "dark" ? "dark" : "light");
  return true;
});

ipcMain.handle("window:toggleFullscreen", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
  return mainWindow.isFullScreen();
});

ipcMain.handle("window:isFullscreen", () =>
  mainWindow && !mainWindow.isDestroyed() ? mainWindow.isFullScreen() : false,
);

ipcMain.handle("app:versions", () => ({
  electron: process.versions.electron,
  node: process.versions.node,
  chrome: process.versions.chrome,
}));

// ---------- lifecycle ----------

// Windows needs an explicit AppUserModelID for taskbar grouping + icon.
if (process.platform === "win32") app.setAppUserModelId("com.eaze.playground");

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
