const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  session,
  ipcMain,
  powerSaveBlocker,
} = require("electron");
const path = require("path");
const fs = require("fs");

const WINDOW_WIDTH = 460;
const WINDOW_HEIGHT = 760;
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5173";

const TRAY_ICONS = {
  good: "tray-good.png",
  "too-close": "tray-too-close.png",
  shoulder: "tray-shoulder.png",
  idle: "tray-idle.png",
};

let mainWindow = null;
let tray = null;
let isQuitting = false;
let isMonitoringActive = false;
let isMuted = false;
let currentTrayMood = "idle";
let lastTrayTooltip = "EaseUp";
let powerBlockerId = null;
const moodIconCache = new Map();

function loadTrayIcon(mood) {
  const iconFile = TRAY_ICONS[mood];
  if (!iconFile) {
    console.error("[EaseUp Main] Unknown tray mood:", mood);
    return null;
  }

  const iconPath = path.join(__dirname, "assets", iconFile);
  if (moodIconCache.has(mood)) {
    const cached = moodIconCache.get(mood);
    if (cached?.image && !cached.image.isEmpty()) return cached;
  }

  if (!fs.existsSync(iconPath)) {
    console.error("[EaseUp Main] Tray icon missing:", iconPath);
    return null;
  }

  const image = nativeImage.createFromPath(iconPath).resize({ width: 32, height: 32 });
  const loaded = { image, iconPath };
  moodIconCache.set(mood, loaded);
  return loaded;
}

function updateTrayMood(mood, tooltip) {
  const loaded = loadTrayIcon(mood);
  if (!loaded?.image) return;

  currentTrayMood = mood;
  ensureTray();
  tray.setImage(loaded.image);
  console.log("[EaseUp Main] tray icon updated:", loaded.iconPath);
  if (tooltip) {
    lastTrayTooltip = tooltip;
    tray.setToolTip(tooltip);
  }
}

function ensureTray() {
  if (tray && !tray.isDestroyed()) return tray;
  return createTray();
}

function createTray() {
  if (tray && !tray.isDestroyed()) return tray;

  const loaded = loadTrayIcon("idle");
  tray = new Tray(loaded?.image || nativeImage.createEmpty());
  tray.setToolTip("EaseUp");

  tray.on("click", showWindow);
  tray.on("double-click", showWindow);
  tray.on("right-click", () => tray.popUpContextMenu());

  updateTrayMenu();
  return tray;
}

function updateTrayMenu() {
  if (!tray || tray.isDestroyed()) return;

  const menu = Menu.buildFromTemplate([
    { label: "앱 열기", click: showWindow },
    {
      label: "경고음 켜기",
      type: "checkbox",
      checked: !isMuted,
      click: () => {
        isMuted = !isMuted;
        mainWindow?.webContents?.send("tray:action", isMuted ? "mute-on" : "mute-off");
        updateTrayMenu();
      },
    },
    { type: "separator" },
    { label: "종료", click: quitApplication },
  ]);

  tray.setContextMenu(menu);
}

function showWindow() {
  ensureTray();
  if (!mainWindow || mainWindow.isDestroyed()) createWindow();
  if (!mainWindow || mainWindow.isDestroyed()) return;

  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.setSkipTaskbar(false);
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send("window:shown");
}

function hideWindowToTray() {
  ensureTray();
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setSkipTaskbar(true);
  mainWindow.hide();
  tray.setToolTip(
    isMonitoringActive
      ? `${lastTrayTooltip} (백그라운드 모니터링 중)`
      : "EaseUp (트레이에서 실행 중)",
  );
}

function quitApplication() {
  if (isQuitting) return;
  isQuitting = true;
  mainWindow?.webContents?.send("tray:action", "stop-monitoring");

  setTimeout(() => {
    if (powerBlockerId !== null) {
      powerSaveBlocker.stop(powerBlockerId);
      powerBlockerId = null;
    }
    mainWindow?.destroy();
    mainWindow = null;
    tray?.destroy();
    tray = null;
    app.quit();
  }, 300);
}

function setMonitoringActive(active) {
  isMonitoringActive = Boolean(active);
  if (isMonitoringActive && powerBlockerId === null) {
    powerBlockerId = powerSaveBlocker.start("prevent-app-suspension");
  } else if (!isMonitoringActive && powerBlockerId !== null) {
    powerSaveBlocker.stop(powerBlockerId);
    powerBlockerId = null;
  }
}

function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    showWindow();
    return mainWindow;
  }

  ensureTray();
  const loaded = loadTrayIcon("idle");
  const appIconPath = path.join(__dirname, "assets", "app-icon.png");
  const windowIcon =
    loaded?.image ||
    (fs.existsSync(appIconPath)
      ? nativeImage.createFromPath(appIconPath)
      : nativeImage.createEmpty());

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: 360,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: "EaseUp",
    icon: windowIcon && !windowIcon.isEmpty() ? windowIcon : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    hideWindowToTray();
  });

  mainWindow.on("minimize", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    hideWindowToTray();
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || DEV_SERVER_URL;
  if (process.env.NODE_ENV !== "production" || process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.session.clearCache().finally(() => {
      mainWindow?.loadURL(`${devUrl}?v=${Date.now()}`);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  return mainWindow;
}

function setupIpc() {
  ipcMain.on("tray:update-mood", (_event, payload = {}) => {
    console.log("[EaseUp Main] received mood:", payload.mood);
    updateTrayMood(payload.mood, payload.tooltip);
  });

  ipcMain.on("monitoring:set-active", (_event, active) => {
    setMonitoringActive(active);
  });

  ipcMain.on("tray:sync-mute", (_event, muted) => {
    isMuted = Boolean(muted);
    updateTrayMenu();
  });
}

function setupPermissions() {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(["media", "mediaKeySystem"].includes(permission));
  });
}

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.easeup.desktop");
  }
  setupPermissions();
  setupIpc();
  createTray();
  createWindow();
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});

app.on("before-quit", (event) => {
  if (!isQuitting) {
    event.preventDefault();
    hideWindowToTray();
  }
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", showWindow);
}
