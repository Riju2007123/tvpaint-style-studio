/* ------------------------------------------------------------------
   my-version - the desktop shell.

   The whole prototype is HTML / CSS / JS (engine.js + ui.js + index.html).
   This file only gives it a real desktop window: no browser chrome, the
   1936x1048 window of the live TVPaint, the dark chrome of the app and the
   real file dialogs for Project > New / Open / Save.
   ------------------------------------------------------------------ */
const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const fsafe = require("./fsafe");

let win = null;
// the page tells the shell whether the project has unsaved changes, so the
// window's X button can ask instead of silently throwing the work away
let projectDirty = false;
let closeConfirmed = false;
const recoveryDir = () => path.join(app.getPath("userData"), "recovery");

// where the project files live on disk
function projectFile() {
  const dir = app.getPath("documents");
  const p = path.join(dir, "my-version");
  try { fs.mkdirSync(p, { recursive: true }); } catch (e) { /* ignore */ }
  return path.join(p, "project.myproj");
}

function createWindow() {
  win = new BrowserWindow({
    width: 1936,
    height: 1048,
    minWidth: 1100,
    minHeight: 680,
    backgroundColor: "#313136",
    title: "my-version — TVPaint-style studio",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      preload: path.join(__dirname, "preload.js")
    }
  });
  win.loadFile("index.html");
  win.once("ready-to-show", () => {
    win.show();
    // the panels float over the canvas, so the window must not be smaller
    // than the drawing area of the live app
    try { win.setMenuBarVisibility(false); } catch (e) { /* ignore */ }
  });
  // X button / Alt+F4: with unsaved changes the page's own Quit dialog decides
  win.on("close", (e) => {
    if (closeConfirmed || !projectDirty) return;
    e.preventDefault();
    try { win.webContents.send("tv:closeRequested"); } catch (err) { closeConfirmed = true; win.close(); }
  });
  // a frozen page must never make the window impossible to close
  win.webContents.on("unresponsive", () => { closeConfirmed = true; });
  win.on("closed", () => { win = null; });
}

// ---- the file dialogs the File menu uses -------------------------------
// (kept for older callers: same native dialog as Save Project, v11 capture)
ipcMain.handle("tv:newProject", async () => {
  const r = await dialog.showSaveDialog(win, {
    title: "Save Project",
    defaultPath: path.join(app.getPath("documents"), "Untitled_(1).tvpp"),
    filters: [{ name: "All Files", extensions: ["*"] }]
  });
  return r.canceled ? null : r.filePath;
});

ipcMain.handle("tv:openProject", async () => {
  const r = await dialog.showOpenDialog(win, {
    title: "Open Project",
    defaultPath: app.getPath("documents"),
    filters: [
      { name: "TVPaint Project", extensions: ["tvpp"] },
      { name: "All Files", extensions: ["*"] }
    ]
  });
  return r.canceled ? null : r.filePaths[0];
});

// TVPaint 11's Save dialog uses the native Windows dialog, the project name
// (*.tvpp) pre-filled and the "All Files" filter (live capture, v11).
ipcMain.handle("tv:saveProjectDialog", async (event, payload) => {
  const name = (payload && payload.name) || "Untitled_(1).tvpp";
  const r = await dialog.showSaveDialog(win, {
    title: "Save Project",
    defaultPath: path.join(app.getPath("documents"), name),
    filters: [{ name: "All Files", extensions: ["*"] }]
  });
  return r.canceled ? null : r.filePath;
});

ipcMain.handle("tv:exportSaveDialog", async (event, payload) => {
  const name = (payload && payload.name) || "Untitled_(1).png";
  const r = await dialog.showSaveDialog(win, {
    title: "Export Footage",
    defaultPath: path.join(app.getPath("pictures"), name),
    filters: (payload && payload.filters) || [{ name: "All Files", extensions: ["*"] }]
  });
  return r.canceled ? null : r.filePath;
});

ipcMain.handle("tv:pickFolder", async (event, payload) => {
  const r = await dialog.showOpenDialog(win, {
    title: "Export Footage",
    defaultPath: (payload && payload.dir) || app.getPath("pictures"),
    properties: ["openDirectory", "createDirectory"]
  });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle("tv:saveProject", async (event, payload) => {
  const data = payload && payload.data ? payload.data : "";
  const r = await dialog.showSaveDialog(win, {
    title: "Save Project",
    defaultPath: projectFile(),
    filters: [{ name: "All Files", extensions: ["*"] }]
  });
  if (r.canceled || !r.filePath) return null;
  fsafe.atomicWrite(r.filePath, data);
  return r.filePath;
});

ipcMain.handle("tv:writeFile", async (event, payload) => {
  const { file, data } = payload || {};
  try { fsafe.atomicWrite(file, data); return true; } catch (err) { return false; }
});

// ---- crash recovery / close guard ---------------------------------------
ipcMain.handle("tv:setDirty", async (event, payload) => {
  projectDirty = !!(payload && payload.dirty);
  return true;
});
ipcMain.handle("tv:writeRecovery", async (event, payload) => {
  try { fsafe.writeRecovery(recoveryDir(), payload && payload.meta, payload && payload.data); return true; } catch (err) { return false; }
});
ipcMain.handle("tv:readRecovery", async () => fsafe.readRecovery(recoveryDir()));
ipcMain.handle("tv:clearRecovery", async () => fsafe.clearRecovery(recoveryDir()));

ipcMain.handle("tv:readFile", async (event, payload) => {
  try { return fs.readFileSync((payload || {}).file, "utf8"); } catch (err) { return null; }
});

// base64 data URLs (canvas exports)
ipcMain.handle("tv:writeFileBinary", async (event, payload) => {
  const { file, data } = payload || {};
  try {
    const b64 = String(data).split(",")[1];
    fsafe.atomicWrite(file, Buffer.from(b64, "base64"));
    return true;
  } catch (err) { return false; }
});

ipcMain.handle("tv:exportFile", async (event, payload) => {
  const p = payload || {};
  const r = await dialog.showSaveDialog(win, {
    title: p.title || "Export",
    defaultPath: path.join(app.getPath("pictures"), p.name || "frame.png"),
    filters: p.filters || [{ name: "PNG image", extensions: ["png"] }]
  });
  if (r.canceled || !r.filePath) return null;
  try {
    fs.writeFileSync(r.filePath, Buffer.from(String(p.data).split(",")[1], "base64"));
    return r.filePath;
  } catch (err) { return null; }
});

ipcMain.handle("tv:openPath", async (event, payload) => {
  const p = (payload || {}).path;
  if (!p) return false;
  try { await shell.openPath(p); return true; } catch (e) { return false; }
});

// File > Open Multi-Backup directory
ipcMain.handle("tv:openBackupDir", async () => {
  const dir = path.join(app.getPath("documents"), "TVPaint Multi-Backup");
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* ignore */ }
  try { await shell.openPath(dir); return dir; } catch (e) { return null; }
});

ipcMain.handle("tv:openLibraryFile", async () => {
  const r = await dialog.showOpenDialog(win, {
    title: "Load Library File",
    defaultPath: app.getPath("documents"),
    filters: [{ name: "TVPaint Library", extensions: ["tvpl"] }, { name: "All Files", extensions: ["*"] }]
  });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle("tv:printerSetup", async () => {
  try {
    require("child_process").spawn("rundll32.exe", ["printui.dll,PrintUIEntry", "/il"], { detached: true, stdio: "ignore" }).unref();
    return true;
  } catch (e) { return false; }
});

// Print the composed page in a hidden window so only the artwork is printed.
ipcMain.handle("tv:printImage", async (event, payload) => {
  const dataUrl = (payload || {}).data;
  if (!dataUrl) return false;
  const w = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  const html = `<html><head><style>@page{margin:0}html,body{margin:0;padding:0}img{width:100%;display:block}</style></head><body><img src="${dataUrl}"></body></html>`;
  await w.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
  return await new Promise(resolve => {
    w.webContents.print({ silent: false, printBackground: true }, (ok) => { w.destroy(); resolve(!!ok); });
  });
});

ipcMain.handle("tv:quit", async () => {
  // a clean quit: nothing left to recover, and the close guard steps aside
  fsafe.clearRecovery(recoveryDir());
  closeConfirmed = true;
  app.quit();
  return true;
});

ipcMain.handle("tv:appInfo", async () => ({
  version: app.getVersion(),
  platform: process.platform,
  electron: process.versions.electron,
  documents: app.getPath("documents"),
  physicalMemoryMB: Math.round(os.totalmem() / 1048576)
}));

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);       // the app draws its own TVPaint menu bar
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
