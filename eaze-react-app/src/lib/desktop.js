/**
 * Thin wrapper over the Electron preload bridge (window.eazeDesktop).
 * Everything returns null / false gracefully in a plain browser, so
 * components can call these without guards.
 */

const bridge = typeof window !== "undefined" ? window.eazeDesktop : null;

export const isDesktop = !!bridge;

/**
 * Keep the native caption bar (- □ ✕) in step with the app theme.
 * No-op in a plain browser.
 */
export function setWindowTheme(theme) {
  if (!bridge?.window) return false;
  return bridge.window.setTheme(theme === "dark" ? "dark" : "light");
}

/** Toggle window fullscreen (same as pressing F11). */
export async function toggleFullscreen() {
  if (!bridge?.window) return null;
  return bridge.window.toggleFullscreen();
}

/** Whether the window is currently fullscreen. */
export async function isFullscreen() {
  if (!bridge?.window) return false;
  return bridge.window.isFullscreen();
}

/** Subscribe to fullscreen changes; returns an unsubscribe function. */
export function onFullscreenChange(callback) {
  if (!bridge?.window) return () => {};
  return bridge.window.onFullscreenChange(callback);
}

/** Ask the user to pick a folder; returns { folder, files } or null. */
export async function openFolderDialog() {
  if (!bridge) return null;
  return bridge.dialogs.openFolder();
}/** Read all .eaze file entries in a folder: [{ name, path }] */
export async function readFolder(folder) {
  if (!bridge) return [];
  return bridge.fs.readFolder(folder);
}

/** Recursive tree of the workspace: [{ name, path, type, children? }] */
export async function readTree(folder) {
  if (!bridge) return [];
  return bridge.fs.readTree(folder);
}

/** Create a folder on disk. Returns { path, name } or null. */
export async function createFolderOnDisk(folderPath) {
  if (!bridge) return null;
  return bridge.fs.createFolder(folderPath);
}

/** Rename a file OR folder on disk; returns { path, name } or null. */
export async function renamePathOnDisk(oldPath, newName) {
  if (!bridge) return null;
  return bridge.fs.renamePath(oldPath, newName);
}

/** Delete a file OR folder to the OS recycle bin. */
export async function deletePathOnDisk(targetPath) {
  if (!bridge) return false;
  const res = await bridge.fs.deletePath(targetPath);
  return !!res?.ok;
}

/** Read one file's content from disk. */
export async function readFile(filePath) {
  if (!bridge) return null;
  return bridge.fs.readFile(filePath);
}

/** Overwrite an existing file (already on disk) with new content. */
export async function writeFile(filePath, content) {
  if (!bridge) return false;
  const res = await bridge.fs.writeFile(filePath, content);
  return !!res?.ok;
}

/** Create a new file on disk (adds .eaze if missing). Returns {path,name}|null. */
export async function createFileOnDisk(filePath, content = "") {
  if (!bridge) return null;
  return bridge.fs.createFile(filePath, content);
}

/** Delete a file from disk. */
export async function deleteFileOnDisk(filePath) {
  if (!bridge) return false;
  const res = await bridge.fs.deleteFile(filePath);
  return !!res?.ok;
}

/** Rename a file on disk; returns { path, name } or null. */
export async function renameFileOnDisk(oldPath, newName) {
  if (!bridge) return null;
  return bridge.fs.renameFile(oldPath, newName);
}

/** Join folder + file name into a full path (Electron-side). */
export async function joinPath(folder, name) {
  if (!bridge) return `${folder}/${name}`.replace(/\\/g, "/");
  return bridge.fs.joinPath(folder, name);
}

/** Save As dialog; returns { path, name } or null. */
export async function saveAsDialog(defaultName, content) {
  if (!bridge) return null;
  return bridge.dialogs.saveAs(defaultName, content);
}
