/**
 * Just Jane Maker Lab - Supplier Directory Module
 * Path: modules/suppliers.js
 */

(function(){
  var FILE='suppliers.json';
  var SEED=[
    {id:'sup_1',name:'eSun Filament Factory',category:'Filament',status:'Active',rating:5,website:'https://esun3d.com',contact:'Sales Team',email:'sales@esun3d.com',phone:'+86 755 8610 1234',lead:'14 days',minOrder:'$100',shipping:'Free above $300',notes:'Consistent colors'},
    {id:'sup_2',name:'Blank Supply Wholesale',category:'Sublimation Blanks',status:'Active',rating:4,website:'https://blanksupply.com',contact:'Amy Johnson',email:'amy@blanksupply.com',phone:'800-555-0199',lead:'5 days',minOrder:'None',shipping:'Calculated at checkout',notes:'Fast shipping, good tumblers'}
  ];
  var items=[];
  var editId=null;

  function g(id){return document.getElementById(id);}

  window.__makerInit_suppliers=function(){
    var frame=g('module-frame');
    var p=g('panel-suppliers');
    if(!p){
      p=document.createElement('div');p.id='panel-suppliers';p.className='module-panel';
      p.innerHTML=`
        <div class="page-header">
          <h2>Supplier Directory</h2>
          <p>Track wholesale suppliers, contact information, and order parameters with automatic database syncing.</p>
        </div>

        <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
          <div class="card" style="flex:1;min-width:320px">
            <div class="toolbar">
              <div class="search-box"><input type="text" id="sup-search" placeholder="Search suppliers..."></div>
              <select id="sup-filter-cat">
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
                  <tr><th>Supplier Name</th><th>Category</th><th>Rating</th><th>Contact</th><th>Lead Time</th><th style="width:70px">Actions</th></tr>
                </thead>
                <tbody id="sup-tbody"></tbody>
              </table>
            </div>
          </div>

          <div class="card" style="width:340px">
            <h3 id="sup-form-title" style="margin-bottom:14px">Add Supplier</h3>
            <form id="sup-form">
              <div class="field" style="margin-bottom:10px">
                <label>Supplier Name</label><input type="text" id="sup-name" required>
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1">
                  <label>Category</label>
                  <select id="sup-cat">
                    <option value="Filament">Filament</option>
                    <option value="Sublimation Blanks">Sublimation Blanks</option>
                    <option value="Acrylic Blanks">Acrylic Blanks</option>
                    <option value="Laser Wood">Laser Wood</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div class="field" style="flex:1">
                  <label>Status</label>
                  <select id="sup-status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div class="field" style="margin-bottom:10px">
                <label>Rating (1 to 5 Stars)</label>
                <select id="sup-rating"><option value="5">★★★★★</option><option value="4">★★★★☆</option><option value="3">★★★☆☆</option><option value="2">★★☆☆☆</option><option value="1">★☆☆☆☆</option></select>
              </div>
              <div class="field" style="margin-bottom:10px">
                <label>Website</label><input type="text" id="sup-website" placeholder="https://...">
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1"><label>Contact Person</label><input type="text" id="sup-contact"></div>
                <div class="field" style="flex:1"><label>Email</label><input type="email" id="sup-email"></div>
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1"><label>Phone</label><input type="text" id="sup-phone"></div>
                <div class="field" style="flex:1"><label>Lead Time</label><input type="text" id="sup-lead" placeholder="e.g. 7 days"></div>
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1"><label>Min Order</label><input type="text" id="sup-min" placeholder="e.g. $100"></div>
                <div class="field" style="flex:1"><label>Shipping Info</label><input type="text" id="sup-ship"></div>
              </div>
              <div class="field" style="margin-bottom:14px">
                <label>Notes</label><textarea id="sup-notes" style="min-height:50px"></textarea>
              </div>
              <div style="display:flex;gap:10px">
                <button type="submit" class="btn btn-primary" style="flex:1">Save Supplier</button>
                <button type="button" id="sup-cancel" class="btn btn-ghost" style="display:none">Cancel</button>
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
    g('sup-form').addEventListener('submit',async function(e){
      e.preventDefault();
      var obj={
        id:editId||'sup_'+Date.now(),
        name:g('sup-name').value,
        category:g('sup-cat').value,
        status:g('sup-status').value,
        rating:parseInt(g('sup-rating').value)||5,
        website:g('sup-website').value,
        contact:g('sup-contact').value,
        email:g('sup-email').value,
        phone:g('sup-phone').value,
        lead:g('sup-lead').value,
        minOrder:g('sup-min').value,
        shipping:g('sup-ship').value,
        notes:g('sup-notes').value
      };
      if(editId){
        var idx=items.findIndex(function(x){return x.id===editId;});
        if(idx>=0)items[idx]=obj;
      }else{
        items.unshift(obj);
      }
      editId=null;
      g('sup-form-title').textContent='Add Supplier';g('sup-cancel').style.display='none';
      ['sup-name','sup-website','sup-contact','sup-email','sup-phone','sup-lead','sup-min','sup-ship','sup-notes'].forEach(function(id){g(id).value='';});
      g('sup-cat').value='Filament';g('sup-status').value='Active';g('sup-rating').value='5';
      await sv();
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
      render();
    });

    g('sup-cancel').addEventListener('click',function(){
      editId=null;g('sup-form-title').textContent='Add Supplier';g('sup-cancel').style.display='none';
      ['sup-name','sup-website','sup-contact','sup-email','sup-phone','sup-lead','sup-min','sup-ship','sup-notes'].forEach(function(id){g(id).value='';});
      g('sup-cat').value='Filament';g('sup-status').value='Active';g('sup-rating').value='5';
    });

    g('sup-search').addEventListener('input',render);
    g('sup-filter-cat').addEventListener('change',render);
  }

  async function load(){
    try {
      let fetchFunc = null;
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) {
        fetchFunc = window.MAKER_CONFIG.fetchFromDatabase;
      }
      if (fetchFunc) {
        const remoteData = await fetchFunc('Suppliers');
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          const startIndex = (remoteData[0] && (remoteData[0][0] === 'ID' || remoteData[0][0] === 'id')) ? 1 : 0;
          items = remoteData.slice(startIndex).map(row => ({
            id: row[0] || '',
            name: row[1] || '',
            category: row[2] || '',
            status: row[3] || 'Active',
            rating: parseInt(row[4]) || 5,
            website: row[5] || '',
            contact: row[6] || '',
            email: row[7] || '',
            phone: row[8] || '',
            lead: row[9] || '',
            minOrder: row[10] || '',
            shipping: row[11] || '',
            notes: row[12] || ''
          })).filter(x => x.id && x.status !== 'DELETED');
          
          await window.makerAPI.writeData(FILE, items);
          render();
          return;
        }
      }
    } catch (err) {
      console.error('Failed loading remote suppliers:', err);
    }

    items=await window.makerAPI.readData(FILE)||[];
    if(!items.length){items=SEED.slice();await window.makerAPI.writeData(FILE,items);}
    render();
  }
  async function sv(){
    await window.makerAPI.writeData(FILE,items);
  }

  function render(){
    var tbody=g('sup-tbody');if(!tbody)return;
    tbody.innerHTML='';
    var q=g('sup-search').value.toLowerCase();
    var fCat=g('sup-filter-cat').value;

    items.forEach(function(s){
      if(fCat && s.category!==fCat)return;
      if(q && !s.name.toLowerCase().includes(q) && !s.notes.toLowerCase().includes(q))return;

      var stars='★'.repeat(s.rating)+'☆'.repeat(5-s.rating);
      var tr=document.createElement('tr');
      tr.innerHTML=`
        <td><div style="font-weight:700">${s.name}</div>${s.website?`<a href="${s.website}" target="_blank" style="font-size:11px;color:var(--accent);text-decoration:none">${s.website}</a>`:''}</td>
        <td><span class="tag">${s.category}</span></td>
        <td style="color:var(--gold);font-weight:600">${stars}</td>
        <td><div>${s.contact||'-'}</div><div style="font-size:11px;color:var(--muted)">${s.email||''}</div></td>
        <td>${s.lead||'-'}</td>
        <td>
          <button class="btn btn-ghost btn-sm supe" data-id="${s.id}">✎</button>
          <button class="btn btn-danger btn-sm supd" data-id="${s.id}">🗑</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    panel.querySelectorAll('.supe').forEach(function(b){
      b.addEventListener('click',function(){
        var s=items.find(function(x){return x.id===b.dataset.id;});
        if(s){
          editId=s.id;
          g('sup-form-title').textContent='Edit Supplier';g('sup-cancel').style.display='inline-flex';
          g('sup-name').value=s.name;g('sup-cat').value=s.category;g('sup-status').value=s.status;
          g('sup-rating').value=s.rating;g('sup-website').value=s.website;g('sup-contact').value=s.contact;
          g('sup-email').value=s.email;g('sup-phone').value=s.phone;g('sup-lead').value=s.lead;
          g('sup-min').value=s.minOrder;g('sup-ship').value=s.shipping;g('sup-notes').value=s.notes;
        }
      });
    });

    panel.querySelectorAll('.supd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this supplier?'))return;
        const idToDelete = b.dataset.id;
cat << 'EOF' > modules/suppliers.js
/**
 * Just Jane Maker Lab - Supplier Directory Module
 * Path: modules/suppliers.js
 */

(function(){
  var FILE='suppliers.json';
  var SEED=[
    {id:'sup_1',name:'eSun Filament Factory',category:'Filament',status:'Active',rating:5,website:'https://esun3d.com',contact:'Sales Team',email:'sales@esun3d.com',phone:'+86 755 8610 1234',lead:'14 days',minOrder:'$100',shipping:'Free above $300',notes:'Consistent colors'},
    {id:'sup_2',name:'Blank Supply Wholesale',category:'Sublimation Blanks',status:'Active',rating:4,website:'https://blanksupply.com',contact:'Amy Johnson',email:'amy@blanksupply.com',phone:'800-555-0199',lead:'5 days',minOrder:'None',shipping:'Calculated at checkout',notes:'Fast shipping, good tumblers'}
  ];
  var items=[];
  var editId=null;

  function g(id){return document.getElementById(id);}

  window.__makerInit_suppliers=function(){
    var frame=g('module-frame');
    var p=g('panel-suppliers');
    if(!p){
      p=document.createElement('div');p.id='panel-suppliers';p.className='module-panel';
      p.innerHTML=`
        <div class="page-header">
          <h2>Supplier Directory</h2>
          <p>Track wholesale suppliers, contact information, and order parameters with automatic database syncing.</p>
        </div>

        <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
          <div class="card" style="flex:1;min-width:320px">
            <div class="toolbar">
              <div class="search-box"><input type="text" id="sup-search" placeholder="Search suppliers..."></div>
              <select id="sup-filter-cat">
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
                  <tr><th>Supplier Name</th><th>Category</th><th>Rating</th><th>Contact</th><th>Lead Time</th><th style="width:70px">Actions</th></tr>
                </thead>
                <tbody id="sup-tbody"></tbody>
              </table>
            </div>
          </div>

          <div class="card" style="width:340px">
            <h3 id="sup-form-title" style="margin-bottom:14px">Add Supplier</h3>
            <form id="sup-form">
              <div class="field" style="margin-bottom:10px">
                <label>Supplier Name</label><input type="text" id="sup-name" required>
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1">
                  <label>Category</label>
                  <select id="sup-cat">
                    <option value="Filament">Filament</option>
                    <option value="Sublimation Blanks">Sublimation Blanks</option>
                    <option value="Acrylic Blanks">Acrylic Blanks</option>
                    <option value="Laser Wood">Laser Wood</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div class="field" style="flex:1">
                  <label>Status</label>
                  <select id="sup-status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div class="field" style="margin-bottom:10px">
                <label>Rating (1 to 5 Stars)</label>
                <select id="sup-rating"><option value="5">★★★★★</option><option value="4">★★★★☆</option><option value="3">★★★☆☆</option><option value="2">★★☆☆☆</option><option value="1">★☆☆☆☆</option></select>
              </div>
              <div class="field" style="margin-bottom:10px">
                <label>Website</label><input type="text" id="sup-website" placeholder="https://...">
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1"><label>Contact Person</label><input type="text" id="sup-contact"></div>
                <div class="field" style="flex:1"><label>Email</label><input type="email" id="sup-email"></div>
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1"><label>Phone</label><input type="text" id="sup-phone"></div>
                <div class="field" style="flex:1"><label>Lead Time</label><input type="text" id="sup-lead" placeholder="e.g. 7 days"></div>
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1"><label>Min Order</label><input type="text" id="sup-min" placeholder="e.g. $100"></div>
                <div class="field" style="flex:1"><label>Shipping Info</label><input type="text" id="sup-ship"></div>
              </div>
              <div class="field" style="margin-bottom:14px">
                <label>Notes</label><textarea id="sup-notes" style="min-height:50px"></textarea>
              </div>
              <div style="display:flex;gap:10px">
                <button type="submit" class="btn btn-primary" style="flex:1">Save Supplier</button>
                <button type="button" id="sup-cancel" class="btn btn-ghost" style="display:none">Cancel</button>
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
    g('sup-form').addEventListener('submit',async function(e){
      e.preventDefault();
      var obj={
        id:editId||'sup_'+Date.now(),
        name:g('sup-name').value,
        category:g('sup-cat').value,
        status:g('sup-status').value,
        rating:parseInt(g('sup-rating').value)||5,
        website:g('sup-website').value,
        contact:g('sup-contact').value,
        email:g('sup-email').value,
        phone:g('sup-phone').value,
        lead:g('sup-lead').value,
        minOrder:g('sup-min').value,
        shipping:g('sup-ship').value,
        notes:g('sup-notes').value
      };
      if(editId){
        var idx=items.findIndex(function(x){return x.id===editId;});
        if(idx>=0)items[idx]=obj;
      }else{
        items.unshift(obj);
      }
      editId=null;
      g('sup-form-title').textContent='Add Supplier';g('sup-cancel').style.display='none';
      ['sup-name','sup-website','sup-contact','sup-email','sup-phone','sup-lead','sup-min','sup-ship','sup-notes'].forEach(function(id){g(id).value='';});
      g('sup-cat').value='Filament';g('sup-status').value='Active';g('sup-rating').value='5';
      await sv();
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
      render();
    });

    g('sup-cancel').addEventListener('click',function(){
      editId=null;g('sup-form-title').textContent='Add Supplier';g('sup-cancel').style.display='none';
      ['sup-name','sup-website','sup-contact','sup-email','sup-phone','sup-lead','sup-min','sup-ship','sup-notes'].forEach(function(id){g(id).value='';});
      g('sup-cat').value='Filament';g('sup-status').value='Active';g('sup-rating').value='5';
    });

    g('sup-search').addEventListener('input',render);
    g('sup-filter-cat').addEventListener('change',render);
  }

  async function load(){
    try {
      let fetchFunc = null;
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) {
        fetchFunc = window.MAKER_CONFIG.fetchFromDatabase;
      }
      if (fetchFunc) {
        const remoteData = await fetchFunc('Suppliers');
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          const startIndex = (remoteData[0] && (remoteData[0][0] === 'ID' || remoteData[0][0] === 'id')) ? 1 : 0;
          items = remoteData.slice(startIndex).map(row => ({
            id: row[0] || '',
            name: row[1] || '',
            category: row[2] || '',
            status: row[3] || 'Active',
            rating: parseInt(row[4]) || 5,
            website: row[5] || '',
            contact: row[6] || '',
            email: row[7] || '',
            phone: row[8] || '',
            lead: row[9] || '',
            minOrder: row[10] || '',
            shipping: row[11] || '',
            notes: row[12] || ''
          })).filter(x => x.id && x.status !== 'DELETED');
          
          await window.makerAPI.writeData(FILE, items);
          render();
          return;
        }
      }
    } catch (err) {
      console.error('Failed loading remote suppliers:', err);
    }

    items=await window.makerAPI.readData(FILE)||[];
    if(!items.length){items=SEED.slice();await window.makerAPI.writeData(FILE,items);}
    render();
  }
  async function sv(){
    await window.makerAPI.writeData(FILE,items);
  }

  function render(){
    var tbody=g('sup-tbody');if(!tbody)return;
    tbody.innerHTML='';
    var q=g('sup-search').value.toLowerCase();
    var fCat=g('sup-filter-cat').value;

    items.forEach(function(s){
      if(fCat && s.category!==fCat)return;
      if(q && !s.name.toLowerCase().includes(q) && !s.notes.toLowerCase().includes(q))return;

      var stars='★'.repeat(s.rating)+'☆'.repeat(5-s.rating);
      var tr=document.createElement('tr');
      tr.innerHTML=`
        <td><div style="font-weight:700">${s.name}</div>${s.website?`<a href="${s.website}" target="_blank" style="font-size:11px;color:var(--accent);text-decoration:none">${s.website}</a>`:''}</td>
        <td><span class="tag">${s.category}</span></td>
        <td style="color:var(--gold);font-weight:600">${stars}</td>
        <td><div>${s.contact||'-'}</div><div style="font-size:11px;color:var(--muted)">${s.email||''}</div></td>
        <td>${s.lead||'-'}</td>
        <td>
          <button class="btn btn-ghost btn-sm supe" data-id="${s.id}">✎</button>
          <button class="btn btn-danger btn-sm supd" data-id="${s.id}">🗑</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    panel.querySelectorAll('.supe').forEach(function(b){
      b.addEventListener('click',function(){
        var s=items.find(function(x){return x.id===b.dataset.id;});
        if(s){
          editId=s.id;
          g('sup-form-title').textContent='Edit Supplier';g('sup-cancel').style.display='inline-flex';
          g('sup-name').value=s.name;g('sup-cat').value=s.category;g('sup-status').value=s.status;
          g('sup-rating').value=s.rating;g('sup-website').value=s.website;g('sup-contact').value=s.contact;
          g('sup-email').value=s.email;g('sup-phone').value=s.phone;g('sup-lead').value=s.lead;
          g('sup-min').value=s.minOrder;g('sup-ship').value=s.shipping;g('sup-notes').value=s.notes;
        }
      });
    });

    panel.querySelectorAll('.supd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this supplier?'))return;
        const idToDelete = b.dataset.id;
        items=items.filter(function(x){return x.id!==idToDelete;});
        await sv();
        try {
          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            await window.MAKER_CONFIG.saveToDatabase('Suppliers', [idToDelete, '', '', 'DELETED']);
          }
        } catch (err) {
          console.error('[Suppliers] Error deleting from remote sheet:', err);
        }
        render();
      });
    });
  }
})();
