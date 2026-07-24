/* ==========================================================================
   INVENTORY MODULE (with Robust Bidirectional Sync & Smart CSV Importing)
   ========================================================================== */

// Global cache to persist data in memory across tab switches
window.__inventoryCache = null;

// Primary module initializer called by main navigation
window.__makerInit_inventory = function () {
  const container = document.getElementById('panel-inventory');
  if (!container) return;

  // Render the initial HTML layout if it hasn't been built yet
  if (!document.getElementById('inventory-app-container')) {
    container.innerHTML = `
      <div id="inventory-app-container">
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
          <div>
            <h2>Inventory Management</h2>
            <p>Track materials, filaments, blanks, and supplies in real-time.</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-ghost" onclick="loadInventory(true)">🔄 Sync</button>
            <input type="file" id="inv-csv-input" accept=".csv" style="display: none;" onchange="importInventoryCSV(event)">
            <button class="btn btn-secondary" onclick="document.getElementById('inv-csv-input').click()">📁 Import CSV</button>
            <button class="btn btn-primary" onclick="openInventoryModal()">+ Add Item</button>
          </div>
        </div>

        <div class="toolbar">
          <div class="search-box">
            <input type="text" id="inv-search" placeholder="Search by name, SKU, brand, or location..." oninput="filterInventory()">
          </div>
          <div class="field" style="margin-bottom:0;">
            <select id="inv-cat-filter" onchange="filterInventory()">
              <option value="ALL">All Categories</option>
              <option value="FIL">Filament (FIL)</option>
              <option value="MAT">Raw Materials (MAT)</option>
              <option value="BLK">Blanks (BLK)</option>
              <option value="SUB">Sublimation (SUB)</option>
              <option value="PKG">Packaging (PKG)</option>
            </select>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU / Name</th>
                <th>Category</th>
                <th>Type / Specs</th>
                <th>Qty</th>
                <th>Cost</th>
                <th>Location</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="inventory-table-body">
              <tr>
                <td colspan="7" style="text-align: center; color: var(--muted); padding: 30px;">
                  Loading inventory...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Load from memory cache or fetch from Google Sheets
  loadInventory(false);
};

/**
 * Loads inventory data into memory with fallback, seeding, and delta tracking.
 * @param {boolean} forceRefresh - If true, bypasses memory cache and fetches live data.
 */
async function loadInventory(forceRefresh = false) {
  const tbody = document.getElementById('inventory-table-body');

  // Use memory cache if available and refresh isn't forced
  if (!forceRefresh && window.__inventoryCache && Array.isArray(window.__inventoryCache)) {
    renderInventoryTable(window.__inventoryCache);
    return;
  }

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--muted); padding: 30px;">
          Syncing with Google Sheets...
        </td>
      </tr>`;
  }

  // 1. Read existing local JSON data first as our absolute fallback / seed source
  let localData = [];
  try {
    if (window.makerAPI && window.makerAPI.readData) {
      localData = await window.makerAPI.readData('inventory.json') || [];
      if (!Array.isArray(localData)) localData = [];
    }
  } catch (e) {
    localData = [];
  }

  try {
    let fetchFunc = null;
    if (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) {
      fetchFunc = window.MAKER_CONFIG.fetchFromDatabase;
    } else if (window.makerAPI && window.makerAPI.fetchSheetData) {
      fetchFunc = window.makerAPI.fetchSheetData;
    }

    let remoteDataParsed = null;
    if (fetchFunc) {
      const rawRows = await fetchFunc('Inventory');
      
      if (rawRows && Array.isArray(rawRows) && rawRows.length > 0) {
        remoteDataParsed = [];
        const startIndex = (rawRows[0] && (rawRows[0][0] === 'ID' || rawRows[0][0] === 'id')) ? 1 : 0;
        
        for (let i = startIndex; i < rawRows.length; i++) {
          const r = rawRows[i];
          if (!r || !r[0]) continue; // Skip empty rows
          remoteDataParsed.push({
            id: r[0] || '',
            sku: r[1] || '',
            name: r[2] || '',
            brand: r[3] || '',
            cat: r[4] || 'FIL',
            subcat: r[5] || '',
            type: r[6] || '',
            colour: r[7] || '',
            qty: Number(r[8]) || 0,
            lowStock: Number(r[9]) || 2,
            diameter: r[10] || '',
            weight: r[11] || '',
            printTemp: r[12] || '',
            bedTemp: r[13] || '',
            cost: Number(r[14]) || 0,
            location: r[15] || '',
            supplier: r[16] || '',
            notes: r[17] || ''
          });
        }
        
        // Filter out DELETED elements
        remoteDataParsed = remoteDataParsed.filter(x => x.id && x.name !== 'DELETED');
      }
    }

    if (remoteDataParsed !== null) {
      // Fetch was successful! Let's decide if we fallback/seed or overwrite local
      if (remoteDataParsed.length === 0 && localData.length > 0) {
        // Sheet is empty, but local JSON file has rich data -> Seed the sheet!
        window.__inventoryCache = localData;
        renderInventoryTable(window.__inventoryCache);

        if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
          for (const item of localData) {
            const rowArray = [
              item.id, item.sku, item.name, item.brand, item.cat,
              item.subcat, item.type, item.colour, item.qty, item.lowStock,
              item.diameter, item.weight, item.printTemp, item.bedTemp,
              item.cost, item.location, item.supplier, item.notes
            ];
            await window.MAKER_CONFIG.saveToDatabase('Inventory', rowArray);
          }
        }
      } else {
        // Remote sheet has data -> Use it!
        window.__inventoryCache = remoteDataParsed;
        renderInventoryTable(window.__inventoryCache);

        // Delta check: Only write to local file if there's an actual change
        const localStr = JSON.stringify(localData);
        const remoteStr = JSON.stringify(remoteDataParsed);
        if (localStr !== remoteStr && window.makerAPI && window.makerAPI.writeData) {
          await window.makerAPI.writeData('inventory.json', remoteDataParsed);
        }
      }
      return;
    }
  } catch (err) {
    console.error('Failed to load inventory from remote:', err);
  }

  // Fallback: Use local data if fetch failed entirely
  window.__inventoryCache = localData;
  renderInventoryTable(window.__inventoryCache);
}

/**
 * Renders inventory items into the table UI.
 */
function renderInventoryTable(items) {
  const tbody = document.getElementById('inventory-table-body');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--muted); padding: 30px;">
          No inventory items found. Add one or import a CSV!
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const isLow = item.qty <= item.lowStock;
    const badgeClass = isLow ? 'badge-red' : 'badge-green';
    const badgeText = isLow ? `Low Stock (${item.qty})` : `In Stock (${item.qty})`;

    return `
      <tr>
        <td>
          <strong style="color: var(--text);">${escapeHtml(item.name)}</strong><br>
          <small style="color: var(--muted);">${escapeHtml(item.sku || 'No SKU')}</small>
        </td>
        <td><span class="badge badge-accent">${escapeHtml(item.cat)}</span></td>
        <td>
          ${escapeHtml(item.brand ? item.brand + ' ' : '')}${escapeHtml(item.type || '')}
          ${item.colour ? `<br><span class="tag">${escapeHtml(item.colour)}</span>` : ''}
        </td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>$${Number(item.cost).toFixed(2)}</td>
        <td>${escapeHtml(item.location || '-')}</td>
        <td style="text-align: right;">
          <button class="btn btn-ghost btn-sm" onclick="deleteInventoryItem('${item.id}')">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Filters the memory cache by search text and category dropdown.
 */
function filterInventory() {
  if (!window.__inventoryCache) return;

  const search = (document.getElementById('inv-search')?.value || '').toLowerCase();
  const cat = document.getElementById('inv-cat-filter')?.value || 'ALL';

  const filtered = window.__inventoryCache.filter(item => {
    const matchesCat = (cat === 'ALL' || item.cat === cat);
    const matchesSearch = !search || 
      item.name.toLowerCase().includes(search) ||
      item.sku.toLowerCase().includes(search) ||
      item.brand.toLowerCase().includes(search) ||
      item.location.toLowerCase().includes(search);

    return matchesCat && matchesSearch;
  });

  renderInventoryTable(filtered);
}

/**
 * Handles CSV Import with smart header mapping and deduplication.
 */
async function importInventoryCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const text = e.target.result;
    const lines = text.split(/\r\n|\n/);
    if (lines.length < 2) return;

    // Helper to parse a CSV line safely (respecting quotes and commas)
    function parseCSVLine(line) {
      const result = [];
      let currentVal = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentVal += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      result.push(currentVal.trim());
      return result;
    }

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());

    // Locate header indexes dynamically to match current spreadsheet fields exactly
    const idIdx = headers.findIndex(h => h === 'id' || h === 'item id' || h === 'uid' || h === 'identifier');
    const skuIdx = headers.findIndex(h => h === 'sku' || h === 'part number' || h === 'product code' || h === 'code');
    const nameIdx = headers.findIndex(h => h === 'name' || h === 'title' || h === 'item name' || h === 'product name' || h === 'item');
    const brandIdx = headers.findIndex(h => h === 'brand' || h === 'manufacturer' || h === 'maker');
    const catIdx = headers.findIndex(h => h === 'category' || h === 'cat' || h === 'type' || h === 'class');
    const subcatIdx = headers.findIndex(h => h === 'subcategory' || h === 'sub-category' || h === 'subcat');
    const typeIdx = headers.findIndex(h => h === 'material type' || h === 'filament type' || h === 'type details' || h === 'type');
    const colourIdx = headers.findIndex(h => h === 'colour' || h === 'color' || h === 'shade');
    const qtyIdx = headers.findIndex(h => h === 'qty' || h === 'quantity' || h === 'count' || h === 'stock' || h === 'amount');
    const lowStockIdx = headers.findIndex(h => h === 'lowstock' || h === 'low stock' || h === 'alert' || h === 'min' || h === 'threshold');
    const diameterIdx = headers.findIndex(h => h === 'diameter' || h === 'size' || h === 'dia');
    const weightIdx = headers.findIndex(h => h === 'weight' || h === 'mass' || h === 'wt');
    const printTempIdx = headers.findIndex(h => h === 'printtemp' || h === 'print temp' || h === 'nozzle temp');
    const bedTempIdx = headers.findIndex(h => h === 'bedtemp' || h === 'bed temp');
    const costIdx = headers.findIndex(h => h === 'cost' || h === 'price' || h === 'unit cost' || h === 'rate');
    const locationIdx = headers.findIndex(h => h === 'location' || h === 'bin' || h === 'shelf' || h === 'storage');
    const supplierIdx = headers.findIndex(h => h === 'supplier' || h === 'vendor' || h === 'source');
    const notesIdx = headers.findIndex(h => h === 'notes' || h === 'description' || h === 'desc' || h === 'comment');

    if (!window.__inventoryCache) window.__inventoryCache = [];
    let importedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = parseCSVLine(line);
      if (cols.length === 0 || !cols.some(c => c)) continue;

      const rawSku = skuIdx !== -1 ? cols[skuIdx] : '';
      const rawId = idIdx !== -1 ? cols[idIdx] : '';
      
      // Look up if this item already exists in local cache to prevent duplicates
      let existingIndex = -1;
      if (rawId) {
        existingIndex = window.__inventoryCache.findIndex(item => item.id === rawId);
      }
      if (existingIndex === -1 && rawSku) {
        existingIndex = window.__inventoryCache.findIndex(item => item.sku === rawSku);
      }

      const generatedId = rawId || (existingIndex !== -1 ? window.__inventoryCache[existingIndex].id : 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));

      const itemObj = {
        id: generatedId,
        sku: rawSku,
        name: (nameIdx !== -1 && cols[nameIdx]) ? cols[nameIdx] : 'Unnamed Item',
        brand: brandIdx !== -1 ? cols[brandIdx] : '',
        cat: (catIdx !== -1 && cols[catIdx]) ? cols[catIdx] : 'FIL',
        subcat: subcatIdx !== -1 ? cols[subcatIdx] : '',
        type: typeIdx !== -1 ? cols[typeIdx] : '',
        colour: colourIdx !== -1 ? cols[colourIdx] : '',
        qty: qtyIdx !== -1 ? (Number(cols[qtyIdx]) || 0) : 0,
        lowStock: lowStockIdx !== -1 ? (Number(cols[lowStockIdx]) || 2) : 2,
        diameter: diameterIdx !== -1 ? cols[diameterIdx] : '',
        weight: weightIdx !== -1 ? cols[weightIdx] : '',
        printTemp: printTempIdx !== -1 ? cols[printTempIdx] : '',
        bedTemp: bedTempIdx !== -1 ? cols[bedTempIdx] : '',
        cost: costIdx !== -1 ? (Number(cols[costIdx]) || 0) : 0,
        location: locationIdx !== -1 ? cols[locationIdx] : '',
        supplier: supplierIdx !== -1 ? cols[supplierIdx] : '',
        notes: notesIdx !== -1 ? cols[notesIdx] : ''
      };

      if (existingIndex !== -1) {
        // Update existing item
        window.__inventoryCache[existingIndex] = itemObj;
      } else {
        // Insert as new item
        window.__inventoryCache.push(itemObj);
      }

      // Map to exact 18-column Google Sheet database format
      const rowArray = [
        itemObj.id, itemObj.sku, itemObj.name, itemObj.brand, itemObj.cat,
        itemObj.subcat, itemObj.type, itemObj.colour, itemObj.qty, itemObj.lowStock,
        itemObj.diameter, itemObj.weight, itemObj.printTemp, itemObj.bedTemp,
        itemObj.cost, itemObj.location, itemObj.supplier, itemObj.notes
      ];

      // Save row to database
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
        await window.MAKER_CONFIG.saveToDatabase('Inventory', rowArray);
      }
      importedCount++;
    }

    // Save update cache locally
    if (window.makerAPI && window.makerAPI.writeData) {
      await window.makerAPI.writeData('inventory.json', window.__inventoryCache);
    }

    renderInventoryTable(window.__inventoryCache);
    alert(`Successfully processed CSV: ${importedCount} items imported/updated!`);
    event.target.value = ''; // Reset input
  };

  reader.readAsText(file);
}

/**
 * Deletes an inventory item from memory cache and sheet.
 */
async function deleteInventoryItem(id) {
  if (!confirm('Are you sure you want to delete this inventory item?')) return;

  // Remove from local memory cache immediately for instant UI responsiveness
  if (window.__inventoryCache) {
    window.__inventoryCache = window.__inventoryCache.filter(item => item.id !== id);
    renderInventoryTable(window.__inventoryCache);
  }

  // Save to local fallback cache file
  if (window.makerAPI && window.makerAPI.writeData) {
    await window.makerAPI.writeData('inventory.json', window.__inventoryCache || []);
  }

  // Trigger spreadsheet sync
  try {
    // Overwrite row with empty markers or handle via API if delete endpoint exists
    if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
      await window.MAKER_CONFIG.saveToDatabase('Inventory', [id, '', 'DELETED']);
    } else if (window.makerAPI && window.makerAPI.saveRowData) {
      await window.makerAPI.saveRowData('Inventory', [id, '', 'DELETED']);
    }
  } catch (err) {
    console.error('Error deleting item from remote sheet:', err);
  }
}

// Utility to prevent XSS string injections
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
