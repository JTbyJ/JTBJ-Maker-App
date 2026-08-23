/**
 * Just Jane Maker Lab - Master App Configuration
 * Path: modules/config.js
 */

/**
 * Global Table Sorting Engine
 * Attaches interactive sorting capability to HTML <table> elements.
 */
window.makeTableSortable = function(tableOrId, options = {}) {
  const table = typeof tableOrId === 'string' ? document.getElementById(tableOrId) : tableOrId;
  if (!table) return null;

  const thead = table.querySelector('thead');
  if (!thead) return null;

  const headers = Array.from(thead.querySelectorAll('th'));
  let activeCol = options.defaultCol !== undefined ? options.defaultCol : null;
  let activeDir = options.defaultDir || 'asc';

  function updateHeaderUI() {
    headers.forEach((th, idx) => {
      const text = (th.dataset.baseText || th.textContent).replace(/[\u25B2\u25BC\u21C5]/g, '').trim();
      if (text.toLowerCase() === 'actions' || text === '' || th.dataset.sortable === 'false') {
        return;
      }
      th.style.cursor = 'pointer';
      th.title = 'Click to sort';

      let indicator = '<span style="opacity:0.35; font-size:10px; margin-left:4px;">⇅</span>';
      const colKey = th.dataset.sortKey !== undefined ? th.dataset.sortKey : idx;
      if (activeCol === colKey || activeCol === idx) {
        indicator = `<span style="color:var(--accent); font-size:11px; margin-left:4px; font-weight:800;">${activeDir === 'asc' ? '▲' : '▼'}</span>`;
      }

      if (!th.dataset.baseText) {
        th.dataset.baseText = text;
      }
      th.innerHTML = th.dataset.baseText + indicator;
    });
  }

  headers.forEach((th, idx) => {
    const text = th.textContent.trim().toLowerCase();
    if (text === 'actions' || text === '' || th.dataset.sortable === 'false') return;

    th.addEventListener('click', () => {
      const colKey = th.dataset.sortKey !== undefined ? th.dataset.sortKey : idx;
      if (activeCol === colKey || activeCol === idx) {
        activeDir = activeDir === 'asc' ? 'desc' : 'asc';
      } else {
        activeCol = colKey;
        activeDir = 'asc';
      }
      updateHeaderUI();
      if (typeof options.onSort === 'function') {
        options.onSort(activeCol, activeDir, th.dataset.sortKey !== undefined ? th.dataset.sortKey : idx);
      } else {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll('tr'));
        rows.sort((a, b) => {
          const cellA = (a.children[idx]?.textContent || '').trim();
          const cellB = (b.children[idx]?.textContent || '').trim();
          const numA = parseFloat(cellA.replace(/[$,%]/g, ''));
          const numB = parseFloat(cellB.replace(/[$,%]/g, ''));
          const isNum = !isNaN(numA) && !isNaN(numB) && cellA.replace(/[$,%.-]/g, '').trim() !== '';
          const valA = isNum ? numA : cellA.toLowerCase();
          const valB = isNum ? numB : cellB.toLowerCase();
          if (valA < valB) return activeDir === 'asc' ? -1 : 1;
          if (valA > valB) return activeDir === 'asc' ? 1 : -1;
          return 0;
        });
        rows.forEach(r => tbody.appendChild(r));
      }
    });
  });

  updateHeaderUI();

  return {
    getSortState: () => ({ col: activeCol, dir: activeDir }),
    setSortState: (col, dir) => {
      activeCol = col;
      activeDir = dir;
      updateHeaderUI();
    },
    updateUI: updateHeaderUI
  };
};

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
      const url = `${this.scriptUrl}?sheet=${encodeURIComponent(sheetName)}&_t=${Date.now()}`;
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
     * Rebuild and Seed Google Sheets Database Engine:
     * Enforces correct column headers and uploads all local JSON datasets to Google Sheets.
     */
    window.rebuildAndSeedGoogleSheets = async function(showNotice = true) {
      if (!window.MAKER_CONFIG || !window.MAKER_CONFIG.scriptUrl || !window.makerAPI) return;

      if (showNotice) {
        const confirmRebuild = confirm("⚡ Rebuild Google Sheets Database?\n\nThis will synchronize all local datasets (Suppliers, Inventory, SKUs, Products, Customers, Orders, Categories, Brands) to your Google Spreadsheet and ensure standard headers are set.");
        if (!confirmRebuild) return;
      }

      console.log('[Rebuild] Rebuilding and seeding Google Sheets database...');

      const standardHeaders = {
        'Suppliers': ['id', 'name', 'category', 'status', 'rating', 'website', 'contact', 'email', 'phone', 'lead', 'min', 'shipping', 'notes'],
        'Customers': ['id', 'name', 'email', 'phone', 'address', 'finish_preference', 'instagram_handle', 'customer_type', 'notes', 'created_at'],
        'Inventory': ['id', 'sku', 'name', 'brand', 'cat', 'subcat', 'type', 'colour', 'qty', 'lowStock', 'diameter', 'weight', 'printTemp', 'bedTemp', 'cost', 'location', 'supplier', 'notes', 'unitMetric', 'metricCapacity', 'photo'],
        'Sku': ['id', 'sku', 'name', 'cat', 'subcat', 'brand', 'cost', 'price', 'cogs', 'retail', 'status', 'notes', 'classification', 'photo'],
        'Products': ['id', 'name', 'category', 'sku', 'status', 'platforms', 'saleprice', 'etsyfee', 'description', 'notes', 'labourhrs', 'labourrate', 'labourcost', 'materialcost', 'cogs', 'margin', 'bom', 'photo'],
        'Orders': ['id', 'ordernumber', 'date', 'source', 'status', 'paymentstatus', 'customerid', 'customername', 'notes', 'lineitems', 'subtotal', 'shipping', 'total', 'cogs', 'profit', 'externalid'],
        'Categories': ['id', 'code', 'label', 'color', 'subs'],
        'Brands': ['ID', 'Name', 'Code', 'Website', 'Status', 'Notes']
      };

      const seedConfigs = [
        { file: 'suppliers.json', tab: 'Suppliers', mapFn: item => [item.id, item.name, item.category, item.status, item.rating, item.website, item.contact, item.email, item.phone, item.lead, item.minOrder, item.shipping, item.notes] },
        { file: 'customers.json', tab: 'Customers', mapFn: item => [item.id, item.name, item.email, item.phone, item.address, item.finishPreference, item.instagram, item.type, item.notes, item.createdAt] },
        { file: 'inventory.json', tab: 'Inventory', mapFn: item => [item.id, item.sku, item.name, item.brand, item.category, item.subcategory, item.type, item.colour, item.qty, item.lowStock, item.diameter, item.weight, item.printTemp, item.bedTemp, item.cost, item.location, item.supplier, item.notes, item.unitMetric, item.metricCapacity, item.photo] },
        { file: 'sku.json', tab: 'Sku', mapFn: item => [item.id, item.sku, item.name, item.cat, item.subcat, item.brand, item.cost, item.price, item.cogs, item.retail, item.status, item.notes, item.classification, item.photo] },
        { file: 'products.json', tab: 'Products', mapFn: item => [item.id, item.name, item.category, item.sku, item.status, item.platforms ? JSON.stringify(item.platforms) : '', item.saleprice, item.etsyfee, item.description, item.notes, item.labourhrs, item.labourrate, item.labourcost, item.materialcost, item.cogs, item.margin, item.bom ? JSON.stringify(item.bom) : '[]', item.photo] },
        { file: 'orders.json', tab: 'Orders', mapFn: item => [item.id, item.orderNumber, item.date, item.source, item.status, item.paymentStatus, item.customerId, item.customerName, item.notes, item.lineItems ? JSON.stringify(item.lineItems) : '[]', item.subtotal, item.shipping, item.total, item.cogs, item.profit, item.externalId] },
        { file: 'categories.json', tab: 'Categories', mapFn: item => [item.id, item.code, item.label, item.color, item.subs ? JSON.stringify(item.subs) : '{}'] },
        { file: 'brands.json', tab: 'Brands', mapFn: item => [item.id, item.name, item.code, item.website, item.status, item.notes] }
      ];

      let totalSynced = 0;

      for (const cfg of seedConfigs) {
        try {
          let localData = await window.makerAPI.readData(cfg.file) || [];
          if (localData && Array.isArray(localData) && localData.length > 0) {
            for (const item of localData) {
              const row = cfg.mapFn(item);
              if (row && row[0]) {
                await window.MAKER_CONFIG.saveToDatabase(cfg.tab, row);
                totalSynced++;
              }
            }
          }
        } catch (err) {
          console.error(`[Rebuild] Error seeding tab ${cfg.tab}:`, err);
        }
      }

      if (showNotice) {
        alert(`⚡ Rebuild complete!\n\nSuccessfully queued ${totalSynced} records across all database tabs for synchronization with Google Sheets.`);
      }
    };

    /**
     * Auto-seeding / Auto-sync engine:
     * Reads local JSON caches and automatically syncs any local records missing from remote Google Sheets tabs.
     */
    window.autoSyncAllDataToSheets = async function() {
      if (!window.MAKER_CONFIG || !window.MAKER_CONFIG.scriptUrl || !window.makerAPI) return;

      console.log('[AutoSync] Checking bidirectional synchronization between local JSON and Google Sheets...');

      const syncTargets = [
        { file: 'suppliers.json', tab: 'Suppliers', moduleInit: '__makerInit_suppliers' },
        { file: 'customers.json', tab: 'Customers', moduleInit: '__makerInit_customers' },
        { file: 'inventory.json', tab: 'Inventory', moduleInit: 'loadInventory' },
        { file: 'sku.json', tab: 'Sku' },
        { file: 'products.json', tab: 'Products' },
        { file: 'orders.json', tab: 'Orders' },
        { file: 'brands.json', tab: 'Brands' }
      ];

      for (const target of syncTargets) {
        try {
          if (target.moduleInit && typeof window[target.moduleInit] === 'function') {
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
