const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('makerAPI', {
  readData:   (filename)       => ipcRenderer.invoke('read-data', filename),
  writeData:  (filename, data) => ipcRenderer.invoke('write-data', filename, data),
  deleteData: (filename)       => ipcRenderer.invoke('delete-data', filename),
  openDialog: (opts)           => ipcRenderer.invoke('open-dialog', opts),
  saveDialog: (opts)           => ipcRenderer.invoke('save-dialog', opts),
  messageBox: (opts)           => ipcRenderer.invoke('message-box', opts),
  exportCSV:  (payload)        => ipcRenderer.invoke('export-csv', payload),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  getVersion: ()               => ipcRenderer.invoke('get-version'),
});
