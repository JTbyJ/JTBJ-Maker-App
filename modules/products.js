/**
 * Just Jane Maker Lab - Product Catalog & BOM Module
 * Path: modules/products.js
 */

// Global products memory cache
window.__productsCache = null;

(function(){
  var FILE='products.json';
  var products=[];
  var invList=[];
  var editId=null;
  var bomList=[]; // Temporary array of BOM items during product creation/edit

  function g(id){return document.getElementById(id);}

  window.__makerInit_products=async function(){
    var frame=g('module-frame');
    var p=g('panel-products');
    if(!p){
      p=document.createElement('div');p.id='panel-products';p.className='module-panel';
      p.innerHTML=`
        <style>
          #panel-products,
          #panel-products * {
            -webkit-app-region: no-drag !important;
          }

          #panel-products input,
          #panel-products textarea,
          #panel-products button,
          #panel-products select,
          #ai-seo-modal,
          #ai-seo-modal * {
            pointer-events: auto !important;
            user-select: text !important;
            -webkit-user-select: text !important;
            position: relative !important;
            z-index: 99999 !important;
          }
        </style>
        <div class="page-header">
          <h2>Product Catalog &amp; BOM Builder</h2>
          <p>Define finished products, establish Bills of Materials (BOM) linked to inventory, and calculate exact COGS and profit margins.</p>
        </div>

        <div style="display:flex;gap:10px;margin-bottom:14px">
          <button class="btn btn-primary" id="prod-tab-list-btn">Product Directory</button>
          <button class="btn btn-ghost" id="prod-tab-form-btn">Add New Product</button>
        </div>

        <!-- LIST TAB -->
        <div id="prod-tab-list">
          <div class="card">
            <div class="toolbar">
              <div class="search-box"><input type="text" id="prod-search" placeholder="Search products..."></div>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Product Details</th><th>SKU</th><th>Labor + Mat.</th><th>COGS</th><th>Price</th><th>Profit</th><th style="width:70px">Actions</th></tr>
                </thead>
                <tbody id="prod-tbody"></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- FORM TAB -->
        <div id="prod-tab-form" style="display:none">
          <form id="prod-form" style="display:flex;gap:24px;flex-wrap:wrap">
            <div class="card" style="flex:1;min-width:320px">
              <h3 style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
                <span>Product Specification</span>
                <button type="button" class="btn btn-teal btn-sm" id="btn-generate-ai-seo">🤖 AI Etsy SEO</button>
              </h3>
              
              <div class="field" style="margin-bottom:10px">
                <label>Product Name</label><input type="text" id="p-name" required>
              </div>
              <div class="field" style="margin-bottom:10px">
                <label>SKU</label><input type="text" id="p-sku" required placeholder="e.g. FIN-TUM-GLIT">
              </div>
              <div class="field" style="margin-bottom:10px">
                <label>Photo URL / Image Link</label><input type="text" id="p-photo" placeholder="e.g. https://imgur.com/example.png">
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1">
                  <div style="display:flex;justify-content:space-between;align-items:center"><label style="margin:0">Category</label><button type="button" class="btn btn-ghost btn-sm" data-goto="categories" style="padding:2px 6px;font-size:10px;line-height:1;margin-bottom:4px;border:none;background:none;color:var(--accent);font-weight:700;cursor:pointer">+ Manage</button></div>
                  <select id="p-cat">
                    <!-- Dynamic Category Options -->
                  </select>
                </div>
                <div class="field" style="flex:1">
                  <label>Status</label>
                  <select id="p-status"><option value="Active">Active</option><option value="Discontinued">Discontinued</option></select>
                </div>
              </div>

              <div class="field" style="margin-bottom:10px">
                <label>Sales Platforms (JSON List)</label>
                <input type="text" id="p-platforms" placeholder='e.g. ["Etsy", "Shopify", "In-Person"]' value='["Etsy"]'>
              </div>

              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1"><label>Sale Price ($)</label><input type="number" id="p-price" step="any" required></div>
                <div class="field" style="flex:1"><label>Etsy Fee ($)</label><input type="number" id="p-fee" step="any" value="0"></div>
              </div>

              <div class="field" style="margin-bottom:10px">
                <label>Description</label><textarea id="p-desc" style="min-height:50px"></textarea>
              </div>
              <div class="field" style="margin-bottom:14px">
                <label>Manufacturing Notes</label><textarea id="p-notes" style="min-height:50px"></textarea>
              </div>

              <h3 style="margin-top:20px;margin-bottom:10px">Labor Calculation</h3>
              <div style="display:flex;gap:10px">
                <div class="field" style="flex:1"><label>Labor Hours</label><input type="number" id="p-lab-hrs" step="any" value="0.5"></div>
                <div class="field" style="flex:1"><label>Hourly Rate ($/hr)</label><input type="number" id="p-lab-rate" step="any" value="20"></div>
              </div>
            </div>

            <!-- Bill of Materials Card -->
            <div class="card" style="width:400px;display:flex;flex-direction:column">
              <h3 style="margin-bottom:14px">Bill of Materials (BOM)</h3>
              
              <div style="display:flex;gap:8px;margin-bottom:12px;align-items:flex-end">
                <div class="field" style="flex:1">
                  <div style="display:flex;justify-content:space-between;align-items:center"><label style="margin:0">Inventory Item</label><button type="button" class="btn btn-ghost btn-sm" data-goto="inventory" style="padding:2px 6px;font-size:10px;line-height:1;margin-bottom:4px;border:none;background:none;color:var(--accent);font-weight:700;cursor:pointer">+ New</button></div>
                  <select id="p-bom-item"><option value="">Select Raw Item...</option></select>
                </div>
                <div class="field" style="width:110px">
                  <label id="p-bom-qty-label">Qty Required</label><input type="number" id="p-bom-qty" step="any" value="1">
                </div>
                <button type="button" class="btn btn-secondary" id="p-bom-add-btn">Add</button>
              </div>

              <div class="table-wrap" style="flex:1;min-height:160px;margin-bottom:14px">
                <table>
                  <thead><tr><th>Item</th><th>Qty</th><th>Cost</th><th>Total</th><th style="width:40px"></th></tr></thead>
                  <tbody id="p-bom-tbody"></tbody>
                </table>
              </div>

              <div style="background:rgba(255,255,255,.02);padding:14px;border-radius:8px;border:1px solid var(--border);margin-bottom:18px">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Material Cost:</span><span id="calc-mat-cost" style="font-weight:600">$0.00</span></div>
                <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Labor Cost:</span><span id="calc-lab-cost" style="font-weight:600">$0.00</span></div>
                <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:6px;margin-top:6px;font-weight:700"><span>Estimated COGS:</span><span id="calc-cogs">$0.00</span></div>
              </div>

              <div style="display:flex;gap:10px">
                <button type="submit" class="btn btn-primary" style="flex:1">Save Product Spec</button>
                <button type="button" class="btn btn-ghost" id="prod-cancel-btn">Cancel</button>
              </div>
            </div>
          </form>
        </div>

        <!-- AI SEO GENERATOR MODAL -->
        <div id="ai-seo-modal" style="display:none; position:fixed; z-index:11000; left:0; top:0; width:100%; height:100%; overflow:auto; background-color:rgba(0,0,0,0.8); align-items:center; justify-content:center;">
          <div class="card" style="background:var(--surface); width:600px; max-height:90%; overflow-y:auto; border:1px solid var(--border); border-radius:var(--radius); padding:28px; position:relative; box-shadow:0 10px 40px rgba(0,0,0,0.6); display:flex; flex-direction:column; gap:16px;">
            <h3 style="margin-bottom:4px; font-size:18px; font-weight:700; color:var(--teal);">🤖 AI Etsy Listing &amp; SEO Generator</h3>

            <div class="field">
              <label style="color:var(--teal);">Optimized Etsy Title (Max 140 chars)</label>
              <textarea id="ai-seo-title" style="width:100%; height:70px; background:rgba(0,0,0,0.25); border-color:var(--border); color:#fff; font-family:inherit; padding:8px;" readonly></textarea>
              <button class="btn btn-ghost btn-sm" id="btn-copy-title" style="margin-top:6px; align-self:flex-start;">📋 Copy Title</button>
            </div>

            <div class="field">
              <label style="color:var(--teal);">13 High-Traffic Etsy Search Tags</label>
              <textarea id="ai-seo-tags" style="width:100%; height:60px; background:rgba(0,0,0,0.25); border-color:var(--border); color:#fff; font-family:inherit; padding:8px;" readonly></textarea>
              <button class="btn btn-ghost btn-sm" id="btn-copy-tags" style="margin-top:6px; align-self:flex-start;">📋 Copy Tags</button>
            </div>

            <div class="field">
              <label style="color:var(--teal);">Premium Handmade Product Description</label>
              <textarea id="ai-seo-desc" style="width:100%; height:200px; background:rgba(0,0,0,0.25); border-color:var(--border); color:#fff; font-family:inherit; padding:8px;" readonly></textarea>
              <button class="btn btn-ghost btn-sm" id="btn-copy-desc" style="margin-top:6px; align-self:flex-start;">📋 Copy Description</button>
            </div>

            <div style="display:flex; justify-content:flex-end; margin-top:8px;">
              <button class="btn btn-primary" id="btn-close-ai-seo">Done</button>
            </div>
          </div>
        </div>
      `;
      frame.appendChild(p);
      setupEvents();
    }
    await load();
  };

  async function populateProductCats() {
    if (!window.OSOT_CATS) {
      if (window.loadCategories) {
        await window.loadCategories();
      }
    }
    const cats = window.OSOT_CATS || {};
    const select = g('p-cat');
    if (select) {
      let html = '';
      Object.keys(cats).forEach(code => {
        html += `<option value="${cats[code].label}">${cats[code].label}</option>`;
      });
      select.innerHTML = html;
    }
  }

  function setupEvents(){
    g('prod-tab-list-btn').addEventListener('click',function(){switchTab('list');});
    g('prod-tab-form-btn').addEventListener('click',function(){
      clearBuildForm();
      switchTab('form');
    });

    // Qty Required Dynamic Metric Label on Selected Item change
    g('p-bom-item').addEventListener('change', function() {
      var id = g('p-bom-item').value;
      var label = g('p-bom-qty-label');
      var inv = invList.find(function(x){return x.id === id;});
      if (inv && label) {
        label.textContent = 'Qty (' + (inv.unitMetric || 'ea') + ')';
      } else if (label) {
        label.textContent = 'Qty Required';
      }
    });

    // AI Etsy SEO Generation
    g('btn-generate-ai-seo').addEventListener('click', function() {
      var name = g('p-name').value.trim() || "Handmade Craft Item";
      var cat = g('p-cat').value || "Custom Gift";
      var desc = g('p-desc').value.trim() || "A beautifully styled custom creation.";
      var mNotes = g('p-notes').value.trim() || "Carefully prepared and packaged.";

      // Collect material names
      var matNames = bomList.map(function(b) { return b.name; });
      if (matNames.length === 0) matNames = ["Premium Selected Materials"];

      // 1. Title Generation
      var title = name + " - Custom " + cat + " - Handmade Gift " + matNames.slice(0,2).join(" & ") + " Design, Personalized Craft";
      if (title.length > 140) {
        title = title.substring(0, 137) + "...";
      }

      // 2. Tags (13 tags)
      var tags = ["Handmade Craft", "Custom Gift", "Personalized Decor", cat, "Maker Lab Design", "Premium Material", "Artisan Gift", "Unique Design", "Home Accent", "Custom Made", "Craft Art", matNames[0]];
      if (tags.length < 13) tags.push("Special Gift");
      tags = tags.slice(0, 13).join(", ");

      // 3. Description Generation
      var fullDesc = `✨ Welcome to Just Jane Maker Lab! ✨\n\nWe are absolutely thrilled to present our beautifully handcrafted "${name}". Each item is individually built with love, care, and precision in our local studio.\n\n📐 PRODUCT SPECIFICATIONS:\n• Product: ${name}\n• Category Group: ${cat}\n• Styling Details: ${desc}\n\n🌿 EXCLUSIVE MATERIALS USED:\nThis premium piece features the following quality inputs:\n${matNames.map(function(m) { return "  - " + m; }).join("\n")}\n\n💡 QUALITY & CRAFTSMANSHIP:\n${mNotes}\n\n🎁 THE PERFECT GIFT:\nLooking for a unique, memorable gift for birthdays, anniversaries, or special holidays? Supporting independent makers means this item is packed with a personal touch you won't find anywhere else.\n\nThank you for choosing Just Jane Maker Lab! 💖`;

      g('ai-seo-title').value = title;
      g('ai-seo-tags').value = tags;
      g('ai-seo-desc').value = fullDesc;

      g('ai-seo-modal').style.display = 'flex';
    });

    g('btn-close-ai-seo').addEventListener('click', function() {
      g('ai-seo-modal').style.display = 'none';
    });

    // Clipboard copies
    g('btn-copy-title').addEventListener('click', function() {
      g('ai-seo-title').select();
      document.execCommand('copy');
      alert('Title copied to clipboard!');
    });
    g('btn-copy-tags').addEventListener('click', function() {
      g('ai-seo-tags').select();
      document.execCommand('copy');
      alert('Tags copied to clipboard!');
    });
    g('btn-copy-desc').addEventListener('click', function() {
      g('ai-seo-desc').select();
      document.execCommand('copy');
      alert('Description copied to clipboard!');
    });

    g('p-bom-add-btn').addEventListener('click',function(){
      var id=g('p-bom-item').value;
      var qty=parseFloat(g('p-bom-qty').value)||0;
      if(!id||qty<=0)return;
      var inv=invList.find(function(x){return x.id===id;});
      if(inv){
        var cap = Number(inv.metricCapacity || 1);
        const cost = Number(inv.cost || 0);
        const calculatedUnitCost = cost / cap;

        var existing=bomList.find(function(x){return x.itemId===id;});
        if(existing){
          existing.qty+=qty;
        }else{
          bomList.push({
            itemId:id,
            name:inv.name,
            qty:qty,
            unitMetric: inv.unitMetric || 'ea',
            unitCost: calculatedUnitCost
          });
        }
        g('p-bom-qty').value='1';
        renderBOM();
      }
    });

    g('prod-form').addEventListener('submit',async function(e){
      e.preventDefault();
      var name=g('p-name').value;
      var sku=g('p-sku').value;
      var cat=g('p-cat').value;
      var status=g('p-status').value;
      var platforms=[];try{platforms=JSON.parse(g('p-platforms').value);}catch(err){platforms=["Etsy"];}
      var salePrice=parseFloat(g('p-price').value)||0;
      var etsyFee=parseFloat(g('p-fee').value)||0;
      var desc=g('p-desc').value;
      var notes=g('p-notes').value;
      var labHrs=parseFloat(g('p-lab-hrs').value)||0;
      var labRate=parseFloat(g('p-lab-rate').value)||0;

      // Recalculate
      var matCost=0;bomList.forEach(function(b){matCost+=b.qty*b.unitCost;});
      var labCost=labHrs*labRate;
      var cogs=matCost+labCost+etsyFee;
      var margin=salePrice>0?((salePrice-cogs)/salePrice)*100:0;

      var photo=g('p-photo').value.trim();

      var obj={
        id:editId||'prod_'+Date.now(),
        name:name,
        category:cat,
        sku:sku,
        status:status,
        platforms:platforms,
        salePrice:salePrice,
        etsyFee:etsyFee,
        description:desc,
        notes:notes,
        labourHrs:labHrs,
        labourRate:labRate,
        labourCost:labCost,
        materialCost:matCost,
        cogs:cogs,
        margin:margin,
        bom:bomList.map(function(b){
          return {
            itemId:b.itemId,
            name:b.name,
            qty:b.qty,
            unitMetric:b.unitMetric || 'ea',
            unitCost:b.unitCost
          };
        }),
        photo:photo
      };
      if(editId){var idx=products.findIndex(function(x){return x.id===editId;});if(idx>=0)products[idx]=obj;}
      else products.unshift(obj);
      window.__productsCache = products;
      await sv();
      try {
        if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
          await window.MAKER_CONFIG.saveToDatabase('Products', [
            obj.id, obj.name, obj.category, obj.sku, obj.status,
            JSON.stringify(obj.platforms), obj.salePrice, obj.etsyFee,
            obj.description, obj.notes, obj.labourHrs, obj.labourRate,
            obj.labourCost, obj.materialCost, obj.cogs, obj.margin,
            JSON.stringify(obj.bom), obj.photo
          ]);
        }
      } catch (err) {
        console.error('[Products] Error syncing to remote sheet:', err);
      }
      clearBuildForm();switchTab('list');renderList();
    });
    g('prod-cancel-btn').addEventListener('click',function(){clearBuildForm();switchTab('list');});
    g('prod-search').addEventListener('input',renderList);

    // Watch labor changes to live-calc
    ['p-lab-hrs','p-lab-rate','p-price','p-fee'].forEach(function(id){
      g(id).addEventListener('input',recalcSummary);
    });
  }

  function switchTab(t){
    if(t==='list'){
      g('prod-tab-list').style.display='block';g('prod-tab-form').style.display='none';
      g('prod-tab-list-btn').className='btn btn-primary';g('prod-tab-form-btn').className='btn btn-ghost';
    }else{
      g('prod-tab-list').style.display='none';g('prod-tab-form').style.display='block';
      g('prod-tab-list-btn').className='btn btn-ghost';g('prod-tab-form-btn').className='btn btn-primary';
    }
  }

  async function loadInventory(){
    try{
      if (window.__inventoryCache && window.__inventoryCache.length > 0) {
        invList = window.__inventoryCache;
      } else {
        invList=await window.makerAPI.readData('inventory.json')||[];
        window.__inventoryCache = invList;
      }
    }catch(err){invList=[];}
    var sel=g('p-bom-item');if(!sel)return;
    sel.innerHTML='<option value="">Select Raw Item...</option>';
    invList.forEach(function(i){
      var o=document.createElement('option');o.value=i.id;o.textContent=i.name+' ('+i.sku+')';sel.appendChild(o);
    });
  }

  async function load(){
    await loadInventory();
    await populateProductCats();

    // Use in-memory cache if available
    if (window.__productsCache && Array.isArray(window.__productsCache) && window.__productsCache.length > 0) {
      products = window.__productsCache;
      renderList();
      return;
    }

    try {
      let fetchFunc = null;
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) {
        fetchFunc = window.MAKER_CONFIG.fetchFromDatabase;
      }
      if (fetchFunc) {
        const remoteData = await fetchFunc('Products');
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          const header = remoteData[0].map(h => String(h || '').trim().toLowerCase());
          const idIdx = header.findIndex(h => h === 'id' || h === 'product_id' || h.includes('id'));
          const nameIdx = header.findIndex(h => h === 'name' || h === 'product name' || h.includes('name'));
          const catIdx = header.findIndex(h => h === 'category' || h.includes('cat'));
          const skuIdx = header.findIndex(h => h === 'sku' || h.includes('sku'));
          const statIdx = header.findIndex(h => h === 'status' || h.includes('status'));
          const platIdx = header.findIndex(h => h === 'platforms' || h === 'sales platforms' || h.includes('plat'));
          const priceIdx = header.findIndex(h => h === 'saleprice' || h === 'sale price' || h === 'price' || h.includes('price') || h.includes('retail'));
          const feeIdx = header.findIndex(h => h === 'etsyfee' || h === 'etsy fee' || h.includes('fee'));
          const descIdx = header.findIndex(h => h === 'description' || h.includes('desc'));
          const notesIdx = header.findIndex(h => h === 'notes' || h.includes('notes') || h.includes('mfg'));
          const hrsIdx = header.findIndex(h => h === 'labourhrs' || h === 'labour hours' || h === 'labor hours' || h.includes('hrs') || h.includes('hours'));
          const rateIdx = header.findIndex(h => h === 'labourrate' || h === 'hourly rate' || h.includes('rate'));
          const labCostIdx = header.findIndex(h => h === 'labourcost' || h === 'labour cost' || h === 'labor cost' || h.includes('labourcost') || h.includes('laborcost'));
          const matCostIdx = header.findIndex(h => h === 'materialcost' || h === 'material cost' || h.includes('materialcost'));
          const cogsIdx = header.findIndex(h => h === 'cogs' || h.includes('cogs'));
          const marginIdx = header.findIndex(h => h === 'margin' || h.includes('margin'));
          const bomIdx = header.findIndex(h => h === 'bom' || h === 'bill of materials' || h.includes('bom'));
          const photoIdx = header.findIndex(h => h === 'photo' || h === 'image' || h.includes('photo') || h.includes('image'));

          const parsedProds = [];
          for (let i = 1; i < remoteData.length; i++) {
            const r = remoteData[i];
            if (!r || r.length === 0) continue;
            const idVal = idIdx !== -1 ? r[idIdx] : '';
            if (!idVal) continue;

            let platforms = [];
            const rawPlat = platIdx !== -1 ? r[platIdx] : '';
            try { platforms = JSON.parse(rawPlat || '[]'); } catch(e) {
              platforms = rawPlat ? rawPlat.split(',') : [];
            }

            let bom = [];
            const rawBom = bomIdx !== -1 ? r[bomIdx] : '';
            try { bom = JSON.parse(rawBom || '[]'); } catch(e) {}

            parsedProds.push({
              id: idVal,
              name: nameIdx !== -1 ? r[nameIdx] : '',
              category: catIdx !== -1 ? r[catIdx] : '',
              sku: skuIdx !== -1 ? r[skuIdx] : '',
              status: statIdx !== -1 ? r[statIdx] : 'Active',
              platforms: platforms,
              salePrice: priceIdx !== -1 ? (parseFloat(r[priceIdx]) || 0) : 0,
              etsyFee: feeIdx !== -1 ? (parseFloat(r[feeIdx]) || 0) : 0,
              description: descIdx !== -1 ? r[descIdx] : '',
              notes: notesIdx !== -1 ? r[notesIdx] : '',
              labourHrs: hrsIdx !== -1 ? (parseFloat(r[hrsIdx]) || 0) : 0,
              labourRate: rateIdx !== -1 ? (parseFloat(r[rateIdx]) || 20) : 20,
              labourCost: labCostIdx !== -1 ? (parseFloat(r[labCostIdx]) || 0) : 0,
              materialCost: matCostIdx !== -1 ? (parseFloat(r[matCostIdx]) || 0) : 0,
              cogs: cogsIdx !== -1 ? (parseFloat(r[cogsIdx]) || 0) : 0,
              margin: marginIdx !== -1 ? (parseFloat(r[marginIdx]) || 0) : 0,
              bom: bom,
              photo: photoIdx !== -1 ? r[photoIdx] : ''
            });
          }

          products = parsedProds.filter(x => x.id && x.status !== 'DELETED');
          window.__productsCache = products;
          await window.makerAPI.writeData(FILE, products);
          renderList();
          return;
        }
      }
    } catch (err) {
      console.error('[Products] Failed loading remote products:', err);
    }

    try{
      products=await window.makerAPI.readData(FILE)||[];
      window.__productsCache = products;
    }catch(e){products=[];}
    renderList();
  }
  async function sv(){
    await window.makerAPI.writeData(FILE,products);
  }

  function renderList(){
    var q=g('prod-search').value.toLowerCase();
    var tbody=g('prod-tbody');if(!tbody)return;
    tbody.innerHTML='';

    // Read current live cache from inventory to calculate up-to-date COGS metrics
    var currentInventory = window.__inventoryCache || [];

    products.forEach(function(p){
      if(q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q))return;

      // Recalculate materials dynamically based on live inventory per-unit cost
      var dynamicMatCost = 0;
      if (p.bom && Array.isArray(p.bom)) {
        p.bom.forEach(function(bomItem) {
          const invItem = currentInventory.find(x => x.id === bomItem.itemId || x.sku === bomItem.itemId);
          if (invItem) {
            const cost = Number(invItem.cost || 0);
            const capacity = Number(invItem.metricCapacity || 1);
            const liveUnitCost = cost / capacity;
            dynamicMatCost += bomItem.qty * liveUnitCost;
          } else {
            dynamicMatCost += bomItem.qty * (bomItem.unitCost || 0);
          }
        });
      }

      var dynamicCogs = dynamicMatCost + Number(p.labourCost || 0) + Number(p.etsyFee || 0);
      var dynamicMargin = p.salePrice > 0 ? ((p.salePrice - dynamicCogs) / p.salePrice) * 100 : 0;
      var profit = p.salePrice - dynamicCogs;

      var photoCell = '';
      if (p.photo) {
        var directPhotoUrl = window.getDirectPhotoUrl ? window.getDirectPhotoUrl(p.photo) : p.photo;
        photoCell = `<img src="${directPhotoUrl}" style="width:36px; height:36px; border-radius:6px; object-fit:cover; cursor:pointer;" onclick="window.openPhotoLightbox('${p.photo}')">`;
      } else {
        photoCell = '<span style="font-size:18px; color:var(--muted);">📷</span>';
      }

      var tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            ${photoCell}
            <div>
              <div style="font-weight:700">${p.name}</div>
              <div style="font-size:11px;color:var(--muted)">${p.category} • ${p.platforms.join(', ')}</div>
            </div>
          </div>
        </td>
        <td><span class="tag">${p.sku}</span></td>
        <td><div>Lab: $${(p.labourCost || 0).toFixed(2)}</div><div style="font-size:11px;color:var(--muted)">Mat: $${dynamicMatCost.toFixed(2)}</div></td>
        <td style="font-weight:600">$${dynamicCogs.toFixed(2)}</td>
        <td style="font-weight:600">$${p.salePrice.toFixed(2)}</td>
        <td><span class="badge ${profit>0?'badge-green':'badge-red'}">$${profit.toFixed(2)} (${dynamicMargin.toFixed(0)}%)</span></td>
        <td>
          <button class="btn btn-ghost btn-sm prode" data-id="${p.id}">✎</button>
          <button class="btn btn-danger btn-sm prodd" data-id="${p.id}">🗑</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.prode').forEach(function(b){
      b.addEventListener('click',function(){
        var pItem=products.find(function(x){return x.id===b.dataset.id;});
        if(pItem){
          editId=pItem.id;
          g('p-name').value=pItem.name;g('p-sku').value=pItem.sku;g('p-cat').value=pItem.category;g('p-status').value=pItem.status;
          g('p-platforms').value=JSON.stringify(pItem.platforms);g('p-price').value=pItem.salePrice;g('p-fee').value=pItem.etsyFee;
          g('p-desc').value=pItem.description;g('p-notes').value=pItem.notes;
          g('p-lab-hrs').value=pItem.labourHrs;g('p-lab-rate').value=pItem.labourRate;
          g('p-photo').value=pItem.photo || '';
          bomList=pItem.bom.map(function(x){
            return {
              itemId:x.itemId,
              name:x.name,
              qty:x.qty,
              unitMetric:x.unitMetric || 'ea',
              unitCost:x.unitCost
            };
          });
          renderBOM();switchTab('form');
        }
      });
    });

    tbody.querySelectorAll('.prodd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this product?'))return;
        const idToDelete = b.dataset.id;
        products=products.filter(function(x){return x.id!==idToDelete;});
        window.__productsCache = products;
        await sv();
        try {
          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            await window.MAKER_CONFIG.saveToDatabase('Products', [idToDelete, '', '', '', 'DELETED']);
          }
        } catch (err) {
          console.error('[Products] Error deleting from remote sheet:', err);
        }
        renderList();
      });
    });
  }

  function renderBOM(){
    var tbody=g('p-bom-tbody');if(!tbody)return;
    tbody.innerHTML='';
    bomList.forEach(function(b,idx){
      var total=b.qty*b.unitCost;
      var tr=document.createElement('tr');
      tr.innerHTML=`
        <td>${b.name} (${b.unitMetric})</td><td>${b.qty}</td><td>$${b.unitCost.toFixed(3)}</td><td>$${total.toFixed(2)}</td>
        <td><button type="button" class="btn btn-danger btn-sm bomr" style="padding:2px 6px" data-idx="${idx}">×</button></td>
      `;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.bomr').forEach(function(b){
      b.addEventListener('click',function(){
        bomList.splice(parseInt(b.dataset.idx),1);renderBOM();
      });
    });
    recalcSummary();
  }

  function recalcSummary(){
    var matCost=0;bomList.forEach(function(b){matCost+=b.qty*b.unitCost;});
    var hrs=parseFloat(g('p-lab-hrs').value)||0;
    var rate=parseFloat(g('p-lab-rate').value)||0;
    var fee=parseFloat(g('p-fee').value)||0;
    var labCost=hrs*rate;
    var cogs=matCost+labCost+fee;

    g('calc-mat-cost').textContent='$'+matCost.toFixed(2);
    g('calc-lab-cost').textContent='$'+labCost.toFixed(2);
    g('calc-cogs').textContent='$'+cogs.toFixed(2);
  }

  function clearBuildForm(){
    editId=null;bomList=[];
    g('prod-form').reset();
    g('p-platforms').value='["Etsy"]';g('p-lab-hrs').value='0.5';g('p-lab-rate').value='20';g('p-fee').value='0';
    g('p-bom-qty').value='1';
    renderBOM();
  }
})();
