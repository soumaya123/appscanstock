const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');

let backendProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  const prodURL = `file://${path.join(__dirname, '../dist/index.html')}`;
  win.loadURL(prodURL);

  // Ouvrir les liens externes dans le navigateur par défaut
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// Assurer une seule instance de l'application
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    // Démarrage automatique du backend
    try {
      const resourcesPath = process.resourcesPath || __dirname;
      const backendDirs = [
        path.join(__dirname, '../../backend'),
        path.join(__dirname, '../backend'),
        path.join(__dirname, 'backend'),
        path.join(resourcesPath, 'backend')
      ];
      const backendDir = backendDirs.find((p) => {
        try { return fs.existsSync(p); } catch { return false; }
      });
      if (backendDir) {
        const psScript = path.join(backendDir, 'start_server.ps1');
        const isWin = process.platform === 'win32';
        if (isWin && fs.existsSync(psScript)) {
          backendProcess = spawn('powershell.exe', ['-ExecutionPolicy','Bypass','-File', psScript], { cwd: backendDir, stdio: 'ignore', windowsHide: true });
        } else {
          const pythonCmd = isWin ? 'python' : 'python3';
          const args = ['-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000'];
          backendProcess = spawn(pythonCmd, args, { cwd: backendDir, stdio: 'ignore', windowsHide: true });
        }
      }
    } catch (e) {
      console.error('Erreur démarrage backend:', e);
    }

    // Attendre que 127.0.0.1:8000 réponde (~15s max)
    const waitForPort = (port, host, timeoutMs = 15000) => new Promise((resolve, reject) => {
      const start = Date.now();
      const tryConnect = () => {
        const socket = new net.Socket();
        socket.setTimeout(1500);
        socket.once('error', () => { socket.destroy(); (Date.now()-start>timeoutMs) ? reject(new Error('timeout')) : setTimeout(tryConnect, 400); });
        socket.once('timeout', () => { socket.destroy(); (Date.now()-start>timeoutMs) ? reject(new Error('timeout')) : setTimeout(tryConnect, 400); });
        socket.connect(port, host, () => { socket.end(); resolve(true); });
      };
      tryConnect();
    });

    try { await waitForPort(8000, '127.0.0.1'); } catch {}
    createWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('before-quit', () => {
    try {
      if (backendProcess && !backendProcess.killed) {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t']);
        } else {
          backendProcess.kill('SIGINT');
        }
      }
    } catch (e) {
      // ignore
    }
  });
}

module.exports = {};