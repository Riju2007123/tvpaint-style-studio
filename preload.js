/* the bridge between the page and the desktop shell: the real file dialogs */
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("tv", {
  isDesktop: true,
  newProject: () => ipcRenderer.invoke("tv:newProject"),
  openProject: () => ipcRenderer.invoke("tv:openProject"),
  saveProject: (data) => ipcRenderer.invoke("tv:saveProject", { data }),
  saveProjectDialog: (name) => ipcRenderer.invoke("tv:saveProjectDialog", { name }),
  exportSaveDialog: (name, filters) => ipcRenderer.invoke("tv:exportSaveDialog", { name, filters }),
  pickFolder: (dir) => ipcRenderer.invoke("tv:pickFolder", { dir }),
  writeFile: (file, data) => ipcRenderer.invoke("tv:writeFile", { file, data }),
  writeFileBinary: (file, data) => ipcRenderer.invoke("tv:writeFileBinary", { file, data }),
  readFile: (file) => ipcRenderer.invoke("tv:readFile", { file }),
  exportFile: (name, data, filters) => ipcRenderer.invoke("tv:exportFile", { name, data, filters }),
  openPath: (path) => ipcRenderer.invoke("tv:openPath", { path }),
  openBackupDir: () => ipcRenderer.invoke("tv:openBackupDir"),
  openLibraryFile: () => ipcRenderer.invoke("tv:openLibraryFile"),
  printerSetup: () => ipcRenderer.invoke("tv:printerSetup"),
  printImage: (data) => ipcRenderer.invoke("tv:printImage", { data }),
  quit: () => ipcRenderer.invoke("tv:quit"),
  setDirty: (dirty) => ipcRenderer.invoke("tv:setDirty", { dirty }),
  writeRecovery: (meta, data) => ipcRenderer.invoke("tv:writeRecovery", { meta, data }),
  readRecovery: () => ipcRenderer.invoke("tv:readRecovery"),
  clearRecovery: () => ipcRenderer.invoke("tv:clearRecovery"),
  onCloseRequested: (cb) => ipcRenderer.on("tv:closeRequested", () => cb()),
  appInfo: () => ipcRenderer.invoke("tv:appInfo"),
  documentsPath: null,
  browser: false
});
