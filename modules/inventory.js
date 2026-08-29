/* ==========================================================================
   INVENTORY MODULE (with Robust Bidirectional Sync, Relational SKU/Supplier Integration & Printable Labels)
   ========================================================================== */

// Global cache to persist data in memory across tab switches
window.__inventoryCache = null;
let invSortCol = 'name';
let invSortDir = 'asc';
let invSortController = null;

// Primary module initializer called by main navigation
window.__makerInit_inventory = function () {
  const container = document.getElementById('panel-inventory');
  if (!container) return;

  // Render the initial HTML layout if it hasn't been built yet
  if (!document.getElementById('inventory-app-container')) {
    container.innerHTML = `
      <style>
        #panel-inventory,
        #panel-inventory * {
          -webkit-app-region: no-drag !important;
        }

        #panel-inventory input,
        #panel-inventory textarea,
        #panel-inventory button,
        #panel-inventory select,
        #inventory-modal,
        #inventory-modal * {
          pointer-events: auto !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          position: relative !important;
          z-index: 99999 !important;
        }
      </style>
      <div id="inventory-app-container">
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
          <div>
            <h2>Inventory Management</h2>
            <p>Track materials, filaments, blanks, and supplies in real-time. (Relational to SKU Catalog & Suppliers)</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-ghost" onclick="loadInventory(true)">🔄 Sync</button>
            <input type="file" id="inv-csv-input" accept=".csv" style="display: none;" onchange="importInventoryCSV(event)">
            <button class="btn btn-secondary" onclick="document.getElementById('inv-csv-input').click()">📁 Import CSV</button>
          </div>
        </div>

        <!-- PERMANENT TOP FORM CARD -->
        <div class="card" style="margin-bottom: 24px;">
          <h3 id="inv-form-title" style="margin-bottom:18px; font-size:15px; font-weight:700; color:var(--accent);">Add Inventory Item</h3>
          <form id="inv-form" onsubmit="saveInventoryItemForm(event)">
            <input type="hidden" id="inv-form-id">

            <!-- SKU SELECTION (REFERENTIAL INTEGRITY) -->
            <div class="field" style="margin-bottom:14px;" id="inv-sku-select-group">
              <div style="display:flex;justify-content:space-between;align-items:center"><label style="margin:0">Select SKU Catalog Item</label><button type="button" class="btn btn-ghost btn-sm" data-goto="sku" style="padding:2px 6px;font-size:10px;line-height:1;margin-bottom:4px;border:none;background:none;color:var(--accent);font-weight:700;cursor:pointer">+ Add New SKU</button></div>
              <select id="inv-form-sku" style="width:100%; font-family:monospace; font-weight:700;" onchange="onInventorySkuChange()" required>
                <!-- Populated dynamically -->
              </select>
              <small style="color:var(--muted); margin-top:4px; display:block;">Choosing a SKU auto-fills Name, Category, Subcategory, and Brand from SKU database.</small>
            </div>

            <!-- Inline SKU Creation option -->
            <div style="margin-bottom:14px; background: rgba(224,64,251,0.05); padding: 14px; border-radius: 8px; border: 1px solid var(--border);">
              <label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; color:var(--accent); cursor:pointer; margin-bottom:0;">
                <input type="checkbox" id="inv-toggle-inline-sku" onchange="toggleInlineSkuFields()"> ⚡ Create a New SKU Inline
              </label>

              <div id="inv-inline-sku-fields" style="display:none; margin-top:12px;">
                <div class="input-row">
                  <div class="field" style="flex:1;"><label>New SKU Code (e.g. FIL-PLA-105)</label><input type="text" id="inv-inline-sku-code" placeholder="FIL-PLA-105" style="font-family:monospace; font-weight:700;"></div>
                  <div class="field" style="flex:2;"><label>New Item Name</label><input type="text" id="inv-inline-sku-name" placeholder="Creality White PLA"></div>
                </div>
                <div class="input-row">
                  <div class="field" style="flex:1;"><label>Category</label>
                    <select id="inv-inline-sku-cat">
                      <option value="FIL">Filament (FIL)</option>
                      <option value="MAT">Raw Materials (MAT)</option>
                      <option value="BLK">Blanks (BLK)</option>
                      <option value="SUB">Sublimation Supplies (SUB)</option>
                      <option value="PKG">Packaging (PKG)</option>
                      <option value="CONS">Consumables (CONS)</option>
                    </select>
                  </div>
                  <div class="field" style="flex:1;"><label>Subcategory (e.g. PLA)</label><input type="text" id="inv-inline-sku-subcat" placeholder="e.g. PLA"></div>
                  <div class="field" style="flex:1;"><label>Brand / Manufacturer</label><input type="text" id="inv-inline-sku-brand" placeholder="Creality"></div>
                </div>
              </div>
            </div>

            <div class="input-row" id="inv-form-read-details-row">
              <div class="field" style="flex:2;"><label>Name</label><input type="text" id="inv-form-name" readonly style="background:rgba(255,255,255,0.04); color:var(--muted); outline:none;"></div>
              <div class="field" style="flex:1;"><label>Brand</label><input type="text" id="inv-form-brand" readonly style="background:rgba(255,255,255,0.04); color:var(--muted); outline:none;"></div>
            </div>

            <div class="input-row" id="inv-form-read-cats-row">
              <div class="field" style="flex:1;"><label>Category</label><input type="text" id="inv-form-cat" readonly style="background:rgba(255,255,255,0.04); color:var(--muted); outline:none;"></div>
              <div class="field" style="flex:1;"><label>Subcategory</label><input type="text" id="inv-form-subcat" readonly style="background:rgba(255,255,255,0.04); color:var(--muted); outline:none;"></div>
            </div>

            <!-- STOCK & SUPPLIER DETAILS -->
            <div class="input-row">
              <div class="field" style="flex:1;"><label>Purchase Qty (Packs)</label><input type="number" id="inv-form-qty" required value="1" min="0"></div>
              <div class="field" style="flex:1;"><label>Low Stock Alert</label><input type="number" id="inv-form-lowstock" required value="2" min="0"></div>
              <div class="field" style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center"><label style="margin:0">Supplier Lookup</label><button type="button" class="btn btn-ghost btn-sm" data-goto="suppliers" style="padding:2px 6px;font-size:10px;line-height:1;margin-bottom:4px;border:none;background:none;color:var(--accent);font-weight:700;cursor:pointer">+ New</button></div>
                <select id="inv-form-supplier" style="width:100%;" required>
                  <!-- Populated dynamically from suppliers.json -->
                </select>
              </div>
            </div>

            <!-- PHYSICAL DETAILS -->
            <div class="input-row">
              <div class="field" style="flex:1;"><label>Type / Specs (e.g. PLA)</label><input type="text" id="inv-form-type" placeholder="Type Details"></div>
              <div class="field" style="flex:1;"><label>Colour / Finish</label><input type="text" id="inv-form-colour" placeholder="Colour"></div>
              <div class="field" style="flex:1;"><label>Storage Location</label><input type="text" id="inv-form-location" placeholder="e.g. Filament Box A"></div>
            </div>

            <div class="input-row">
              <div class="field" style="flex:1;"><label>Photo URL / Image Link (Google Drive Share Link)</label><input type="text" id="inv-form-photo" placeholder="e.g. https://drive.google.com/file/d/.../view?usp=sharing"></div>
            </div>

            <div class="input-row">
              <div class="field" style="flex:1;"><label>Diameter (e.g. 1.75mm)</label><input type="text" id="inv-form-diameter"></div>
              <div class="field" style="flex:1;"><label>Weight (e.g. 1kg)</label><input type="text" id="inv-form-weight"></div>
              <div class="field" style="flex:1;"><label>Print Temp (C)</label><input type="text" id="inv-form-printtemp"></div>
              <div class="field" style="flex:1;"><label>Bed Temp (C)</label><input type="text" id="inv-form-bedtemp"></div>
            </div>

            <!-- COSTING & UNIT METRIC -->
            <div style="border:1px solid var(--border); padding:16px; border-radius:10px; margin-bottom:16px; background:rgba(255,255,255,0.01);">
              <h4 style="font-size:12px; text-transform:uppercase; color:var(--accent); margin-bottom:12px; font-weight:700;">Replenishment Costing & Unit Metric</h4>
              <div class="input-row">
                <div class="field" style="flex:1;"><label>Purchase Cost ($)</label><input type="number" id="inv-form-cost" step="0.01" required value="0.00" oninput="calcFormMetricCost()"></div>
                <div class="field" style="flex:1;">
                  <label>Unit Metric</label>
                  <select id="inv-form-metric" required onchange="onInventoryMetricChange(); calcFormMetricCost();">
                    <option value="g">⚖️ Per Gram (g)</option>
                    <option value="m">📏 Per Meter (m)</option>
                    <option value="sh">📄 Per Sheet (sh)</option>
                    <option value="ea">📦 Per Item (ea)</option>
                  </select>
                </div>
                <div class="field" style="flex:1;"><label id="inv-form-capacity-label">Pack Metric Capacity</label><input type="number" id="inv-form-capacity" step="any" required value="1" oninput="calcFormMetricCost()"></div>
              </div>
              <div style="font-size:13px; font-weight:700; color:var(--green); margin-top:8px;" id="inv-form-cost-per-unit-preview">Cost per Metric Unit: $0.00</div>
            </div>

            <div class="field" style="margin-bottom:18px;"><label>Description / Notes</label><textarea id="inv-form-notes" placeholder="Additional details..."></textarea></div>

            <div style="display:flex; gap:10px; justify-content:flex-start;">
              <button type="button" class="btn btn-ghost" onclick="clearInventoryForm()" id="inv-cancel-btn" style="display:none;">Cancel</button>
              <button type="submit" class="btn btn-primary" id="inv-save-btn">Save Item</button>
            </div>
          </form>
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
          <table id="inv-table">
            <thead>
              <tr>
                <th data-sort-key="name">SKU / Name</th>
                <th data-sort-key="cat">Category</th>
                <th data-sort-key="type">Type / Specs / Metric</th>
                <th data-sort-key="qty">Qty</th>
                <th data-sort-key="cost">Rep. Cost</th>
                <th data-sort-key="unitcost">Unit Cost</th>
                <th data-sort-key="location">Location</th>
                <th style="text-align: right; width: 140px;">Actions</th>
              </tr>
            </thead>
            <tbody id="inventory-table-body">
              <tr>
                <td colspan="8" style="text-align: center; color: var(--muted); padding: 30px;">
                  Loading inventory...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PRINTABLE QR LABEL POPUP -->
      <div id="inv-label-modal" style="display:none; position:fixed; z-index:11000; left:0; top:0; width:100%; height:100%; overflow:auto; background-color:rgba(0,0,0,0.8); align-items:center; justify-content:center;">
        <div class="card" style="background:#fff; color:#000; width:450px; border-radius:12px; padding:24px; position:relative; box-shadow:0 10px 30px rgba(0,0,0,0.5); text-align:center;">
          <h3 style="margin-bottom:12px; font-size:16px; font-weight:700; color:#333;">Print Bin Label</h3>

          <!-- PRINT CONTAINER -->
          <div id="printable-label-content" style="border:2px dashed #ccc; padding:20px; border-radius:8px; margin-bottom:20px; background:#fff; display:inline-block; width:100%;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:14px; text-align:left;">
              <div style="flex:1;">
                <div style="font-size:11px; font-weight:800; color:#888; text-transform:uppercase; letter-spacing:0.5px;">Just Jane Maker Lab</div>
                <div id="lbl-sku" style="font-size:22px; font-weight:900; font-family:monospace; color:#000; margin:4px 0;">FIL-PLA-001</div>
                <div id="lbl-name" style="font-size:14px; font-weight:700; color:#111; line-height:1.2; max-height:36px; overflow:hidden;">CR-PLA Blue Filament</div>
                <div style="margin-top:8px;">
                  <span id="lbl-loc" style="font-size:11px; font-weight:800; background:#000; color:#fff; padding:3px 8px; border-radius:4px; font-family:monospace;">BOX A</span>
                </div>
              </div>
              <!-- Simulated Inline SVG QR Code Generator -->
              <div id="lbl-qr-svg" style="width:110px; height:110px;"></div>
            </div>
          </div>

          <div style="display:flex; gap:10px; justify-content:center;">
            <button class="btn btn-ghost" onclick="closeLabelModal()" style="border:1px solid #ccc; color:#555;">Close</button>
            <button class="btn btn-primary" onclick="printLabelContent()">🖨️ Print Label</button>
          </div>
        </div>
      </div>
    `;
  }

  // Load from memory cache or fetch from Google Sheets
  loadInventory(false);
  prepareInventoryForm(null);
  populateInventoryCatFilter();

  if (window.makeTableSortable) {
    invSortController = window.makeTableSortable('inv-table', {
      defaultCol: 'name',
      defaultDir: 'asc',
      onSort: function(colKey, dir) {
        invSortCol = colKey;
        invSortDir = dir;
        filterInventory();
      }
    });
  }
};

async function populateInventoryCatFilter() {
  if (!window.OSOT_CATS) {
    if (window.loadCategories) {
      await window.loadCategories();
    }
  }
  const cats = window.OSOT_CATS || {};
  const filterSel = document.getElementById('inv-cat-filter');
  if (filterSel) {
    let html = '<option value="ALL">All Categories</option>';
    Object.keys(cats).forEach(code => {
      html += `<option value="${code}">${cats[code].label} (${code})</option>`;
    });
    filterSel.innerHTML = html;
  }
}

/**
 * Generates an SVG QR Code representation for printable labels
 */
function generateQrSvg(text) {
  // Let's draw a beautiful QR code simulating layout
  // We'll generate a pseudorandom stable grid based on hashing the text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  // Grid size 21x21 (standard QR Version 1)
  const size = 21;
  let svg = `<svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" shape-rendering="crispEdges">`;
  svg += `<rect width="${size}" height="${size}" fill="#ffffff"/>`;

  // Set finder patterns (the square corners)
  const isFinder = (r, c) => {
    if (r < 7 && c < 7) return true; // Top-Left
    if (r < 7 && c >= size - 7) return true; // Top-Right
    if (r >= size - 7 && c < 7) return true; // Bottom-Left
    return false;
  };

  const isFinderFilled = (r, c) => {
    // Top-Left Finder
    if (r < 7 && c < 7) {
      if (r === 0 || r === 6 || c === 0 || c === 6) return true;
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    // Top-Right Finder
    if (r < 7 && c >= size - 7) {
      const cc = c - (size - 7);
      if (r === 0 || r === 6 || cc === 0 || cc === 6) return true;
      if (r >= 2 && r <= 4 && cc >= 2 && cc <= 4) return true;
      return false;
    }
    // Bottom-Left Finder
    if (r >= size - 7 && c < 7) {
      const rr = r - (size - 7);
      if (rr === 0 || rr === 6 || c === 0 || c === 6) return true;
      if (rr >= 2 && rr <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    return false;
  };

  // Draw cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c)) {
        if (isFinderFilled(r, c)) {
          svg += `<rect x="${c}" y="${r}" width="1" height="1" fill="#000000"/>`;
        }
      } else {
        // Standard cells are pseudorandomly filled based on hash
        const seed = Math.sin(hash + r * 13 + c * 37) * 10000;
        const fill = (seed - Math.floor(seed)) > 0.47;
        // Keep a few alignments clear
        if (fill && (r !== 6 && c !== 6)) {
          svg += `<rect x="${c}" y="${r}" width="1" height="1" fill="#000000"/>`;
        }
      }
    }
  }
  svg += `</svg>`;
  return svg;
}

/**
 * Loads inventory data into memory with fallback, seeding, and delta tracking.
 * @param {boolean} forceRefresh - If true, bypasses memory cache and fetches live data.
 */
async function loadInventory(forceRefresh = false) {
  const tbody = document.getElementById('inventory-table-body');

  // Load and cache SKU catalog beforehand to prevent async race conditions during render
  try {
    window.__skuCatalogCache = await window.makerAPI.readData('sku.json') || [];
  } catch(e) {
    window.__skuCatalogCache = [];
  }

  // Convert legacy mutable rows once, then maintain inventory.json as the ledger
  // aggregate projection used by the existing UI.
  if (window.InventoryLedger) {
    try {
      const transactions = await window.InventoryLedger.ensure();
      await window.InventoryLedger.rebuild(transactions);
    } catch (err) {
      console.error('Inventory ledger initialization failed:', err);
    }
  }

  // Use memory cache if available and refresh isn't forced
  if (!forceRefresh && window.__inventoryCache && Array.isArray(window.__inventoryCache)) {
    renderInventoryTable(window.__inventoryCache);
    return;
  }

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--muted); padding: 30px;">
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
        const header = rawRows[0].map(h => String(h || '').trim().toLowerCase());
        const idIdx = header.findIndex(h => h === 'id' || h === 'item_id' || h.includes('id'));
        const skuIdx = header.findIndex(h => h === 'sku' || h.includes('sku'));
        const nameIdx = header.findIndex(h => h === 'name' || h === 'item name' || h.includes('name'));
        const brandIdx = header.findIndex(h => h === 'brand' || h.includes('brand'));
        const catIdx = header.findIndex(h => h === 'cat' || h === 'category' || h.includes('cat'));
        const subcatIdx = header.findIndex(h => h === 'subcat' || h === 'subcategory' || h.includes('subcat'));
        const typeIdx = header.findIndex(h => h === 'type' || h.includes('type'));
        const colourIdx = header.findIndex(h => h === 'colour' || h === 'color' || h.includes('colour') || h.includes('color'));
        const qtyIdx = header.findIndex(h => h === 'qty' || h === 'quantity' || h.includes('qty'));
        const lowStockIdx = header.findIndex(h => h === 'lowstock' || h === 'low stock' || h.includes('low'));
        const diameterIdx = header.findIndex(h => h === 'diameter' || h.includes('diameter'));
        const weightIdx = header.findIndex(h => h === 'weight' || h.includes('weight'));
        const printTempIdx = header.findIndex(h => h === 'printtemp' || h === 'print temp' || h.includes('print'));
        const bedTempIdx = header.findIndex(h => h === 'bedtemp' || h === 'bed temp' || h.includes('bed'));
        const costIdx = header.findIndex(h => h === 'cost' || h === 'price' || h.includes('cost'));
        const locationIdx = header.findIndex(h => h === 'location' || h.includes('location') || h.includes('loc'));
        const supplierIdx = header.findIndex(h => h === 'supplier' || h.includes('supplier') || h.includes('sup'));
        const notesIdx = header.findIndex(h => h === 'notes' || h.includes('notes') || h.includes('desc'));
        const unitMetricIdx = header.findIndex(h => h === 'unitmetric' || h === 'unit metric' || h.includes('metric'));
        const metricCapacityIdx = header.findIndex(h => h === 'metriccapacity' || h === 'metric capacity' || h.includes('capacity'));
        const photoIdx = header.findIndex(h => h === 'photo' || h === 'image' || h.includes('photo') || h.includes('image'));

        for (let i = 1; i < rawRows.length; i++) {
          const r = rawRows[i];
          if (!r || r.length === 0) continue;
          let idVal = idIdx !== -1 ? r[idIdx] : '';
          const skuVal = skuIdx !== -1 ? r[skuIdx] : '';
          const nameVal = nameIdx !== -1 ? r[nameIdx] : '';
          if (!idVal && !skuVal && !nameVal) continue;

          let newlyAssigned = false;
          if (!idVal) {
            idVal = 'inv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            newlyAssigned = true;
          }

          const itemObj = {
            id: idVal,
            sku: skuVal,
            name: nameVal,
            brand: brandIdx !== -1 ? r[brandIdx] : '',
            cat: catIdx !== -1 ? r[catIdx] : 'FIL',
            subcat: subcatIdx !== -1 ? r[subcatIdx] : '',
            type: typeIdx !== -1 ? r[typeIdx] : '',
            colour: colourIdx !== -1 ? r[colourIdx] : '',
            qty: qtyIdx !== -1 ? (Number(r[qtyIdx]) || 0) : 0,
            lowStock: lowStockIdx !== -1 ? (Number(r[lowStockIdx]) || 2) : 2,
            diameter: diameterIdx !== -1 ? r[diameterIdx] : '',
            weight: weightIdx !== -1 ? r[weightIdx] : '',
            printTemp: printTempIdx !== -1 ? r[printTempIdx] : '',
            bedTemp: bedTempIdx !== -1 ? r[bedTempIdx] : '',
            cost: costIdx !== -1 ? (Number(r[costIdx]) || 0) : 0,
            location: locationIdx !== -1 ? r[locationIdx] : '',
            supplier: supplierIdx !== -1 ? r[supplierIdx] : '',
            notes: notesIdx !== -1 ? r[notesIdx] : '',
            unitMetric: unitMetricIdx !== -1 ? r[unitMetricIdx] : 'ea',
            metricCapacity: metricCapacityIdx !== -1 ? (Number(r[metricCapacityIdx]) || 1) : 1,
            photo: photoIdx !== -1 ? r[photoIdx] : ''
          };
          remoteDataParsed.push(itemObj);

          if (newlyAssigned && window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            window.MAKER_CONFIG.saveToDatabase('Inventory', [
              itemObj.id, itemObj.sku, itemObj.name, itemObj.brand, itemObj.cat,
              itemObj.subcat, itemObj.type, itemObj.colour, itemObj.qty, itemObj.lowStock,
              itemObj.diameter, itemObj.weight, itemObj.printTemp, itemObj.bedTemp,
              itemObj.cost, itemObj.location, itemObj.supplier, itemObj.notes,
              itemObj.unitMetric, itemObj.metricCapacity, itemObj.photo
            ]);
          }
        }
        
        // Filter out DELETED elements
        remoteDataParsed = remoteDataParsed.filter(x => x.id && x.name !== 'DELETED');
      }
    }

    if (remoteDataParsed !== null) {
      const combinedMap = new Map();
      for (const item of remoteDataParsed) {
        combinedMap.set(item.id, item);
      }
      if (localData && Array.isArray(localData)) {
        for (const localItem of localData) {
          if (localItem && localItem.id && !combinedMap.has(localItem.id) && localItem.name !== 'DELETED') {
            combinedMap.set(localItem.id, localItem);
            if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
              window.MAKER_CONFIG.saveToDatabase('Inventory', [
                localItem.id, localItem.sku, localItem.name, localItem.brand, localItem.cat,
                localItem.subcat, localItem.type, localItem.colour, localItem.qty, localItem.lowStock,
                localItem.diameter, localItem.weight, localItem.printTemp, localItem.bedTemp,
                localItem.cost, localItem.location, localItem.supplier, localItem.notes,
                localItem.unitMetric || 'ea', localItem.metricCapacity || 1, localItem.photo || ''
              ]);
            }
          }
        }
      }

      window.__inventoryCache = Array.from(combinedMap.values());
      renderInventoryTable(window.__inventoryCache);
      if (window.makerAPI && window.makerAPI.writeData) {
        await window.makerAPI.writeData('inventory.json', window.__inventoryCache);
      }
      return;
    }
  } catch (err) {
    console.error('Failed to load inventory from remote:', err);
  }

  // Fallback: Use local data if fetch failed entirely
  window.__inventoryCache = localData;
  renderInventoryTable(window.__inventoryCache);

  if (forceRefresh) {
    alert('🔄 Inventory synchronized successfully!\n' + (window.__inventoryCache ? window.__inventoryCache.length : 0) + ' entries loaded/updated in the database.');
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
        <td colspan="8" style="text-align: center; color: var(--muted); padding: 30px;">
          No inventory items found. Add one or import a CSV!
        </td>
      </tr>`;
    return;
  }

  const metricLabel = { g: 'g', m: 'm', sh: 'sh', ea: 'ea' };

  // Read SKU catalog to look up up-to-date metadata dynamically (SSOT resolution)
  let skuCatalog = window.__skuCatalogCache || [];

  let sortedItems = [...items];

  sortedItems.sort((a, b) => {
    const resolvedSkuA = skuCatalog.find(s => s.sku === a.sku);
    const resolvedSkuB = skuCatalog.find(s => s.sku === b.sku);
    const nameA = resolvedSkuA ? resolvedSkuA.name : a.name;
    const nameB = resolvedSkuB ? resolvedSkuB.name : b.name;
    const catA = resolvedSkuA ? resolvedSkuA.cat : a.cat;
    const catB = resolvedSkuB ? resolvedSkuB.cat : b.cat;

    const repCostA = resolvedSkuA ? Number(resolvedSkuA.cost || 0) : Number(a.cost || 0);
    const repCostB = resolvedSkuB ? Number(resolvedSkuB.cost || 0) : Number(b.cost || 0);
    const unitCostA = repCostA / Number(a.metricCapacity || 1);
    const unitCostB = repCostB / Number(b.metricCapacity || 1);

    let valA, valB;
    if (invSortCol === 'cat') { valA = (catA || '').toLowerCase(); valB = (catB || '').toLowerCase(); }
    else if (invSortCol === 'type') { valA = (a.type || '').toLowerCase(); valB = (b.type || '').toLowerCase(); }
    else if (invSortCol === 'qty') { valA = Number(a.qty || 0); valB = Number(b.qty || 0); }
    else if (invSortCol === 'cost') { valA = repCostA; valB = repCostB; }
    else if (invSortCol === 'unitcost') { valA = unitCostA; valB = unitCostB; }
    else if (invSortCol === 'location') { valA = (a.location || '').toLowerCase(); valB = (b.location || '').toLowerCase(); }
    else { valA = (nameA || '').toLowerCase(); valB = (nameB || '').toLowerCase(); }

    if (valA < valB) return invSortDir === 'asc' ? -1 : 1;
    if (valA > valB) return invSortDir === 'asc' ? 1 : -1;
    return 0;
  });

  tbody.innerHTML = sortedItems.map(item => {
    // Resolve metadata dynamically from master SKU catalog if possible
    const resolvedSku = skuCatalog.find(s => s.sku === item.sku);
    const resolvedName = resolvedSku ? resolvedSku.name : item.name;
    const resolvedBrand = resolvedSku ? resolvedSku.brand : item.brand;
    const resolvedCat = resolvedSku ? resolvedSku.cat : item.cat;
    const resolvedSubcat = resolvedSku ? resolvedSku.subcat : item.subcat;

    const isLow = item.qty <= item.lowStock;
    const badgeClass = isLow ? 'badge-red' : 'badge-green';
    const badgeText = isLow ? `Low Stock (${item.qty})` : `In Stock (${item.qty})`;
    
    // Cost calculations - strictly referencing master SKU cost
    const repCost = resolvedSku ? Number(resolvedSku.cost || 0) : Number(item.cost || 0);
    const capacity = Number(item.metricCapacity || 1);
    const unitCost = repCost / capacity;

    const imageLink = item.photo || (resolvedSku ? resolvedSku.photo : '');
    var photoCell = '';
    if (imageLink) {
      var directPhotoUrl = window.getDirectPhotoUrl ? window.getDirectPhotoUrl(imageLink) : imageLink;
      photoCell = `<img src="${escapeHtml(directPhotoUrl)}" style="width:36px; height:36px; border-radius:6px; object-fit:cover; cursor:pointer;" onclick="window.openPhotoLightbox(decodeURIComponent('${encodeURIComponent(imageLink)}'))" onerror="this.onerror=null; this.outerHTML='<span style=&quot;font-size:18px; color:var(--muted);&quot; title=&quot;Image restricted or unavailable&quot;>📷</span>';">`;
    } else {
      photoCell = '<span style="font-size:18px; color:var(--muted);">📷</span>';
    }

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            ${photoCell}
            <div>
              <strong style="color: var(--text);">${escapeHtml(resolvedName)}</strong><br>
              <small style="color: var(--muted); font-family: monospace;">${escapeHtml(item.sku || 'No SKU')}</small>
            </div>
          </div>
        </td>
        <td><span class="badge badge-accent">${escapeHtml(resolvedCat)}</span></td>
        <td>
          ${escapeHtml(resolvedBrand ? resolvedBrand + ' ' : '')}${escapeHtml(item.type || '')}
          ${item.colour ? `<br><span class="tag">${escapeHtml(item.colour)}</span>` : ''}
          <div style="font-size: 11px; color: var(--muted); margin-top: 4px;">Metric: 1 pack = ${capacity}${metricLabel[item.unitMetric || 'ea']}</div>
        </td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>$${repCost.toFixed(2)}</td>
        <td style="font-weight:700; color:var(--teal); font-family: monospace;">$${unitCost.toFixed(3)}/${metricLabel[item.unitMetric || 'ea']}</td>
        <td>${escapeHtml(item.location || '-')}</td>
        <td style="text-align: right;">
          <button class="btn btn-ghost btn-sm" onclick="openLabelModal('${item.id}')" title="Generate Label">🏷️</button>
          <button class="btn btn-ghost btn-sm" onclick="editInventoryItem('${item.id}')" title="Edit Item">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="deleteInventoryItem('${item.id}')" title="Delete Item">🗑️</button>
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
 * POPULATE SKU AND SUPPLIER DROPDOWNS & INITIALIZE FORM STATE
 */
async function prepareInventoryForm(id = null) {
  // Load SKUs
  let skus = [];
  try { skus = await window.makerAPI.readData('sku.json') || []; } catch(e){}

  const skuSelect = document.getElementById('inv-form-sku');
  if (skuSelect) {
    skuSelect.innerHTML = '<option value="">Select SKU...</option>';
    skus.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.sku;
      opt.textContent = `${s.sku} - ${s.name}`;
      opt.dataset.name = s.name;
      opt.dataset.brand = s.brand;
      opt.dataset.cat = s.cat;
      opt.dataset.subcat = s.subcat;
      opt.dataset.cost = s.cost;
      skuSelect.appendChild(opt);
    });
  }

  // Load Suppliers
  let sups = [];
  try { sups = await window.makerAPI.readData('suppliers.json') || []; } catch(e){}
  const supSelect = document.getElementById('inv-form-supplier');
  if (supSelect) {
    supSelect.innerHTML = '<option value="">Select Supplier...</option>';
    sups.filter(s => s.status === 'Active').forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.name;
      opt.textContent = s.name;
      supSelect.appendChild(opt);
    });
  }

  // Reset form to Add state
  document.getElementById('inv-form').reset();
  document.getElementById('inv-form-id').value = '';
  document.getElementById('inv-form-title').textContent = 'Add Inventory Item';
  document.getElementById('inv-form-cost-per-unit-preview').textContent = 'Cost per Metric Unit: $0.00';
  document.getElementById('inv-cancel-btn').style.display = 'none';
  onInventoryMetricChange();

  if (id) {
    // EDIT MODE
    const item = window.__inventoryCache.find(x => x.id === id);
    if (item) {
      document.getElementById('inv-form-id').value = item.id;
      document.getElementById('inv-form-sku').value = item.sku;

      // Auto-fill locked attributes
      document.getElementById('inv-form-name').value = item.name;
      document.getElementById('inv-form-brand').value = item.brand;
      document.getElementById('inv-form-cat').value = item.cat;
      document.getElementById('inv-form-subcat').value = item.subcat;

      // Fill editable
      document.getElementById('inv-form-qty').value = item.qty;
      document.getElementById('inv-form-lowstock').value = item.lowStock;
      document.getElementById('inv-form-supplier').value = item.supplier;
      document.getElementById('inv-form-type').value = item.type;
      document.getElementById('inv-form-colour').value = item.colour;
      document.getElementById('inv-form-location').value = item.location;
      document.getElementById('inv-form-photo').value = item.photo || '';
      document.getElementById('inv-form-diameter').value = item.diameter;
      document.getElementById('inv-form-weight').value = item.weight;
      document.getElementById('inv-form-printtemp').value = item.printTemp;
      document.getElementById('inv-form-bedtemp').value = item.bedTemp;

      // Cost & Metric
      document.getElementById('inv-form-cost').value = item.cost;
      document.getElementById('inv-form-metric').value = item.unitMetric || 'ea';
      onInventoryMetricChange();
      document.getElementById('inv-form-capacity').value = item.metricCapacity || 1;
      document.getElementById('inv-form-notes').value = item.notes;

      document.getElementById('inv-form-title').textContent = 'Edit Inventory Item';
      document.getElementById('inv-cancel-btn').style.display = 'inline-flex';
      calcFormMetricCost();
    }
  }

  // Auto-focus the SKU Selector and scroll smoothly to top
  if (skuSelect) {
    skuSelect.focus();
  }
  const appContainer = document.getElementById('inventory-app-container');
  if (appContainer) {
    appContainer.scrollIntoView({ behavior: 'smooth' });
  }
}

function clearInventoryForm() {
  document.getElementById('inv-form').reset();
  document.getElementById('inv-form-id').value = '';
  document.getElementById('inv-form-title').textContent = 'Add Inventory Item';
  document.getElementById('inv-form-cost-per-unit-preview').textContent = 'Cost per Metric Unit: $0.00';
  document.getElementById('inv-cancel-btn').style.display = 'none';

  const inlineToggle = document.getElementById('inv-toggle-inline-sku');
  if (inlineToggle) {
    inlineToggle.checked = false;
    toggleInlineSkuFields();
  }

  // Reload the form selections with the newly created SKU if any
  prepareInventoryForm(null);
}

function onInventorySkuChange() {
  const select = document.getElementById('inv-form-sku');
  const opt = select.options[select.selectedIndex];
  if (opt && opt.value) {
    document.getElementById('inv-form-name').value = opt.dataset.name || '';
    document.getElementById('inv-form-brand').value = opt.dataset.brand || '';
    document.getElementById('inv-form-cat').value = opt.dataset.cat || '';
    document.getElementById('inv-form-subcat').value = opt.dataset.subcat || '';

    // Default replenishment cost from SKU database
    const costInput = document.getElementById('inv-form-cost');
    if (costInput && (!costInput.value || Number(costInput.value) === 0)) {
      costInput.value = Number(opt.dataset.cost || 0).toFixed(2);
    }

    // Choose appropriate default metric
    const cat = opt.dataset.cat;
    const metricSel = document.getElementById('inv-form-metric');
    if (cat === 'FIL') {
      metricSel.value = 'g';
    } else if (cat === 'MAT') {
      metricSel.value = 'sh';
    } else if (cat === 'SUB') {
      metricSel.value = 'm';
    } else {
      metricSel.value = 'ea';
    }
    onInventoryMetricChange();
    calcFormMetricCost();
  } else {
    document.getElementById('inv-form-name').value = '';
    document.getElementById('inv-form-brand').value = '';
    document.getElementById('inv-form-cat').value = '';
    document.getElementById('inv-form-subcat').value = '';
  }
}

function onInventoryMetricChange() {
  const metric = document.getElementById('inv-form-metric').value;
  const label = document.getElementById('inv-form-capacity-label');
  const capInp = document.getElementById('inv-form-capacity');

  if (metric === 'g') {
    label.textContent = 'Pack Capacity (Grams/Spool)';
    if (capInp.value === '1' || !capInp.value) capInp.value = 1000;
  } else if (metric === 'm') {
    label.textContent = 'Pack Capacity (Meters/Roll)';
    if (capInp.value === '1' || !capInp.value) capInp.value = 5;
  } else if (metric === 'sh') {
    label.textContent = 'Pack Capacity (Sheets)';
    if (capInp.value === '1000' || capInp.value === '5' || !capInp.value) capInp.value = 1;
  } else {
    label.textContent = 'Pack Capacity (Quantity/Items)';
    if (capInp.value === '1000' || capInp.value === '5' || !capInp.value) capInp.value = 1;
  }
}

function calcFormMetricCost() {
  const cost = parseFloat(document.getElementById('inv-form-cost').value) || 0;
  const capacity = parseFloat(document.getElementById('inv-form-capacity').value) || 1;
  const metric = document.getElementById('inv-form-metric').value;

  const unitCost = cost / capacity;
  const preview = document.getElementById('inv-form-cost-per-unit-preview');
  preview.textContent = `Cost per Metric Unit: $${unitCost.toFixed(3)} / ${metric}`;
}

/**
 * SAVE FROM MODAL FORM
 */
async function saveInventoryItemForm(e) {
  e.preventDefault();

  const id = document.getElementById('inv-form-id').value || 'inv_' + Date.now();

  let sku = document.getElementById('inv-form-sku').value;
  let name = document.getElementById('inv-form-name').value;
  let brand = document.getElementById('inv-form-brand').value;
  let cat = document.getElementById('inv-form-cat').value;
  let subcat = document.getElementById('inv-form-subcat').value;

  const inlineToggle = document.getElementById('inv-toggle-inline-sku');
  const cost = Number(document.getElementById('inv-form-cost').value) || 0;

  if (inlineToggle && inlineToggle.checked) {
    // We are creating a SKU inline!
    sku = document.getElementById('inv-inline-sku-code').value.trim();
    name = document.getElementById('inv-inline-sku-name').value.trim();
    cat = document.getElementById('inv-inline-sku-cat').value;
    subcat = document.getElementById('inv-inline-sku-subcat').value.trim();
    brand = document.getElementById('inv-inline-sku-brand').value.trim();

    if (!sku || !name) {
      alert('SKU Code and Item Name are required to create an inline SKU.');
      return;
    }

    // Save to sku.json database
    let skus = [];
    try { skus = await window.makerAPI.readData('sku.json') || []; } catch(err){}
    const existing = skus.find(s => s.sku.toLowerCase() === sku.toLowerCase());
    if (!existing) {
      const skuId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const newSkuObj = {
        id: skuId,
        sku: sku,
        name: name,
        cat: cat,
        subcat: subcat,
        brand: brand,
        cost: cost,
        price: 0,
        cogs: 0,
        retail: 0,
        status: 'Active',
        notes: 'Created inline from Inventory Form',
        classification: 'Raw Component / Material (BOM Input)'
      };
      skus.unshift(newSkuObj);
      await window.makerAPI.writeData('sku.json', skus);

      // Save row to Sheets tab
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
        await window.MAKER_CONFIG.saveToDatabase('Sku', [
          skuId, sku, name, cat, subcat, brand, cost, 0, 0, 0, 'Active', 'Created inline from Inventory Form', 'Raw Component / Material (BOM Input)', '', '', '', '', '', ''
        ]);
      }
    }
  }

  const qty = Number(document.getElementById('inv-form-qty').value) || 0;
  const lowStock = Number(document.getElementById('inv-form-lowstock').value) || 0;
  const supplier = document.getElementById('inv-form-supplier').value;

  const type = document.getElementById('inv-form-type').value;
  const colour = document.getElementById('inv-form-colour').value;
  const location = document.getElementById('inv-form-location').value;

  const diameter = document.getElementById('inv-form-diameter').value;
  const weight = document.getElementById('inv-form-weight').value;
  const printTemp = document.getElementById('inv-form-printtemp').value;
  const bedTemp = document.getElementById('inv-form-bedtemp').value;

  const unitMetric = document.getElementById('inv-form-metric').value;
  const metricCapacity = Number(document.getElementById('inv-form-capacity').value) || 1;
  const notes = document.getElementById('inv-form-notes').value;
  const photo = document.getElementById('inv-form-photo').value.trim();

  const itemObj = {
    id,
    sku,
    name: sku ? '' : name,
    brand: sku ? '' : brand,
    cat: sku ? '' : cat,
    subcat: sku ? '' : subcat,
    qty, lowStock, supplier,
    type, colour, location, diameter, weight, printTemp, bedTemp,
    cost, unitMetric, metricCapacity, notes, photo
  };

  if (!window.__inventoryCache) window.__inventoryCache = [];

  const prior = window.__inventoryCache.find(x => x.sku === sku);
  const priorQty = prior ? Number(prior.qty || 0) : 0;
  const quantityDelta = qty * metricCapacity - priorQty;
  if (quantityDelta) {
    await window.InventoryLedger.record({
      type: quantityDelta > 0 ? 'purchase' : 'consumption',
      sku: sku, qty: Math.abs(quantityDelta), baseQty: Math.abs(quantityDelta),
      unitMetric: unitMetric, metricCapacity: 1,
      unitCost: quantityDelta > 0 ? cost / metricCapacity : Number(prior && prior.averageUnitCost || 0),
      supplier: supplier, location: location, metadata: itemObj
    });
  }
  const projection = window.__inventoryCache.find(x => x.sku === sku);
  if (projection) {
    Object.assign(projection, { lowStock: lowStock, type: type, colour: colour, notes: notes, photo: photo });
    await window.makerAPI.writeData('inventory.json', window.__inventoryCache);
  }

  clearInventoryForm();
  renderInventoryTable(window.__inventoryCache);
}

// Toggle visibility of fields for inline SKU creation
window.toggleInlineSkuFields = function() {
  const inlineToggle = document.getElementById('inv-toggle-inline-sku');
  const inlineFields = document.getElementById('inv-inline-sku-fields');
  const skuSelect = document.getElementById('inv-form-sku');
  const readDetailsRow = document.getElementById('inv-form-read-details-row');
  const readCatsRow = document.getElementById('inv-form-read-cats-row');

  if (inlineToggle && inlineToggle.checked) {
    if (inlineFields) inlineFields.style.display = 'block';
    if (skuSelect) {
      skuSelect.removeAttribute('required');
      skuSelect.disabled = true;
    }
    if (readDetailsRow) readDetailsRow.style.display = 'none';
    if (readCatsRow) readCatsRow.style.display = 'none';
  } else {
    if (inlineFields) inlineFields.style.display = 'none';
    if (skuSelect) {
      skuSelect.setAttribute('required', 'true');
      skuSelect.disabled = false;
    }
    if (readDetailsRow) readDetailsRow.style.display = 'flex';
    if (readCatsRow) readCatsRow.style.display = 'flex';
  }
};

function editInventoryItem(id) {
  prepareInventoryForm(id);
}

/**
 * QR BIN LABEL PRINT MODAL
 */
function openLabelModal(id) {
  const item = window.__inventoryCache.find(x => x.id === id);
  if (!item) return;

  document.getElementById('lbl-sku').textContent = item.sku || 'NO SKU';
  document.getElementById('lbl-name').textContent = item.name || 'Unnamed Item';
  document.getElementById('lbl-loc').textContent = (item.location || 'NONE').toUpperCase();

  // Generate beautiful simulated SVG QR Code representing JTBJ-MAKER-LAB:<sku>
  const qrSvgCode = generateQrSvg(`JTBJ-MAKER-LAB:${item.sku || 'ITEM'}`);
  document.getElementById('lbl-qr-svg').innerHTML = qrSvgCode;

  document.getElementById('inv-label-modal').style.display = 'flex';
}

function closeLabelModal() {
  document.getElementById('inv-label-modal').style.display = 'none';
}

function printLabelContent() {
  // Use a clean popup window to render ONLY the label card styled for thermal printing!
  const content = document.getElementById('printable-label-content').innerHTML;
  const printWindow = window.open('', '_blank', 'width=500,height=400');

  printWindow.document.write(`
    <html>
      <head>
        <title>Print Label</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; background: #fff; color: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }
          .label-box { width: 400px; padding: 15px; border: 1px solid #000; border-radius: 8px; box-sizing: border-box; }
          .flex-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
          .header { font-size: 11px; font-weight: 800; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
          .sku { font-size: 24px; font-weight: 900; font-family: monospace; color: #000; margin: 2px 0; }
          .name { font-size: 13px; font-weight: 700; color: #111; line-height: 1.2; }
          .loc { font-size: 11px; font-weight: 800; background: #000; color: #fff; padding: 3px 8px; border-radius: 4px; font-family: monospace; display: inline-block; margin-top: 6px; }
          .qr { width: 100px; height: 100px; }
        </style>
      </head>
      <body>
        <div class="label-box">
          <div class="flex-row">
            <div style="flex: 1;">
              <div class="header">Just Jane Maker Lab</div>
              <div class="sku">${document.getElementById('lbl-sku').textContent}</div>
              <div class="name">${document.getElementById('lbl-name').textContent}</div>
              <div class="loc">${document.getElementById('lbl-loc').textContent}</div>
            </div>
            <div class="qr">${document.getElementById('lbl-qr-svg').innerHTML}</div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
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
    const unitMetricIdx = headers.findIndex(h => h === 'unitmetric' || h === 'metric' || h === 'unit');
    const metricCapacityIdx = headers.findIndex(h => h === 'metriccapacity' || h === 'capacity' || h === 'size');

    if (!window.__inventoryCache) window.__inventoryCache = [];
    let importedCount = 0;
    const importedTransactions = [];

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
        notes: notesIdx !== -1 ? cols[notesIdx] : '',
        unitMetric: (unitMetricIdx !== -1 && cols[unitMetricIdx]) ? cols[unitMetricIdx] : 'ea',
        metricCapacity: (metricCapacityIdx !== -1 && cols[metricCapacityIdx]) ? Number(cols[metricCapacityIdx]) : 1
      };
      const capacity = Number(itemObj.metricCapacity || 1) || 1;
      importedTransactions.push({
        type: 'purchase', sku: itemObj.sku, qty: itemObj.qty,
        baseQty: itemObj.qty * capacity, unitMetric: itemObj.unitMetric,
        metricCapacity: capacity, unitCost: Number(itemObj.cost || 0) / capacity,
        supplier: itemObj.supplier, location: itemObj.location, metadata: itemObj
      });

      if (existingIndex !== -1) {
        // Update existing item
        window.__inventoryCache[existingIndex] = itemObj;
      } else {
        // Insert as new item
        window.__inventoryCache.push(itemObj);
      }

      // Map to exact Google Sheet database format
      const rowArray = [
        itemObj.id, itemObj.sku, itemObj.name, itemObj.brand, itemObj.cat,
        itemObj.subcat, itemObj.type, itemObj.colour, itemObj.qty, itemObj.lowStock,
        itemObj.diameter, itemObj.weight, itemObj.printTemp, itemObj.bedTemp,
        itemObj.cost, itemObj.location, itemObj.supplier, itemObj.notes,
        itemObj.unitMetric, itemObj.metricCapacity
      ];

      // Save row to database
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
        await window.MAKER_CONFIG.saveToDatabase('Inventory', rowArray);
      }
      importedCount++;
    }

    if (window.InventoryLedger) {
      const transactions = await window.InventoryLedger.ensure();
      importedTransactions.forEach(txn => transactions.push(Object.assign({
        id: 'import_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        date: new Date().toISOString()
      }, txn)));
      await window.makerAPI.writeData(window.InventoryLedger.FILE, transactions);
      await window.InventoryLedger.rebuild(transactions);
    } else if (window.makerAPI && window.makerAPI.writeData) {
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
