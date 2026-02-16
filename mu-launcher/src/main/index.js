const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let gameProcess = null;

const VOICE_SERVER_URL = 'wss://giloria.es/voice';

const SERVERS = [
  { name: 'MU Giloria (Season 6)', address: 'giloria.es', port: 44405 },
  { name: 'MU Giloria (MuMain)', address: 'giloria.es', port: 44406 },
];

const RESOLUTIONS = [
  { label: '640x480', width: 640, height: 480, index: 0 },
  { label: '800x600', width: 800, height: 600, index: 1 },
  { label: '1024x768', width: 1024, height: 768, index: 2 },
  { label: '1280x1024', width: 1280, height: 1024, index: 3 },
  { label: '1600x900', width: 1600, height: 900, index: 6 },
  { label: '1680x1050', width: 1680, height: 1050, index: 8 },
  { label: '1920x1080', width: 1920, height: 1080, index: 9 },
  { label: '2560x1440', width: 2560, height: 1440, index: 10 },
];

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(getSettingsPath(), 'utf-8'));
  } catch {
    return {
      characterName: '',
      server: 0,
      resolution: '1920x1080',
      language: 'es',
      theme: 'dark',
      voiceEnabled: true,
    };
  }
}

function saveSettings(settings) {
  const dir = path.dirname(getSettingsPath());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 700,
    resizable: false,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.on('close', (e) => {
    if (gameProcess) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.ico');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('MU Giloria - Voice Chat');
  updateTrayMenu();

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function updateTrayMenu() {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    { label: 'Mostrar', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
    { type: 'separator' },
    { label: 'Salir', click: () => { gameProcess = null; app.quit(); } },
  ]);
  tray.setContextMenu(menu);
}

function writeConfigIni(server, resolution) {
  const exeDir = path.dirname(process.execPath);
  const configPath = path.join(exeDir, 'config.ini');
  const res = RESOLUTIONS.find(r => r.label === resolution) || RESOLUTIONS[6];
  const srv = SERVERS[server] || SERVERS[0];

  const content = `[CONNECTION SETTINGS]\r\nServerIP=${srv.address}\r\nServerPort=${srv.port}\r\n\r\n[Window]\r\nWidth=${res.width}\r\nHeight=${res.height}\r\nWindowed=1\r\n\r\n[LOGIN]\r\nVersion=1.03.34\r\nTestVersion=1.03.34\r\n`;

  try {
    fs.writeFileSync(configPath, content);
  } catch (err) {
    console.error('Failed to write config.ini:', err.message);
  }
}

function launchGame(server, resolution) {
  const exeDir = path.dirname(process.execPath);
  const mainExe = path.join(exeDir, 'main.exe');
  const srv = SERVERS[server] || SERVERS[0];

  if (!fs.existsSync(mainExe)) {
    return { success: false, error: 'main.exe not found. Place the launcher in the game directory.' };
  }

  writeConfigIni(server, resolution);

  try {
    gameProcess = spawn(mainExe, ['connect', `/u${srv.address}`, `/p${srv.port}`], {
      cwd: exeDir,
      detached: true,
      stdio: 'ignore',
    });

    gameProcess.on('exit', () => {
      gameProcess = null;
      if (mainWindow) {
        mainWindow.webContents.send('game-closed');
        mainWindow.show();
      }
    });

    gameProcess.unref();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// IPC handlers
ipcMain.handle('get-config', () => ({
  settings: loadSettings(),
  servers: SERVERS,
  resolutions: RESOLUTIONS,
  voiceUrl: VOICE_SERVER_URL,
}));

ipcMain.handle('save-settings', (_e, settings) => {
  saveSettings(settings);
  return true;
});

ipcMain.handle('launch-game', (_e, { server, resolution }) => {
  return launchGame(server, resolution);
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('close-app', () => {
  gameProcess = null;
  app.quit();
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (!gameProcess) app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
