const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
const { detectHardware } = require('./hardware');
const { fetchPrices } = require('./prices');

const siteEntry = path.join(__dirname, '..', 'site', 'index.html');
const PRICE_TTL = 24 * 60 * 60 * 1000;
let mainWindow = null;
let priceRequest = null;

app.setAppUserModelId('com.spencerboggs.pcupgradeadvisor');

function priceCachePath() {
  return path.join(app.getPath('userData'), 'prices-cache.json');
}

function readPriceCache() {
  try {
    const data = JSON.parse(fs.readFileSync(priceCachePath(), 'utf8'));
    return data && data.prices && data.fetchedAt ? data : null;
  } catch (error) {
    return null;
  }
}

function writePriceCache(data) {
  try {
    const file = priceCachePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data));
  } catch (error) {
    // The bundled snapshot remains available if the cache cannot be written.
  }
}

async function getPrices() {
  const cached = readPriceCache();
  const fetchedAt = cached ? Date.parse(cached.fetchedAt) : NaN;
  if (cached && Number.isFinite(fetchedAt) && Date.now() - fetchedAt < PRICE_TTL) {
    return { ...cached, cached: true };
  }

  if (!priceRequest) {
    priceRequest = fetchPrices()
      .then((data) => {
        const payload = { ...data, fetchedAt: new Date().toISOString() };
        writePriceCache(payload);
        return { ...payload, cached: false };
      })
      .catch((error) => {
        if (cached) return { ...cached, cached: true, stale: true, error: error.message };
        return null;
      })
      .finally(() => {
        priceRequest = null;
      });
  }

  return priceRequest;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 940,
    minWidth: 940,
    minHeight: 680,
    show: false,
    title: 'PC Upgrade Advisor',
    backgroundColor: '#0f141c',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(siteEntry);
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Open external links in the default browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.handle('prices:get', () => getPrices());

ipcMain.handle('hardware:scan', async () => {
  const started = Date.now();
  const hardware = await detectHardware();
  hardware.elapsedMs = Date.now() - started;
  return hardware;
});

ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  platform: process.platform,
  electron: process.versions.electron
}));

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
