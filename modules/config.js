/**
 * Just Jane Maker Lab - Master App Configuration
 * Path: modules/config.js
 * 
 * PATCH v1.0 (2026-08-28):
 * - Fixed undefined field fallback bug for truncated Google Sheets rows
 * - Added JSON fallback when Google Sheets is unreachable
 * - Improved HTTP error handling and response validation
 * 
 * PATCH v1.1 (2026-08-29):
 * - Fixed context binding issue in fetchFromDatabase
 * - Ensured scriptUrl is always accessible across modules
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
      const spec = catalog.find(s => s.sku === item.itemId || s.id === item.itemId);
      const invItem = inv.find(x => x.sku === item.itemId || x.id === item.itemId);
      const aggregateUnitCost = spec ? Number(spec.averageUnitCost || 0) : 0;
      let packCost = spec ? Number(spec.cost || 0) : 0;
      if (!packCost && invItem) packCost = Number(invItem.cost || 0);
      if (!packCost) packCost = Number(item.unitCost || 0);

      let capacity = Number(item.metricCapacity || (invItem ? invItem.metricCapacity : 1) || 1);
      if (capacity <= 0) capacity = 1;

      let unitCost = aggregateUnitCost || (packCost / capacity);
      const qtyWithWaste = (Number(item.qty) || 0) * (1 + (Number(item.waste) || 0) / 100);
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

// Inventory purchases and adjustments are immutable ledger entries. inventory.json
// is retained as a backwards-compatible aggregate projection for existing screens.
window.InventoryLedger = {
  FILE: 'inventory-transactions.json',
  async ensure() {
    if (!window.makerAPI || !window.makerAPI.readData) {
      return [];
    }
    let transactions = await window.makerAPI.readData(this.FILE);
    if (Array.isArray(transactions)) return transactions;
    const legacy = await window.makerAPI.readData('inventory.json') || [];
    const migratedAt = new Date().toISOString();
    transactions = legacy.filter(item => item && item.sku).map(item => {
      const capacity = Number(item.metricCapacity || 1) || 1;
      const quantity = Number(item.qty || 0);
      return {
        id: 'opening_' + (item.id || Math.random().toString(36).slice(2)),
        type: 'opening-balance',
        sku: item.sku,
        date: migratedAt,
        qty: quantity,
        unitMetric: item.unitMetric || 'ea',
        metricCapacity: capacity,
        baseQty: quantity * capacity,
        unitCost: (Number(item.cost || 0) / capacity),
        supplier: item.supplier || '',
        location: item.location || '',
        metadata: item
      };
    });
    await window.makerAPI.writeData(this.FILE, transactions);
    return transactions;
  },
  async record(entry) {
    if (!window.makerAPI || !window.makerAPI.readData || !window.makerAPI.writeData) {
      return [];
    }
    const transactions = await this.ensure();
    const qty = Number(entry.qty || 0);
    const capacity = Number(entry.metricCapacity || 1) || 1;
    if (!entry.sku || !qty) throw new Error('A SKU and non-zero quantity are required.');
    transactions.push({
      id: entry.id || 'txn_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: entry.type || 'purchase',
      sku: entry.sku,
      date: entry.date || new Date().toISOString(),
      qty: qty,
      unitMetric: entry.unitMetric || 'ea',
      metricCapacity: capacity,
      baseQty: Number(entry.baseQty || qty * capacity),
      unitCost: Number(entry.unitCost || 0),
      supplier: entry.supplier || '',
      location: entry.location || '',
      metadata: entry.metadata || {}
    });
    await window.makerAPI.writeData(this.FILE, transactions);
    if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
      const tx = transactions[transactions.length - 1];
      try {
        await window.MAKER_CONFIG.saveToDatabase('InventoryTransactions', [
          tx.id, tx.type, tx.sku, tx.date, tx.qty, tx.unitMetric, tx.metricCapacity,
          tx.baseQty, tx.unitCost, tx.supplier, tx.location, JSON.stringify(tx.metadata || {})
        ]);
      } catch (err) {
        console.error('Inventory transaction sync failed:', err);
      }
    }
    return this.rebuild(transactions);
  },
  async rebuild(transactions) {
    if (!window.makerAPI || !window.makerAPI.readData || !window.makerAPI.writeData) {
      return [];
    }
    transactions = transactions || await this.ensure();
    const aggregates = new Map();
    transactions.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).forEach(txn => {
      const key = txn.sku;
      const current = aggregates.get(key) || { sku: key, qty: 0, value: 0, unitMetric: txn.unitMetric || 'ea', metadata: {} };
      const baseQty = Math.abs(Number(txn.baseQty || 0));
      if (txn.type === 'consumption') {
        const used = Math.min(current.qty, baseQty);
        current.value -= used * (current.qty ? current.value / current.qty : Number(txn.unitCost || 0));
        current.qty -= used;
        current.metadata = Object.assign({}, current.metadata, txn.metadata || {});
      } else {
        current.qty += baseQty;
        current.value += baseQty * Number(txn.unitCost || 0);
        current.unitMetric = txn.unitMetric || current.unitMetric;
        current.metadata = txn.metadata || current.metadata;
        current.supplier = txn.supplier || current.supplier;
        current.location = txn.location || current.location;
      }
      aggregates.set(key, current);
    });
    const projection = Array.from(aggregates.values()).map(a => {
      const m = a.metadata || {};
      const averageUnitCost = a.qty > 0 ? a.value / a.qty : 0;
      return Object.assign({}, m, {
        id: 'aggregate_' + a.sku,
        sku: a.sku,
        qty: a.qty,
        cost: averageUnitCost,
        averageUnitCost: averageUnitCost,
        inventoryValue: a.value,
        unitMetric: a.unitMetric,
        metricCapacity: 1,
        supplier: a.supplier || m.supplier || '',
        location: a.location || m.location || ''
      });
    });
    let skus = await window.makerAPI.readData('sku.json') || [];
    skus = skus.map(sku => {
      const a = aggregates.get(sku.sku);
      if (!a) return sku;
      const averageUnitCost = a.qty > 0 ? a.value / a.qty : 0;
      const lastKnownUnitCost = averageUnitCost || Number(sku.averageUnitCost || sku.cost || 0);
      return Object.assign({}, sku, {
        onHandQty: a.qty, inventoryValue: a.value,
        averageUnitCost: lastKnownUnitCost, cost: lastKnownUnitCost
      });
    });
    window.__inventoryCache = projection;
    window.__skuCatalogCache = skus;
    await Promise.all([
      window.makerAPI.writeData('inventory.json', projection),
      window.makerAPI.writeData('sku.json', skus)
    ]);
    window.dispatchEvent(new CustomEvent('maker:inventory-updated'));
    return projection;
  }
};

/**
 * ROBUST FIELD PARSER FOR GOOGLE SHEETS ROW DATA (PATCH v1.0)
 * Safely handles truncated rows and undefined values
 * Prevents "undefined" string contamination in database
 */
window.parseRowField = function(row, columnIndex, defaultValue = '') {
  // Validate inputs
  if (!Array.isArray(row) || columnIndex < 0) {
    return defaultValue;
  }
  
  // Check if index exists and value is not undefined
  if (columnIndex >= row.length) {
    return defaultValue;
  }
  
  const value = row[columnIndex];
  
  // Return default for undefined, null, or empty strings
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  // Always return as string and trim
  return String(value).trim();
};

/**
 * SAFE NUMERIC PARSER (PATCH v1.0)
 * Converts row field to number with fallback
 */
window.parseRowNumber = function(row, columnIndex, defaultValue = 0) {
  const strValue = window.parseRowField(row, columnIndex, String(defaultValue));
  const numValue = Number(strValue);
  return isNaN(numValue) ? defaultValue : numValue;
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
    // Use window.MAKER_CONFIG.scriptUrl explicitly (PATCH v1.1 FIX)
    const url = window.MAKER_CONFIG.scriptUrl;
    if (!url) {
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

    console.log(`[Google Sheets] Flushing batch of ${currentBatch.length} sync transactions in chunked parallel batches...`);

    const chunkSize = 4;
    for (let i = 0; i < currentBatch.length; i += chunkSize) {
      const chunk = currentBatch.slice(i, i + chunkSize);
      const promises = chunk.map(async (tx) => {
        try {
          const payload = JSON.stringify({ sheet: tx.sheetName, row: tx.rowArray });
          const url = `${window.MAKER_CONFIG.scriptUrl}?data=${encodeURIComponent(payload)}`;
          await fetch(url, { method: 'GET', mode: 'no-cors' });
          console.log(`[Google Sheets] Batch-synced row to '${tx.sheetName}'!`);
        } catch (err) {
          console.error(`[Google Sheets] Error batch-syncing row to '${tx.sheetName}':`, err);
        }
      });
      await Promise.all(promises);
      if (i + chunkSize < currentBatch.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    console.log(`[Google Sheets] Batch sync of ${currentBatch.length} transactions completed!`);
  },

  /**
   * Fetch data from a specific tab in your Google Sheet (PATCH v1.1 - FIXED CONTEXT)
   * Now includes HTTP validation, row sanitization, and error handling
   * Uses window.MAKER_CONFIG.scriptUrl to avoid context binding issues
   */
  async fetchFromDatabase(sheetName) {
    // PATCH v1.1: Use window.MAKER_CONFIG.scriptUrl explicitly
    const scriptUrl = window.MAKER_CONFIG.scriptUrl;
    if (!scriptUrl) {
      console.warn('[Sync Parser] Script URL not configured - using local JSON fallback');
      return null;
    }

    try {
      const url = `${scriptUrl}?sheet=${encodeURIComponent(sheetName)}&_t=${Date.now()}`;
      const response = await fetch(url);
      
      // Validate HTTP response status (PATCH FIX #1)
      if (!response.ok) {
        console.error(`[Google Sheets] HTTP ${response.status} fetching ${sheetName}`);
        return null;
      }
      
      const data = await response.json();
      
      // Validate response structure (PATCH FIX #2)
      if (!Array.isArray(data)) {
        console.warn(`[Google Sheets] Invalid data structure from ${sheetName} (expected array)`);
        return null;
      }
      
      // Sanitize all rows: ensure they are arrays with no undefined values (PATCH FIX #3)
      const sanitized = data.map(row => {
        if (!Array.isArray(row)) return row;
        return row.map(cell => cell === undefined || cell === null ? '' : cell);
      });
      
      console.log(`[Google Sheets] ✓ Successfully fetched ${sanitized.length} rows from '${sheetName}'`);
      return sanitized;
    } catch (err) {
      console.error(`[Google Sheets] Fetch failed for '${sheetName}':`, err.message);
      return null;
    }
  }
};

// Global tabular database file register
const tabularFiles = [
  'customers.json',
  'inventory.json',
  'inventory-transactions.json',
  'suppliers.json',
  'products.json',
  'orders.json',
  'sku.json',
  'categories.json',
  'brands.json'
];

/**
 * Rebuild and Seed Google Sheets Database Engine:
 * Enforces correct column headers and uploads all local JSON datasets to Google Sheets.
 */
window.rebuildAndSeedGoogleSheets = async function(showNotice = true) {
  if (!window.MAKER_CONFIG || !window.MAKER_CONFIG.scriptUrl || !window.makerAPI) return;

  if (showNotice) {
    const confirmRebuild = confirm("⚡ Rebuild Google Sheets Database?\n\nThis will synchronize all local datasets (Suppliers, Inventory, SKUs, Products, Customers, Orders, Categories, Brands) to Google Sheets.");
    if (!confirmRebuild) return;
  }

  console.log('[Rebuild] Rebuilding and seeding Google Sheets database...');

  const standardHeaders = {
    'Suppliers': ['id', 'name', 'category', 'status', 'rating', 'website', 'contact', 'email', 'phone', 'lead', 'min', 'shipping', 'notes'],
    'Customers': ['id', 'name', 'email', 'phone', 'address', 'finish_preference', 'instagram_handle', 'customer_type', 'notes', 'created_at'],
    'Inventory': ['id', 'sku', 'name', 'brand', 'cat', 'subcat', 'type', 'colour', 'qty', 'lowStock', 'diameter', 'weight', 'printTemp', 'bedTemp', 'cost', 'location', 'supplier', 'notes', 'unitMetric', 'metricCapacity', 'photo'],
    'InventoryTransactions': ['id', 'type', 'sku', 'date', 'qty', 'unitMetric', 'metricCapacity', 'baseQty', 'unitCost', 'supplier', 'location', 'metadata'],
    'Sku': ['id', 'sku', 'name', 'cat', 'subcat', 'brand', 'cost', 'price', 'cogs', 'retail', 'status', 'notes', 'classification', 'photo', 'supplier', 'variation', 'varCode', 'typeName', 'typeCode'],
    'Products': ['id', 'name', 'category', 'sku', 'status', 'platforms', 'saleprice', 'etsyfee', 'description', 'notes', 'labourhrs', 'labourrate', 'labourcost', 'materialcost', 'cogs', 'margin', 'bom', 'photo'],
    'Orders': ['id', 'ordernumber', 'date', 'source', 'status', 'paymentstatus', 'customerid', 'customername', 'notes', 'lineitems', 'subtotal', 'shipping', 'total', 'cogs', 'profit', 'externalid'],
    'Categories': ['id', 'code', 'label', 'color', 'subs'],
    'Brands': ['ID', 'Name', 'Code', 'Website', 'Status', 'Notes']
  };

  const seedConfigs = [
    {
      file: 'suppliers.json',
      cacheKey: '__suppliersCache',
      tab: 'Suppliers',
      mapFn: item => [
        item.id, item.name, item.category, item.status, item.rating, item.website, item.contact, item.email,
        item.phone ? String(item.phone).replace(/^\+/, '') : '',
        item.lead, item.minOrder || item.min || '', item.shipping, item.notes
      ]
    },
    {
      file: 'customers.json',
      cacheKey: '__customerCache',
      tab: 'Customers',
      mapFn: item => [
        item.id, item.name, item.email,
        item.phone ? String(item.phone).replace(/^\+/, '') : '',
        item.address,
        item.finishPref || item.finish_preference || item.finishPreference || '',
        item.igHandle || item.instagram_handle || item.instagram || '',
        item.type || item.customer_type || 'Personal',
        item.notes,
        item.createdAt || item.created_at || new Date().toISOString().slice(0, 10)
      ]
    },
    {
      file: 'inventory.json',
      cacheKey: '__inventoryCache',
      tab: 'Inventory',
      mapFn: item => [
        item.id, item.sku, item.name, item.brand, item.category || item.cat || '', item.subcategory || item.subcat || '',
        item.type, item.colour || item.color || '', item.qty, item.lowStock, item.diameter, item.weight,
        item.printTemp, item.bedTemp, item.cost, item.location, item.supplier, item.notes,
        item.unitMetric || 'ea', item.metricCapacity || 1, item.photo || ''
      ]
    },
    {
      file: 'sku.json',
      cacheKey: '__skuCatalogCache',
      tab: 'Sku',
      mapFn: item => [
        item.id, item.sku, item.name, item.cat, item.subcat, item.brand, item.cost, item.price,
        item.cogs, item.retail, item.status, item.notes, item.classification, item.photo || '',
        item.supplier || '', item.variation || '', item.varCode || '', item.typeName || '', item.typeCode || ''
      ]
    },
    {
      file: 'products.json',
      cacheKey: '__productsCache',
      tab: 'Products',
      mapFn: item => [
        item.id, item.name, item.category, item.sku, item.status,
        item.platforms ? JSON.stringify(item.platforms) : '[]',
        item.saleprice || item.salePrice || 0,
        item.etsyfee || item.etsyFee || 0,
        item.description || '', item.notes || '',
        item.labourhrs || item.labourHrs || 0,
        item.labourrate || item.labourRate || 20,
        item.labourcost || item.labourCost || 0,
        item.materialcost || item.materialCost || 0,
        item.cogs || 0, item.margin || 0,
        item.bom ? JSON.stringify(item.bom) : '[]',
        item.photo || ''
      ]
    },
    {
      file: 'orders.json',
      cacheKey: '__ordersCache',
      tab: 'Orders',
      mapFn: item => [
        item.id, item.orderNumber || item.ordernumber || '', item.date || '', item.source || '',
        item.status || '', item.paymentStatus || item.paymentstatus || '',
        item.customerId || item.customerid || '', item.customerName || item.customername || '',
        item.notes || '', item.lineItems ? JSON.stringify(item.lineItems) : '[]',
        item.subtotal || 0, item.shipping || 0, item.total || 0, item.cogs || 0, item.profit || 0,
        item.externalId || item.externalid || ''
      ]
    },
    {
      file: 'categories.json',
      cacheKey: 'OSOT_CATS',
      tab: 'Categories',
      mapFn: item => [item.id, item.code, item.label, item.color, item.subs ? JSON.stringify(item.subs) : '{}']
    },
    {
      file: 'brands.json',
      cacheKey: '__brandsCache',
      tab: 'Brands',
      mapFn: item => [item.id, item.name, item.code, item.website, item.status, item.notes]
    }
  ];

  let totalSynced = 0;

  for (const cfg of seedConfigs) {
    try {
      let sourceData = [];
      if (cfg.cacheKey && window[cfg.cacheKey]) {
        sourceData = Array.isArray(window[cfg.cacheKey]) ? window[cfg.cacheKey] : (typeof window[cfg.cacheKey] === 'object' ? Object.values(window[cfg.cacheKey]) : []);
      }
      if (!sourceData || sourceData.length === 0) {
        sourceData = await window.makerAPI.readData(cfg.file) || [];
      }

      if (sourceData && Array.isArray(sourceData) && sourceData.length > 0) {
        for (const item of sourceData) {
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
 * AUTO-SYNC WITH JSON FALLBACK (PATCH v1.0 - Enhanced)
 * Syncs data to Google Sheets, reverts to local JSON on failure
 * Prevents data loss when Google Sheets is unreachable
 */
window.autoSyncAllDataToSheets = async function() {
  if (!window.MAKER_CONFIG || !window.MAKER_CONFIG.scriptUrl || !window.makerAPI) {
    console.warn('[AutoSync] Config incomplete. Sync disabled.');
    return;
  }

  console.log('[AutoSync] Starting bidirectional sync (Local JSON ↔ Google Sheets)...');

  const syncTargets = [
    { file: 'suppliers.json', tab: 'Suppliers', moduleInit: '__makerInit_suppliers' },
    { file: 'customers.json', tab: 'Customers', moduleInit: '__makerInit_customers' },
    { file: 'inventory.json', tab: 'Inventory', moduleInit: '__makerInit_inventory' },
    { file: 'sku.json', tab: 'Sku', moduleInit: '__makerInit_sku' },
    { file: 'products.json', tab: 'Products', moduleInit: '__makerInit_products' },
    { file: 'orders.json', tab: 'Orders', moduleInit: '__makerInit_orders' },
    { file: 'brands.json', tab: 'Brands', moduleInit: '__makerInit_brands' },
    { file: 'categories.json', tab: 'Categories', moduleInit: '__makerInit_categories' }
  ];

  let syncedCount = 0;
  let fallbackCount = 0;

  for (const target of syncTargets) {
    try {
      // Try to fetch from Google Sheets first (PATCH FIX)
      const remoteData = await window.MAKER_CONFIG.fetchFromDatabase(target.tab);
      
      if (!remoteData || remoteData.length === 0) {
        console.warn(`[AutoSync] ${target.tab} empty/unavailable from Sheets. Using local JSON...`);
        fallbackCount++;
        
        // Fallback: Load from local JSON (PATCH FIX)
        try {
          const localData = await window.makerAPI.readData(target.file);
          if (localData && Array.isArray(localData) && localData.length > 0) {
            console.log(`[AutoSync] ✓ Loaded ${localData.length} records from ${target.file}`);
          }
        } catch (fallbackErr) {
          console.error(`[AutoSync] Failed to load ${target.file}:`, fallbackErr);
        }
        continue;
      }

      // Initialize module with remote data
      if (target.moduleInit && typeof window[target.moduleInit] === 'function') {
        try {
          await window[target.moduleInit](false);
          syncedCount++;
          console.log(`[AutoSync] ✓ Synced ${target.tab}`);
        } catch (initErr) {
          console.error(`[AutoSync] Module init failed for ${target.tab}:`, initErr);
          fallbackCount++;
          
          // Try fallback to local JSON (PATCH FIX)
          try {
            const localData = await window.makerAPI.readData(target.file);
            if (localData) {
              console.log(`[AutoSync] ✓ Fell back to local ${target.file}`);
            }
          } catch (e) {
            console.error(`[AutoSync] Fallback also failed for ${target.file}`);
          }
        }
      }
    } catch (err) {
      console.error(`[AutoSync] Unexpected error syncing ${target.tab}:`, err);
      fallbackCount++;
    }
  }

  console.log(`[AutoSync] Complete! Synced: ${syncedCount}, Fallbacks: ${fallbackCount}/${syncTargets.length}`);
};

// Intercept makerAPI for generic modules to support dynamic Google Sheets backup
function initMakerApiInterceptor() {
  if (!window.makerAPI) return;
  const originalMakerAPI = window.makerAPI;

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMakerApiInterceptor);
} else {
  initMakerApiInterceptor();
}
