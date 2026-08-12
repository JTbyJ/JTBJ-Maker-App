(function(){
  var FILE='projects.json';
  var frame=document.getElementById('module-frame');
  var panel=document.createElement('div');
  panel.id='panel-projects';panel.className='module-panel';

  panel.innerHTML=
    '<div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">' +
    '  <div>' +
    '    <h2>Project Log</h2>' +
    '    <p>Track craft projects, costs, revenue &amp; profit</p>' +
    '  </div>' +
    '  <button class="btn btn-ghost" id="proj-sync-btn">🔄 Sync</button>' +
    '</div>' +
    '<div class="stat-row">'+
      '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="proj-total">0</div><div class="sl">Total Projects</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--teal)" id="proj-revenue">$0.00</div><div class="sl">Total Revenue</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--red)" id="proj-cost">$0.00</div><div class="sl">Total Cost</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--green)" id="proj-profit">$0.00</div><div class="sl">Net Profit</div></div>'+
    '</div>'+
    '<div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:20px">'+
      '<div class="card" style="flex:1.5;min-width:320px">'+
        '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="proj-form-title">Add Experimental Project / Prototype</h3>'+
        '<div class="input-row">'+
          '<div class="field" style="flex:2"><label>Project Name</label><input id="proj-name" placeholder="e.g. Mug Order - Sarah Birthday"></div>'+
          '<div class="field"><label>Category</label><select id="proj-cat"><option>Sublimation</option><option>3D Print</option><option>Resin</option><option>Candle</option><option>Soap</option><option>Bath Bomb</option><option>Vinyl / HTV</option><option>Embroidery</option><option>Mixed</option><option>Other</option></select></div>'+
          '<div class="field"><label>Status</label><select id="proj-status"><option>Idea</option><option>In Progress</option><option>Completed</option><option>Sold</option><option>Gifted</option><option>Cancelled</option></select></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field"><label>Start Date</label><input id="proj-start" type="date"></div>'+
          '<div class="field"><label>End Date</label><input id="proj-end" type="date"></div>'+
          '<div class="field"><label>Material Cost (BOM Auto)</label><input id="proj-mat-cost" type="number" step="0.01" readonly style="background:rgba(255,255,255,0.04);color:var(--muted);outline:none;"></div>'+
          '<div class="field"><label>Labour Cost ($)</label><input id="proj-lab-cost" type="number" step="0.01" placeholder="15.00" value="10.00"></div>'+
          '<div class="field"><label>Revenue ($)</label><input id="proj-rev" type="number" step="0.01" placeholder="45.00"></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field"><label>Profit (auto)</label><div id="proj-profit-live" style="padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;font-weight:700;font-size:14px;color:var(--green)">$0.00</div></div>'+
          '<div class="field" style="flex:3"><label>Notes / Prototype Details</label><input id="proj-notes" placeholder="e.g. Custom design - 3 revisions"></div>'+
        '</div>'+
        '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary" id="proj-save">Save Project</button><button class="btn btn-ghost" id="proj-cancel" style="display:none">Cancel</button></div>'+
      '</div>'+

      '<!-- PROTOTYPE BOM CARD -->'+
      '<div class="card" style="flex:1;min-width:280px;display:flex;flex-direction:column">'+
        '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Prototype Bill of Materials (BOM)</h3>'+
        '<div style="display:flex;gap:8px;margin-bottom:12px;align-items:flex-end">'+
          '<div class="field" style="flex:1">'+
            '<div style="display:flex;justify-content:space-between;align-items:center">'+
              '<label style="margin:0">Inventory Supply</label>'+
              '<button type="button" class="btn btn-ghost btn-sm" id="proj-btn-inline-sku" style="padding:2px 6px;font-size:10px;line-height:1;margin-bottom:4px;border:none;background:none;color:var(--accent);font-weight:700;cursor:pointer">⚡ New SKU</button>'+
            '</div>'+
            '<select id="proj-bom-item"><option value="">Select supply...</option></select>'+
          '</div>'+
          '<div class="field" style="width:70px"><label>Qty</label><input id="proj-bom-qty" type="number" value="1" step="any"></div>'+
          '<button type="button" class="btn btn-secondary" id="proj-bom-add-btn">Add</button>'+
        '</div>'+
        '<div class="table-wrap" style="flex:1;min-height:120px;margin-bottom:12px">'+
          '<table><thead><tr><th>Supply</th><th>Qty</th><th>Cost</th><th>Total</th><th></th></tr></thead>'+
          '<tbody id="proj-bom-tbody"></tbody></table>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="toolbar">'+
      '<div class="search-box"><input id="proj-search" placeholder="Search projects..."></div>'+
      '<select id="proj-cat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px"><option value="">All Categories</option><option>Sublimation</option><option>3D Print</option><option>Resin</option><option>Candle</option><option>Soap</option><option>Bath Bomb</option><option>Vinyl / HTV</option><option>Embroidery</option><option>Mixed</option><option>Other</option></select>'+
      '<select id="proj-stat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px"><option value="">All Statuses</option><option>Idea</option><option>In Progress</option><option>Completed</option><option>Sold</option><option>Gifted</option><option>Cancelled</option></select>'+
    '</div>'+
    '<div class="table-wrap"><table><thead><tr><th>Project Name</th><th>Category</th><th>Status</th><th>Start</th><th>End</th><th>Mat Cost</th><th>Labour</th><th>Revenue</th><th>Profit</th><th>Actions</th></tr></thead><tbody id="proj-tbody"></tbody></table></div>'+

    /* MODAL WINDOW FOR DETAILS */
    '<div id="proj-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;align-items:center;justify-content:center">'+
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;width:min(620px,90vw);max-height:85vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.5)">'+
        '<button id="proj-modal-x" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;color:var(--text-muted);cursor:pointer;line-height:1">x</button>'+
        '<div id="proj-modal-body"></div>'+
        '<div style="display:flex;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">'+
          '<button class="btn btn-primary" id="proj-modal-edit">Edit This Project</button>'+
          '<button class="btn btn-teal" id="proj-modal-promote" style="display:none;">🚀 Convert to Catalog Product</button>'+
          '<button class="btn btn-ghost" id="proj-modal-close">Close</button>'+
        '</div>'+
      '</div>'+
    '</div>' +

    /* INLINE SKU MODAL FOR PROJECTS */
    '<div id="proj-inline-sku-modal" style="display:none; position:fixed; z-index:11000; left:0; top:0; width:100%; height:100%; overflow:auto; background-color:rgba(0,0,0,0.8); align-items:center; justify-content:center;">'+
      '<div class="card" style="background:var(--surface); width:480px; border:1px solid var(--border); border-radius:var(--radius); padding:24px; position:relative; box-shadow:0 10px 40px rgba(0,0,0,0.6); display:flex; flex-direction:column; gap:16px;">'+
        '<h3 style="margin-bottom:4px; font-size:16px; font-weight:700; color:var(--accent);">⚡ Fast Create New SKU Inline</h3>'+
        '<div class="field">'+
          '<label>SKU Code</label>'+
          '<input type="text" id="pj-inline-sku-code" placeholder="e.g. FIL-PLA-CRE-005" style="font-family:monospace; font-weight:700;">'+
        '</div>'+
        '<div class="field">'+
          '<label>Item Name</label>'+
          '<input type="text" id="pj-inline-sku-name" placeholder="e.g. Creality Black PLA">'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field" style="flex:1;">'+
            '<label>Category</label>'+
            '<select id="pj-inline-sku-cat">'+
              '<option value="FIL">Filament (FIL)</option>'+
              '<option value="MAT">Raw Materials (MAT)</option>'+
              '<option value="BLK">Blanks (BLK)</option>'+
              '<option value="SUB">Sublimation Supplies (SUB)</option>'+
            '</select>'+
          '</div>'+
          '<div class="field" style="flex:1;">'+
            '<label>Subcategory Code</label>'+
            '<input type="text" id="pj-inline-sku-subcat" placeholder="e.g. PLA">'+
          '</div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field" style="flex:1;">'+
            '<label>Brand / Manufacturer</label>'+
            '<input type="text" id="pj-inline-sku-brand" placeholder="e.g. Creality">'+
          '</div>'+
          '<div class="field" style="flex:1;">'+
            '<label>Cost ($)</label>'+
            '<input type="number" id="pj-inline-sku-cost" step="0.01" value="0.00">'+
          '</div>'+
        '</div>'+
        '<div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">'+
          '<button type="button" class="btn btn-ghost" id="pj-inline-sku-cancel">Cancel</button>'+
          '<button type="button" class="btn btn-primary" id="pj-inline-sku-save">Create &amp; Add SKU</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  frame.appendChild(panel);

  var items=[],editId=null,modalId=null;
  var activeBom = []; // Temporary BOM for active project builder
  var inventory = [];

  function g(id){return document.getElementById(id);}
  function esc(v){return String(v===undefined||v===null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function mf(label,val){
    if(val===undefined||val===null||val==='')return '';
    return '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px">'+
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px">'+label+'</div>'+
      '<div style="font-size:14px">'+esc(val)+'</div></div>';
  }

  function calcProfit(){
    var mat=parseFloat(g('proj-mat-cost').value)||0;
    var lab=parseFloat(g('proj-lab-cost').value)||0;
    var rev=parseFloat(g('proj-rev').value)||0;
    var profit=rev-(mat+lab);
    var el=g('proj-profit-live');
    el.textContent=(profit>=0?'+':'')+profit.toFixed(2);
    el.style.color=profit>=0?'var(--green)':'var(--red)';
  }

  function showModal(id){
    var i=items.find(function(x){return x.id===id;});if(!i)return;
    modalId=id;
    var sc={Idea:'badge-muted','In Progress':'badge-accent',Completed:'badge-green',Sold:'badge-teal',Gifted:'badge-gold',Cancelled:'badge-red'};
    var profit=Number(i.revenue||0)-Number(i.matCost||0)-Number(i.labCost||0);

    // Set promotion button display for Completed or Sold projects
    var promoteBtn = g('proj-modal-promote');
    if (promoteBtn) {
      if (i.status === 'Completed' || i.status === 'Sold') {
        promoteBtn.style.display = 'inline-flex';
      } else {
        promoteBtn.style.display = 'none';
      }
    }

    // Build BOM details string if present
    var bomHtml = '';
    if (i.bom && i.bom.length > 0) {
      bomHtml = '<div style="margin-top: 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px;">'+
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:6px">Prototype BOM</div>'+
        '<table style="width:100%; border-collapse:collapse; font-size:12px;">'+
          '<thead><tr style="border-bottom:1px solid var(--border);"><th style="text-align:left; padding:4px;">Item</th><th style="text-align:left; padding:4px;">Qty</th><th style="text-align:right; padding:4px;">Cost</th></tr></thead>'+
          '<tbody>'+
            i.bom.map(function(b) {
              return '<tr><td style="padding:4px;">'+esc(b.name)+'</td><td style="padding:4px;">'+b.qty+' '+esc(b.unitMetric || 'ea')+'</td><td style="text-align:right; padding:4px;">$'+(b.qty * (b.unitCost || 0)).toFixed(2)+'</td></tr>';
            }).join('')+
          '</tbody>'+
        '</table>'+
      '</div>';
    }

    g('proj-modal-body').innerHTML=
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;padding-right:30px">'+
        '<div>'+
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);margin-bottom:4px">'+esc(i.category)+'</div>'+
          '<h3 style="font-size:20px;font-weight:800;margin:0">'+esc(i.name)+'</h3>'+
        '</div>'+
        '<span class="badge '+(sc[i.status]||'')+'">'+esc(i.status)+'</span>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
        mf('Start Date',i.startDate)+mf('End Date',i.endDate)+
        mf('Material Cost','$'+Number(i.matCost||0).toFixed(2))+mf('Labour Cost','$'+Number(i.labCost||0).toFixed(2))+
        mf('Revenue','$'+Number(i.revenue||0).toFixed(2))+
      '</div>'+
      '<div style="background:var(--bg);border:2px solid '+(profit>=0?'var(--green)':'var(--red)')+';border-radius:8px;padding:14px;text-align:center;margin-top:10px">'+
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px">Net Profit</div>'+
        '<div style="font-size:24px;font-weight:900;color:'+(profit>=0?'var(--green)':'var(--red)')+'">'+
          (profit>=0?'+':'')+profit.toFixed(2)+
        '</div>'+
      '</div>'+
      bomHtml+
      (i.notes?'<div style="margin-top:10px">'+mf('Notes',i.notes)+'</div>':'');
    g('proj-modal').style.display='flex';
  }

  // Promote Project Prototype to Product Catalog
  g('proj-modal-promote').addEventListener('click', async function() {
    g('proj-modal').style.display = 'none';
    if (!modalId) return;
    var i = items.find(function(x) { return x.id === modalId; });
    if (!i) return;

    if (!confirm('Promote this project prototype "' + i.name + '" to the ready-to-sell Product Catalog?')) return;

    try {
      let catalogProds = [];
      try { catalogProds = await window.makerAPI.readData('products.json') || []; } catch(e){}

      const newProdId = 'prod_' + Date.now();
      const cleanBOM = (i.bom || []).map(b => ({
        itemId: b.itemId,
        name: b.name,
        qty: b.qty,
        unitMetric: b.unitMetric || 'ea',
        unitCost: b.unitCost || 0
      }));

      const newProdObj = {
        id: newProdId,
        name: i.name,
        category: i.category,
        sku: 'CAT-' + i.category.substring(0,3).toUpperCase() + '-' + Date.now().toString(36).substring(4).toUpperCase(),
        status: 'Active',
        platforms: ['Etsy'],
        salePrice: Number(i.revenue || 0) || 20.00,
        etsyFee: 0,
        description: i.notes || 'Imported experimental design from Project Log.',
        notes: 'Promoted from Project Prototype ' + i.id,
        labourHrs: 0.5,
        labourRate: 20,
        labourCost: Number(i.labCost || 0),
        materialCost: Number(i.matCost || 0),
        cogs: Number(i.matCost || 0) + Number(i.labCost || 0),
        margin: Number(i.revenue || 0) > 0 ? (((Number(i.revenue || 0) - (Number(i.matCost || 0) + Number(i.labCost || 0))) / Number(i.revenue || 0)) * 100) : 0,
        bom: cleanBOM
      };

      catalogProds.unshift(newProdObj);
      window.__productsCache = catalogProds;
      await window.makerAPI.writeData('products.json', catalogProds);

      if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
        await window.MAKER_CONFIG.saveToDatabase('Products', [
          newProdObj.id, newProdObj.name, newProdObj.category, newProdObj.sku, newProdObj.status,
          JSON.stringify(newProdObj.platforms), newProdObj.salePrice, newProdObj.etsyFee,
          newProdObj.description, newProdObj.notes, newProdObj.labourHrs, newProdObj.labourRate,
          newProdObj.labourCost, newProdObj.materialCost, newProdObj.cogs, newProdObj.margin,
          JSON.stringify(newProdObj.bom)
        ]);
      }

      alert('🚀 Successfully promoted prototype to active Product Catalog! Navigate to the Products tab to view/edit.');
    } catch(err) {
      console.error('Error promoting prototype:', err);
      alert('Failed to promote prototype to Product Catalog.');
    }
  });

  g('proj-modal').addEventListener('click',function(e){if(e.target===g('proj-modal'))g('proj-modal').style.display='none';});
  g('proj-modal-x').addEventListener('click',function(){g('proj-modal').style.display='none';});
  g('proj-modal-close').addEventListener('click',function(){g('proj-modal').style.display='none';});
  g('proj-modal-edit').addEventListener('click',function(){
    g('proj-modal').style.display='none';
    if(!modalId)return;
    var i=items.find(function(x){return x.id===modalId;});if(!i)return;
    editId=modalId;
    g('proj-name').value=i.name||'';g('proj-cat').value=i.category||'Other';
    g('proj-status').value=i.status||'Idea';g('proj-start').value=i.startDate||'';
    g('proj-end').value=i.endDate||'';g('proj-mat-cost').value=i.matCost||'';
    g('proj-lab-cost').value=i.labCost||'';g('proj-rev').value=i.revenue||'';
    g('proj-notes').value=i.notes||'';
    activeBom = i.bom ? JSON.parse(JSON.stringify(i.bom)) : [];
    renderActiveBOM();
    calcProfit();
    g('proj-form-title').textContent='Edit Project';g('proj-cancel').style.display='inline-flex';
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  });

  ['proj-mat-cost','proj-lab-cost','proj-rev'].forEach(function(id){g(id).addEventListener('input',calcProfit);});

  // Dynamic dropdown and item management inside projects
  async function loadInventory() {
    try {
      inventory = window.__inventoryCache || await window.makerAPI.readData('inventory.json') || [];
    } catch(e) { inventory = []; }

    let skuCatalog = [];
    try { skuCatalog = await window.makerAPI.readData('sku.json') || []; } catch(e){}

    // Ensure SKU catalog items not present in inventory can still be built (SSOT)
    skuCatalog.forEach(s => {
      const matches = inventory.some(inv => inv.sku === s.sku);
      if (!matches) {
        inventory.push({
          id: s.sku,
          sku: s.sku,
          name: s.name,
          brand: s.brand,
          cat: s.cat,
          subcat: s.subcat,
          cost: s.cost,
          unitMetric: 'ea',
          metricCapacity: 1
        });
      }
    });

    var sel = g('proj-bom-item');
    if (sel) {
      sel.innerHTML = '<option value="">Select supply...</option>';
      inventory.forEach(function(inv) {
        var opt = document.createElement('option');
        opt.value = inv.sku || inv.id;
        opt.textContent = inv.name + ' (' + (inv.sku || 'No SKU') + ')';
        sel.appendChild(opt);
      });
    }
  }

  // Inline SKU trigger for projects
  g('proj-btn-inline-sku').addEventListener('click', function(e) {
    e.preventDefault();
    g('pj-inline-sku-code').value = '';
    g('pj-inline-sku-name').value = '';
    g('pj-inline-sku-subcat').value = '';
    g('pj-inline-sku-brand').value = '';
    g('pj-inline-sku-cost').value = '0.00';
    g('proj-inline-sku-modal').style.display = 'flex';
  });

  g('pj-inline-sku-cancel').addEventListener('click', function() {
    g('proj-inline-sku-modal').style.display = 'none';
  });

  g('pj-inline-sku-save').addEventListener('click', async function() {
    var sku = g('pj-inline-sku-code').value.trim();
    var name = g('pj-inline-sku-name').value.trim();
    if (!sku || !name) {
      alert('SKU Code and Item Name are required to create a SKU.');
      return;
    }
    var cat = g('pj-inline-sku-cat').value;
    var subcat = g('pj-inline-sku-subcat').value.trim();
    var brand = g('pj-inline-sku-brand').value.trim();
    var cost = Number(g('pj-inline-sku-cost').value) || 0;

    // Save SKU to Master catalog
    let skus = [];
    try { skus = await window.makerAPI.readData('sku.json') || []; } catch(err){}
    const existing = skus.find(s => s.sku.toLowerCase() === sku.toLowerCase());
    if (!existing) {
      const skuId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const newSku = {
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
        notes: 'Created inline from Project Log prototype form',
        classification: 'Raw Component / Material (BOM Input)'
      };
      skus.unshift(newSku);
      await window.makerAPI.writeData('sku.json', skus);

      if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
        await window.MAKER_CONFIG.saveToDatabase('Sku', [
          skuId, sku, name, cat, subcat, brand, cost, 0, 0, 0, 'Active', 'Created inline from Project Log prototype', 'Raw Component / Material (BOM Input)'
        ]);
      }
    }

    await loadInventory();
    g('proj-inline-sku-modal').style.display = 'none';

    // Auto-select the newly created SKU in the BOM picker
    g('proj-bom-item').value = sku;
  });

  // BOM adding
  g('proj-bom-add-btn').addEventListener('click', function() {
    var itemId = g('proj-bom-item').value;
    var qty = parseFloat(g('proj-bom-qty').value) || 0;
    if (!itemId || qty <= 0) return;

    var inv = inventory.find(function(x) { return x.sku === itemId || x.id === itemId; });
    if (inv) {
      const cap = Number(inv.metricCapacity || 1);
      const cost = Number(inv.cost || 0);
      const calculatedUnitCost = cost / cap;
      const bomIdentifier = inv.sku || inv.id;

      var existing = activeBom.find(function(b) { return b.itemId === bomIdentifier; });
      if (existing) {
        existing.qty += qty;
      } else {
        activeBom.push({
          itemId: bomIdentifier,
          name: inv.name,
          qty: qty,
          unitMetric: inv.unitMetric || 'ea',
          unitCost: calculatedUnitCost
        });
      }
      g('proj-bom-qty').value = '1';
      renderActiveBOM();
    }
  });

  function renderActiveBOM() {
    var tbody = g('proj-bom-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    var totalMatCost = 0;
    activeBom.forEach(function(b, idx) {
      let uCost = Number(b.unitCost || 0);
      if (uCost === 0) {
        const skuCatalog = window.__skuCatalogCache || [];
        const masterSku = skuCatalog.find(s => s.sku === b.itemId);
        if (masterSku) {
          uCost = Number(masterSku.cost || 0);
        }
      }

      var lineTotal = b.qty * uCost;
      totalMatCost += lineTotal;

      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + esc(b.name) + '</td>'+
        '<td>' + b.qty + ' ' + esc(b.unitMetric || 'ea') + '</td>'+
        '<td>$' + uCost.toFixed(2) + '</td>'+
        '<td>$' + lineTotal.toFixed(2) + '</td>'+
        '<td><button type="button" class="btn btn-danger btn-sm p-bomr" style="padding:2px 6px;" data-idx="' + idx + '">×</button></td>';
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.p-bomr').forEach(function(b) {
      b.addEventListener('click', function() {
        activeBom.splice(parseInt(b.dataset.idx), 1);
        renderActiveBOM();
      });
    });

    g('proj-mat-cost').value = totalMatCost.toFixed(2);
    calcProfit();
  }

  async function load(){
    await loadInventory();
    items=await window.makerAPI.readData(FILE)||[];
    render();
  }
  async function sv(){await window.makerAPI.writeData(FILE,items);}

  function render(){
    var q=g('proj-search').value.toLowerCase();
    var cf=g('proj-cat-filter').value;
    var sf=g('proj-stat-filter').value;
    var fi=items.filter(function(i){return(!cf||i.category===cf)&&(!sf||i.status===sf)&&(!q||JSON.stringify(i).toLowerCase().indexOf(q)>-1);});
    g('proj-total').textContent=items.length;
    g('proj-revenue').textContent='$'+items.reduce(function(s,i){return s+Number(i.revenue||0);},0).toFixed(2);
    var totalCost=items.reduce(function(s,i){return s+Number(i.matCost||0)+Number(i.labCost||0);},0);
    g('proj-cost').textContent='$'+totalCost.toFixed(2);
    var netProfit=items.reduce(function(s,i){return s+Number(i.revenue||0)-Number(i.matCost||0)-Number(i.labCost||0);},0);
    var pel=g('proj-profit');pel.textContent='$'+netProfit.toFixed(2);pel.style.color=netProfit>=0?'var(--green)':'var(--red)';
    var sc={Idea:'badge-muted','In Progress':'badge-accent',Completed:'badge-green',Sold:'badge-teal',Gifted:'badge-gold',Cancelled:'badge-red'};
    if(fi.length===0){g('proj-tbody').innerHTML='<tr><td colspan="10" class="empty-state"><p>No projects yet.</p></td></tr>';return;}
    g('proj-tbody').innerHTML=fi.map(function(i){
      var profit=Number(i.revenue||0)-Number(i.matCost||0)-Number(i.labCost||0);
      return '<tr data-id="'+i.id+'" style="cursor:pointer" title="Click row to view details">'+
        '<td style="font-weight:600">'+esc(i.name)+'</td><td>'+esc(i.category||'')+'</td>'+
        '<td><span class="badge '+(sc[i.status]||'')+'">'+esc(i.status)+'</span></td>'+
        '<td>'+esc(i.startDate||'')+'</td><td>'+esc(i.endDate||'')+'</td>'+
        '<td>$'+Number(i.matCost||0).toFixed(2)+'</td><td>$'+Number(i.labCost||0).toFixed(2)+'</td>'+
        '<td>$'+Number(i.revenue||0).toFixed(2)+'</td>'+
        '<td style="font-weight:700;color:'+(profit>=0?'var(--green)':'var(--red)')+'">'+
          (profit>=0?'+':'')+profit.toFixed(2)+'</td>'+
        '<td><button class="btn btn-ghost btn-sm prje" data-id="'+i.id+'">Edit</button> <button class="btn btn-danger btn-sm prjd" data-id="'+i.id+'">Del</button></td>'+
      '</tr>';
    }).join('');
    panel.querySelectorAll('#proj-tbody tr').forEach(function(tr){
      tr.addEventListener('click',function(e){if(e.target.closest('button'))return;showModal(tr.dataset.id);});
    });
    panel.querySelectorAll('.prje').forEach(function(b){
      b.addEventListener('click',function(){
        var i=items.find(function(x){return x.id===b.dataset.id;});if(!i)return;
        editId=b.dataset.id;
        g('proj-name').value=i.name||'';g('proj-cat').value=i.category||'Other';
        g('proj-status').value=i.status||'Idea';g('proj-start').value=i.startDate||'';
        g('proj-end').value=i.endDate||'';g('proj-mat-cost').value=i.matCost||'';
        g('proj-lab-cost').value=i.labCost||'';g('proj-rev').value=i.revenue||'';
        g('proj-notes').value=i.notes||'';
        activeBom = i.bom ? JSON.parse(JSON.stringify(i.bom)) : [];
        renderActiveBOM();
        calcProfit();
        g('proj-form-title').textContent='Edit Project';g('proj-cancel').style.display='inline-flex';
        panel.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
    panel.querySelectorAll('.prjd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this project?'))return;
        items=items.filter(function(x){return x.id!==b.dataset.id;});await sv();render();
      });
    });
  }

  g('proj-sync-btn').addEventListener('click', async function() {
    g('proj-tbody').innerHTML = '<tr><td colspan="10" class="empty-state"><p>Syncing Project Log with Google Sheets...</p></td></tr>';
    await load();
  });

  g('proj-save').addEventListener('click',async function(){
    var name=g('proj-name').value.trim();if(!name)return;
    var obj={id:editId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      name:name,category:g('proj-cat').value,status:g('proj-status').value,
      startDate:g('proj-start').value,endDate:g('proj-end').value,
      matCost:Number(g('proj-mat-cost').value)||0,labCost:Number(g('proj-lab-cost').value)||0,
      revenue:Number(g('proj-rev').value)||0,notes:g('proj-notes').value.trim(),
      bom: activeBom.map(b => ({
        itemId: b.itemId,
        name: b.name,
        qty: b.qty,
        unitMetric: b.unitMetric || 'ea',
        unitCost: b.unitCost || 0
      }))
    };
    if(editId){var idx=items.findIndex(function(x){return x.id===editId;});if(idx>=0)items[idx]=obj;}else items.unshift(obj);
    editId=null;g('proj-form-title').textContent='Add Experimental Project / Prototype';g('proj-cancel').style.display='none';
    ['proj-name','proj-start','proj-end','proj-mat-cost','proj-lab-cost','proj-rev','proj-notes'].forEach(function(id){g(id).value='';});
    g('proj-cat').value='Sublimation';g('proj-status').value='Idea';
    activeBom = [];
    renderActiveBOM();
    calcProfit();
    await sv();render();
  });
  g('proj-cancel').addEventListener('click',function(){
    editId=null;
    g('proj-form-title').textContent='Add Experimental Project / Prototype';
    g('proj-cancel').style.display='none';
    activeBom = [];
    renderActiveBOM();
  });
  g('proj-search').addEventListener('input',render);
  g('proj-cat-filter').addEventListener('change',render);
  g('proj-stat-filter').addEventListener('change',render);
  window.__makerInit_projects=load;
})();