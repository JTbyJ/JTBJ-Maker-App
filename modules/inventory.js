/* ==========================================================================
   INVENTORY MODULE (with In-Memory Caching)
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
 * Loads inventory data into memory.
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

  try {
    const rawRows = await window.makerAPI.fetchSheetData('Inventory');
    
    // Parse Google Sheet rows into object structure (skip header row if present)
    const parsedData = [];
    if (Array.isArray(rawRows)) {
      const startIndex = (rawRows[0] && rawRows[0][0] === 'ID' || rawRows[0][0] === 'id') ? 1 : 0;
      for (let i = startIndex; i < rawRows.length; i++) {
        const r = rawRows[i];
        if (!r || !r[0]) continue; // Skip empty rows
        parsedData.push({
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
    }

    // Save to memory cache
    window.__inventoryCache = parsedData;
    renderInventoryTable(window.__inventoryCache);
  } catch (err) {
    console.error('Failed to load inventory:', err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--red); padding: 30px;">
            Error loading inventory data. Please check your connection or config.
          </td>
        </tr>`;
    }
  }
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
 * Handles CSV Import and updates memory cache + database.
 */
async function importInventoryCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const text = e.target.result;
    const lines = text.split(/\r\n|\n/);
    if (lines.length < 2) return;

    const newItems = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Basic CSV parser handling quotes
      const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());

      if (cleanCols.length > 0 && cleanCols[0]) {
        const itemObj = {
          id: cleanCols[0] || 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          sku: cleanCols[1] || '',
          name: cleanCols[2] || 'Unnamed Item',
          brand: cleanCols[3] || '',
          cat: cleanCols[4] || 'FIL',
          subcat: cleanCols[5] || '',
          type: cleanCols[6] || '',
          colour: cleanCols[7] || '',
          qty: Number(cleanCols[8]) || 0,
          lowStock: Number(cleanCols[9]) || 2,
          diameter: cleanCols[10] || '',
          weight: cleanCols[11] || '',
          printTemp: cleanCols[12] || '',
          bedTemp: cleanCols[13] || '',
          cost: Number(cleanCols[14]) || 0,
          location: cleanCols[15] || '',
          supplier: cleanCols[16] || '',
          notes: cleanCols[17] || ''
        };

        newItems.push(itemObj);

        // Map to exact 18-column Google Sheet array format
        const rowArray = [
          itemObj.id, itemObj.sku, itemObj.name, itemObj.brand, itemObj.cat,
          itemObj.subcat, itemObj.type, itemObj.colour, itemObj.qty, itemObj.lowStock,
          itemObj.diameter, itemObj.weight, itemObj.printTemp, itemObj.bedTemp,
          itemObj.cost, itemObj.location, itemObj.supplier, itemObj.notes
        ];

        // Send row directly to Google Apps Script
        await window.makerAPI.saveRowData('Inventory', rowArray);
      }
    }

    // Update local memory cache and UI immediately
    if (!window.__inventoryCache) window.__inventoryCache = [];
    window.__inventoryCache.push(...newItems);
    renderInventoryTable(window.__inventoryCache);

    alert(`Successfully imported ${newItems.length} inventory records!`);
    event.target.value = ''; // Reset file input
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

  // Trigger spreadsheet sync
  try {
    // Overwrite row with empty markers or handle via API if delete endpoint exists
    await window.makerAPI.saveRowData('Inventory', [id, '', 'DELETED']);
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