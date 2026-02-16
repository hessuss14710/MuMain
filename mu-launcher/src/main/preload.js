const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  launchGame: (opts) => ipcRenderer.invoke('launch-game', opts),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeApp: () => ipcRenderer.invoke('close-app'),
  onGameClosed: (cb) => ipcRenderer.on('game-closed', cb),
  onGameError: (cb) => ipcRenderer.on('game-error', (_e, msg) => cb(msg)),
});
