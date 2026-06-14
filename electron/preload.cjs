const { contextBridge, ipcRenderer } = require("electron");

const bridge = {
  isDesktop: true,
  updateTrayMood: (mood, tooltip) => {
    console.log("[EaseUp Preload] updateTrayMood:", mood);
    ipcRenderer.send("tray:update-mood", { mood, tooltip });
  },
  setMonitoringActive: (active) => ipcRenderer.send("monitoring:set-active", active),
  syncMuteState: (muted) => ipcRenderer.send("tray:sync-mute", muted),
  onTrayAction: (callback) => {
    const listener = (_event, action) => callback(action);
    ipcRenderer.on("tray:action", listener);
    return () => ipcRenderer.removeListener("tray:action", listener);
  },
  onWindowShown: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("window:shown", listener);
    return () => ipcRenderer.removeListener("window:shown", listener);
  },
};

contextBridge.exposeInMainWorld("easeUpDesktop", bridge);
contextBridge.exposeInMainWorld("electronAPI", bridge);
