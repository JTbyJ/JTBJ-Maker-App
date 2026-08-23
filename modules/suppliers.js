/**
 * Just Jane Maker Lab - Suppliers Directory Module
 * Path: modules/suppliers.js
 */

window.__suppliersCache = null;

(function(){
  var FILE = 'suppliers.json';
  var editId = null;
  var modalId = null;
  var supSortCol = 'name';
  var supSortDir = 'asc';
  var supSortController = null;
  var frame = document.getElementById('module-frame');
  var panel = document.createElement('div');
  panel.id = 'panel-suppliers';
  panel.className = 'module-panel';

  panel.innerHTML =
    '<style>' +
    '  #panel-suppliers, #panel-suppliers * { -webkit-app-region: no-drag !important; }' +
    '  #panel-suppliers input, #panel-suppliers textarea, #panel-suppliers button, #panel-suppliers select {' +
    '    pointer-events: auto !important;' +
    '    user-select: text !important;' +
    '    -webkit-user-select: text !important;' +
    '    position: relative !important;' +
    '    z-index: 99999 !important;' +
    '  }' +
    '</style>' +
    '<div class="page-header"><h2>Suppliers Directory</h2><p>Manage raw material suppliers, brand ratings, contact details and active statuses.</p></div>' +

    '<div class="stat-row">' +
      '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="sup-total">0</div><div class="sl">Total Suppliers</div></div>' +
      '<div class="stat-box"><div class="sv" style="color:var(--green)" id="sup-active">0</div><div class="sl">Active Suppliers</div></div>' +
      '<div class="stat-box"><div class="sv" style="color:var(--teal)" id="sup-cats">0</div><div class="sl">Total Categories</div></div>' +
      '<div class="stat-box"><div class="sv" style="color:var(--gold)" id="sup-avg-rating">0.0</div><div class="sl">Avg Rating</div></div>' +
    '</div>' +

    '<div class="card" style="margin-bottom:20px">' +
      '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="sup-form-title">Add New Supplier</h3>' +

      /* FORM ROWS */
      '<div class="input-row">' +
        '<div class="field" style="flex:2"><label>Supplier Name</label><input id="sup-name" placeholder="e.g. Filaments.ca"></div>' +
        '<div class="field" style="flex:1">' +
          '<label>Category</label>' +
          '<select id="sup-cat">' +
            '<option value="Filament">Filament</option>' +
            '<option value="Equipment">Equipment</option>' +
            '<option value="Sublimation">Sublimation</option>' +
            '<option value="Packaging">Packaging</option>' +
            '<option value="Resin">Resin</option>' +
            '<option value="Vinyl / HTV">Vinyl / HTV</option>' +
            '<option value="Blanks">Blanks</option>' +
            '<option value="Craft Supplies">Craft Supplies</option>' +
            '<option value="Materials">Materials</option>' +
            '<option value="Other">Other</option>' +
          '</select>' +
        '</div>' +
        '<div class="field" style="flex:1">' +
          '<label>Status</label>' +
          '<select id="sup-status">' +
            '<option value="Active">Active</option>' +
            '<option value="Inactive">Inactive</option>' +
            '<option value="On Hold">On Hold</option>' +
          '</select>' +
        '</div>' +
        '<div class="field" style="flex:1">' +
          '<label>Rating</label>' +
          '<select id="sup-rating">' +
            '<option value="5">⭐⭐⭐⭐⭐ (5)</option>' +
            '<option value="4">⭐⭐⭐⭐ (4)</option>' +
            '<option value="3">⭐⭐⭐ (3)</option>' +
            '<option value="2">⭐⭐ (2)</option>' +
            '<option value="1">⭐ (1)</option>' +
          '</select>' +
        '</div>' +
      '</div>' +

      '<div class="input-row">' +
        '<div class="field" style="flex:1.5"><label>Website</label><input id="sup-website" placeholder="e.g. filaments.ca"></div>' +
        '<div class="field" style="flex:1.5"><label>Contact Person</label><input id="sup-contact" placeholder="e.g. Jane Smith"></div>' +
        '<div class="field" style="flex:2"><label>Email</label><input id="sup-email" type="email" placeholder="e.g. sales@filaments.ca"></div>' +
        '<div class="field" style="flex:1.5"><label>Phone</label><input id="sup-phone" placeholder="e.g. 1-800-555-0199"></div>' +
      '</div>' +

      '<div class="input-row">' +
        '<div class="field" style="flex:1"><label>Lead Time</label><input id="sup-lead" placeholder="e.g. 3-7 business days"></div>' +
        '<div class="field" style="flex:1"><label>Min Order</label><input id="sup-min" placeholder="e.g. No minimum or $50"></div>' +
        '<div class="field" style="flex:1.5"><label>Shipping Policy</label><input id="sup-ship" placeholder="e.g. Free shipping over $75"></div>' +
      '</div>' +

      '<div class="input-row">' +
        '<div class="field" style="flex:1"><label>Notes / Details</label><textarea id="sup-notes" style="min-height:50px" placeholder="Canadian-based filament supplier. Wide range of PLA..."></textarea></div>' +
      '</div>' +

      '<div style="display:flex;gap:8px;margin-top:10px">' +
        '<button class="btn btn-primary" id="sup-save">Save Supplier</button>' +
        '<button class="btn btn-ghost" id="sup-cancel" style="display:none">Cancel</button>' +
      '</div>' +
    '</div>' +

    /* TOOLBAR */
    '<div class="toolbar">' +
      '<div class="search-box"><input id="sup-search" placeholder="Search suppliers by name, notes..."></div>' +
      '<select id="sup-cat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">' +
        '<option value="">All Categories</option>' +
        '<option value="Filament">Filament</option>' +
        '<option value="Equipment">Equipment</option>' +
        '<option value="Sublimation">Sublimation</option>' +
        '<option value="Packaging">Packaging</option>' +
        '<option value="Resin">Resin</option>' +
        '<option value="Vinyl / HTV">Vinyl / HTV</option>' +
        '<option value="Blanks">Blanks</option>' +
        '<option value="Craft Supplies">Craft Supplies</option>' +
        '<option value="Materials">Materials</option>' +
        '<option value="Other">Other</option>' +
      '</select>' +
      '<select id="sup-stat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">' +
        '<option value="">All Statuses</option>' +
        '<option value="Active">Active</option><option value="Inactive">Inactive</option><option value="On Hold">On Hold</option>' +
      '</select>' +
      '<select id="sup-rating-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">' +
        '<option value="">All Ratings</option>' +
        '<option value="5">5 Stars</option>' +
        '<option value="4">4+ Stars</option>' +
        '<option value="3">3+ Stars</option>' +
        '<option value="2">2+ Stars</option>' +
      '</select>' +
      '<button class="btn btn-ghost" id="sup-sync">🔄 Sync</button>' +
    '</div>' +

    /* TABLE */
    '<div class="table-wrap"><table id="sup-table"><thead><tr>' +
      '<th data-sort-key="name">Name</th><th data-sort-key="category">Category</th><th data-sort-key="status">Status</th><th data-sort-key="rating">Rating</th><th data-sort-key="website">Website</th><th data-sort-key="contact">Contact</th><th data-sort-key="phone">Phone</th><th style="width:70px">Actions</th>' +
    '</tr></thead><tbody id="sup-tbody"></tbody></table></div>' +

    /* DETAILS MODAL */
    '<div id="sup-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;align-items:center;justify-content:center">' +
      '<div class="card" style="width:550px;max-width:90%;position:relative;background:var(--card);border:1px solid var(--border);display:flex;flex-direction:column">' +
        '<button id="sup-modal-x" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;color:var(--text-muted);cursor:pointer;line-height:1">x</button>' +
        '<div id="sup-modal-body"></div>' +
        '<div style="display:flex;gap:10px;margin-top:20px;padding-top:14px;border-top:1px solid var(--border);justify-content:flex-end">' +
          '<button class="btn btn-primary" id="sup-modal-edit">Edit This Supplier</button>' +
          '<button class="btn btn-ghost" id="sup-modal-close">Close</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  frame.appendChild(panel);

  function g(id){return document.getElementById(id);}

  /* ── INITIALIZATION LOADER ── */
  async function load(forceRefresh = false) {
    var localData = [];
    try {
      localData = await window.makerAPI.readData(FILE) || [];
    } catch(e) {}

    if (localData && localData.length > 0) {
      window.__suppliersCache = localData;
      render();
    }

    try {
      let fetchFunc = null;
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) {
        fetchFunc = window.MAKER_CONFIG.fetchFromDatabase;
      }
      if (fetchFunc) {
        const remoteData = await fetchFunc('Suppliers');
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          const header = remoteData[0].map(h => String(h || '').trim().toLowerCase());
          const idIdx = header.findIndex(h => h === 'id' || h === 'supplier_id' || h.includes('id'));
          const nameIdx = header.findIndex(h => h === 'name' || h === 'supplier name' || h.includes('name'));
          const catIdx = header.findIndex(h => h === 'category' || h.includes('category') || h.includes('cat'));
          const statIdx = header.findIndex(h => h === 'status' || h.includes('status'));
          const ratingIdx = header.findIndex(h => h === 'rating' || h.includes('rating') || h.includes('rate'));
          const webIdx = header.findIndex(h => h === 'website' || h.includes('web') || h.includes('site'));
          const contactIdx = header.findIndex(h => h === 'contact' || h === 'contact_person' || h.includes('contact') || h.includes('person'));
          const emailIdx = header.findIndex(h => h === 'email' || h.includes('email') || h.includes('mail'));
          const phoneIdx = header.findIndex(h => h === 'phone' || h.includes('phone') || h.includes('mobile'));
          const leadIdx = header.findIndex(h => h === 'lead' || h === 'lead_time' || h.includes('lead') || h.includes('time'));
          const minIdx = header.findIndex(h => h === 'min' || h === 'min_order' || h.includes('min') || h.includes('order'));
          const shipIdx = header.findIndex(h => h === 'shipping' || h === 'shipping_policy' || h.includes('ship'));
          const notesIdx = header.findIndex(h => h === 'notes' || h.includes('notes') || h.includes('desc'));

          const parsedList = [];
          for (let i = 1; i < remoteData.length; i++) {
            const r = remoteData[i];
            if (!r || r.length === 0) continue;
            let idVal = idIdx !== -1 ? r[idIdx] : '';
            const nameVal = nameIdx !== -1 ? r[nameIdx] : '';
            if (!idVal && !nameVal) continue;

            let newlyAssigned = false;
            if (!idVal) {
              idVal = 'sup_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
              newlyAssigned = true;
            }

            const itemObj = {
              id: idVal,
              name: nameVal,
              category: catIdx !== -1 ? r[catIdx] : 'Filament',
              status: statIdx !== -1 ? r[statIdx] : 'Active',
              rating: ratingIdx !== -1 ? (parseInt(r[ratingIdx]) || 5) : 5,
              website: webIdx !== -1 ? r[webIdx] : '',
              contact: contactIdx !== -1 ? r[contactIdx] : '',
              email: emailIdx !== -1 ? r[emailIdx] : '',
              phone: phoneIdx !== -1 ? r[phoneIdx] : '',
              lead: leadIdx !== -1 ? r[leadIdx] : '',
              minOrder: minIdx !== -1 ? r[minIdx] : '',
              shipping: shipIdx !== -1 ? r[shipIdx] : '',
              notes: notesIdx !== -1 ? r[notesIdx] : ''
            };
            parsedList.push(itemObj);

            if (newlyAssigned && window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
              window.MAKER_CONFIG.saveToDatabase('Suppliers', [
                itemObj.id, itemObj.name, itemObj.category, itemObj.status, itemObj.rating,
                itemObj.website, itemObj.contact, itemObj.email, itemObj.phone,
                itemObj.lead, itemObj.minOrder, itemObj.shipping, itemObj.notes
              ]);
            }
          }

          const validParsed = parsedList.filter(x => x.id && x.status !== 'DELETED');

          // Bidirectional merge: combine remote items + missing local items
          const combinedMap = new Map();
          for (const item of validParsed) {
            combinedMap.set(item.id, item);
          }
          if (localData && Array.isArray(localData)) {
            for (const localItem of localData) {
              if (localItem && localItem.id && !combinedMap.has(localItem.id) && localItem.status !== 'DELETED') {
                combinedMap.set(localItem.id, localItem);
                if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
                  window.MAKER_CONFIG.saveToDatabase('Suppliers', [
                    localItem.id, localItem.name, localItem.category, localItem.status, localItem.rating,
                    localItem.website, localItem.contact, localItem.email, localItem.phone,
                    localItem.lead, localItem.minOrder, localItem.shipping, localItem.notes
                  ]);
                }
              }
            }
          }

          window.__suppliersCache = Array.from(combinedMap.values());
          await window.makerAPI.writeData(FILE, window.__suppliersCache);
          render();
          if (forceRefresh) {
            alert('🔄 Suppliers synchronized successfully!\n' + (window.__suppliersCache ? window.__suppliersCache.length : 0) + ' entries loaded/updated in the database.');
          }
          return;
        }
      }
    } catch (err) {
      console.error('[Suppliers] Failed loading remote suppliers:', err);
    }

    window.__suppliersCache = localData;

    if (window.makeTableSortable) {
      supSortController = window.makeTableSortable('sup-table', {
        defaultCol: 'name',
        defaultDir: 'asc',
        onSort: function(colKey, dir) {
          supSortCol = colKey;
          supSortDir = dir;
          render();
        }
      });
    }

    render();

    if (forceRefresh) {
      alert('🔄 Suppliers synchronized successfully!\n' + (window.__suppliersCache ? window.__suppliersCache.length : 0) + ' entries loaded/updated in the database.');
    }
  }

  async function sv(){
    await window.makerAPI.writeData(FILE, window.__suppliersCache || []);
  }

  /* ── RENDER TABLE ── */
  function render() {
    var items = window.__suppliersCache || [];
    var q = g('sup-search').value.toLowerCase();
    var cf = g('sup-cat-filter').value;
    var sf = g('sup-stat-filter').value;
    var rf = parseInt(g('sup-rating-filter').value) || 0;

    var fi = items.filter(function(i){
      var catOk = !cf || i.category === cf;
      var statOk = !sf || i.status === sf;
      var ratingOk = !rf || (i.rating || 0) >= rf;
      var qOk = !q || JSON.stringify(i).toLowerCase().indexOf(q) > -1;
      return catOk && statOk && ratingOk && qOk;
    });

    /* Render stats */
    g('sup-total').textContent = items.length;
    g('sup-active').textContent = items.filter(function(i){return i.status === 'Active';}).length;
    g('sup-cats').textContent = new Set(items.map(function(i){return i.category;})).size;
    var rated = items.filter(function(i){return i.rating;});
    var avgR = rated.length ? (rated.reduce(function(s, i){return s + (i.rating || 0);}, 0) / rated.length).toFixed(1) : '0.0';
    g('sup-avg-rating').textContent = avgR;

    /* Status colours mapping */
    var sc = {Active: 'badge-green', Inactive: 'badge-muted', 'On Hold': 'badge-gold'};

    var sortedFi = [...fi];
    sortedFi.sort(function(a, b) {
      var valA, valB;
      if (supSortCol === 'category') { valA = (a.category || '').toLowerCase(); valB = (b.category || '').toLowerCase(); }
      else if (supSortCol === 'status') { valA = (a.status || '').toLowerCase(); valB = (b.status || '').toLowerCase(); }
      else if (supSortCol === 'rating') { valA = Number(a.rating || 0); valB = Number(b.rating || 0); }
      else if (supSortCol === 'website') { valA = (a.website || '').toLowerCase(); valB = (b.website || '').toLowerCase(); }
      else if (supSortCol === 'contact') { valA = (a.contact || '').toLowerCase(); valB = (b.contact || '').toLowerCase(); }
      else if (supSortCol === 'phone') { valA = (a.phone || '').toLowerCase(); valB = (b.phone || '').toLowerCase(); }
      else { valA = (a.name || '').toLowerCase(); valB = (b.name || '').toLowerCase(); }

      if (valA < valB) return supSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return supSortDir === 'asc' ? 1 : -1;
      return 0;
    });

    g('sup-tbody').innerHTML = sortedFi.length ? sortedFi.map(function(i){
      var websiteLink = i.website ? '<a href="https://' + esc(i.website) + '" target="_blank" style="color:var(--accent);text-decoration:none">&#127760; ' + esc(i.website) + '</a>' : '—';
      return '<tr class="sup-row" data-id="' + i.id + '" style="cursor:pointer" title="Click to view full details">' +
        '<td style="font-weight:700;color:var(--text)">' + esc(i.name) + '</td>' +
        '<td><span class="badge badge-accent">' + esc(i.category) + '</span></td>' +
        '<td><span class="badge ' + (sc[i.status] || '') + '">' + esc(i.status) + '</span></td>' +
        '<td style="font-size:14px">' + starHTML(i.rating || 0) + '</td>' +
        '<td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + websiteLink + '</td>' +
        '<td>' + esc(i.contact || '—') + '</td>' +
        '<td>' + esc(i.phone || '—') + '</td>' +
        '<td>' +
          '<button class="btn btn-ghost btn-sm supe" data-id="' + i.id + '">Edit</button> ' +
          '<button class="btn btn-danger btn-sm supd" data-id="' + i.id + '">Del</button>' +
        '</td>' +
      '</tr>';
    }).join('') : '<tr><td colspan="8" class="empty-state"><p>No suppliers found. Add your first one above!</p></td></tr>';

    /* Attach Row click detail viewers */
    panel.querySelectorAll('#sup-tbody .sup-row').forEach(function(row){
      row.addEventListener('click', function(e){
        if (e.target.closest('button') || e.target.closest('a')) return;
        showModal(row.dataset.id);
      });
    });

    /* Attach Edit and Delete button events */
    panel.querySelectorAll('.supe').forEach(function(b){
      b.addEventListener('click', function(e){
        e.stopPropagation();
        var i = items.find(function(x){return x.id === b.dataset.id;});
        if (!i) return;
        editId = b.dataset.id;
        g('sup-name').value = i.name || '';
        g('sup-cat').value = i.category || 'Filament';
        g('sup-status').value = i.status || 'Active';
        g('sup-rating').value = String(i.rating || 5);
        g('sup-website').value = i.website || '';
        g('sup-contact').value = i.contact || '';
        g('sup-email').value = i.email || '';
        g('sup-phone').value = i.phone || '';
        g('sup-lead').value = i.lead || '';
        g('sup-min').value = i.minOrder || '';
        g('sup-ship').value = i.shipping || '';
        g('sup-notes').value = i.notes || '';
        g('sup-form-title').textContent = 'Edit Supplier';
        g('sup-cancel').style.display = 'inline-flex';
        panel.scrollIntoView({behavior: 'smooth', block: 'start'});
      });
    });

    panel.querySelectorAll('.supd').forEach(function(b){
      b.addEventListener('click', async function(e){
        e.stopPropagation();
        if (!confirm('Delete this supplier?')) return;
        const idToDelete = b.dataset.id;
        window.__suppliersCache = window.__suppliersCache.filter(function(x){return x.id !== idToDelete;});
        await sv();
        try {
          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            await window.MAKER_CONFIG.saveToDatabase('Suppliers', [idToDelete, '', '', 'DELETED']);
          }
        } catch (err) {
          console.error('[Suppliers] Error deleting remote sheet:', err);
        }
        render();
      });
    });
  }

  /* ── DETAILS MODAL ── */
  function showModal(id) {
    var items = window.__suppliersCache || [];
    var i = items.find(function(x){return x.id === id;});
    if (!i) return;
    modalId = id;

    g('sup-modal-body').innerHTML =
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;padding-right:30px">' +
        '<div>' +
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);margin-bottom:4px">' + esc(i.category) + '</div>' +
          '<h3 style="font-size:20px;font-weight:800;margin:0">' + esc(i.name) + '</h3>' +
        '</div>' +
        '<div style="font-size:18px">' + starHTML(i.rating || 0) + '</div>' +
      '</div>' +
      '<h4 style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--accent);margin-bottom:8px">Contact details</h4>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">' +
        mf('Website', i.website ? '<a href="https://' + esc(i.website) + '" target="_blank" style="color:var(--accent)">' + esc(i.website) + '</a>' : '') +
        mf('Contact Person', i.contact) +
        mf('Email', i.email ? '<a href="mailto:' + esc(i.email) + '" style="color:var(--accent)">' + esc(i.email) + '</a>' : '') +
        mf('Phone', i.phone) +
      '</div>' +
      '<h4 style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--accent);margin-bottom:8px">Shipping &amp; Fulfillment</h4>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">' +
        mf('Lead Time', i.lead) +
        mf('Min Order', i.minOrder) +
        mf('Shipping Policy', i.shipping) +
      '</div>' +
      (i.notes ? '<h4 style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--accent);margin-bottom:8px">Notes &amp; Description</h4>' +
                 '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:13px;line-height:1.5;white-space:pre-wrap;color:var(--text)">' + esc(i.notes) + '</div>' : '');

    g('sup-modal').style.display = 'flex';
  }

  function mf(label, val) {
    if (!val) return '';
    return '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px">' +
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px">' + label + '</div>' +
      '<div style="font-size:14px">' + val + '</div></div>';
  }

  g('sup-modal').addEventListener('click', function(e){
    if (e.target === g('sup-modal')) g('sup-modal').style.display = 'none';
  });
  g('sup-modal-x').addEventListener('click', function(){g('sup-modal').style.display = 'none';});
  g('sup-modal-close').addEventListener('click', function(){g('sup-modal').style.display = 'none';});
  g('sup-modal-edit').addEventListener('click', function(){
    g('sup-modal').style.display = 'none';
    if (!modalId) return;
    var btn = panel.querySelector('.supe[data-id="' + modalId + '"]');
    if (btn) btn.click();
  });

  /* ── FORM SAVE ACTION ── */
  g('sup-save').addEventListener('click', async function(){
    var name = g('sup-name').value.trim();
    if (!name) { alert('Please enter a supplier name.'); return; }

    var obj = {
      id: editId || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name,
      category: g('sup-cat').value,
      status: g('sup-status').value,
      rating: parseInt(g('sup-rating').value) || 5,
      website: g('sup-website').value.trim(),
      contact: g('sup-contact').value.trim(),
      email: g('sup-email').value.trim(),
      phone: formatPhoneNumber(g('sup-phone').value.trim()),
      lead: g('sup-lead').value.trim(),
      minOrder: g('sup-min').value.trim(),
      shipping: g('sup-ship').value.trim(),
      notes: g('sup-notes').value.trim()
    };

    if (editId) {
      var idx = window.__suppliersCache.findIndex(function(x){return x.id === editId;});
      if (idx >= 0) window.__suppliersCache[idx] = obj;
    } else {
      window.__suppliersCache.unshift(obj);
    }

    clearForm();
    await sv();
    render();

    try {
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
        await window.MAKER_CONFIG.saveToDatabase('Suppliers', [
          obj.id, obj.name, obj.category, obj.status, obj.rating,
          obj.website, obj.contact, obj.email, obj.phone,
          obj.lead, obj.minOrder, obj.shipping, obj.notes
        ]);
      }
    } catch (err) {
      console.error('[Suppliers] Error syncing to remote sheet:', err);
    }
  });

  function clearForm(){
    editId = null;
    g('sup-form-title').textContent = 'Add New Supplier';
    g('sup-cancel').style.display = 'none';
    ['sup-name','sup-website','sup-contact','sup-email','sup-phone','sup-lead','sup-min','sup-ship','sup-notes'].forEach(function(id){
      g(id).value = '';
    });
    g('sup-cat').value = 'Filament';
    g('sup-status').value = 'Active';
    g('sup-rating').value = '5';
  }

  g('sup-cancel').addEventListener('click', clearForm);
  g('sup-search').addEventListener('input', render);
  g('sup-cat-filter').addEventListener('change', render);
  g('sup-stat-filter').addEventListener('change', render);
  g('sup-rating-filter').addEventListener('change', render);
  g('sup-sync').addEventListener('click', function(){ load(true); });

  /* ── HELPERS ── */
  function starHTML(rating) {
    var full = '★', empty = '☆', str = '';
    for (var i = 1; i <= 5; i++) {
      str += (i <= rating) ? full : empty;
    }
    return str;
  }

  function esc(v) {
    return String(v === undefined || v === null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatPhoneNumber(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 0) {
      return `+${digits}`;
    }
    return phone;
  }

  window.__makerInit_suppliers = load;
})();