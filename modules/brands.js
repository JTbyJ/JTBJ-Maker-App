/**
 * Just Jane Maker Lab - Brand Manager Module
 * Path: modules/brands.js
 */

window.__brandsCache = null;

(function() {
  var FILE = 'brands.json';
  var editId = null;

  var DEFAULT_BRANDS = [
    { id: 'b_1', name: 'Creality', code: 'CRE', website: 'creality.com', status: 'Active', notes: 'Major filament and printer manufacturer' },
    { id: 'b_2', name: 'Overture', code: 'OVE', website: 'overture3d.com', status: 'Active', notes: 'High quality PETG/PLA' },
    { id: 'b_3', name: 'Bambu Lab', code: 'BAM', website: 'bambulab.com', status: 'Active', notes: 'High speed printers & filaments' },
    { id: 'b_4', name: 'Polymaker', code: 'POL', website: 'polymaker.com', status: 'Active', notes: 'PolyTerra, PolyLite PLA/PETG' },
    { id: 'b_5', name: 'eSUN', code: 'ESU', website: 'esun3d.com', status: 'Active', notes: 'PLA+ and specialty materials' },
    { id: 'b_6', name: 'Sunlu', code: 'SUN', website: 'sunlu.com', status: 'Active', notes: 'Budget friendly filaments' },
    { id: 'b_7', name: 'Hatchbox', code: 'HAT', website: 'hatchbox3d.com', status: 'Active', notes: 'Consistent quality PLA' },
    { id: 'b_8', name: 'Elegoo', code: 'ELE', website: 'elegoo.com', status: 'Active', notes: 'Resin and FDM filaments' },
    { id: 'b_9', name: 'Anycubic', code: 'ANY', website: 'anycubic.com', status: 'Active', notes: 'Resin and FDM materials' }
  ];

  function getBrandCode(brand) {
    if (!brand) return 'UNK';
    var clean = brand.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    var words = clean.split(' ').filter(Boolean);
    if (words.length >= 3) {
      return (words[0][0] + words[1][0] + words[2][0]).slice(0, 3);
    } else if (words.length === 2) {
      return (words[0].slice(0, 2) + words[1][0]).slice(0, 3);
    } else {
      return words[0].slice(0, 3).padEnd(3, 'X');
    }
  }

  function g(id) { return document.getElementById(id); }

  window.__makerInit_brands = async function() {
    var frame = document.getElementById('module-frame');
    var panel = document.getElementById('panel-brands');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'panel-brands';
      panel.className = 'module-panel';
      panel.innerHTML =
        '<style>' +
        '  #panel-brands, #panel-brands * { -webkit-app-region: no-drag !important; }' +
        '  #panel-brands input, #panel-brands textarea, #panel-brands button, #panel-brands select {' +
        '    pointer-events: auto !important;' +
        '    user-select: text !important;' +
        '    -webkit-user-select: text !important;' +
        '    position: relative !important;' +
        '    z-index: 99999 !important;' +
        '  }' +
        '</style>' +
        '<div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start;">' +
        '  <div>' +
        '    <h2>Brand Manager</h2>' +
        '    <p>Manage brand catalog, 3-letter SKU prefixes, websites, and manufacturing notes.</p>' +
        '  </div>' +
        '  <button class="btn btn-ghost" id="brand-sync-btn">🔄 Sync</button>' +
        '</div>' +

        '<div class="stat-row">' +
        '  <div class="stat-box"><div class="sv" style="color:var(--accent)" id="brand-stat-total">0</div><div class="sl">Total Brands</div></div>' +
        '  <div class="stat-box"><div class="sv" style="color:var(--green)" id="brand-stat-active">0</div><div class="sl">Active Brands</div></div>' +
        '</div>' +

        '<div style="display:flex; gap:24px; flex-wrap:wrap;">' +
        '  <!-- LEFT: FORM -->' +
        '  <div class="card" style="flex:1; min-width:320px; max-width:420px;">' +
        '    <h3 style="font-size:15px; font-weight:700; margin-bottom:14px; color:#fff;" id="brand-form-title">Add New Brand</h3>' +
        '    <div class="field" style="margin-bottom:10px;">' +
        '      <label>BRAND NAME *</label>' +
        '      <input type="text" id="brand-name" placeholder="e.g. Creality" required>' +
        '    </div>' +
        '    <div style="display:flex; gap:10px; margin-bottom:10px;">' +
        '      <div class="field" style="flex:1;">' +
        '        <label>SKU BRAND CODE (3 CHARS)</label>' +
        '        <input type="text" id="brand-code" placeholder="CRE" maxlength="3" style="font-family:monospace; text-transform:uppercase; font-weight:700;">' +
        '      </div>' +
        '      <div class="field" style="flex:1;">' +
        '        <label>STATUS</label>' +
        '        <select id="brand-status">' +
        '          <option value="Active">Active</option>' +
        '          <option value="Inactive">Inactive</option>' +
        '        </select>' +
        '      </div>' +
        '    </div>' +
        '    <div class="field" style="margin-bottom:10px;">' +
        '      <label>WEBSITE</label>' +
        '      <input type="text" id="brand-website" placeholder="e.g. creality.com">' +
        '    </div>' +
        '    <div class="field" style="margin-bottom:16px;">' +
        '      <label>NOTES / DETAILS</label>' +
        '      <textarea id="brand-notes" placeholder="e.g. Filament specs, preferred vendor info" rows="3"></textarea>' +
        '    </div>' +
        '    <div style="display:flex; gap:10px;">' +
        '      <button class="btn btn-primary" id="brand-save-btn" style="flex:1;">Save Brand</button>' +
        '      <button class="btn btn-ghost" id="brand-cancel-btn" style="display:none;">Cancel</button>' +
        '    </div>' +
        '  </div>' +

        '  <!-- RIGHT: TABLE -->' +
        '  <div class="card" style="flex:2; min-width:480px;">' +
        '    <div class="toolbar" style="margin-bottom:16px;">' +
        '      <div class="search-box" style="width:100%;">' +
        '        <input type="text" id="brand-search" placeholder="Search brands by name, code, website...">' +
        '      </div>' +
        '    </div>' +
        '    <div class="table-wrap">' +
        '      <table>' +
        '        <thead>' +
        '          <tr>' +
        '            <th>Code</th>' +
        '            <th>Brand Name</th>' +
        '            <th>Website</th>' +
        '            <th>Status</th>' +
        '            <th>Notes</th>' +
        '            <th style="text-align:right;">Actions</th>' +
        '          </tr>' +
        '        </thead>' +
        '        <tbody id="brand-tbody"></tbody>' +
        '      </table>' +
        '    </div>' +
        '  </div>' +
        '</div>';
      frame.appendChild(panel);
    }

    attachBrandEvents();
    await loadBrands(false);
  };

  async function loadBrands(forceRefresh) {
    if (!forceRefresh && window.__brandsCache && Array.isArray(window.__brandsCache)) {
      renderBrandsTable();
      return;
    }

    var tbody = g('brand-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:20px;">Syncing brands...</td></tr>';
    }

    var localData = [];
    try {
      localData = await window.makerAPI.readData(FILE) || [];
    } catch (e) { localData = []; }

    try {
      let fetchFunc = (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase);
      let remoteParsed = null;

      if (fetchFunc) {
        const rawRows = await fetchFunc('Brands');
        if (rawRows && Array.isArray(rawRows) && rawRows.length > 0) {
          remoteParsed = [];
          const header = rawRows[0].map(h => String(h || '').trim().toLowerCase());
          const idIdx = header.findIndex(h => h === 'id' || h === 'brand_id' || h.includes('id'));
          const nameIdx = header.findIndex(h => h === 'name' || h === 'brand name' || h.includes('name'));
          const codeIdx = header.findIndex(h => h === 'code' || h === 'brand code' || h.includes('code'));
          const webIdx = header.findIndex(h => h === 'website' || h.includes('web') || h.includes('site'));
          const statIdx = header.findIndex(h => h === 'status' || h.includes('status'));
          const notesIdx = header.findIndex(h => h === 'notes' || h.includes('notes'));

          for (let i = 1; i < rawRows.length; i++) {
            const r = rawRows[i];
            if (!r || r.length === 0) continue;
            let idVal = (idIdx !== -1 ? r[idIdx] : '') || '';
            const nameVal = (nameIdx !== -1 ? r[nameIdx] : '') || '';
            if (!idVal && !nameVal) continue;

            let newlyAssigned = false;
            if (!idVal) {
              idVal = 'brand_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
              newlyAssigned = true;
            }

            const itemObj = {
              id: idVal,
              name: nameVal,
              code: (codeIdx !== -1 ? r[codeIdx] : '') || getBrandCode(nameVal),
              website: (webIdx !== -1 ? r[webIdx] : '') || '',
              status: (statIdx !== -1 ? r[statIdx] : '') || 'Active',
              notes: (notesIdx !== -1 ? r[notesIdx] : '') || ''
            };
            remoteParsed.push(itemObj);

            if (newlyAssigned && window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
              window.MAKER_CONFIG.saveToDatabase('Brands', [
                itemObj.id, itemObj.name, itemObj.code, itemObj.website, itemObj.status, itemObj.notes
              ]);
            }
          }
          remoteParsed = remoteParsed.filter(x => x.id && x.status !== 'DELETED');
        }
      }

      if (remoteParsed !== null) {
        if (remoteParsed.length === 0 && localData.length === 0) {
          // Seed default brands
          window.__brandsCache = DEFAULT_BRANDS;
          await sv();
          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            for (const b of DEFAULT_BRANDS) {
              await window.MAKER_CONFIG.saveToDatabase('Brands', [
                b.id, b.name, b.code, b.website, b.status, b.notes
              ]);
            }
          }
        } else if (remoteParsed.length === 0 && localData.length > 0) {
          window.__brandsCache = localData;
          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            for (const b of localData) {
              await window.MAKER_CONFIG.saveToDatabase('Brands', [
                b.id, b.name, b.code, b.website, b.status, b.notes
              ]);
            }
          }
        } else {
          window.__brandsCache = remoteParsed;
          await sv();
        }
        renderBrandsTable();
        return;
      }
    } catch (err) {
      console.error('[Brands] Error loading brands:', err);
    }

    if (!localData || localData.length === 0) {
      localData = DEFAULT_BRANDS;
    }
    window.__brandsCache = localData;
    renderBrandsTable();
  }

  async function sv() {
    if (window.makerAPI && window.makerAPI.writeData) {
      await window.makerAPI.writeData(FILE, window.__brandsCache || []);
    }
  }

  function renderBrandsTable() {
    var items = window.__brandsCache || [];
    var tbody = g('brand-tbody');
    if (!tbody) return;

    var query = (g('brand-search') ? g('brand-search').value : '').toLowerCase();
    var filtered = items.filter(function(b) {
      return !query || JSON.stringify(b).toLowerCase().includes(query);
    });

    if (g('brand-stat-total')) g('brand-stat-total').textContent = items.length;
    if (g('brand-stat-active')) g('brand-stat-active').textContent = items.filter(function(b) { return b.status === 'Active'; }).length;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No brands found. Add your first brand!</p></td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function(b) {
      var badgeClass = b.status === 'Active' ? 'badge-green' : 'badge-muted';
      var webLink = b.website ? '<a href="https://' + escapeHtml(b.website) + '" target="_blank" style="color:var(--accent); text-decoration:none;">🌐 ' + escapeHtml(b.website) + '</a>' : '—';

      return '<tr>' +
        '<td><span style="font-family:monospace; font-weight:800; color:var(--accent); background:rgba(224,64,251,0.1); padding:2px 6px; border-radius:4px;">' + escapeHtml(b.code || getBrandCode(b.name)) + '</span></td>' +
        '<td><strong style="color:var(--text);">' + escapeHtml(b.name) + '</strong></td>' +
        '<td>' + webLink + '</td>' +
        '<td><span class="badge ' + badgeClass + '">' + escapeHtml(b.status || 'Active') + '</span></td>' +
        '<td style="color:var(--muted); font-size:12px; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + escapeHtml(b.notes || '—') + '</td>' +
        '<td style="text-align:right;">' +
        '  <button class="btn btn-ghost btn-sm brande" data-id="' + b.id + '">Edit</button> ' +
        '  <button class="btn btn-danger btn-sm brandd" data-id="' + b.id + '">Del</button>' +
        '</td>' +
        '</tr>';
    }).join('');

    // Attach row button events
    tbody.querySelectorAll('.brande').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.dataset.id;
        var brand = (window.__brandsCache || []).find(function(x) { return x.id === id; });
        if (!brand) return;

        editId = id;
        g('brand-name').value = brand.name || '';
        g('brand-code').value = brand.code || getBrandCode(brand.name);
        g('brand-website').value = brand.website || '';
        g('brand-status').value = brand.status || 'Active';
        g('brand-notes').value = brand.notes || '';

        g('brand-form-title').textContent = 'Edit Brand';
        g('brand-cancel-btn').style.display = 'inline-block';
      });
    });

    tbody.querySelectorAll('.brandd').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (!confirm('Are you sure you want to delete this brand?')) return;
        var id = btn.dataset.id;
        window.__brandsCache = (window.__brandsCache || []).filter(function(x) { return x.id !== id; });
        await sv();

        if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
          await window.MAKER_CONFIG.saveToDatabase('Brands', [id, '', '', '', 'DELETED']);
        }
        renderBrandsTable();
        window.populateBrandsDropdown();
      });
    });

    // Automatically keep dropdowns in sync
    window.populateBrandsDropdown();
  }

  function attachBrandEvents() {
    var saveBtn = g('brand-save-btn');
    var cancelBtn = g('brand-cancel-btn');
    var searchInput = g('brand-search');
    var syncBtn = g('brand-sync-btn');
    var nameInput = g('brand-name');
    var codeInput = g('brand-code');

    if (nameInput && codeInput) {
      nameInput.addEventListener('input', function() {
        if (!editId || !codeInput.value) {
          codeInput.value = getBrandCode(nameInput.value);
        }
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', async function() {
        var name = g('brand-name').value.trim();
        if (!name) { alert('Brand name is required.'); return; }

        var code = (g('brand-code').value.trim() || getBrandCode(name)).toUpperCase();
        var website = g('brand-website').value.trim();
        var status = g('brand-status').value;
        var notes = g('brand-notes').value.trim();

        if (!window.__brandsCache) window.__brandsCache = [];

        var obj = {
          id: editId || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          name: name,
          code: code,
          website: website,
          status: status,
          notes: notes
        };

        if (editId) {
          var idx = window.__brandsCache.findIndex(function(x) { return x.id === editId; });
          if (idx !== -1) window.__brandsCache[idx] = obj;
        } else {
          window.__brandsCache.unshift(obj);
        }

        clearBrandForm();
        await sv();
        renderBrandsTable();

        if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
          await window.MAKER_CONFIG.saveToDatabase('Brands', [
            obj.id, obj.name, obj.code, obj.website, obj.status, obj.notes
          ]);
        }

        window.populateBrandsDropdown();
      });
    }

    if (cancelBtn) cancelBtn.addEventListener('click', clearBrandForm);
    if (searchInput) searchInput.addEventListener('input', renderBrandsTable);
    if (syncBtn) syncBtn.addEventListener('click', function() { loadBrands(true); });
  }

  function clearBrandForm() {
    editId = null;
    g('brand-form-title').textContent = 'Add New Brand';
    g('brand-cancel-btn').style.display = 'none';
    g('brand-name').value = '';
    g('brand-code').value = '';
    g('brand-website').value = '';
    g('brand-notes').value = '';
    g('brand-status').value = 'Active';
  }

  /**
   * Helper function exposed globally to populate brand options into any select element or input datalist
   */
  window.populateBrandsDropdown = function(targetElementOrId, selectedValue) {
    var brands = window.__brandsCache || DEFAULT_BRANDS;
    var activeBrands = brands.filter(function(b) { return b.status === 'Active'; });

    var targetEl = typeof targetElementOrId === 'string' ? g(targetElementOrId) : targetElementOrId;
    if (!targetEl) {
      // Fallback: populate default brand inputs/selects if present
      targetEl = g('sku-brand-select') || g('sku-brand-input');
    }

    if (targetEl && targetEl.tagName === 'SELECT') {
      var html = '<option value="">Select Brand...</option>';
      activeBrands.forEach(function(b) {
        var sel = (selectedValue === b.name || selectedValue === b.code) ? ' selected' : '';
        html += '<option value="' + escapeHtml(b.name) + '"' + sel + '>' + escapeHtml(b.name) + ' (' + escapeHtml(b.code || getBrandCode(b.name)) + ')</option>';
      });
      targetEl.innerHTML = html;
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
