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

let win = null;

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
  win.on("closed", () => { win = null; });
}

// ---- the file dialogs the File menu uses -------------------------------
ipcMain.handle("tv:newProject", async () => {
  const r = await dialog.showSaveDialog(win, {
    title: "New Project",
    defaultPath: projectFile(),
    filters: [{ name: "my-version project", extensions: ["myproj"] }]
  });
  return r.canceled ? null : r.filePath;
});

ipcMain.handle("tv:openProject", async () => {
  const r = await dialog.showOpenDialog(win, {
    title: "Open Project",
    defaultPath: app.getPath("documents"),
    filters: [{ name: "my-version project", extensions: ["myproj"] }]
  });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle("tv:saveProject", async (e) => {
  const data = e && e.data ? e.data : "";
  const r = await dialog.showSaveDialog(win, {
    title: "Save Project",
    defaultPath: projectFile(),
    filters: [{ name: "my-version project", extensions: ["myproj"] }]
  });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, data, "utf8");
  return r.filePath;
});

ipcMain.handle("tv:writeFile", async (e) => {
  const { file, data } = e;
  try { fs.writeFileSync(file, data); return true; } catch (err) { return false; }
});

ipcMain.handle("tv:readFile", async (e) => {
  try { return fs.readFileSync(e.file, "utf8"); } catch (err) { return null; }
});

ipcMain.handle("tv:exportFile", async (e) => {
  const r = await dialog.showSaveDialog(win, {
    title: e.title || "Export",
    defaultPath: path.join(app.getPath("pictures"), e.name || "frame.png"),
    filters: e.filters || [{ name: "PNG image", extensions: ["png"] }]
  });
  if (r.canceled || !r.filePath) return null;
  try {
    fs.writeFileSync(r.filePath, Buffer.from(e.data.split(",")[1], "base64"));
    return r.filePath;
  } catch (err) { return null; }
});

ipcMain.handle("tv:appInfo", async () => ({
  version: app.getVersion(),
  platform: process.platform,
  electron: process.versions.electron
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
