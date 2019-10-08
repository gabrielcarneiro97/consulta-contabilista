const { ipcMain, app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const reloader = require('electron-reload');

const { version } = require('./package.json');

reloader(__dirname);
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let backgroundWindow;

function createWindow() {
  // Emitted when the window is closed.
  mainWindow = new BrowserWindow({
    width: 300,
    height: 170,
    resizable: false,
    minimizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  backgroundWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  backgroundWindow.loadFile(path.join(__dirname, 'process.html'));

  mainWindow.setTitle(`Consulta Contabilista Siare ${version}`);

  if (isDev) {
    // Open the DevTools.
    // BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    backgroundWindow.webContents.openDevTools({ mode: 'detach' });
  }

  ipcMain.on('init', () => backgroundWindow.webContents.send('init'));
  ipcMain.on('end', () => mainWindow.webContents.send('end'));

  mainWindow.on('closed', () => {
    mainWindow = null;
    backgroundWindow.destroy();
  });

  backgroundWindow.on('closed', () => {
    backgroundWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
