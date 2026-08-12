/**
 * Just Jane Maker Lab - Master App Configuration
 * Path: modules/config.js
 */

window.MAKER_CONFIG = {
  // Your Google Apps Script Deployment URL
  scriptUrl: 'https://script.google.com/macros/s/AKfycbyg6P9qpb-9_fND5zDZezC1jmK_liWUwtfAnyDzQVd22KHIz44WWalGJhkzq3CYPWTG9A/exec',

  // Google Maps API Key for Address Autocomplete
  googleMapsApiKey: 'AIzaSyCLr13nWg2vD_PnZpJDtJA7v-hil_VUEBA',

  // Performance-focused client-side sync queue
  _syncQueue: [],
  _syncTimeout: null,

  /**
   * Save a single row of data to a specific tab in your Google Sheet (with automatic debounced parallel batching)
   */
  async saveToDatabase(sheetName, rowArray) {
    if (!this.scriptUrl) {
      console.error('[Google Sheets] Web App URL missing');
      return;
    }

    this._syncQueue.push({ sheetName, rowArray });
    console.log(`[Google Sheets] Queued transaction row for '${sheetName}' (Total queued: ${this._syncQueue.length})`);

    if (this._syncTimeout) clearTimeout(this._syncTimeout);
    this._syncTimeout = setTimeout(() => this.flushQueue(), 150);
  },

  async flushQueue() {
    if (this._syncQueue.length === 0) return;

    const currentBatch = [...this._syncQueue];
    this._syncQueue = [];
    this._syncTimeout = null;

    console.log(`[Google Sheets] Flushing batch of ${currentBatch.length} sync transactions in parallel...`);

    const promises = currentBatch.map(async (tx) => {
      try {
        const payload = JSON.stringify({ sheet: tx.sheetName, row: tx.rowArray });
        const url = `${this.scriptUrl}?data=${encodeURIComponent(payload)}`;
        await fetch(url, { method: 'GET', mode: 'no-cors' });
        console.log(`[Google Sheets] Batch-synced row to '${tx.sheetName}'!`);
      } catch (err) {
        console.error(`[Google Sheets] Error batch-syncing row to '${tx.sheetName}':`, err);
      }
    });

    await Promise.all(promises);
    console.log(`[Google Sheets] Batch sync of ${currentBatch.length} transactions completed!`);
  },

  /**
   * Fetch data from a specific tab in your Google Sheet
   */
  async fetchFromDatabase(sheetName) {
    if (!this.scriptUrl) return null;

    try {
      const url = `${this.scriptUrl}?sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`[Google Sheets] Error fetching from '${sheetName}':`, err);
      return null;
    }
  }
};

// Intercept makerAPI for generic modules to support dynamic Google Sheets backup
(function() {
  if (window.makerAPI) {
    const originalMakerAPI = window.makerAPI;
    const tabularFiles = [
      'customers.json',
      'inventory.json',
      'suppliers.json',
      'products.json',
      'orders.json',
      'sku.json',
      'categories.json'
    ];

    function filenameToTabName(filename) {
      if (filename === 'recipes.json') return 'Recipes';
      if (filename === 'checklists.json') return 'Checklists';
      if (filename === 'sku.json') return 'Sku';
      if (filename === 'sublimation.json') return 'Sublimation';
      if (filename === 'projects.json') return 'Projects';
      if (filename === 'print3d.json') return 'Print3D';
      
      if (filename === 'laser_mat.json') return 'Laser_Mat';
      if (filename === 'laser_lb.json') return 'Laser_Lb';
      if (filename === 'laser_log.json') return 'Laser_Log';
      
      if (filename === 'assets_hw.json') return 'Assets_Hw';
      if (filename === 'assets_sw.json') return 'Assets_Sw';
      
      return filename.replace('.json', '').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');
    }

    window.makerAPI = Object.assign({}, originalMakerAPI, {
      async readData(filename) {
        if (tabularFiles.includes(filename)) {
          return originalMakerAPI.readData(filename);
        }

        const tabName = filenameToTabName(filename);
        try {
          if (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) {
            const remoteData = await window.MAKER_CONFIG.fetchFromDatabase(tabName);
            if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
              const dataRow = remoteData.find(row => row && row[0] === 'JSON_DATA');
              if (dataRow && dataRow[1]) {
                const parsed = JSON.parse(dataRow[1]);
                await originalMakerAPI.writeData(filename, parsed);
                return parsed;
              }
            }
          }
        } catch (err) {
          console.error(`[Google Sheets] Intercept readData error for ${filename}:`, err);
        }

        return originalMakerAPI.readData(filename);
      },

      async writeData(filename, data) {
        const result = await originalMakerAPI.writeData(filename, data);
        if (tabularFiles.includes(filename)) {
          return result;
        }

        const tabName = filenameToTabName(filename);
        try {
          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            const payload = ['JSON_DATA', JSON.stringify(data)];
            await window.MAKER_CONFIG.saveToDatabase(tabName, payload);
          }
        } catch (err) {
          console.error(`[Google Sheets] Intercept writeData error for ${filename}:`, err);
        }

        return result;
      }
    });
  }
})();
