const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  setTitle: (title) => ipcRenderer.send('window-set-title', title),
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
});
