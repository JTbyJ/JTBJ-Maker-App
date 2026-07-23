const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs   = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1100, minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
    title: 'Just Jane Maker Lab',
    backgroundColor: '#0f0f1a', show: false,
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.once('ready-to-show', () => { mainWindow.show(); mainWindow.maximize(); });
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

function ensureDataDir() {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Google CSV Import Handler (Robust Google Contacts Mapping)
ipcMain.handle('import-google-csv', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Google Contacts CSV',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      properties: ['openFile']
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, error: 'Cancelled' };
    }

    const content = fs.readFileSync(filePaths[0], 'utf-8');
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) return { success: false, error: 'File appears empty.' };

    const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
    
    // Comprehensive column checks for Google export formats
    const nameIdx = headers.findIndex(h => h === 'name' || h === 'given name' || h.includes('name'));
    const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('e-mail') || h.includes('value'));
    const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));

    const fp = path.join(ensureDataDir(), 'customers.json');
    let existing = [];
    if (fs.existsSync(fp)) {
      try { existing = JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch(e){}
    }

    let addedCount = 0;
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const cleanRow = row.map(val => String(val).replace(/^["']|["']$/g, '').trim());

      const name = nameIdx >= 0 ? cleanRow[nameIdx] : '';
      // Fallback scan across row elements if specific index misses standard email patterns
      let email = emailIdx >= 0 ? cleanRow[emailIdx] : '';
      if (!email || !email.includes('@')) {
        email = cleanRow.find(val => val && val.includes('@') && val.includes('.')) || '';
      }
      const phone = phoneIdx >= 0 ? cleanRow[phoneIdx] : '';

      if (email && !existing.some(ex => ex.email && ex.email.toLowerCase() === email.toLowerCase())) {
        existing.unshift({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          name: name || email.split('@')[0],
          email: email,
          phone: phone || '',
          address: '',
          source: 'Other',
          isRepeat: false,
          notes: 'Imported from Google CSV',
          etsyUsername: '',
          createdAt: new Date().toISOString().slice(0, 10)
        });
        addedCount++;
      }
    }

    fs.writeFileSync(fp, JSON.stringify(existing, null, 2), 'utf-8');
    return { success: true, count: addedCount };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('read-data', async (_e, filename) => {
  try {
    const fp = path.join(ensureDataDir(), filename);
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch { return null; }
});

ipcMain.handle('write-data', async (_e, filename, data) => {
  try {
    fs.writeFileSync(path.join(ensureDataDir(), filename), JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch { return false; }
});

ipcMain.handle('delete-data', async (_e, filename) => {
  try {
    const fp = path.join(ensureDataDir(), filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    return true;
  } catch { return false; }
});

ipcMain.handle('open-dialog',  async (_e, opts) => dialog.showOpenDialog(mainWindow, opts));
ipcMain.handle('save-dialog',  async (_e, opts) => dialog.saveDialog(mainWindow, opts));
ipcMain.handle('message-box',  async (_e, opts) => dialog.showMessageBox(mainWindow, opts));
ipcMain.handle('get-version',  () => app.getVersion());

ipcMain.handle('export-csv', async (_e, { defaultName, rows, headers }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName + '.csv',
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  if (canceled || !filePath) return false;
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','));
  fs.writeFileSync(filePath, lines.join('\r\n'), 'utf-8');
  shell.openPath(filePath);
  return true;
});