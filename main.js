const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 540,
    height: 560,
    minWidth: 540,
    maxWidth: 540,
    minHeight: 560,
    maxHeight: 560,
    resizable: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    alwaysOnTop: false,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("widget:close", () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle("widget:minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle("widget:togglePin", () => {
  if (!mainWindow) return false;
  const next = !mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(next, "floating");
  return next;
});
