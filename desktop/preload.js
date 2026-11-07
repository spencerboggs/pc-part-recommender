const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pcAdvisorDesktop', {
  platform: process.platform,
  getHardware: () => ipcRenderer.invoke('hardware:scan'),
  getPrices: () => ipcRenderer.invoke('prices:get'),
  getAppInfo: () => ipcRenderer.invoke('app:info')
});
