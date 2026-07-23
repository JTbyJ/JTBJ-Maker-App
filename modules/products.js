/**
 * Just Jane Maker Lab - Product Catalog & BOM Module
 * Path: modules/products.js
 */

(function(){
  var FILE='products.json';
  var products=[];
  var invList=[];
  var editId=null;
  var bomList=[]; // Temporary array of BOM items during product creation/edit

  function g(id){return document.getElementById(id);}

  window.__makerInit_products=function(){
    var frame=g('module-frame');
    var p=g('panel-products');
    if(!p){
      p=document.createElement('div');p.id='panel-products';p.className='module-panel';
      p.innerHTML=`
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
              <h3 style="margin-bottom:14px">Product Specification</h3>
              
              <div class="field" style="margin-bottom:10px">
                <label>Product Name</label><input type="text" id="p-name" required>
              </div>
              <div class="field" style="margin-bottom:10px">
                <label>SKU</label><input type="text" id="p-sku" required placeholder="e.g. FIN-TUM-GLIT">
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1">
                  <label>Category</label>
                  <select id="p-cat">
                    <option value="Sublimation Tumblers">Sublimation Tumblers</option>
                    <option value="3D Prints">3D Prints</option>
                    <option value="Laser Crafts">Laser Crafts</option>
                    <option value="Other Finishings">Other Finishings</option>
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
                  <label>Inventory Item</label>
                  <select id="p-bom-item"><option value="">Select Raw Item...</option></select>
                </div>
                <div class="field" style="width:80px">
                  <label>Qty Required</label><input type="number" id="p-bom-qty" step="any" value="1">
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
      `;
      frame.appendChild(p);
      setupEvents();
    }
    load();
  };

  function setupEvents(){
    g('prod-tab-list-btn').addEventListener('click',function(){switchTab('list');});
    g('prod-tab-form-btn').addEventListener('click',function(){switchTab('form');});

    g('p-bom-add-btn').addEventListener('click',function(){
      var id=g('p-bom-item').value;
      var qty=parseFloat(g('p-bom-qty').value)||0;
      if(!id||qty<=0)return;
      var inv=invList.find(function(x){return x.id===id;});
      if(inv){
        var existing=bomList.find(function(x){return x.itemId===id;});
        if(existing){
          existing.qty+=qty;
        }else{
          bomList.push({itemId:id,name:inv.name,qty:qty,unitCost:inv.cost});
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
        bom:bomList.map(function(b){return {itemId:b.itemId,name:b.name,qty:b.qty,unitCost:b.unitCost};})
      };
      if(editId){var idx=products.findIndex(function(x){return x.id===editId;});if(idx>=0)products[idx]=obj;}
      else products.unshift(obj);
      await sv();
      try {
        if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
          await window.MAKER_CONFIG.saveToDatabase('Products', [
            obj.id, obj.name, obj.category, obj.sku, obj.status,
            JSON.stringify(obj.platforms), obj.salePrice, obj.etsyFee,
            obj.description, obj.notes, obj.labourHrs, obj.labourRate,
            obj.labourCost, obj.materialCost, obj.cogs, obj.margin,
            JSON.stringify(obj.bom)
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
    try{invList=await window.makerAPI.readData('inventory.json')||[];}catch(err){invList=[];}
    var sel=g('p-bom-item');if(!sel)return;
    sel.innerHTML='<option value="">Select Raw Item...</option>';
    invList.forEach(function(i){
      var o=document.createElement('option');o.value=i.id;o.textContent=i.name+' ('+i.sku+')';sel.appendChild(o);
    });
  }

  async function load(){
    await loadInventory();
    try {
      let fetchFunc = null;
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) {
        fetchFunc = window.MAKER_CONFIG.fetchFromDatabase;
      }
      if (fetchFunc) {
        const remoteData = await fetchFunc('Products');
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          const startIndex = (remoteData[0] && (remoteData[0][0] === 'ID' || remoteData[0][0] === 'id')) ? 1 : 0;
          products = remoteData.slice(startIndex).map(row => {
            let platforms = [];
            try { platforms = JSON.parse(row[5] || '[]'); } catch(e) {
              platforms = row[5] ? row[5].split(',') : [];
            }
            let bom = [];
            try { bom = JSON.parse(row[16] || '[]'); } catch(e) {}

            return {
              id: row[0] || '',
              name: row[1] || '',
              category: row[2] || '',
              sku: row[3] || '',
              status: row[4] || 'Active',
              platforms: platforms,
              salePrice: parseFloat(row[6]) || 0,
              etsyFee: parseFloat(row[7]) || 0,
              description: row[8] || '',
              notes: row[9] || '',
              labourHrs: parseFloat(row[10]) || 0,
              labourRate: parseFloat(row[11]) || 20,
              labourCost: parseFloat(row[12]) || 0,
              materialCost: parseFloat(row[13]) || 0,
              cogs: parseFloat(row[14]) || 0,
              margin: parseFloat(row[15]) || 0,
              bom: bom
            };
          }).filter(x => x.id && x.status !== 'DELETED');
          
          await window.makerAPI.writeData(FILE, products);
          renderList();
          return;
        }
      }
    } catch (err) {
      console.error('[Products] Failed loading remote products:', err);
    }

    try{products=await window.makerAPI.readData(FILE)||[];}catch(e){products=[];}
    renderList();
  }
  async function sv(){
    await window.makerAPI.writeData(FILE,products);
  }

  function renderList(){
    var q=g('prod-search').value.toLowerCase();
    var tbody=g('prod-tbody');if(!tbody)return;
    tbody.innerHTML='';

    products.forEach(function(p){
      if(q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q))return;
      var tr=document.createElement('tr');
      var profit=p.salePrice-p.cogs;
      tr.innerHTML=`
        <td><div style="font-weight:700">${p.name}</div><div style="font-size:11px;color:var(--muted)">${p.category} • ${p.platforms.join(', ')}</div></td>
        <td><span class="tag">${p.sku}</span></td>
        <td><div>Lab: $${p.labourCost.toFixed(2)}</div><div style="font-size:11px;color:var(--muted)">Mat: $${p.materialCost.toFixed(2)}</div></td>
        <td style="font-weight:600">$${p.cogs.toFixed(2)}</td>
        <td style="font-weight:600">$${p.salePrice.toFixed(2)}</td>
        <td><span class="badge ${profit>0?'badge-green':'badge-red'}">$${profit.toFixed(2)} (${p.margin.toFixed(0)}%)</span></td>
        <td>
          <button class="btn btn-ghost btn-sm prode" data-id="${p.id}">✎</button>
          <button class="btn btn-danger btn-sm prodd" data-id="${p.id}">🗑</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    panel.querySelectorAll('.prode').forEach(function(b){
      b.addEventListener('click',function(){
        var p=products.find(function(x){return x.id===b.dataset.id;});
        if(p){
          editId=p.id;
          g('p-name').value=p.name;g('p-sku').value=p.sku;g('p-cat').value=p.category;g('p-status').value=p.status;
          g('p-platforms').value=JSON.stringify(p.platforms);g('p-price').value=p.salePrice;g('p-fee').value=p.etsyFee;
          g('p-desc').value=p.description;g('p-notes').value=p.notes;
          g('p-lab-hrs').value=p.labourHrs;g('p-lab-rate').value=p.labourRate;
          bomList=p.bom.map(function(x){return {itemId:x.itemId,name:x.name,qty:x.qty,unitCost:x.unitCost};});
          renderBOM();switchTab('form');
        }
      });
    });

    panel.querySelectorAll('.prodd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this product?'))return;
        const idToDelete = b.dataset.id;
        products=products.filter(function(x){return x.id!==idToDelete;});
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
        <td>${b.name}</td><td>${b.qty}</td><td>$${b.unitCost.toFixed(2)}</td><td>$${total.toFixed(2)}</td>
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
