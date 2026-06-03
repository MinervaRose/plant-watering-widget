const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("plantWidget", {
  close: () => ipcRenderer.invoke("widget:close"),
  minimize: () => ipcRenderer.invoke("widget:minimize"),
  togglePin: () => ipcRenderer.invoke("widget:togglePin")
});
