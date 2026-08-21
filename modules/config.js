/**
 * Just Jane Maker Lab - Master App Configuration
 * Path: modules/config.js
 */

window.PricingEngine = {
  // Method 1: Fetch Live/Current Cost dynamically from SKU catalog and inventory
  getLiveCost: function(bomItems, skuCatalog, inventoryCache) {
    let total = 0;
    if (!bomItems || !Array.isArray(bomItems)) return total;
    const catalog = skuCatalog || window.__skuCatalogCache || [];
    const inv = inventoryCache || window.__inventoryCache || [];
    bomItems.forEach(item => {
      const invItem = inv.find(x => x.sku === item.itemId || x.id === item.itemId);
      let unitCost = 0;
      if (invItem) {
        const cost = Number(invItem.cost || 0);
        const capacity = Number(invItem.metricCapacity || 1);
        unitCost = cost / capacity;
      } else {
        const spec = catalog.find(s => s.sku === item.itemId || s.id === item.itemId);
        unitCost = spec ? Number(spec.cost || 0) : Number(item.unitCost || 0);
      }
      const qtyWithWaste = item.qty * (1 + (Number(item.waste) || 0) / 100);
      total += unitCost * qtyWithWaste;
    });
    return total;
  },

  // Method 2: Get Lock-in / Historical Cost
  getLockedCost: function(bomItems) {
    let total = 0;
    if (!bomItems || !Array.isArray(bomItems)) return total;
    bomItems.forEach(item => {
      const unitCost = Number(item.unitCost || item.cost || 0);
      const qtyWithWaste = item.qty * (1 + (Number(item.waste) || 0) / 100);
      total += unitCost * qtyWithWaste;
    });
    return total;
  },

  // Method 3: Simplified Margin, Labor, Overhead & Taxes Pricing Engine
  calculateTargetPrice: function(baseCost, laborHours, laborRate, overheadPct, targetMarginPct, taxPct) {
    const labor = (Number(laborHours) || 0) * (Number(laborRate) || 0);
    const overhead = ((Number(baseCost) || 0) + labor) * ((Number(overheadPct) || 0) / 100);
    const totalCost = (Number(baseCost) || 0) + labor + overhead;

    // Profit margin calculation (price = cost / (1 - margin))
    const marginRatio = (Number(targetMarginPct) || 0) / 100;
    const priceExcludingTax = marginRatio < 1 ? (totalCost / (1 - marginRatio)) : totalCost;
    const taxAmount = priceExcludingTax * ((Number(taxPct) || 0) / 100);
    const finalPrice = priceExcludingTax + taxAmount;

    return {
      totalCost: totalCost,
      preTaxPrice: priceExcludingTax,
      finalPrice: finalPrice,
      taxAmount: taxAmount
    };
  }
};

window.MAKER_CONFIG = {
  // Your Google Apps Script Deployment URL
  scriptUrl: 'https://script.google.com/macros/s/AKfycbzpObs8-mFfHb_TUWVDwJfx7iBvxmLTnnE0seAm8fplvTloxE7CLXkgvEc2RHXlt_hFtw/exec',

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
      'categories.json',
      'brands.json'
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

    /**
     * Auto-seeding / Auto-sync engine:
     * Reads local JSON caches and automatically syncs any local records missing from remote Google Sheets tabs.
     */
    window.autoSyncAllDataToSheets = async function() {
      if (!window.MAKER_CONFIG || !window.MAKER_CONFIG.scriptUrl || !window.makerAPI) return;

      console.log('[AutoSync] Checking bidirectional synchronization between local JSON and Google Sheets...');

      const syncTargets = [
        { file: 'suppliers.json', tab: 'Suppliers', cacheKey: '__suppliersCache', moduleInit: '__makerInit_suppliers' },
        { file: 'customers.json', tab: 'Customers', cacheKey: '__customerCache', moduleInit: '__makerInit_customers' },
        { file: 'inventory.json', tab: 'Inventory', cacheKey: '__inventoryCache', moduleInit: 'loadInventory' },
        { file: 'sku.json', tab: 'Sku', cacheKey: '__skuCatalogCache' },
        { file: 'products.json', tab: 'Products', cacheKey: '__productsCache' },
        { file: 'orders.json', tab: 'Orders', cacheKey: '__ordersCache' },
        { file: 'brands.json', tab: 'Brands', cacheKey: '__brandsCache' }
      ];

      for (const target of syncTargets) {
        try {
          if (typeof window[target.moduleInit] === 'function') {
            await window[target.moduleInit](false);
          }
        } catch (err) {
          console.error(`[AutoSync] Error running ${target.moduleInit} for ${target.tab}:`, err);
        }
      }
    };

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
