/**
 * Just Jane Maker Lab - Orders Directory Module
 * Path: modules/orders.js
 */

(function(){
  var FILE='orders.json';
  var orders=[];
  var prodList=[];
  var editId=null;
  var lines=[]; // Active items in the form

  function g(id){return document.getElementById(id);}

  window.__makerInit_orders=function(){
    var frame=g('module-frame');
    var p=g('panel-orders');
    if(!p){
      p=document.createElement('div');p.id='panel-orders';p.className='module-panel';
      p.innerHTML=`
        <div class="page-header">
          <h2>Sales Orders Directory</h2>
          <p>Record orders, build custom customer invoices, calculate exact margins, and sync transaction lines to your Google Database.</p>
        </div>

        <div style="display:flex;gap:10px;margin-bottom:14px">
          <button class="btn btn-primary" id="ord-tab-list-btn">Order List</button>
          <button class="btn btn-ghost" id="ord-tab-form-btn">New Order Form</button>
        </div>

        <!-- LIST TAB -->
        <div id="ord-tab-list">
          <div class="card">
            <div class="toolbar">
              <div class="search-box"><input type="text" id="ord-search" placeholder="Search orders by number, source, name..."></div>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Order Num</th><th>Customer</th><th>Source</th><th>Status</th><th>Total Value</th><th>Profit Margin</th><th style="width:70px">Actions</th></tr>
                </thead>
                <tbody id="ord-tbody"></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- FORM TAB -->
        <div id="ord-tab-form" style="display:none">
          <form id="ord-form" style="display:flex;gap:24px;flex-wrap:wrap">
            <div class="card" style="flex:1;min-width:320px">
              <h3 style="margin-bottom:14px">Sales Details</h3>
              
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1"><label>Order Number</label><input type="text" id="o-num" required placeholder="e.g. ETSY-10045"></div>
                <div class="field" style="flex:1"><label>Date Purchased</label><input type="date" id="o-date" required></div>
              </div>

              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1">
                  <label>Sales Channel</label>
                  <select id="o-source"><option value="Etsy">Etsy Shop</option><option value="Shopify">Shopify Store</option><option value="In-Person">In-Person/Local</option><option value="Other">Other Channel</option></select>
                </div>
                <div class="field" style="flex:1">
                  <label>Order Status</label>
                  <select id="o-status"><option value="Pending">Pending / Processing</option><option value="Shipped">Shipped</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select>
                </div>
              </div>

              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1">
                  <label>Payment Status</label>
                  <select id="o-pay-status"><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option><option value="Refunded">Refunded</option></select>
                </div>
              </div>

              <h3 style="margin-top:20px;margin-bottom:10px">Customer Identification</h3>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1"><label>Customer Name</label><input type="text" id="o-cust-name" required placeholder="Jane Smith"></div>
                <div class="field" style="flex:1"><label>Customer ID (Optional)</label><input type="text" id="o-cust-id" placeholder="cust_..."></div>
              </div>
              <div class="field" style="margin-bottom:14px">
                <label>Order Notes / Personalization Notes</label><textarea id="o-notes" style="min-height:50px" placeholder="Name on tumbler: 'Just Jane' in cursive..."></textarea>
              </div>
            </div>

            <!-- Shopping Cart Card -->
            <div class="card" style="width:420px;display:flex;flex-direction:column">
              <h3 style="margin-bottom:14px">Order Line Items</h3>
              
              <div style="display:flex;gap:8px;margin-bottom:12px;align-items:flex-end">
                <div class="field" style="flex:1">
                  <label>Select Product Catalog Item</label>
                  <select id="o-item-sel"><option value="">Choose Finished Product...</option></select>
                </div>
                <div class="field" style="width:60px">
                  <label>Qty</label><input type="number" id="o-item-qty" value="1">
                </div>
                <button type="button" class="btn btn-secondary" id="o-item-add">Add</button>
              </div>

              <div class="table-wrap" style="flex:1;min-height:160px;margin-bottom:14px">
                <table>
                  <thead><tr><th>Product Name</th><th>Qty</th><th>Price</th><th>Total</th><th style="width:40px"></th></tr></thead>
                  <tbody id="o-line-tbody"></tbody>
                </table>
              </div>

              <div style="background:rgba(255,255,255,.02);padding:14px;border-radius:8px;border:1px solid var(--border);margin-bottom:18px">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Subtotal:</span><span id="calc-subtotal" style="font-weight:600">$0.00</span></div>
                <div style="display:flex;gap:10px;margin-bottom:6px;align-items:center">
                  <div class="field" style="flex:1;flex-direction:row;align-items:center;gap:10px">
                    <label style="text-transform:none;font-size:13px;color:var(--text)">Shipping Charged:</label>
                    <input type="number" id="o-ship" value="0" step="any" style="width:70px;padding:4px 6px">
                  </div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Total Costs (COGS):</span><span id="calc-cogs-total" style="font-weight:600">$0.00</span></div>
                <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:6px;margin-top:6px;font-weight:700"><span>Estimated Order Profit:</span><span id="calc-profit" style="color:var(--green)">$0.00</span></div>
              </div>

              <div style="display:flex;gap:10px">
                <button type="submit" class="btn btn-primary" style="flex:1">Save Sales Record</button>
                <button type="button" class="btn btn-ghost" id="ord-cancel-btn">Cancel</button>
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
    g('ord-tab-list-btn').addEventListener('click',function(){switchTab('list');});
    g('ord-tab-form-btn').addEventListener('click',function(){switchTab('form');});

    g('o-item-add').addEventListener('click',function(){
      var id=g('o-item-sel').value;
      var qty=parseInt(g('o-item-qty').value)||0;
      if(!id||qty<=0)return;
      var prod=prodList.find(function(x){return x.id===id;});
      if(prod){
        var existing=lines.find(function(x){return x.productId===id;});
        if(existing){
          existing.qty+=qty;
        }else{
          lines.push({productId:id,name:prod.name,qty:qty,price:prod.salePrice,cogs:prod.cogs});
        }
        g('o-item-qty').value='1';
        renderLines();
      }
    });

    g('o-ship').addEventListener('input',recalcOrderSummary);

    g('ord-form').addEventListener('submit',async function(e){
      e.preventDefault();
      var subtotal=0;var totalCogs=0;
      lines.forEach(function(l){subtotal+=l.qty*l.price;totalCogs+=l.qty*l.cogs;});
      var ship=parseFloat(g('o-ship').value)||0;
      var total=subtotal+ship;
      var profit=total-totalCogs;

      var obj={
        id:editId||'ord_'+Date.now(),
        orderNumber:g('o-num').value,
        date:g('o-date').value,
        source:g('o-source').value,
        status:g('o-status').value,
        paymentStatus:g('o-pay-status').value,
        customerId:g('o-cust-id').value||'cust_generic',
        customerName:g('o-cust-name').value,
        notes:g('o-notes').value,
        lineItems:lines.map(function(l){return {productId:l.productId,name:l.name,qty:l.qty,price:l.price,cogs:l.cogs};}),
        subtotal:subtotal,
        shipping:ship,
        total:total,
        cogs:totalCogs,
        profit:profit
      };
      if(editId){var idx=orders.findIndex(function(x){return x.id===editId;});if(idx>=0)orders[idx]=obj;}
      else orders.unshift(obj);
      await sv();
      try {
        if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
          await window.MAKER_CONFIG.saveToDatabase('Orders', [
            obj.id, obj.orderNumber, obj.date, obj.source, obj.status,
            obj.paymentStatus, obj.customerId, obj.customerName, obj.notes,
            JSON.stringify(obj.lineItems), obj.subtotal, obj.shipping,
            obj.total, obj.cogs, obj.profit
          ]);
        }
      } catch (err) {
        console.error('[Orders] Error syncing order to remote sheet:', err);
      }
      clearForm();switchTab('list');renderList();
    });
    g('ord-cancel-btn').addEventListener('click',function(){clearForm();switchTab('list');});
    g('ord-search').addEventListener('input',renderList);
  }

  function switchTab(t){
    if(t==='list'){
      g('ord-tab-list').style.display='block';g('ord-tab-form').style.display='none';
      g('ord-tab-list-btn').className='btn btn-primary';g('ord-tab-form-btn').className='btn btn-ghost';
    }else{
      g('ord-tab-list').style.display='none';g('ord-tab-form').style.display='block';
      g('ord-tab-list-btn').className='btn btn-ghost';g('ord-tab-form-btn').className='btn btn-primary';
    }
  }

  async function loadProducts(){
    try{prodList=await window.makerAPI.readData('products.json')||[];}catch(e){prodList=[];}
    var sel=g('o-item-sel');if(!sel)return;
    sel.innerHTML='<option value="">Choose Finished Product...</option>';
    prodList.forEach(function(p){
      var o=document.createElement('option');o.value=p.id;o.textContent=p.name+' ($'+p.salePrice.toFixed(2)+')';sel.appendChild(o);
    });
  }

  async function load(){
    await loadProducts();
    try {
      let fetchFunc = null;
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) {
        fetchFunc = window.MAKER_CONFIG.fetchFromDatabase;
      }
      if (fetchFunc) {
        const remoteData = await fetchFunc('Orders');
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          const startIndex = (remoteData[0] && (remoteData[0][0] === 'ID' || remoteData[0][0] === 'id')) ? 1 : 0;
          orders = remoteData.slice(startIndex).map(row => {
            let lineItems = [];
            try { lineItems = JSON.parse(row[9] || '[]'); } catch(e) {}
            return {
              id: row[0] || '',
              orderNumber: row[1] || '',
              date: row[2] || '',
              source: row[3] || '',
              status: row[4] || 'Pending',
              paymentStatus: row[5] || 'Paid',
              customerId: row[6] || '',
              customerName: row[7] || '',
              notes: row[8] || '',
              lineItems: lineItems,
              subtotal: parseFloat(row[10]) || 0,
              shipping: parseFloat(row[11]) || 0,
              total: parseFloat(row[12]) || 0,
              cogs: parseFloat(row[13]) || 0,
              profit: parseFloat(row[14]) || 0
            };
          }).filter(x => x.id && x.status !== 'DELETED');
          
          await window.makerAPI.writeData(FILE, orders);
          renderList();
          return;
        }
      }
    } catch (err) {
      console.error('[Orders] Failed fetching remote orders:', err);
    }

    try{orders=await window.makerAPI.readData(FILE)||[];}catch(e){orders=[];}
    renderList();
  }
  async function sv(){await window.makerAPI.writeData(FILE,orders);}

  function renderList(){
    var q=g('ord-search').value.toLowerCase();
    var tbody=g('ord-tbody');if(!tbody)return;
    tbody.innerHTML='';

    orders.forEach(function(o){
      if(q && !o.orderNumber.toLowerCase().includes(q) && !o.customerName.toLowerCase().includes(q) && !o.source.toLowerCase().includes(q))return;
      var tr=document.createElement('tr');
      var pct=o.total>0?(o.profit/o.total)*100:0;
      tr.innerHTML=`
        <td><div style="font-weight:700">${o.orderNumber}</div><div style="font-size:11px;color:var(--muted)">${o.date}</div></td>
        <td><div>${o.customerName}</div></td>
        <td><span class="tag">${o.source}</span></td>
        <td><span class="badge ${o.status==='Completed'?'badge-green':(o.status==='Shipped'?'badge-teal':'badge-gold')}">${o.status}</span></td>
        <td style="font-weight:600">$${o.total.toFixed(2)}</td>
        <td><span class="badge badge-green">$${o.profit.toFixed(2)} (${pct.toFixed(0)}%)</span></td>
        <td>
          <button class="btn btn-ghost btn-sm orde" data-id="${o.id}">✎</button>
          <button class="btn btn-danger btn-sm ordd" data-id="${o.id}">🗑</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    panel.querySelectorAll('.orde').forEach(function(b){
      b.addEventListener('click',function(){
        var o=orders.find(function(x){return x.id===b.dataset.id;});
        if(o){
          editId=o.id;
          g('o-num').value=o.orderNumber;g('o-date').value=o.date;g('o-source').value=o.source;g('o-status').value=o.status;
          g('o-pay-status').value=o.paymentStatus;g('o-cust-id').value=o.customerId;g('o-cust-name').value=o.customerName;
          g('o-notes').value=o.notes;g('o-ship').value=o.shipping;
          lines=o.lineItems.map(function(x){return {productId:x.productId,name:x.name,qty:x.qty,price:x.price,cogs:x.cogs};});
          renderLines();switchTab('form');
        }
      });
    });

    panel.querySelectorAll('.ordd').forEach(function(b){
      b.addEventListener('click',async function(e){
        e.stopPropagation();
        if(!confirm('Delete order?'))return;
        const idToDelete = b.dataset.id;
        orders=orders.filter(function(x){return x.id!==idToDelete;});
        await sv();
        try {
          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            await window.MAKER_CONFIG.saveToDatabase('Orders', [idToDelete, '', '', '', 'DELETED']);
          }
        } catch (err) {
          console.error('[Orders] Error deleting order from remote sheet:', err);
        }
        renderList();
      });
    });
  }

  function renderLines(){
    var tbody=g('o-line-tbody');if(!tbody)return;
    tbody.innerHTML='';
    lines.forEach(function(l,idx){
      var tot=l.qty*l.price;
      var tr=document.createElement('tr');
      tr.innerHTML=`
        <td>${l.name}</td><td>${l.qty}</td><td>$${l.price.toFixed(2)}</td><td>$${tot.toFixed(2)}</td>
        <td><button type="button" class="btn btn-danger btn-sm liner" style="padding:2px 6px" data-idx="${idx}">×</button></td>
      `;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.liner').forEach(function(b){
      b.addEventListener('click',function(){
        lines.splice(parseInt(b.dataset.idx),1);renderLines();
      });
    });
    recalcOrderSummary();
  }

  function recalcOrderSummary(){
    var subtotal=0;var totalCogs=0;
    lines.forEach(function(l){subtotal+=l.qty*l.price;totalCogs+=l.qty*l.cogs;});
    var ship=parseFloat(g('o-ship').value)||0;
    var total=subtotal+ship;
    var profit=total-totalCogs;

    g('calc-subtotal').textContent='$'+subtotal.toFixed(2);
    g('calc-cogs-total').textContent='$'+totalCogs.toFixed(2);
    g('calc-profit').textContent='$'+profit.toFixed(2);
  }

  function clearForm(){
    editId=null;lines=[];
    g('ord-form').reset();
    g('o-item-qty').value='1';g('o-ship').value='0';
    g('o-date').value=new Date().toISOString().substring(0,10);
    renderLines();
  }
})();
