/**
 * Just Jane Maker Lab - Master App Configuration
 * Path: modules/config.js
 */

window.MAKER_CONFIG = {
  // Your Google Apps Script Deployment URL
  scriptUrl: 'https://script.google.com/macros/s/AKfycbxUwtz-AkaMkaE8uXjIc5q5vyUuM8DpnGUBJ65pDOxCiv3rLWvWCPAj_Hcp3znTwC43bw/exec',

  /**
   * Save a single row of data to a specific tab in your Google Sheet
   */
  async saveToDatabase(sheetName, rowArray) {
    if (!this.scriptUrl) {
      console.error('[Google Sheets] Web App URL missing');
      return;
    }

    try {
      console.log(`[Google Sheets] Sending row to '${sheetName}'...`);

      const payload = JSON.stringify({ sheet: sheetName, row: rowArray });
      const url = `${this.scriptUrl}?data=${encodeURIComponent(payload)}`;

      // GET requests bypass CORS POST preflight blocks completely in Google Apps Script!
      await fetch(url, { method: 'GET', mode: 'no-cors' });

      console.log(`[Google Sheets] Successfully pushed row to '${sheetName}'!`);
    } catch (err) {
      console.error(`[Google Sheets] Error saving to '${sheetName}':`, err);
    }
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
      'orders.json'
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
cat << 'EOF' > modules/config.js
/**
 * Just Jane Maker Lab - Master App Configuration
 * Path: modules/config.js
 */

window.MAKER_CONFIG = {
  // Your Google Apps Script Deployment URL
  scriptUrl: 'https://script.google.com/macros/s/AKfycbxUwtz-AkaMkaE8uXjIc5q5vyUuM8DpnGUBJ65pDOxCiv3rLWvWCPAj_Hcp3znTwC43bw/exec',

  /**
   * Save a single row of data to a specific tab in your Google Sheet
   */
  async saveToDatabase(sheetName, rowArray) {
    if (!this.scriptUrl) {
      console.error('[Google Sheets] Web App URL missing');
      return;
    }

    try {
      console.log(`[Google Sheets] Sending row to '${sheetName}'...`);

      const payload = JSON.stringify({ sheet: sheetName, row: rowArray });
      const url = `${this.scriptUrl}?data=${encodeURIComponent(payload)}`;

      // GET requests bypass CORS POST preflight blocks completely in Google Apps Script!
      await fetch(url, { method: 'GET', mode: 'no-cors' });

      console.log(`[Google Sheets] Successfully pushed row to '${sheetName}'!`);
    } catch (err) {
      console.error(`[Google Sheets] Error saving to '${sheetName}':`, err);
    }
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
      'orders.json'
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
