/**
 * Just Jane Maker Lab - Inventory Control Module
 * Path: modules/inventory.js
 */

(function(){
  var FILE='inventory.json';
  var SEED=[
    {id:'inv_1',name:'PLA Filament Black',category:'Filament',sku:'FIL-PLA-BLK',qty:3,unit:'spools',cost:22.50,supplierId:'sup_1',minQty:1,notes:'eSun brand'},
    {id:'inv_2',name:'20oz Skinny Tumbler White',category:'Sublimation Blanks',sku:'SUB-TUM-20W',qty:24,unit:'pieces',cost:3.10,supplierId:'sup_2',minQty:12,notes:'Double-wall vacuum insulated'}
  ];
  var items=[];
  var editId=null;

  function g(id){return document.getElementById(id);}

  window.__makerInit_inventory=function(){
    var frame=g('module-frame');
    var p=g('panel-inventory');
    if(!p){
      p=document.createElement('div');p.id='panel-inventory';p.className='module-panel';
      p.innerHTML=`
        <div class="page-header">
          <h2>Inventory Management</h2>
          <p>Track raw materials, blanks, and craft supplies with local database cache and remote Google Sheets backup.</p>
        </div>
        
        <div class="stat-row">
          <div class="stat-box"><div class="sv" id="inv-stat-total">0</div><div class="sl">Total Items Listed</div></div>
          <div class="stat-box"><div class="sv" id="inv-stat-value">$0.00</div><div class="sl">Total Inventory Value</div></div>
          <div class="stat-box"><div class="sv" id="inv-stat-low">0</div><div class="sl">Low Stock Alerts</div></div>
        </div>

        <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
          <div class="card" style="flex:1;min-width:320px">
            <div class="toolbar">
              <div class="search-box"><input type="text" id="inv-search" placeholder="Search by name, SKU, or notes..."></div>
              <select id="inv-filter-cat">
                <option value="">All Categories</option>
                <option value="Filament">Filament</option>
                <option value="Sublimation Blanks">Sublimation Blanks</option>
                <option value="Acrylic Blanks">Acrylic Blanks</option>
                <option value="Laser Wood">Laser Wood</option>
                <option value="Hardware">Hardware</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Item &amp; SKU</th><th>Category</th><th>Qty</th><th>Cost</th><th>Total Value</th><th>Alert</th><th style="width:70px">Actions</th></tr>
                </thead>
                <tbody id="inv-tbody"></tbody>
              </table>
            </div>
          </div>

          <div class="card" style="width:340px">
            <h3 id="inv-form-title" style="margin-bottom:14px">Add Inventory Item</h3>
            <form id="inv-form">
              <div class="field" style="margin-bottom:10px">
                <label>Item Name</label><input type="text" id="inv-name" required>
              </div>
              <div class="field" style="margin-bottom:10px">
                <label>SKU (Stock Keeping Unit)</label><input type="text" id="inv-sku" required placeholder="e.g. RAW-MAT-01">
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1">
                  <label>Category</label>
                  <select id="inv-cat">
                    <option value="Filament">Filament</option>
                    <option value="Sublimation Blanks">Sublimation Blanks</option>
                    <option value="Acrylic Blanks">Acrylic Blanks</option>
                    <option value="Laser Wood">Laser Wood</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div class="field" style="flex:1">
                  <label>Unit</label><input type="text" id="inv-unit" required placeholder="e.g. spools, pcs">
                </div>
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1">
                  <label>Quantity</label><input type="number" id="inv-qty" step="any" required>
                </div>
                <div class="field" style="flex:1">
                  <label>Unit Cost ($)</label><input type="number" id="inv-cost" step="any" required>
                </div>
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1">
                  <label>Supplier</label>
                  <select id="inv-supplier"><option value="">No Supplier</option></select>
                </div>
                <div class="field" style="flex:1">
                  <label>Min Qty (Alert)</label><input type="number" id="inv-min" step="any" required value="0">
                </div>
              </div>
              <div class="field" style="margin-bottom:14px">
                <label>Notes</label><textarea id="inv-notes" style="min-height:50px"></textarea>
              </div>
              <div style="display:flex;gap:10px">
                <button type="submit" class="btn btn-primary" style="flex:1">Save Item</button>
                <button type="button" id="inv-cancel" class="btn btn-ghost" style="display:none">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      `;
      frame.appendChild(p);
      setupEvents();
    }
    load();
  };

  function setupEvents(){
    g('inv-form').addEventListener('submit',async function(e){
      e.preventDefault();
      var obj={
        id:editId||'inv_'+Date.now(),
        name:g('inv-name').value,
        sku:g('inv-sku').value,
        category:g('inv-cat').value,
        qty:parseFloat(g('inv-qty').value)||0,
        unit:g('inv-unit').value,
        cost:parseFloat(g('inv-cost').value)||0,
        supplierId:g('inv-supplier').value||'',
        minQty:parseFloat(g('inv-min').value)||0,
        notes:g('inv-notes').value
      };
      if(editId){
        var idx=items.findIndex(function(x){return x.id===editId;});
        if(idx>=0)items[idx]=obj;
      }else{
        items.unshift(obj);
      }
      await sv();
      
      try {
        if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
          await window.MAKER_CONFIG.saveToDatabase('Inventory', [
            obj.id, obj.name, obj.sku, obj.category, obj.qty,
            obj.unit, obj.cost, obj.supplierId, obj.minQty, obj.notes
          ]);
        }
      } catch (err) {
        console.error('[Inventory] Error syncing to remote database:', err);
      }

      editId=null;
      g('inv-form-title').textContent='Add Inventory Item';
      g('inv-cancel').style.display='none';
      ['inv-name','inv-sku','inv-qty','inv-unit','inv-cost','inv-min','inv-notes'].forEach(function(id){g(id).value='';});
      g('inv-cat').selectedIndex=0;g('inv-supplier').selectedIndex=0;
      render();
    });

    g('inv-cancel').addEventListener('click',function(){
      editId=null;g('inv-form-title').textContent='Add Inventory Item';g('inv-cancel').style.display='none';
      ['inv-name','inv-sku','inv-qty','inv-unit','inv-cost','inv-min','inv-notes'].forEach(function(id){g(id).value='';});
      g('inv-cat').selectedIndex=0;g('inv-supplier').selectedIndex=0;
    });

    g('inv-search').addEventListener('input',render);
    g('inv-filter-cat').addEventListener('change',render);
  }

  async function load(){
    try {
      let fetchFunc = null;
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) {
        fetchFunc = window.MAKER_CONFIG.fetchFromDatabase;
      }
      if (fetchFunc) {
        const remoteData = await fetchFunc('Inventory');
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          const startIndex = (remoteData[0] && (remoteData[0][0] === 'ID' || remoteData[0][0] === 'id')) ? 1 : 0;
          items = remoteData.slice(startIndex).map(row => ({
            id: row[0] || '',
            name: row[1] || '',
            sku: row[2] || '',
            category: row[3] || '',
            qty: parseFloat(row[4]) || 0,
            unit: row[5] || '',
            cost: parseFloat(row[6]) || 0,
            supplierId: row[7] || '',
            minQty: parseFloat(row[8]) || 0,
            notes: row[9] || ''
          })).filter(x => x.id && x.notes !== 'DELETED');
          
          await window.makerAPI.writeData(FILE, items);
          await loadSuppliers();
          render();
          return;
        }
      }
    } catch (err) {
      console.error('[Inventory] Error fetching from remote database:', err);
    }

    items=await window.makerAPI.readData(FILE)||[];
    if(!items.length){items=SEED.slice();await window.makerAPI.writeData(FILE,items);}
    await loadSuppliers();
    render();
  }

  async function sv(){
    await window.makerAPI.writeData(FILE,items);
  }

  async function loadSuppliers(){
    var sOpt=g('inv-supplier');if(!sOpt)return;
    sOpt.innerHTML='<option value="">No Supplier</option>';
    try{
      var sList=await window.makerAPI.readData('suppliers.json')||[];
      sList.forEach(function(s){
        var o=document.createElement('option');o.value=s.id;o.textContent=s.name;sOpt.appendChild(o);
      });
    }catch(e){}
  }

  function render(){
    var tbody=g('inv-tbody');if(!tbody)return;
    tbody.innerHTML='';
    var q=g('inv-search').value.toLowerCase();
    var fCat=g('inv-filter-cat').value;
    var totalListed=0,totalValue=0,lowStock=0;

    items.forEach(function(item){
      if(fCat && item.category!==fCat)return;
      if(q && !item.name.toLowerCase().includes(q) && !item.sku.toLowerCase().includes(q) && !item.notes.toLowerCase().includes(q))return;

      totalListed++;
      var val=item.qty*item.cost;
      totalValue+=val;
      var isLow=item.qty<=item.minQty;
      if(isLow)lowStock++;

      var tr=document.createElement('tr');
      tr.innerHTML=`
        <td><div style="font-weight:700">${item.name}</div><div style="font-size:11px;color:var(--muted)">${item.sku}</div></td>
        <td><span class="tag">${item.category}</span></td>
        <td><span style="font-weight:600">${item.qty}</span> <span style="font-size:11px;color:var(--muted)">${item.unit}</span></td>
        <td>$${item.cost.toFixed(2)}</td>
        <td style="font-weight:600">$${val.toFixed(2)}</td>
        <td>${isLow?`<span class="badge badge-red">Low Stock</span>`:`<span class="badge badge-green">OK</span>`}</td>
        <td>
          <button class="btn btn-ghost btn-sm inve" data-id="${item.id}">✎</button>
          <button class="btn btn-danger btn-sm invd" data-id="${item.id}">🗑</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    g('inv-stat-total').textContent=totalListed;
    g('inv-stat-value').textContent='$'+totalValue.toFixed(2);
    g('inv-stat-low').textContent=lowStock;

    tbody.querySelectorAll('.inve').forEach(function(b){
      b.addEventListener('click',function(){
        var item=items.find(function(x){return x.id===b.dataset.id;});
        if(item){
          editId=item.id;
          g('inv-form-title').textContent='Edit Inventory Item';g('inv-cancel').style.display='inline-flex';
          g('inv-name').value=item.name;g('inv-sku').value=item.sku;g('inv-cat').value=item.category;
          g('inv-qty').value=item.qty;g('inv-unit').value=item.unit;g('inv-cost').value=item.cost;
          g('inv-supplier').value=item.supplierId;g('inv-min').value=item.minQty;g('inv-notes').value=item.notes;
        }
      });
    });

    tbody.querySelectorAll('.invd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this item?'))return;
        const idToDelete = b.dataset.id;
        items=items.filter(function(x){return x.id!==idToDelete;});
        await sv();
        
        try {
          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            await window.MAKER_CONFIG.saveToDatabase('Inventory', [idToDelete, '', '', '', '', '', '', '', '', 'DELETED']);
          }
        } catch (err) {
          console.error('[Inventory] Error deleting from remote database:', err);
        }

        render();
      });
    });
  }
})();
