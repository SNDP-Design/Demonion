import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getDesktopSources: (opts) => ipcRenderer.invoke('get-desktop-sources', opts),
});
