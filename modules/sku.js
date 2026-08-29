(function(){
  var FILE='sku.json';
  var frame=document.getElementById('module-frame');
  var panel=document.createElement('div');
  panel.id='panel-sku';panel.className='module-panel';

  /* ── FALLBACK OSOT CATEGORY SYSTEM ── */
  var OSOT_CATS={
    'FIL':{label:'Filament',     color:'var(--accent)',    subs:{PLA:'PLA',PTG:'PETG',TPU:'TPU',ABS:'ABS',SLK:'Silk',PLX:'PLA-CF',WOD:'PLA Wood'}},
    'MAT':{label:'Materials',    color:'var(--gold)',      subs:{WOD:'Wood Board',ACR:'Acrylic',MDF:'MDF',SLT:'Slate',LTH:'Leather',CRK:'Cork'}},
    'BLK':{label:'Blanks',       color:'var(--teal)',      subs:{MUG:'Mug',TBL:'Tumbler',TEE:'T-Shirt',TOT:'Tote Bag',TIL:'Tile',CST:'Coaster',PLW:'Pillow',MSP:'Mouse Pad',PHN:'Phone Case',ORN:'Ornament'}},
    'CONS':{label:'Consumables', color:'var(--green)',     subs:{INK:'Ink',PPR:'Paper',TFN:'Teflon Sheet',TPS:'Tape',GOV:'Gloves',SLG:'Silica Gel'}},
    'PKG':{label:'Packaging',    color:'var(--text-muted)',subs:{PLY:'Poly Mailer',BOX:'Box',TSS:'Tissue Paper',STK:'Sticker',RBN:'Ribbon',BAG:'Gift Bag'}},
    'SUB':{label:'Sublimation Supplies',color:'var(--red)',subs:{PPR:'Sub Paper',INK:'Sub Ink',MWP:'Mug Wrap',SHK:'Shrink Wrap'}}
  };

  async function ensureCategories() {
    if (!window.OSOT_CATS) {
      if (window.loadCategories) {
        await window.loadCategories();
      } else {
        window.OSOT_CATS = OSOT_CATS;
      }
    }
    OSOT_CATS = window.OSOT_CATS || OSOT_CATS;
  }

  /* ── HELPER: 3-LETTER CODE FROM STRING (Brand, Type/Finish) ── */
  function get3LetterCode(str) {
    if (!str) return 'UNK';
    var clean = str.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    var words = clean.split(' ').filter(Boolean);
    if (words.length >= 3) {
      return (words[0][0] + words[1][0] + words[2][0]).slice(0, 3);
    } else if (words.length === 2) {
      return (words[0].slice(0, 2) + words[1][0]).slice(0, 3);
    } else {
      return words[0].slice(0, 3).padEnd(3, 'X');
    }
  }
  var getBrandCode = get3LetterCode;

  function getTypeCode(typeStr) {
    if (!typeStr) return 'REG';
    var clean = typeStr.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    if (!clean) return 'REG';
    var commonMap = {
      'REGULAR': 'REG', 'STANDARD': 'REG', 'SILK': 'SLK', 'HYPER': 'HYP',
      'HIGH SPEED': 'HYP', 'LUMINOUS': 'LUM', 'WOOD': 'WOD', 'MATTE': 'MAT',
      'GLOSSY': 'GLS', 'CARBON': 'CFR', 'PETG': 'PTG', 'PLA': 'PLA'
    };
    if (commonMap[clean]) return commonMap[clean];
    return get3LetterCode(typeStr);
  }

  /* ── HELPER: 4-LETTER COLOR CODE ── */
  function getColorCode(color) {
    if (!color) return 'GENR';
    var clean = color.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    if (!clean) return 'GENR';

    var commonMap = {
      'BLACK': 'BLAC', 'BLUE': 'BLUE', 'RED': 'REDD', 'WHITE': 'WHIT',
      'GREEN': 'GREN', 'PURPLE': 'PURP', 'YELLOW': 'YELW', 'ORANGE': 'ORNG',
      'SILVER': 'SLVR', 'GOLD': 'GOLD', 'CLEAR': 'CLER', 'NATURAL': 'NATR',
      'BROWN': 'BRWN', 'PINK': 'PINK', 'GRAY': 'GRAY', 'GREY': 'GREY'
    };
    if (commonMap[clean]) return commonMap[clean];

    var words = clean.split(' ').filter(Boolean);
    if (words.length === 1) {
      var w = words[0];
      if (w.length >= 4) return w.slice(0, 4);
      return w.padEnd(4, w.slice(-1) || 'X');
    } else {
      var w1 = words[0][0];
      var restStr = words.slice(1).join('');
      var consonants = restStr.replace(/[AEIOU]/g, '');
      var fill = consonants.length >= 3 ? consonants : restStr;
      return (w1 + fill).slice(0, 4).padEnd(4, 'X');
    }
  }

  /* ── BUILD CATEGORY OPTIONS ── */
  function buildCatOptions(selected){
    var html='';
    Object.keys(OSOT_CATS).forEach(function(code){
      var sel=(selected===code)?' selected':'';
      html+='<option value="'+code+'">'+code+' - '+OSOT_CATS[code].label+'</option>';
    });
    return html;
  }

  function buildSubcatOptions(catCode,selected){
    var html='';
    if(catCode&&OSOT_CATS[catCode]){
      Object.keys(OSOT_CATS[catCode].subs).forEach(function(sub){
        var sel=(selected===sub)?' selected':'';
        html+='<option value="'+sub+'">'+sub+' - '+OSOT_CATS[catCode].subs[sub]+'</option>';
      });
    }
    return html;
  }

  function buildFilterOptions() {
    var html = '<option value="">All Categories</option>';
    Object.keys(OSOT_CATS).forEach(function(code) {
      html += '<option value="' + code + '">' + code + ' - ' + OSOT_CATS[code].label + '</option>';
    });
    var el = $('sku-cat-filter');
    if (el) el.innerHTML = html;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }


  /* ── PANEL HTML ── */
  panel.innerHTML=
    '<style>' +
    '  #panel-sku, #panel-sku * { -webkit-app-region: no-drag !important; }' +
    '  #panel-sku input, #panel-sku textarea, #panel-sku button, #panel-sku select {' +
    '    pointer-events: auto !important;' +
    '    user-select: text !important;' +
    '    -webkit-user-select: text !important;' +
    '    position: relative !important;' +
    '    z-index: 99999 !important;' +
    '  }' +
    '</style>' +
    '<div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">' +
    '  <div>' +
    '    <h2>SKU Builder</h2>' +
    '    <p>Generate and manage product SKUs &mdash; CATEGORY-SUBCATEGORY-SEQUENCE</p>' +
    '  </div>' +
    '  <button class="btn btn-ghost" id="sku-sync-btn">🔄 Sync</button>' +
    '</div>' +

    '<div class="stat-row">'+
      '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="sku-total">0</div><div class="sl">Total SKUs</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--gold)" id="sku-revenue">$0.00</div><div class="sl">Revenue Potential</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--green)" id="sku-margin">0%</div><div class="sl">Avg Margin</div></div>'+
    '</div>'+

    '<div class="card" style="margin-bottom:20px">'+
      '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="sku-form-title">Build New SKU</h3>'+

      /* SKU PREVIEW */
      '<div style="background:var(--bg);border:2px solid var(--accent);border-radius:10px;padding:16px;margin-bottom:16px;text-align:center">'+
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:6px">SKU Preview</div>'+
        '<div id="sku-preview" style="font-size:28px;font-weight:900;font-family:monospace;color:var(--accent);letter-spacing:2px">FIL-PLA-REG-OVR-BLAC</div>'+
        '<div style="font-size:11px;color:var(--text-muted);margin-top:6px">Format: [CAT]-[SUBCAT]-[TYPE]-[BRAND]-[COLOR] (e.g. FIL-PLA-SLK-OVR-FGRN)</div>'+
      '</div>'+

      /* CATEGORY + SUBCATEGORY SELECTS */
      '<div class="input-row">'+
        '<div class="field" style="flex:1">'+
          '<div style="display:flex;justify-content:space-between;align-items:center"><label style="margin:0">CATEGORY GROUP</label><button type="button" class="btn btn-ghost btn-sm" data-goto="categories" style="padding:2px 6px;font-size:10px;line-height:1;margin-bottom:4px;border:none;background:none;color:var(--accent);font-weight:700;cursor:pointer">+ Manage</button></div>'+
          '<select id="sku-catgroup" style="font-family:monospace;font-weight:700">'+
            buildCatOptions('FIL')+
          '</select>'+
        '</div>'+
        '<div class="field" style="flex:1">'+
          '<label>SUB-CATEGORY CODE</label>'+
          '<select id="sku-subcat" style="font-family:monospace;font-weight:700">'+
            buildSubcatOptions('FIL','PLA')+
          '</select>'+
        '</div>'+
        '<div class="field" style="flex:1.2">'+
          '<label>Type / Finish (e.g. Silk, Hyper)</label>'+
          '<input id="sku-type-name" placeholder="e.g. Silk" style="font-weight:700">'+
        '</div>'+
        '<div class="field" style="width:90px">'+
          '<label>Type Code</label>'+
          '<input id="sku-type-code" placeholder="SLK" style="font-family:monospace;font-weight:700">'+
        '</div>'+
        '<div class="field" style="flex:1.2">'+
          '<label>Colour / Variant</label>'+
          '<input id="sku-var-name" placeholder="e.g. Forest Green" style="font-weight:700">'+
        '</div>'+
        '<div class="field" style="width:90px">'+
          '<label>Color Code</label>'+
          '<input id="sku-var-code" placeholder="FGRN" style="font-family:monospace;font-weight:700">'+
        '</div>'+
        '<div class="field" style="flex:1.5">'+
          '<label>Custom Override SKU</label>'+
          '<input id="sku-custom" placeholder="Leave blank to auto-build" style="font-family:monospace">'+
        '</div>'+
      '</div>'+

      /* PRODUCT DETAILS */
      '<div class="input-row">'+
        '<div class="field" style="flex:2"><label>Product Name</label><input id="sku-pname" placeholder="e.g. Hyper PLA Blue 1kg"></div>'+
        '<div class="field" style="flex:1">'+
          '<div style="display:flex;justify-content:space-between;align-items:center"><label style="margin:0">Brand / Manufacturer</label><button type="button" class="btn btn-ghost btn-sm" data-goto="brands" style="padding:2px 6px;font-size:10px;line-height:1;margin-bottom:4px;border:none;background:none;color:var(--accent);font-weight:700;cursor:pointer">+ Manage</button></div>'+
          '<select id="sku-brand-select" style="font-weight:600;"><option value="">Select Brand...</option></select>'+
        '</div>'+
        '<div class="field" style="flex:1">'+
          '<div style="display:flex;justify-content:space-between;align-items:center"><label style="margin:0">Supplier</label><button type="button" class="btn btn-ghost btn-sm" data-goto="suppliers" style="padding:2px 6px;font-size:10px;line-height:1;margin-bottom:4px;border:none;background:none;color:var(--accent);font-weight:700;cursor:pointer">+ Add New</button></div>'+
          '<select id="sku-supplier-select" style="font-weight:600;"><option value="">Select Supplier...</option></select>'+
        '</div>'+
        '<div class="field" style="flex:1"><label>Classification</label><select id="sku-classification"><option>Raw Component / Material (BOM Input)</option><option>Finished Sellable Product (Etsy/Custom)</option></select></div>'+
        '<div class="field" style="flex:1"><label>Status</label><select id="sku-status"><option>Active</option><option>Draft</option><option>Discontinued</option></select></div>'+
      '</div>'+

      /* PRICING */
      '<div class="input-row">'+
        '<div class="field"><label style="display:flex;justify-content:space-between;align-items:center"><span>Average Unit Cost (CAD $)</span><span style="font-size:10px;color:var(--accent);font-weight:700" title="Auto-updated from inventory purchase transactions">🔒 Ledger Average</span></label><input id="sku-cost" type="number" step="0.01" placeholder="0.00"></div>'+
        '<div class="field"><label>Price (CAD $)</label><input id="sku-price" type="number" step="0.01" placeholder="0.00"></div>'+
        '<div class="field"><label>Margin %</label>'+
          '<div id="sku-margin-live" style="padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;font-weight:700;font-size:14px;color:var(--text-muted)">--%</div>'+
        '</div>'+
        '<div class="field"><label>COGS (CAD $)</label><input id="sku-cogs" type="number" step="0.01" placeholder="e.g. 6.78"></div>'+
        '<div class="field"><label>Retail Price ($)</label><input id="sku-retail" type="number" step="0.01" placeholder="e.g. 18.00"></div>'+
      '</div>'+

      '<div class="input-row">'+
        '<div class="field" style="flex:2"><label>Description / Notes</label><input id="sku-notes" placeholder="e.g. 11oz sublimation mug, white poly-coated"></div>'+
        '<div class="field" style="flex:2"><label>Photo URL / Image Link (Google Drive Share Link)</label><input id="sku-photo" placeholder="e.g. https://drive.google.com/file/d/.../view?usp=sharing"></div>'+
      '</div>'+

      '<div style="display:flex;gap:8px;margin-top:10px">'+
        '<button class="btn btn-primary" id="sku-save">Save SKU</button>'+
        '<button class="btn btn-ghost" id="sku-cancel" style="display:none">Cancel</button>'+
      '</div>'+
    '</div>'+

    /* TOOLBAR */
    '<div class="toolbar">'+
      '<div class="search-box"><input id="sku-search" placeholder="Search SKUs..."></div>'+
      '<select id="sku-cat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
        '<option value="">All Categories</option>'+
      '</select>'+
      '<select id="sku-class-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
        '<option value="">All Classifications</option>'+
        '<option>Raw Component / Material (BOM Input)</option>'+
        '<option>Finished Sellable Product (Etsy/Custom)</option>'+
      '</select>'+
      '<select id="sku-stat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
        '<option value="">All Statuses</option>'+
        '<option>Active</option><option>Draft</option><option>Discontinued</option>'+
      '</select>'+
    '</div>'+
    '<div class="table-wrap"><table id="sku-table"><thead><tr>'+
      '<th data-sortable="false">Photo</th><th data-sort-key="sku">SKU</th><th data-sort-key="name">Product Name</th><th data-sort-key="classification">Classification</th><th data-sort-key="cat">CAT</th><th data-sort-key="brand">Brand</th><th data-sort-key="supplier">Supplier</th><th data-sort-key="cost">Cost</th><th data-sort-key="price">Price</th><th data-sort-key="cogs">COGS</th><th data-sort-key="retail">Retail</th><th data-sort-key="margin">Margin</th><th data-sort-key="status">Status</th><th style="width:70px">Actions</th>'+
    '</tr></thead><tbody id="sku-tbody"></tbody></table></div>' +
    '';

  frame.appendChild(panel);

  var items=[],editId=null;
  var customBrands = []; // Additional brands entered by user locally
  var skuSortCol = 'sku';
  var skuSortDir = 'asc';
  var skuSortController = null;
  function $(id){return document.getElementById(id);}

  /* ── PREVIEW BUILDER ── */
  function buildPreview(){
    var custom=$('sku-custom').value.trim();
    if(custom){$('sku-preview').textContent=custom.toUpperCase();return;}
    var cat=$('sku-catgroup').value||'FIL';
    var sub=$('sku-subcat').value||'PLA';
    var typeCode=($('sku-type-code').value || '').trim().toUpperCase() || 'REG';
    var brandSelect=$('sku-brand-select');
    var brandName=brandSelect ? brandSelect.value : '';
    var brandObj = (window.__brandsCache || []).find(b => b.name === brandName);
    var brandCode = brandObj && brandObj.code ? brandObj.code : getBrandCode(brandName);
    var colorCode=($('sku-var-code').value || '').trim().toUpperCase() || 'GENR';

    $('sku-preview').textContent=cat+'-'+sub+'-'+typeCode+'-'+brandCode+'-'+colorCode;
  }

  function onTypeNameInput() {
    var typeName = $('sku-type-name').value;
    $('sku-type-code').value = getTypeCode(typeName);
    buildPreview();
  }

  function onVarNameInput() {
    var varName = $('sku-var-name').value;
    $('sku-var-code').value = getColorCode(varName);
    buildPreview();
  }

  /* ── CATEGORY CHANGE ── */
  function onCatGroupChange(){
    var code=$('sku-catgroup').value;
    $('sku-subcat').innerHTML=buildSubcatOptions(code,'');
    buildPreview();
  }

  /* ── MARGIN CALCULATOR ── */
  function calcMargin(){
    var cost=parseFloat($('sku-cost').value)||0;
    var price=parseFloat($('sku-price').value)||0;
    var el=$('sku-margin-live');
    if(!price){el.textContent='--%';el.style.color='var(--text-muted)';return;}
    var m=((price-cost)/price*100);
    el.textContent=m.toFixed(1)+'%';
    el.style.color=m>=40?'var(--green)':m>=20?'var(--gold)':'var(--red)';
  }

  /* ── EVENT LISTENERS ON FORM FIELDS ── */
  ['sku-catgroup','sku-subcat','sku-type-code','sku-var-code','sku-custom','sku-brand-select'].forEach(function(id){
    var el=$(id);
    if(el){
      el.addEventListener('input',buildPreview);
      el.addEventListener('change',id==='sku-catgroup'?onCatGroupChange:buildPreview);
    }
  });
  if ($('sku-type-name')) {
    $('sku-type-name').addEventListener('input', onTypeNameInput);
  }
  if ($('sku-var-name')) {
    $('sku-var-name').addEventListener('input', onVarNameInput);
  }
  ['sku-cost','sku-price'].forEach(function(id){$(id).addEventListener('input',calcMargin);});


  /* ── LOAD SUPPLIERS ── */
  async function loadSuppliers(){
    var sups = [];
    try {
      if (window.__suppliersCache) {
        sups = window.__suppliersCache;
      } else {
        sups = await window.makerAPI.readData('suppliers.json') || [];
      }
    } catch(e){}
    var activeSups = sups.filter(s => s.status === 'Active');
    var html = '<option value="">Select Supplier...</option>';
    activeSups.forEach(s => {
      html += '<option value="' + escapeHtml(s.name) + '">' + escapeHtml(s.name) + '</option>';
    });
    var supplierSelect = $('sku-supplier-select');
    if (supplierSelect) {
      supplierSelect.innerHTML = html;
    }
  }

  /* ── RUN SKU MIGRATION FROM INVENTORY ── */
  async function runSkuMigration() {
    var inv = [];
    try { inv = await window.makerAPI.readData('inventory.json') || []; } catch(e){}
    var migratedCount = 0;
    inv.forEach(function(item) {
      if (item.sku && item.sku.trim() !== '') {
        var existing = items.find(function(x) {
          return x.sku && x.sku.toLowerCase() === item.sku.trim().toLowerCase();
        });
        if (!existing) {
          // Migrate SKU
          var newSku = {
            id: item.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            sku: item.sku.trim(),
            name: item.name || 'Unnamed Item',
            cat: item.cat || 'FIL',
            subcat: item.subcat || '',
            brand: item.brand || '',
            supplier: item.supplier || '',
            variation: item.colour || '',
            varCode: '',
            cost: Number(item.cost) || 0,
            price: 0,
            cogs: 0,
            retail: 0,
            status: 'Active',
            notes: 'Migrated from Inventory',
            classification: 'Raw Component / Material (BOM Input)'
          };
          items.push(newSku);
          migratedCount++;

          // Push row to dynamic database
          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            var rowArray = [
              newSku.id, newSku.sku, newSku.name, newSku.cat, newSku.subcat,
              newSku.brand, newSku.cost, newSku.price, newSku.cogs, newSku.retail,
              newSku.status, newSku.notes, newSku.classification, '',
              newSku.supplier, newSku.variation, newSku.varCode
            ];
            window.MAKER_CONFIG.saveToDatabase('Sku', rowArray);
          }
        }
      }
    });
    if (migratedCount > 0) {
      await sv();
    }
  }

  /* ── LOAD ── */
  async function load(){
    await ensureCategories();

    // Re-build select options based on dynamic categories
    var firstCat = Object.keys(OSOT_CATS)[0] || 'FIL';
    var firstSub = Object.keys((OSOT_CATS[firstCat] || {subs:{}}).subs)[0] || '';
    $('sku-catgroup').innerHTML = buildCatOptions(firstCat);
    $('sku-subcat').innerHTML = buildSubcatOptions(firstCat, firstSub);
    buildFilterOptions();

    var localData = [];
    try { localData = await window.makerAPI.readData(FILE) || []; } catch(e){}

    try {
      let fetchFunc = (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase);
      if (fetchFunc) {
        const remoteData = await fetchFunc('Sku');
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          const header = remoteData[0].map(h => String(h || '').trim().toLowerCase());
          let idIdx = header.findIndex(h => h === 'id' || h === 'sku_id' || h === 'item_id');
          if (idIdx === -1) idIdx = header.findIndex(h => h === 'sku');
          if (idIdx === -1) idIdx = 0;
          const skuIdx = header.findIndex(h => h === 'sku' || h.includes('sku'));
          const nameIdx = header.findIndex(h => h === 'name' || h === 'product name' || h.includes('name'));
          const catIdx = header.findIndex(h => h === 'cat' || h === 'category' || h.includes('cat'));
          const subcatIdx = header.findIndex(h => h === 'subcat' || h === 'subcategory' || h.includes('subcat'));
          const brandIdx = header.findIndex(h => h === 'brand' || h === 'brand/supplier' || h.includes('brand') || h.includes('supplier'));
          const costIdx = header.findIndex(h => h === 'cost' || h.includes('cost'));
          const priceIdx = header.findIndex(h => h === 'price' || h.includes('price'));
          const cogsIdx = header.findIndex(h => h === 'cogs' || h.includes('cogs'));
          const retailIdx = header.findIndex(h => h === 'retail' || h === 'retail price' || h.includes('retail'));
          const statusIdx = header.findIndex(h => h === 'status' || h.includes('status'));
          const notesIdx = header.findIndex(h => h === 'notes' || h.includes('notes') || h.includes('desc'));
          const classIdx = header.findIndex(h => h === 'classification' || h.includes('class'));
          const photoIdx = header.findIndex(h => h === 'photo' || h === 'image' || h.includes('photo') || h.includes('image'));

          const supplierIdx = header.findIndex(h => h === 'supplier' || h.includes('supplier'));
          const varIdx = header.findIndex(h => h === 'variation' || h === 'colour' || h.includes('var'));
          const varCodeIdx = header.findIndex(h => h === 'varcode' || h === 'colorcode' || h.includes('varcode'));
          const typeNameIdx = header.findIndex(h => h === 'typename' || h === 'type_name');
          const typeCodeIdx = header.findIndex(h => h === 'typecode' || h === 'type_code');

          const parsedSkus = [];
          for (let i = 1; i < remoteData.length; i++) {
            const r = remoteData[i];
            if (!r || r.length === 0) continue;
            let idVal = (idIdx !== -1 ? r[idIdx] : '') || '';
            const skuVal = (skuIdx !== -1 ? r[skuIdx] : '') || '';
            const nameVal = (nameIdx !== -1 ? r[nameIdx] : '') || '';
            if (!idVal && !skuVal && !nameVal) continue;

            let newlyAssigned = false;
            if (!idVal) {
              idVal = 'sku_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
              newlyAssigned = true;
            }

            const itemObj = {
              id: idVal,
              sku: skuVal,
              name: nameVal,
              cat: (catIdx !== -1 ? r[catIdx] : '') || firstCat,
              subcat: (subcatIdx !== -1 ? r[subcatIdx] : '') || '',
              brand: (brandIdx !== -1 ? r[brandIdx] : '') || '',
              supplier: (supplierIdx !== -1 ? r[supplierIdx] : '') || '',
              variation: (varIdx !== -1 ? r[varIdx] : '') || '',
              varCode: (varCodeIdx !== -1 ? r[varCodeIdx] : '') || '',
              typeName: (typeNameIdx !== -1 ? r[typeNameIdx] : '') || '',
              typeCode: (typeCodeIdx !== -1 ? r[typeCodeIdx] : '') || '',
              cost: costIdx !== -1 ? (Number(r[costIdx]) || 0) : 0,
              price: priceIdx !== -1 ? (Number(r[priceIdx]) || 0) : 0,
              cogs: cogsIdx !== -1 ? (Number(r[cogsIdx]) || 0) : 0,
              retail: retailIdx !== -1 ? (Number(r[retailIdx]) || 0) : 0,
              status: (statusIdx !== -1 ? r[statusIdx] : '') || 'Active',
              notes: (notesIdx !== -1 ? r[notesIdx] : '') || '',
              classification: (classIdx !== -1 ? r[classIdx] : '') || 'Raw Component / Material (BOM Input)',
              photo: (photoIdx !== -1 ? r[photoIdx] : '') || ''
            };
            parsedSkus.push(itemObj);

            if (newlyAssigned && window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
              window.MAKER_CONFIG.saveToDatabase('Sku', [
                itemObj.id, itemObj.sku, itemObj.name, itemObj.cat, itemObj.subcat, itemObj.brand,
                itemObj.cost, itemObj.price, itemObj.cogs, itemObj.retail, itemObj.status, itemObj.notes,
                itemObj.classification, itemObj.photo, itemObj.supplier, itemObj.variation, itemObj.varCode,
                itemObj.typeName, itemObj.typeCode
              ]);
            }
          }

          const validParsed = parsedSkus.filter(x => x.sku && x.status !== 'DELETED');
          const combinedMap = new Map();
          for (const item of validParsed) {
            combinedMap.set(item.id || item.sku, item);
          }
          if (localData && Array.isArray(localData)) {
            for (const localItem of localData) {
              const key = localItem.id || localItem.sku;
              if (key && !combinedMap.has(key) && localItem.status !== 'DELETED') {
                combinedMap.set(key, localItem);
                if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
                  window.MAKER_CONFIG.saveToDatabase('Sku', [
                    localItem.id, localItem.sku, localItem.name, localItem.cat, localItem.subcat, localItem.brand,
                    localItem.cost, localItem.price, localItem.cogs, localItem.retail, localItem.status, localItem.notes,
                    localItem.classification, localItem.photo, localItem.supplier, localItem.variation, localItem.varCode,
                    localItem.typeName || '', localItem.typeCode || ''
                  ]);
                }
              }
            }
          }

          items = Array.from(combinedMap.values());
          await sv();
        } else {
          items = localData;
        }
      } else {
        items = localData;
      }
    } catch(err) {
      items=await window.makerAPI.readData(FILE)||[];
    }

    if (window.populateBrandsDropdown) {
      window.populateBrandsDropdown('sku-brand-select');
    }
    await loadSuppliers();
    await runSkuMigration();
    buildPreview();

    if (window.makeTableSortable) {
      skuSortController = window.makeTableSortable('sku-table', {
        defaultCol: 'sku',
        defaultDir: 'asc',
        onSort: function(colKey, dir) {
          skuSortCol = colKey;
          skuSortDir = dir;
          render();
        }
      });
    }

    render();
  }

  async function sv(){await window.makerAPI.writeData(FILE,items);}

  /* ── RENDER TABLE ── */
  function render(){
    var q=$('sku-search').value.toLowerCase();
    var cf=$('sku-cat-filter').value;
    var clf=$('sku-class-filter').value;
    var sf=$('sku-stat-filter').value;
    var fi=items.filter(function(i){
      var catOk=!cf||(i.cat||'')===cf;
      var classOk=!clf||(i.classification||'Raw Component / Material (BOM Input)')===clf;
      var statOk=!sf||i.status===sf;
      var qOk=!q||JSON.stringify(i).toLowerCase().indexOf(q)!==-1;
      return catOk&&classOk&&statOk&&qOk;
    });

    /* Stats */
    $('sku-total').textContent=items.length;
    var activeItems=items.filter(function(i){return i.status==='Active'&&i.price;});
    $('sku-revenue').textContent='$'+activeItems.reduce(function(s,i){return s+Number(i.price||0);},0).toFixed(2);
    var margins=items.filter(function(i){return i.price&&i.cost;}).map(function(i){return(Number(i.price)-Number(i.cost))/Number(i.price)*100;});
    $('sku-margin').textContent=margins.length?(margins.reduce(function(a,b){return a+b;},0)/margins.length).toFixed(1)+'%':'0%';

    /* Status badge colours */
    var sc={Active:'badge-green',Draft:'badge-muted',Discontinued:'badge-red'};

    var sortedFi = [...fi];
    sortedFi.sort(function(a, b) {
      var marginA = (a.price && a.cost) ? ((Number(a.price) - Number(a.cost)) / Number(a.price) * 100) : 0;
      var marginB = (b.price && b.cost) ? ((Number(b.price) - Number(b.cost)) / Number(b.price) * 100) : 0;

      var valA, valB;
      if (skuSortCol === 'name') { valA = (a.name || '').toLowerCase(); valB = (b.name || '').toLowerCase(); }
      else if (skuSortCol === 'classification') { valA = (a.classification || '').toLowerCase(); valB = (b.classification || '').toLowerCase(); }
      else if (skuSortCol === 'cat') { valA = (a.cat || '').toLowerCase(); valB = (b.cat || '').toLowerCase(); }
      else if (skuSortCol === 'brand') { valA = (a.brand || '').toLowerCase(); valB = (b.brand || '').toLowerCase(); }
      else if (skuSortCol === 'supplier') { valA = (a.supplier || '').toLowerCase(); valB = (b.supplier || '').toLowerCase(); }
      else if (skuSortCol === 'cost') { valA = Number(a.cost || 0); valB = Number(b.cost || 0); }
      else if (skuSortCol === 'price') { valA = Number(a.price || 0); valB = Number(b.price || 0); }
      else if (skuSortCol === 'cogs') { valA = Number(a.cogs || 0); valB = Number(b.cogs || 0); }
      else if (skuSortCol === 'retail') { valA = Number(a.retail || 0); valB = Number(b.retail || 0); }
      else if (skuSortCol === 'margin') { valA = marginA; valB = marginB; }
      else if (skuSortCol === 'status') { valA = (a.status || '').toLowerCase(); valB = (b.status || '').toLowerCase(); }
      else { valA = (a.sku || '').toLowerCase(); valB = (b.sku || '').toLowerCase(); }

      if (valA < valB) return skuSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return skuSortDir === 'asc' ? 1 : -1;
      return 0;
    });

    $('sku-tbody').innerHTML=sortedFi.length?sortedFi.map(function(i){
      var catInfo=OSOT_CATS[i.cat]||{label:i.cat||'—',color:'var(--text-muted)'};
      var catBadge='<span style="background:'+catInfo.color+';color:#fff;border-radius:5px;padding:2px 7px;font-size:11px;font-weight:800;font-family:monospace">'+
        (i.cat||'?')+'</span>';
      var margin=(i.price&&i.cost)?((Number(i.price)-Number(i.cost))/Number(i.price)*100).toFixed(1)+'%':'--';

      var isRaw = (i.classification || '').includes('Raw');
      var classBadge = isRaw ? '<span class="badge badge-accent">🛠️ Raw</span>' : '<span class="badge badge-teal">🛍️ Etsy</span>';

      var photoCell = '';
      if (i.photo) {
        var directPhotoUrl = window.getDirectPhotoUrl ? window.getDirectPhotoUrl(i.photo) : i.photo;
        photoCell = '<img src="' + escapeHtml(directPhotoUrl) + '" class="sku-thumbnail" style="width:36px; height:36px; border-radius:6px; object-fit:cover; cursor:pointer;" onclick="window.openPhotoLightbox(decodeURIComponent(\'' + encodeURIComponent(i.photo) + '\'))" onerror="this.onerror=null; this.outerHTML=\'<span style=&quot;font-size:18px; color:var(--muted);&quot; title=&quot;Image restricted or unavailable&quot;>📷</span>\';">';
      } else {
        photoCell = '<span style="font-size:18px; color:var(--muted);">📷</span>';
      }

      return '<tr>'+
        '<td>' + photoCell + '</td>' +
        '<td style="font-family:monospace;font-weight:700;color:var(--accent)">'+i.sku+'</td>'+
        '<td style="font-weight:600">'+escapeHtml(i.name)+'</td>'+
        '<td>'+classBadge+'</td>'+
        '<td>'+catBadge+'<br><span style="font-size:11px;color:var(--text-muted)">'+(i.subcat?escapeHtml(i.subcat):'')+'</span></td>'+
        '<td>'+escapeHtml(i.brand||'—')+'</td>'+
        '<td>'+escapeHtml(i.supplier||'—')+'</td>'+
        '<td>$'+Number(i.cost||0).toFixed(2)+'</td>'+
        '<td>$'+Number(i.price||0).toFixed(2)+'</td>'+
        '<td>$'+Number(i.cogs||0).toFixed(2)+'</td>'+
        '<td>$'+Number(i.retail||0).toFixed(2)+'</td>'+
        '<td style="font-weight:700;color:'+(parseFloat(margin)>=40?'var(--green)':parseFloat(margin)>=20?'var(--gold)':'var(--red)')+'">'+margin+'</td>'+
        '<td><span class="badge '+(sc[i.status]||'')+'">'+i.status+'</span></td>'+
        '<td>'+
          '<button class="btn btn-ghost btn-sm skue" data-id="'+i.id+'">Edit</button> '+
          '<button class="btn btn-danger btn-sm skud" data-id="'+i.id+'">Del</button>'+
        '</td>'+
      '</tr>';
    }).join(''):'<tr><td colspan="14" class="empty-state"><p>No SKUs yet. Build your first one above!</p></td></tr>';

    /* Edit buttons */
    panel.querySelectorAll('.skue').forEach(function(b){
      b.addEventListener('click',function(){
        var i=items.find(function(x){return x.id===b.dataset.id;});if(!i)return;
        editId=b.dataset.id;
        $('sku-custom').value=i.sku||'';
        $('sku-catgroup').value=i.cat || Object.keys(OSOT_CATS)[0];
        $('sku-subcat').innerHTML=buildSubcatOptions(i.cat || Object.keys(OSOT_CATS)[0], i.subcat || '');
        $('sku-type-name').value=i.typeName || '';
        $('sku-type-code').value=i.typeCode || '';
        $('sku-var-name').value=i.variation || '';
        $('sku-var-code').value=i.varCode || '';
        $('sku-pname').value=i.name||'';
        if (window.populateBrandsDropdown) window.populateBrandsDropdown('sku-brand-select', i.brand || '');
        $('sku-brand-select').value=i.brand||'';
        $('sku-supplier-select').value=i.supplier||'';
        $('sku-classification').value=i.classification || 'Raw Component / Material (BOM Input)';
        $('sku-cost').value=i.cost||'';
        $('sku-price').value=i.price||'';
        $('sku-cogs').value=i.cogs||'';
        $('sku-retail').value=i.retail||'';
        $('sku-status').value=i.status||'Active';
        $('sku-notes').value=i.notes||'';
        $('sku-photo').value=i.photo||'';
        buildPreview();calcMargin();
        $('sku-form-title').textContent='Edit SKU';
        $('sku-cancel').style.display='inline-flex';
        panel.querySelector('.page-header').scrollIntoView({behavior:'smooth'});
      });
    });
    /* Delete buttons */
    panel.querySelectorAll('.skud').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this SKU?'))return;
        var idToDelete = b.dataset.id;
        items=items.filter(function(x){return x.id!==idToDelete;});
        await sv();
        if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
          await window.MAKER_CONFIG.saveToDatabase('Sku', [idToDelete, '', '', '', '', '', 0, 0, 0, 0, 'DELETED']);
        }
        render();
      });
    });
  }

  /* ── SAVE ── */
  $('sku-save').addEventListener('click',async function(){
    var name=$('sku-pname').value.trim();
    if(!name){alert('Product name is required.');return;}
    var skuVal=$('sku-custom').value.trim()||$('sku-preview').textContent;
    var catCode=$('sku-catgroup').value;
    var subCode=$('sku-subcat').value;
    var obj={
      id:editId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      sku:skuVal,
      name:name,
      cat:catCode,
      subcat:subCode,
      typeName:($('sku-type-name').value||'').trim(),
      typeCode:($('sku-type-code').value||'').trim().toUpperCase(),
      brand:$('sku-brand-select').value,
      supplier:$('sku-supplier-select').value,
      variation:$('sku-var-name').value.trim(),
      varCode:$('sku-var-code').value.trim().toUpperCase(),
      classification:$('sku-classification').value,
      cost:Number($('sku-cost').value)||0,
      price:Number($('sku-price').value)||0,
      cogs:Number($('sku-cogs').value)||0,
      retail:Number($('sku-retail').value)||0,
      status:$('sku-status').value,
      notes:$('sku-notes').value.trim(),
      photo:$('sku-photo').value.trim()
    };
    if(editId){
      var idx=items.findIndex(function(x){return x.id===editId;});
      if(idx>=0)items[idx]=obj;
    } else {
      items.unshift(obj);
    }
    clearForm();
    await sv();render();
    if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
      await window.MAKER_CONFIG.saveToDatabase('Sku', [
        obj.id, obj.sku, obj.name, obj.cat, obj.subcat,
        obj.brand, obj.cost, obj.price, obj.cogs, obj.retail,
        obj.status, obj.notes, obj.classification, obj.photo,
        obj.supplier, obj.variation, obj.varCode, obj.typeName, obj.typeCode
      ]);
    }
  });

  function clearForm(){
    editId=null;
    $('sku-form-title').textContent='Build New SKU';
    $('sku-cancel').style.display='none';
    $('sku-custom').value='';
    $('sku-pname').value='';
    if (window.populateBrandsDropdown) window.populateBrandsDropdown('sku-brand-select', '');
    $('sku-brand-select').value='';
    $('sku-supplier-select').value='';
    $('sku-type-name').value='';
    $('sku-type-code').value='';
    $('sku-var-name').value='';
    $('sku-var-code').value='';
    $('sku-classification').value='Raw Component / Material (BOM Input)';
    $('sku-cost').value='';
    $('sku-price').value='';
    $('sku-cogs').value='';
    $('sku-retail').value='';
    $('sku-notes').value='';
    $('sku-photo').value='';
    $('sku-status').value='Active';
    var defaultCat = Object.keys(OSOT_CATS)[0] || 'FIL';
    var defaultSub = Object.keys((OSOT_CATS[defaultCat] || {subs:{}}).subs)[0] || '';
    $('sku-catgroup').value = defaultCat;
    $('sku-subcat').innerHTML=buildSubcatOptions(defaultCat, defaultSub);
    buildPreview();
    calcMargin();
  }

  $('sku-cancel').addEventListener('click',clearForm);
  $('sku-search').addEventListener('input',render);
  $('sku-cat-filter').addEventListener('change',render);
  $('sku-class-filter').addEventListener('change',render);
  $('sku-stat-filter').addEventListener('change',render);
  $('sku-sync-btn').addEventListener('click', async function() {
    $('sku-tbody').innerHTML = '<tr><td colspan="14" class="empty-state"><p>Syncing SKUs with Google Sheets...</p></td></tr>';
    await load();
  });

  window.__makerInit_sku=load;
})();
