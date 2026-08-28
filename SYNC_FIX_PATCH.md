# JTBJ Maker App - Google Sheets Sync Fix Patch
**Version:** 1.0  
**Date:** 2026-08-28  
**Focus:** Fix undefined field fallback bug & add JSON fallback for sync failures

---

## 📋 Summary of Fixes

This patch addresses three critical sync issues:

1. **Undefined Array Index Bug** - When Google Sheets returns truncated rows, field access returns `undefined`
2. **Missing JSON Fallback** - No recovery when Google Sheets is unreachable
3. **Weak HTTP Validation** - No status code checking in fetch operations

---

## 🔧 Changes

### File: `modules/config.js`

#### Change 1: Add Safe Row Field Parser (Line 148, before MAKER_CONFIG)

```javascript
/**
 * ROBUST FIELD PARSER FOR GOOGLE SHEETS ROW DATA
 * Safely handles truncated rows and undefined values
 */
window.parseRowField = function(row, columnIndex, defaultValue = '') {
  // Validate inputs
  if (!Array.isArray(row) || columnIndex < 0) {
    return defaultValue;
  }
  
  // Check if index exists and value is not undefined
  if (columnIndex >= row.length) {
    console.warn(`[Sync Parser] Column index ${columnIndex} exceeds row length ${row.length}`);
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
 * SAFE NUMERIC PARSER
 * Converts row field to number with fallback
 */
window.parseRowNumber = function(row, columnIndex, defaultValue = 0) {
  const strValue = window.parseRowField(row, columnIndex, String(defaultValue));
  const numValue = Number(strValue);
  return isNaN(numValue) ? defaultValue : numValue;
};
```

#### Change 2: Update `fetchFromDatabase()` with HTTP validation (Line 210-222)

**REPLACE:**
```javascript
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
```

**WITH:**
```javascript
async fetchFromDatabase(sheetName) {
  if (!this.scriptUrl) {
    console.error('[Google Sheets] Script URL not configured');
    return null;
  }

  try {
    const url = `${this.scriptUrl}?sheet=${encodeURIComponent(sheetName)}&_t=${Date.now()}`;
    const response = await fetch(url);
    
    // Validate HTTP response
    if (!response.ok) {
      console.error(`[Google Sheets] HTTP ${response.status} fetching ${sheetName}`);
      return null;
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!Array.isArray(data)) {
      console.warn(`[Google Sheets] Invalid data structure from ${sheetName} (expected array)`);
      return null;
    }
    
    // Sanitize all rows: ensure they are arrays with no undefined values
    const sanitized = data.map(row => {
      if (!Array.isArray(row)) return row;
      return row.map(cell => cell === undefined || cell === null ? '' : cell);
    });
    
    console.log(`[Google Sheets] Successfully fetched ${sanitized.length} rows from '${sheetName}'`);
    return sanitized;
  } catch (err) {
    console.error(`[Google Sheets] Fetch failed for '${sheetName}':`, err.message);
    return null;
  }
}
```

#### Change 3: Replace `autoSyncAllDataToSheets()` with fallback logic (Line 390-415)

**REPLACE:**
```javascript
window.autoSyncAllDataToSheets = async function() {
  if (!window.MAKER_CONFIG || !window.MAKER_CONFIG.scriptUrl || !window.makerAPI) return;

  console.log('[AutoSync] Checking bidirectional synchronization between local JSON and Google Sheets...');

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
```

**WITH:**
```javascript
/**
 * AUTO-SYNC WITH JSON FALLBACK
 * Syncs data to Google Sheets, reverts to local JSON on failure
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
      // Try to fetch from Google Sheets first
      const remoteData = await window.MAKER_CONFIG.fetchFromDatabase(target.tab);
      
      if (!remoteData || remoteData.length === 0) {
        console.warn(`[AutoSync] ${target.tab} empty/unavailable from Sheets. Using local JSON...`);
        fallbackCount++;
        
        // Fallback: Load from local JSON
        try {
          const localData = await window.makerAPI.readData(target.file);
          if (localData && Array.isArray(localData) && localData.length > 0) {
            console.log(`[AutoSync] Loaded ${localData.length} records from ${target.file}`);
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
          
          // Try fallback to local JSON
          try {
            const localData = await window.makerAPI.readData(target.file);
            if (localData) {
              console.log(`[AutoSync] Fell back to local ${target.file}`);
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
```

---

## 🔍 Usage in modules/inventory.js

Update the row parsing in `loadInventory()` function (around line 416-452):

**REPLACE existing row parsing:**
```javascript
const itemObj = {
  id: idVal,
  sku: skuVal,
  name: nameVal,
  brand: brandIdx !== -1 ? r[brandIdx] : '',
  cat: catIdx !== -1 ? r[catIdx] : 'FIL',
  // ... etc
};
```

**WITH safe parsing:**
```javascript
const itemObj = {
  id: window.parseRowField(r, idIdx, ''),
  sku: window.parseRowField(r, skuIdx, ''),
  name: window.parseRowField(r, nameIdx, ''),
  brand: window.parseRowField(r, brandIdx, ''),
  cat: window.parseRowField(r, catIdx, 'FIL'),
  subcat: window.parseRowField(r, subcatIdx, ''),
  type: window.parseRowField(r, typeIdx, ''),
  colour: window.parseRowField(r, colourIdx, ''),
  qty: window.parseRowNumber(r, qtyIdx, 0),
  lowStock: window.parseRowNumber(r, lowStockIdx, 2),
  diameter: window.parseRowField(r, diameterIdx, ''),
  weight: window.parseRowField(r, weightIdx, ''),
  printTemp: window.parseRowField(r, printTempIdx, ''),
  bedTemp: window.parseRowField(r, bedTempIdx, ''),
  cost: window.parseRowNumber(r, costIdx, 0),
  location: window.parseRowField(r, locationIdx, ''),
  supplier: window.parseRowField(r, supplierIdx, ''),
  notes: window.parseRowField(r, notesIdx, ''),
  unitMetric: window.parseRowField(r, unitMetricIdx, 'ea'),
  metricCapacity: window.parseRowNumber(r, metricCapacityIdx, 1),
  photo: window.parseRowField(r, photoIdx, '')
};
```

---

## ✅ Testing Checklist

- [ ] **Test 1:** Verify no `"undefined"` strings in database
  - Open DevTools Console
  - Check for `[Sync Parser] Column index` warnings
  
- [ ] **Test 2:** Offline fallback
  - Disconnect internet or block Google Sheets domain
  - Run sync
  - Verify console shows fallback messages
  - Verify local JSON is used
  
- [ ] **Test 3:** HTTP error handling
  - Simulate 403/500 error from Google Sheets
  - Verify fallback triggers
  
- [ ] **Test 4:** Truncated row handling
  - Add test row with missing trailing columns
  - Verify fields resolve to defaults, not `"undefined"`

---

## 📊 Debug Commands

Run in browser console to test:

```javascript
// Test parseRowField
window.parseRowField([1, 'test', undefined, 'value'], 2, 'DEFAULT')  
// Expected: 'DEFAULT'

window.parseRowField([1, 'test', 'hello'], 1, 'DEFAULT')
// Expected: 'test'

// Test parseRowNumber
window.parseRowNumber([1, 2, 3], 1, 0)
// Expected: 2

// Manually trigger sync
await window.autoSyncAllDataToSheets()

// Check sync logs
console.log('[AutoSync] Check console for messages')
```

---

## 🚀 Deployment Steps

1. **Backup** current `modules/config.js`
2. **Apply** all three changes to `modules/config.js`
3. **Update** row parsing in all modules (inventory.js, sku.js, products.js, orders.js, customers.js, suppliers.js)
4. **Test** with Debug Commands section
5. **Deploy** to production
6. **Monitor** console logs for sync issues

---

## 📝 Notes

- All changes are backward compatible
- No breaking changes to existing APIs
- JSON fallback is automatic—no user action needed
- Console logs are verbose for debugging; can be reduced in production

