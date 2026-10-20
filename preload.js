/* the bridge between the page and the desktop shell: the real file dialogs */
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("tv", {
  isDesktop: true,
  newProject: () => ipcRenderer.invoke("tv:newProject"),
  openProject: () => ipcRenderer.invoke("tv:openProject"),
  saveProject: (data) => ipcRenderer.invoke("tv:saveProject", { data }),
  writeFile: (file, data) => ipcRenderer.invoke("tv:writeFile", { file, data }),
  readFile: (file) => ipcRenderer.invoke("tv:readFile", { file }),
  exportFile: (name, data, filters) => ipcRenderer.invoke("tv:exportFile", { name, data, filters }),
  appInfo: () => ipcRenderer.invoke("tv:appInfo")
});
