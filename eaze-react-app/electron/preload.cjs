const { contextBridge, ipcRenderer } = require("electron");

/**
 * Safe bridge exposed to the renderer as window.eazeDesktop.
 * The web app detects it and only then enables folder/disk features.
 */
contextBridge.exposeInMainWorld("eazeDesktop", {
  isDesktop: true,

  dialogs: {
    openFolder: () => ipcRenderer.invoke("dialog:openFolder"),
    saveAs: (defaultName, content) =>
      ipcRenderer.invoke("dialog:saveAs", { defaultName, content }),
  },

  /** Window chrome: themed caption bar colours + fullscreen helpers. */
  window: {
    setTheme: (theme) => ipcRenderer.invoke("window:setTheme", theme),
    toggleFullscreen: () => ipcRenderer.invoke("window:toggleFullscreen"),
    isFullscreen: () => ipcRenderer.invoke("window:isFullscreen"),
    onFullscreenChange: (callback) => {
      const handler = (_event, isFullscreen) => callback(isFullscreen);
      ipcRenderer.on("window:fullscreen", handler);
      return () => ipcRenderer.removeListener("window:fullscreen", handler);
    },
  },

  fs: {
    readFolder: (folder) => ipcRenderer.invoke("fs:readFolder", folder),
    readTree: (folder) => ipcRenderer.invoke("fs:readTree", folder),
    createFolder: (folderPath) => ipcRenderer.invoke("fs:createFolder", folderPath),
    renamePath: (oldPath, newName) =>
      ipcRenderer.invoke("fs:renamePath", { oldPath, newName }),
    deletePath: (targetPath) => ipcRenderer.invoke("fs:deletePath", targetPath),
    readFile: (filePath) => ipcRenderer.invoke("fs:readFile", filePath),
    writeFile: (filePath, content) =>
      ipcRenderer.invoke("fs:writeFile", { filePath, content }),
    createFile: (filePath, content) =>
      ipcRenderer.invoke("fs:createFile", { filePath, content }),
    deleteFile: (filePath) => ipcRenderer.invoke("fs:deleteFile", filePath),
    renameFile: (oldPath, newName) =>
      ipcRenderer.invoke("fs:renameFile", { oldPath, newName }),
    joinPath: (folder, name) =>
      ipcRenderer.invoke("fs:joinPath", { folder, name }),
    exists: (filePath) => ipcRenderer.invoke("fs:exists", filePath),
  },
});
