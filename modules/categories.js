/**
 * Just Jane Maker Lab - Category Manager Module
 * Path: modules/categories.js
 */

// Global Categories cache
window.__categoriesCache = null;
window.OSOT_CATS = null;

(function() {
  const FILE = 'categories.json';
  let items = [];
  let editId = null;

  function g(id) { return document.getElementById(id); }

  const DEFAULT_CATS = {
    'FIL': { label: 'Filament', color: 'var(--accent)', subs: { PLA: 'PLA', PTG: 'PETG', TPU: 'TPU', ABS: 'ABS', SLK: 'Silk', PLX: 'PLA-CF', WOD: 'PLA Wood' } },
    'MAT': { label: 'Materials', color: 'var(--gold)', subs: { WOD: 'Wood Board', ACR: 'Acrylic', MDF: 'MDF', SLT: 'Slate', LTH: 'Leather', CRK: 'Cork' } },
    'BLK': { label: 'Blanks', color: 'var(--teal)', subs: { MUG: 'Mug', TBL: 'Tumbler', TEE: 'T-Shirt', TOT: 'Tote Bag', TIL: 'Tile', CST: 'Coaster', PLW: 'Pillow', MSP: 'Mouse Pad', PHN: 'Phone Case', ORN: 'Ornament' } },
    'CONS': { label: 'Consumables', color: 'var(--green)', subs: { INK: 'Ink', PPR: 'Paper', TFN: 'Teflon Sheet', TPS: 'Tape', GOV: 'Gloves', SLG: 'Silica Gel' } },
    'PKG': { label: 'Packaging', color: 'var(--text-muted)', subs: { PLY: 'Poly Mailer', BOX: 'Box', TSS: 'Tissue Paper', STK: 'Sticker', RBN: 'Ribbon', BAG: 'Gift Bag' } },
    'SUB': { label: 'Sublimation Supplies', color: 'var(--red)', subs: { PPR: 'Sub Paper', INK: 'Sub Ink', MWP: 'Mug Wrap', SHK: 'Shrink Wrap' } }
  };

  window.__makerInit_categories = function() {
    const frame = g('module-frame');
    let p = g('panel-categories');
    if (!p) {
      p = document.createElement('div');
      p.id = 'panel-categories';
      p.className = 'module-panel';
      p.innerHTML = `
        <style>
          #panel-categories,
          #panel-categories * {
            -webkit-app-region: no-drag !important;
          }

          #panel-categories input,
          #panel-categories textarea,
          #panel-categories button,
          #panel-categories select {
            pointer-events: auto !important;
            user-select: text !important;
            -webkit-user-select: text !important;
            position: relative !important;
            z-index: 99999 !important;
          }
        </style>
        <div class="page-header">
          <h2>Category &amp; Subcategory Manager</h2>
          <p>Create and customize dynamic categories, colors, and subcategories utilized across the SKU Builder, Products, and Inventory modules.</p>
        </div>

        <div style="display:flex; gap:24px; flex-wrap:wrap;">
          <!-- EDIT / ADD FORM CARD -->
          <div class="card" style="flex:1; min-width:320px; max-width:450px;">
            <h3 id="cat-form-title" style="margin-bottom:18px; font-size:15px; font-weight:700; color:var(--accent);">Add Category</h3>
            <form id="cat-form" onsubmit="saveCategoryForm(event)">
              <div class="field" style="margin-bottom:12px;">
                <label>Category Code (Uppercase, e.g. FIL)</label>
                <input type="text" id="cat-code" required placeholder="e.g. FIL" style="text-transform:uppercase;">
              </div>
              <div class="field" style="margin-bottom:12px;">
                <label>Category Name</label>
                <input type="text" id="cat-label" required placeholder="e.g. Filament">
              </div>
              <div class="field" style="margin-bottom:12px;">
                <label>Badge Color (CSS color or Hex)</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" id="cat-color" required placeholder="e.g. var(--accent) or #e040fb" style="flex:1;" oninput="if(this.value.startsWith('#')) g('cat-color-picker').value = this.value">
                  <input type="color" id="cat-color-picker" value="#e040fb" style="width:40px; height:38px; padding:2px; cursor:pointer; background:var(--surface); border:1px solid var(--border); border-radius:6px;" oninput="g('cat-color').value = this.value" onchange="g('cat-color').value = this.value">
                </div>
              </div>
              <div class="field" style="margin-bottom:18px;">
                <label>Subcategories (Comma-separated list)</label>
                <textarea id="cat-subs" placeholder="e.g. PLA, PETG, TPU, ABS, Silk" style="min-height:100px;"></textarea>
                <small style="color:var(--muted); margin-top:4px;">Comma list will auto-map to upper-case database keys.</small>
              </div>

              <div style="display:flex; gap:10px;">
                <button type="button" class="btn btn-ghost" id="cat-cancel" style="display:none;" onclick="clearCatForm()">Cancel</button>
                <button type="submit" class="btn btn-primary" style="flex:1;">Save Category</button>
              </div>
            </form>
          </div>

          <!-- LIST CARD -->
          <div class="card" style="flex:2; min-width:400px;">
            <div class="toolbar" style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
              <h3 style="font-size:15px; font-weight:700;">Dynamic Categories Directory</h3>
              <button class="btn btn-ghost btn-sm" onclick="loadCategories(true)">🔄 Sync From Sheet</button>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Code</th>
                    <th>Subcategories</th>
                    <th style="width:90px; text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody id="cat-tbody">
                  <tr><td colspan="4" style="text-align:center; color:var(--muted); padding:20px;">Loading categories...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      frame.appendChild(p);
    }
    loadCategories(false);
  };

  /**
   * Loads category config with fallback, seeding and memory caching
   */
  window.loadCategories = async function(forceRefresh = false) {
    if (!forceRefresh && window.__categoriesCache && Array.isArray(window.__categoriesCache)) {
      items = window.__categoriesCache;
      updateGlobalCats();
      renderCatTable();
      return;
    }

    const tbody = g('cat-tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--muted); padding:20px;">Syncing with Google Sheets...</td></tr>`;
    }

    // 1. Load local file fallback/seed source
    let localData = [];
    try {
      if (window.makerAPI && window.makerAPI.readData) {
        localData = await window.makerAPI.readData(FILE) || [];
      }
    } catch (e) {
      localData = [];
    }

    try {
      let fetchFunc = (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) ||
                      (window.makerAPI && window.makerAPI.fetchSheetData);

      let remoteParsed = null;
      if (fetchFunc) {
        const rawRows = await fetchFunc('Categories');
        if (rawRows && Array.isArray(rawRows) && rawRows.length > 0) {
          remoteParsed = [];
          const header = rawRows[0].map(h => String(h || '').trim().toLowerCase());
          const idIdx = header.findIndex(h => h === 'id' || h === 'category_id' || h.includes('id'));
          const codeIdx = header.findIndex(h => h === 'code' || h === 'category code' || h.includes('code'));
          const labelIdx = header.findIndex(h => h === 'label' || h === 'name' || h === 'category name' || h.includes('label'));
          const colorIdx = header.findIndex(h => h === 'color' || h === 'badge color' || h.includes('color'));
          const subsIdx = header.findIndex(h => h === 'subs' || h === 'subcategories' || h.includes('subs'));

          for (let i = 1; i < rawRows.length; i++) {
            const r = rawRows[i];
            if (!r || r.length === 0) continue;
            const idVal = (idIdx !== -1 ? r[idIdx] : '') || '';
            if (!idVal) continue;
            let subsObj = {};
            try { subsObj = JSON.parse((subsIdx !== -1 ? r[subsIdx] : '') || '{}'); } catch(e){}
            remoteParsed.push({
              id: idVal,
              code: (codeIdx !== -1 ? r[codeIdx] : '') || '',
              label: (labelIdx !== -1 ? r[labelIdx] : '') || '',
              color: (colorIdx !== -1 ? r[colorIdx] : '') || 'var(--accent)',
              subs: subsObj
            });
          }
          remoteParsed = remoteParsed.filter(x => x.id && x.label !== 'DELETED');
        }
      }

      if (remoteParsed !== null) {
        if (remoteParsed.length === 0 && localData.length === 0) {
          // Both empty: Seed defaults!
          const seeded = [];
          let index = 1;
          Object.keys(DEFAULT_CATS).forEach(code => {
            const c = DEFAULT_CATS[code];
            seeded.push({
              id: 'cat_' + index++,
              code: code,
              label: c.label,
              color: c.color,
              subs: c.subs
            });
          });

          items = seeded;
          window.__categoriesCache = seeded;
          updateGlobalCats();
          renderCatTable();
          await sv();

          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            for (const item of seeded) {
              await window.MAKER_CONFIG.saveToDatabase('Categories', [
                item.id, item.code, item.label, item.color, JSON.stringify(item.subs)
              ]);
            }
          }
        } else if (remoteParsed.length === 0 && localData.length > 0) {
          // Sheet empty but local data exists -> Sync to sheet
          items = localData;
          window.__categoriesCache = localData;
          updateGlobalCats();
          renderCatTable();
          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            for (const item of localData) {
              await window.MAKER_CONFIG.saveToDatabase('Categories', [
                item.id, item.code, item.label, item.color, JSON.stringify(item.subs)
              ]);
            }
          }
        } else {
          // Remote sheet wins
          items = remoteParsed;
          window.__categoriesCache = remoteParsed;
          updateGlobalCats();
          renderCatTable();

          const localStr = JSON.stringify(localData);
          const remoteStr = JSON.stringify(remoteParsed);
          if (localStr !== remoteStr && window.makerAPI && window.makerAPI.writeData) {
            await window.makerAPI.writeData(FILE, remoteParsed);
          }
        }
        return;
      }
    } catch (err) {
      console.error('Error loading remote Categories:', err);
    }

    // Full fallback
    if (!localData || localData.length === 0) {
      const seeded = [];
      let index = 1;
      Object.keys(DEFAULT_CATS).forEach(code => {
        const c = DEFAULT_CATS[code];
        seeded.push({
          id: 'cat_' + index++,
          code: code,
          label: c.label,
          color: c.color,
          subs: c.subs
        });
      });
      localData = seeded;
    }
    items = localData;
    window.__categoriesCache = localData;
    updateGlobalCats();
    renderCatTable();

    if (forceRefresh) {
      alert('🔄 Categories synchronized successfully!\n' + items.length + ' entries loaded/updated in the database.');
    }
  };

  function updateGlobalCats() {
    const globalObj = {};
    items.forEach(it => {
      globalObj[it.code] = {
        label: it.label,
        color: it.color,
        subs: it.subs
      };
    });
    window.OSOT_CATS = globalObj;
  }

  async function sv() {
    if (window.makerAPI && window.makerAPI.writeData) {
      await window.makerAPI.writeData(FILE, items);
    }
  }

  function renderCatTable() {
    const tbody = g('cat-tbody');
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--muted); padding:20px;">No categories configured.</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(it => {
      const subLabels = Object.values(it.subs).join(', ') || '—';
      const badgeStyle = `background:${it.color}; color:#fff; padding:2px 8px; border-radius:6px; font-weight:700; font-size:11px;`;
      return `
        <tr>
          <td><strong style="color:var(--text);">${escapeHtml(it.label)}</strong></td>
          <td><span style="${badgeStyle}">${escapeHtml(it.code)}</span></td>
          <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(subLabels)}">${escapeHtml(subLabels)}</td>
          <td style="text-align:right;">
            <button class="btn btn-ghost btn-sm" onclick="editCategoryItem('${it.id}')">✏️</button>
            <button class="btn btn-ghost btn-sm" onclick="deleteCategoryItem('${it.id}')">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.saveCategoryForm = async function(e) {
    e.preventDefault();

    const id = editId || 'cat_' + Date.now();
    const code = g('cat-code').value.trim().toUpperCase();
    const label = g('cat-label').value.trim();
    const color = g('cat-color').value.trim();
    const subsRaw = g('cat-subs').value;

    const subsObj = {};
    subsRaw.split(',').forEach(item => {
      const clean = item.trim();
      if (clean) {
        const key = clean.toUpperCase().replace(/[^A-Z0-9]/g, '');
        subsObj[key] = clean;
      }
    });

    const itemObj = { id, code, label, color, subs: subsObj };

    const idx = items.findIndex(x => x.id === id);
    if (idx >= 0) {
      items[idx] = itemObj;
    } else {
      items.push(itemObj);
    }

    window.__categoriesCache = items;
    updateGlobalCats();
    renderCatTable();
    clearCatForm();
    await sv();

    try {
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
        await window.MAKER_CONFIG.saveToDatabase('Categories', [
          id, code, label, color, JSON.stringify(subsObj)
        ]);
      }
    } catch (err) {
      console.error('[Categories] Error saving to remote:', err);
    }
  };

  window.editCategoryItem = function(id) {
    const it = items.find(x => x.id === id);
    if (!it) return;

    editId = id;
    g('cat-code').value = it.code;
    g('cat-label').value = it.label;
    g('cat-color').value = it.color;
    if (it.color.startsWith('#')) {
      g('cat-color-picker').value = it.color;
    }
    g('cat-subs').value = Object.values(it.subs).join(', ');

    g('cat-form-title').textContent = 'Edit Category';
    g('cat-cancel').style.display = 'inline-flex';
  };

  window.clearCatForm = function() {
    editId = null;
    g('cat-form').reset();
    g('cat-form-title').textContent = 'Add Category';
    g('cat-cancel').style.display = 'none';
  };

  window.deleteCategoryItem = async function(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;

    items = items.filter(x => x.id !== id);
    window.__categoriesCache = items;
    updateGlobalCats();
    renderCatTable();
    await sv();

    try {
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
        await window.MAKER_CONFIG.saveToDatabase('Categories', [id, '', 'DELETED']);
      }
    } catch (err) {
      console.error('[Categories] Error deleting remote category:', err);
    }
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
