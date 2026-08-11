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
  var panel=null;

  function g(id){return document.getElementById(id);}

  window.__makerInit_orders=function(){
    var frame=g('module-frame');
    panel=g('panel-orders');
    if(!panel){
      panel=document.createElement('div');panel.id='panel-orders';panel.className='module-panel';
      panel.innerHTML=`
        <style>
          #panel-orders,
          #panel-orders * {
            -webkit-app-region: no-drag !important;
          }

          #panel-orders input,
          #panel-orders textarea,
          #panel-orders button,
          #panel-orders select {
            pointer-events: auto !important;
            user-select: text !important;
            -webkit-user-select: text !important;
            position: relative !important;
            z-index: 99999 !important;
          }
        </style>
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
          <div>
            <h2>Sales Orders Directory</h2>
            <p>Record orders, build custom customer invoices, calculate exact margins, and sync transaction lines to your Google Database.</p>
          </div>
          <button class="btn btn-ghost" id="ord-sync-btn">🔄 Sync</button>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
          <div style="display:flex; gap:10px">
            <button class="btn btn-primary" id="ord-tab-list-btn">Order List</button>
            <button class="btn btn-ghost" id="ord-tab-form-btn">New Order Form</button>
          </div>
          <div>
            <input type="file" id="ord-csv-input" accept=".csv" style="display: none;" onchange="importEtsyCSV(event)">
            <button class="btn btn-secondary" onclick="document.getElementById('ord-csv-input').click()">📁 Import Etsy Order CSV</button>
          </div>
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
                <div class="field" style="flex:1"><label>Order Number</label><input type="text" id="o-num" required readonly style="background:rgba(255,255,255,0.04); color:var(--muted); outline:none;" placeholder="ORD-10001"></div>
                <div class="field" style="flex:1"><label>External / 3rd Party ID</label><input type="text" id="o-ext-id" placeholder="e.g. Etsy 31234567"></div>
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
              <div class="field" style="margin-bottom:10px">
                <label>Select Customer Profile</label>
                <select id="o-cust-select">
                  <option value="">-- Choose Existing Customer or Add New --</option>
                </select>
              </div>
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div class="field" style="flex:1"><label>Customer Name *</label><input type="text" id="o-cust-name" required placeholder="Jane Smith"></div>
                <div class="field" style="flex:1"><label>Customer ID</label><input type="text" id="o-cust-id" readonly style="background:rgba(255,255,255,0.04); color:var(--muted); outline:none;" placeholder="cust_..."></div>
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
                  <div style="display:flex;justify-content:space-between;align-items:center"><label style="margin:0">Select Product Catalog Item</label><button type="button" class="btn btn-ghost btn-sm" data-goto="products" style="padding:2px 6px;font-size:10px;line-height:1;margin-bottom:4px;border:none;background:none;color:var(--accent);font-weight:700;cursor:pointer">+ New</button></div>
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
      frame.appendChild(panel);
      setupEvents();
    }
    load();
  };

  function setupEvents(){
    g('ord-sync-btn').addEventListener('click', async function() {
      g('ord-tbody').innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--muted); padding:20px;">Syncing orders with Google Sheets...</td></tr>';
      await load();
    });

    g('ord-tab-list-btn').addEventListener('click',function(){switchTab('list');});
    g('ord-tab-form-btn').addEventListener('click',function(){
      // Generate next serial if creating a new order
      if (!editId) {
        g('o-num').value = generateNextOrderNumber();
      }
      switchTab('form');
    });

    // Populate customer info on dropdown selection change
    g('o-cust-select').addEventListener('change', function() {
      const val = g('o-cust-select').value;
      if (val === '__new__') {
        g('o-cust-name').value = '';
        g('o-cust-id').value = '';
        g('o-cust-name').removeAttribute('readonly');
        g('o-cust-name').style.background = '';
        g('o-cust-name').focus();
      } else if (val) {
        let customers = [];
        if (window.__customerCache) {
          customers = window.__customerCache;
        }
        const c = customers.find(x => x.id === val);
        if (c) {
          g('o-cust-name').value = c.name || '';
          g('o-cust-id').value = c.id || '';
          g('o-cust-name').setAttribute('readonly', 'true');
          g('o-cust-name').style.background = 'rgba(255,255,255,0.04)';
        }
      } else {
        g('o-cust-name').value = '';
        g('o-cust-id').value = '';
        g('o-cust-name').removeAttribute('readonly');
        g('o-cust-name').style.background = '';
      }
    });

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

      let custId = g('o-cust-id').value;
      let custName = g('o-cust-name').value.trim();

      // If customer doesn't exist yet (New Customer is chosen or no ID is present)
      if (!custId && custName) {
        custId = 'cust_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const newCust = {
          id: custId,
          name: custName,
          email: '',
          phone: '',
          address: '',
          type: 'Personal',
          igHandle: '',
          finishPref: '',
          notes: 'Auto-created via Sales Order ' + g('o-num').value,
          createdAt: new Date().toISOString().slice(0, 10)
        };
        if (!window.__customerCache) window.__customerCache = [];
        window.__customerCache.unshift(newCust);

        try {
          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            await window.MAKER_CONFIG.saveToDatabase('Customers', [
              newCust.id, newCust.name, newCust.email, '',
              newCust.address, '', '', newCust.type,
              newCust.notes, newCust.createdAt
            ]);
          } else if (window.makerAPI && window.makerAPI.saveRowData) {
            await window.makerAPI.saveRowData('Customers', [
              newCust.id, newCust.name, newCust.email, '',
              newCust.address, '', '', newCust.type,
              newCust.notes, newCust.createdAt
            ]);
          }

          if (window.makerAPI && window.makerAPI.writeData) {
            await window.makerAPI.writeData('customers.json', window.__customerCache);
          }
        } catch (err) {
          console.error('[Orders] Error auto-creating customer profile:', err);
        }
      }

      var obj={
        id:editId||'ord_'+Date.now(),
        orderNumber:g('o-num').value,
        externalId:g('o-ext-id').value.trim(),
        date:g('o-date').value,
        source:g('o-source').value,
        status:g('o-status').value,
        paymentStatus:g('o-pay-status').value,
        customerId:custId||'cust_generic',
        customerName:custName,
        notes:g('o-notes').value,
        lineItems:lines.map(function(l){return {productId:l.productId,name:l.name,qty:l.qty,price:l.price,cogs:l.cogs};}),
        subtotal:subtotal,
        shipping:ship,
        total:total,
        cogs:totalCogs,
        profit:profit
      };

      // Auto-deduct inventory if new completed order
      if (!editId && (obj.status === 'Completed' || obj.status === 'Shipped')) {
        await autoDeductInventoryForLines(obj.lineItems);
      }

      if(editId){var idx=orders.findIndex(function(x){return x.id===editId;});if(idx>=0)orders[idx]=obj;}
      else orders.unshift(obj);
      await sv();
      try {
        if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
          await window.MAKER_CONFIG.saveToDatabase('Orders', [
            obj.id, obj.orderNumber, obj.date, obj.source, obj.status,
            obj.paymentStatus, obj.customerId, obj.customerName, obj.notes,
            JSON.stringify(obj.lineItems), obj.subtotal, obj.shipping,
            obj.total, obj.cogs, obj.profit, obj.externalId || ''
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

  async function autoDeductInventoryForLines(lineItems) {
    let inventory = [];
    try { inventory = await window.makerAPI.readData('inventory.json') || []; } catch(e){}
    let products = [];
    try { products = await window.makerAPI.readData('products.json') || []; } catch(e){}

    let deductedCount = 0;
    for (const line of lineItems) {
      const prod = products.find(p => p.id === line.productId || p.sku === line.productId);
      if (prod && prod.bom) {
        for (const bomItem of prod.bom) {
          const invItem = inventory.find(inv => inv.id === bomItem.itemId);
          if (invItem) {
            const qtyToSubtract = (bomItem.qty || 1) * line.qty;
            invItem.qty = Math.max(0, invItem.qty - qtyToSubtract);
            deductedCount++;

            // Sync inventory item row to database
            if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
              await window.MAKER_CONFIG.saveToDatabase('Inventory', [
                invItem.id, invItem.sku, invItem.name, invItem.brand, invItem.cat,
                invItem.subcat, invItem.type, invItem.colour, invItem.qty, invItem.lowStock,
                invItem.diameter, invItem.weight, invItem.printTemp, invItem.bedTemp,
                invItem.cost, invItem.location, invItem.supplier, invItem.notes,
                invItem.unitMetric || 'ea', invItem.metricCapacity || 1
              ]);
            }
          }
        }
      }
    }

    if (deductedCount > 0) {
      await window.makerAPI.writeData('inventory.json', inventory);
    }
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

  // Auto-generate next sequential order number (e.g. ORD-10001)
  function generateNextOrderNumber() {
    let maxNum = 10000;
    orders.forEach(o => {
      if (o.orderNumber && o.orderNumber.startsWith('ORD-')) {
        const num = parseInt(o.orderNumber.replace('ORD-', ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    return 'ORD-' + (maxNum + 1);
  }

  // Populate Customer Selection dropdown dynamically
  async function populateCustomerSelect() {
    const sel = g('o-cust-select');
    if (!sel) return;

    let customers = [];
    try {
      if (window.__customerCache) {
        customers = window.__customerCache;
      } else {
        customers = await window.makerAPI.readData('customers.json') || [];
        window.__customerCache = customers;
      }
    } catch (e) {
      customers = [];
    }

    sel.innerHTML = '<option value="">-- Choose Existing Customer or Add New --</option>';
    sel.innerHTML += '<option value="__new__" style="font-weight:700; color:var(--accent);">+ Add New Customer...</option>';

    // Sort customers by name
    customers.slice().sort((a,b) => (a.name || '').localeCompare(b.name || '')).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.email || 'No Email'})`;
      sel.appendChild(opt);
    });
  }

  async function load(){
    await loadProducts();
    await populateCustomerSelect();
    try {
      let fetchFunc = null;
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) {
        fetchFunc = window.MAKER_CONFIG.fetchFromDatabase;
      }
      if (fetchFunc) {
        const remoteData = await fetchFunc('Orders');
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          const header = remoteData[0].map(h => String(h || '').trim().toLowerCase());
          const idIdx = header.findIndex(h => h === 'id' || h === 'order_id' || h.includes('id'));
          const orderNumIdx = header.findIndex(h => h === 'ordernumber' || h === 'order number' || h === 'order_number' || h.includes('number') || h.includes('num'));
          const dateIdx = header.findIndex(h => h === 'date' || h === 'date purchased' || h.includes('date'));
          const sourceIdx = header.findIndex(h => h === 'source' || h === 'sales channel' || h.includes('source') || h.includes('channel'));
          const statusIdx = header.findIndex(h => h === 'status' || h === 'order status' || h.includes('status'));
          const payIdx = header.findIndex(h => h === 'paymentstatus' || h === 'payment status' || h.includes('pay'));
          const custIdIdx = header.findIndex(h => h === 'customerid' || h === 'customer id' || h.includes('customerid'));
          const custNameIdx = header.findIndex(h => h === 'customername' || h === 'customer name' || h.includes('customername') || h.includes('customer_name'));
          const notesIdx = header.findIndex(h => h === 'notes' || h.includes('notes'));
          const itemsIdx = header.findIndex(h => h === 'lineitems' || h === 'line items' || h.includes('items') || h.includes('lines'));
          const subIdx = header.findIndex(h => h === 'subtotal' || h.includes('subtotal'));
          const shipIdx = header.findIndex(h => h === 'shipping' || h.includes('shipping') || h.includes('ship'));
          const totalIdx = header.findIndex(h => h === 'total' || h === 'total value' || h.includes('total'));
          const cogsIdx = header.findIndex(h => h === 'cogs' || h.includes('cogs'));
          const profitIdx = header.findIndex(h => h === 'profit' || h.includes('profit'));
          const extIdIdx = header.findIndex(h => h === 'externalid' || h === 'external / 3rd party id' || h === 'external id' || h.includes('external'));

          const parsedOrders = [];
          for (let i = 1; i < remoteData.length; i++) {
            const r = remoteData[i];
            if (!r || r.length === 0) continue;
            const idVal = idIdx !== -1 ? r[idIdx] : '';
            if (!idVal) continue;

            let lineItems = [];
            const rawItems = itemsIdx !== -1 ? r[itemsIdx] : '';
            try { lineItems = JSON.parse(rawItems || '[]'); } catch(e) {}

            parsedOrders.push({
              id: idVal,
              orderNumber: orderNumIdx !== -1 ? r[orderNumIdx] : '',
              date: dateIdx !== -1 ? r[dateIdx] : '',
              source: sourceIdx !== -1 ? r[sourceIdx] : 'Other',
              status: statusIdx !== -1 ? r[statusIdx] : 'Pending',
              paymentStatus: payIdx !== -1 ? r[payIdx] : 'Paid',
              customerId: custIdIdx !== -1 ? r[custIdIdx] : '',
              customerName: custNameIdx !== -1 ? r[custNameIdx] : '',
              notes: notesIdx !== -1 ? r[notesIdx] : '',
              lineItems: lineItems,
              subtotal: subIdx !== -1 ? (parseFloat(r[subIdx]) || 0) : 0,
              shipping: shipIdx !== -1 ? (parseFloat(r[shipIdx]) || 0) : 0,
              total: totalIdx !== -1 ? (parseFloat(r[totalIdx]) || 0) : 0,
              cogs: cogsIdx !== -1 ? (parseFloat(r[cogsIdx]) || 0) : 0,
              profit: profitIdx !== -1 ? (parseFloat(r[profitIdx]) || 0) : 0,
              externalId: extIdIdx !== -1 ? r[extIdIdx] : ''
            });
          }

          orders = parsedOrders.filter(x => x.id && x.status !== 'DELETED');
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
      const ext = o.externalId || '';
      if(q && !o.orderNumber.toLowerCase().includes(q) && !o.customerName.toLowerCase().includes(q) && !o.source.toLowerCase().includes(q) && !ext.toLowerCase().includes(q))return;
      var tr=document.createElement('tr');
      var pct=o.total>0?(o.profit/o.total)*100:0;
      tr.innerHTML=`
        <td><div style="font-weight:700">${o.orderNumber}</div>${ext ? `<div style="font-size:11px;color:var(--accent)">${ext}</div>` : ''}<div style="font-size:11px;color:var(--muted)">${o.date}</div></td>
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

    const p = g('panel-orders');
    p.querySelectorAll('.orde').forEach(function(b){
      b.addEventListener('click',async function(){
        var o=orders.find(function(x){return x.id===b.dataset.id;});
        if(o){
          editId=o.id;
          g('o-num').value=o.orderNumber;
          g('o-ext-id').value=o.externalId || '';
          g('o-date').value=o.date;g('o-source').value=o.source;g('o-status').value=o.status;
          g('o-pay-status').value=o.paymentStatus;

          await populateCustomerSelect();
          const custSelect = g('o-cust-select');
          if (o.customerId && o.customerId !== 'cust_generic') {
            custSelect.value = o.customerId;
            g('o-cust-name').setAttribute('readonly', 'true');
            g('o-cust-name').style.background = 'rgba(255,255,255,0.04)';
          } else {
            custSelect.value = '';
            g('o-cust-name').removeAttribute('readonly');
            g('o-cust-name').style.background = '';
          }

          g('o-cust-id').value=o.customerId;g('o-cust-name').value=o.customerName;
          g('o-notes').value=o.notes;g('o-ship').value=o.shipping;
          lines=o.lineItems.map(function(x){return {productId:x.productId,name:x.name,qty:x.qty,price:x.price,cogs:x.cogs};});
          renderLines();switchTab('form');
        }
      });
    });

    p.querySelectorAll('.ordd').forEach(function(b){
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
    g('o-cust-name').removeAttribute('readonly');
    g('o-cust-name').style.background = '';
    populateCustomerSelect();
    renderLines();
  }
})();

// Global Etsy CSV Import Listener
async function importEtsyCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const text = e.target.result;
    const lines = text.split(/\r\n|\n/);
    if (lines.length < 2) return;

    // Helper to parse CSV line
    function parseCSVLine(line) {
      const result = [];
      let currentVal = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentVal += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      result.push(currentVal.trim());
      return result;
    }

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());

    const orderIdIdx = headers.findIndex(h => h.includes('order id') || h === 'id');
    const dateIdx = headers.findIndex(h => h.includes('sale date') || h.includes('date'));
    const buyerIdIdx = headers.findIndex(h => h.includes('buyer') || h.includes('user id'));
    const nameIdx = headers.findIndex(h => h.includes('full name') || h === 'name' || h.includes('recipient'));
    const emailIdx = headers.findIndex(h => h === 'email' || h.includes('mail'));
    const itemNameIdx = headers.findIndex(h => h.includes('item name') || h.includes('title'));
    const qtyIdx = headers.findIndex(h => h === 'quantity' || h === 'qty');
    const priceIdx = headers.findIndex(h => h === 'price' || h.includes('item total'));
    const shipIdx = headers.findIndex(h => h === 'shipping');

    // Load dependencies
    let products = [];
    try { products = await window.makerAPI.readData('products.json') || []; } catch(e){}
    let inventory = [];
    try { inventory = await window.makerAPI.readData('inventory.json') || []; } catch(e){}
    let customers = [];
    try { customers = await window.makerAPI.readData('customers.json') || []; } catch(e){}
    let orders = [];
    try { orders = await window.makerAPI.readData('orders.json') || []; } catch(e){}

    let orderCount = 0;
    let customerCount = 0;
    let stockDeductedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = parseCSVLine(line);
      if (cols.length === 0 || !cols.some(c => c)) continue;

      const orderNum = orderIdIdx !== -1 ? cols[orderIdIdx] : 'ETS_' + Date.now() + '_' + i;
      const oDate = dateIdx !== -1 ? cols[dateIdx] : new Date().toISOString().slice(0, 10);
      const buyerName = nameIdx !== -1 ? cols[nameIdx] : 'Etsy Customer';
      const buyerEmail = emailIdx !== -1 ? cols[emailIdx] : '';
      const buyerId = buyerIdIdx !== -1 ? cols[buyerIdIdx] : 'cust_' + Date.now().toString(36);
      const itemName = itemNameIdx !== -1 ? cols[itemNameIdx] : '';
      const itemQty = qtyIdx !== -1 ? (parseInt(cols[qtyIdx]) || 1) : 1;
      const itemPrice = priceIdx !== -1 ? (parseFloat(cols[priceIdx]) || 0) : 0;
      const shipping = shipIdx !== -1 ? (parseFloat(cols[shipIdx]) || 0) : 0;

      // Skip duplicates based on externalId
      if (orders.some(o => o.externalId === orderNum || o.orderNumber === orderNum)) continue;

      // 1. Customer Auto-Creation
      let cust = customers.find(c => c.email && buyerEmail && c.email.toLowerCase() === buyerEmail.toLowerCase());
      if (!cust) {
        cust = {
          id: buyerId || 'cust_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
          name: buyerName,
          email: buyerEmail,
          phone: '',
          address: '',
          source: 'Etsy',
          isRepeat: false,
          notes: 'Imported from Etsy Order CSV',
          etsyUsername: buyerId || '',
          createdAt: new Date().toISOString().slice(0, 10)
        };
        customers.unshift(cust);
        customerCount++;

        if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
          window.MAKER_CONFIG.saveToDatabase('Customers', [
            cust.id, cust.name, cust.email, cust.phone, cust.address,
            'Personal', cust.etsyUsername, 'Personal', cust.notes, cust.createdAt
          ]);
        }
      }

      // 2. Lookup Product BOM & Auto-Deduct Inventory Stock
      let prod = products.find(p => p.name.toLowerCase() === itemName.toLowerCase() || p.sku.toLowerCase() === itemName.toLowerCase());
      if (!prod && itemName) {
        prod = products.find(p => itemName.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(itemName.toLowerCase()));
      }

      let orderBom = [];
      let calculatedCogs = 0;
      if (prod) {
        orderBom = prod.bom || [];
        calculatedCogs = prod.cogs || 0;

        // Subtract stock for each BOM item
        for (const bomItem of orderBom) {
          const invItem = inventory.find(inv => inv.id === bomItem.itemId);
          if (invItem) {
            const qtyToDeduct = (bomItem.qty || 1) * itemQty;
            invItem.qty = Math.max(0, invItem.qty - qtyToDeduct);
            stockDeductedCount++;

            // Sync updated row to Sheet
            if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
              await window.MAKER_CONFIG.saveToDatabase('Inventory', [
                invItem.id, invItem.sku, invItem.name, invItem.brand, invItem.cat,
                invItem.subcat, invItem.type, invItem.colour, invItem.qty, invItem.lowStock,
                invItem.diameter, invItem.weight, invItem.printTemp, invItem.bedTemp,
                invItem.cost, invItem.location, invItem.supplier, invItem.notes,
                invItem.unitMetric || 'ea', invItem.metricCapacity || 1
              ]);
            }
          }
        }
      }

      // 3. Save Sales Record
      const totalValue = (itemQty * itemPrice) + shipping;
      const totalCogs = calculatedCogs * itemQty;
      const orderObj = {
        id: 'ord_etsy_' + Date.now() + '_' + i,
        orderNumber: generateNextOrderNumber(),
        externalId: orderNum,
        date: oDate,
        source: 'Etsy',
        status: 'Completed',
        paymentStatus: 'Paid',
        customerId: cust.id,
        customerName: cust.name,
        notes: 'Auto-imported Etsy sale of: ' + itemName,
        lineItems: [{
          productId: prod ? prod.id : 'custom_item',
          name: itemName || 'Etsy Item',
          qty: itemQty,
          price: itemPrice,
          cogs: calculatedCogs
        }],
        subtotal: itemQty * itemPrice,
        shipping: shipping,
        total: totalValue,
        cogs: totalCogs,
        profit: totalValue - totalCogs
      };

      orders.unshift(orderObj);
      orderCount++;

      // Save Order to Google Sheet
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
        await window.MAKER_CONFIG.saveToDatabase('Orders', [
          orderObj.id, orderObj.orderNumber, orderObj.date, orderObj.source, orderObj.status,
          orderObj.paymentStatus, orderObj.customerId, orderObj.customerName, orderObj.notes,
          JSON.stringify(orderObj.lineItems), orderObj.subtotal, orderObj.shipping,
          orderObj.total, orderObj.cogs, orderObj.profit, orderObj.externalId || ''
        ]);
      }
    }

    // Save updated databases locally
    if (orderCount > 0) {
      await window.makerAPI.writeData('orders.json', orders);
    }
    if (customerCount > 0) {
      await window.makerAPI.writeData('customers.json', customers);
    }
    if (stockDeductedCount > 0) {
      await window.makerAPI.writeData('inventory.json', inventory);
    }

    // If active view is Order tab, reload
    if (window.__makerInit_orders) {
      window.__makerInit_orders();
    }
    alert(`Import complete!\n🎉 Orders Imported: ${orderCount}\n👥 New Customers Created: ${customerCount}\n📦 Inventory Items Auto-Deducted: ${stockDeductedCount}`);
    event.target.value = ''; // Reset input
  };

  reader.readAsText(file);
}
