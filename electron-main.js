const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// تشغيل سيرفر Express
require('./server');

let mainWindow = null;

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) return;

  const preloadMain = path.join(__dirname, 'electron', 'preload-main.js');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    show: false,
    webPreferences: {
      preload: preloadMain,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow
    .loadURL(BASE_URL + '/')
    .then(() => {
      console.log('[Electron] main window loaded');
    })
    .catch((err) => {
      console.error('[Electron] failed to load main window URL:', err);
    });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// استمع لأحداث النافذة من الـ renderer
ipcMain.on('window-minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});
ipcMain.on('window-maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});
ipcMain.on('window-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});
ipcMain.on('window-set-title', (e, title) => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setTitle(title || 'SB Smart');
});

ipcMain.handle('dialog:select-directory', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'تحديد مسار',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

app.whenReady().then(() => {
  // فتح النافذة الرئيسية مباشرة بدون شاشة Intro
  setTimeout(createMainWindow, 600);
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    setTimeout(createMainWindow, 300);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
