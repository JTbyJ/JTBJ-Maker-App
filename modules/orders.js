(function(){
  var FILE='orders.json';
  var PROD_FILE='products.json';
  var CUST_FILE='customers.json';
  var frame=document.getElementById('module-frame');
  var panel=document.createElement('div');
  panel.id='panel-orders';panel.className='module-panel';

  panel.innerHTML=
    '<div class="page-header"><h2>Orders &amp; Invoicing</h2><p>Track every sale &mdash; Etsy, Facebook, In Person &amp; Custom</p></div>'+
    '<div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--border)">'+
      '<button id="ord-tab-list" style="padding:10px 28px;background:none;border:none;border-bottom:3px solid var(--accent);color:var(--accent);font-weight:700;font-size:14px;cursor:pointer;margin-bottom:-2px">Orders</button>'+
      '<button id="ord-tab-new" style="padding:10px 28px;background:none;border:none;border-bottom:3px solid transparent;color:var(--text-muted);font-weight:600;font-size:14px;cursor:pointer;margin-bottom:-2px">New Order</button>'+
    '</div>'+

    '<div id="ord-list-pane">'+
      '<div class="stat-row">'+
        '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="ord-total">0</div><div class="sl">Total Orders</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--gold)" id="ord-revenue">$0.00</div><div class="sl">Revenue</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--green)" id="ord-profit">$0.00</div><div class="sl">Profit</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--red)" id="ord-pending-count">0</div><div class="sl">Pending</div></div>'+
      '</div>'+
      '<div class="toolbar">'+
        '<div class="search-box"><input id="ord-search" placeholder="Search orders, customers, products..."></div>'+
        '<select id="ord-status-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
          '<option value="">All Statuses</option>'+
          '<option>Pending</option><option>In Production</option><option>Ready</option>'+
          '<option>Shipped</option><option>Delivered</option><option>Cancelled</option><option>Refunded</option>'+
        '</select>'+
        '<select id="ord-src-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
          '<option value="">All Sources</option>'+
          '<option>Etsy</option><option>Facebook</option><option>In Person</option><option>Custom</option>'+
        '</select>'+
        '<button class="btn btn-primary" id="ord-new-btn">+ New Order</button>'+
      '</div>'+
      '<div style="overflow-x:auto;margin-top:10px">'+
        '<table style="width:100%;border-collapse:collapse;font-size:13px">'+
          '<thead><tr style="border-bottom:2px solid var(--border)">'+
            '<th style="text-align:left;padding:8px 10px;color:var(--text-muted)">Order #</th>'+
            '<th style="text-align:left;padding:8px 10px;color:var(--text-muted)">Date</th>'+
            '<th style="text-align:left;padding:8px 10px;color:var(--text-muted)">Customer</th>'+
            '<th style="text-align:left;padding:8px 10px;color:var(--text-muted)">Source</th>'+
            '<th style="text-align:left;padding:8px 10px;color:var(--text-muted)">Status</th>'+
            '<th style="text-align:right;padding:8px 10px;color:var(--text-muted)">Total</th>'+
            '<th style="text-align:right;padding:8px 10px;color:var(--text-muted)">Profit</th>'+
            '<th style="text-align:right;padding:8px 10px;color:var(--text-muted)">Payment</th>'+
            '<th style="text-align:right;padding:8px 10px;color:var(--text-muted)">Actions</th>'+
          '</tr></thead>'+
          '<tbody id="ord-tbody"></tbody>'+
        '</table>'+
      '</div>'+
    '</div>'+

    '<div id="ord-new-pane" style="display:none">'+
      '<div class="card" style="margin-bottom:20px">'+
        '<h3 style="font-size:14px;font-weight:700;margin-bottom:14px" id="ord-form-title">New Order</h3>'+
        '<div class="input-row">'+
          '<div class="field"><label>Order Date</label><input id="ord-date" type="date"></div>'+
          '<div class="field"><label>Source Channel</label><select id="ord-src">'+
            '<option>Etsy</option><option>Facebook</option><option>In Person</option><option>Custom</option>'+
          '</select></div>'+
          '<div class="field"><label>Status</label><select id="ord-status">'+
            '<option>Pending</option><option>In Production</option><option>Ready</option>'+
            '<option>Shipped</option><option>Delivered</option><option>Cancelled</option><option>Refunded</option>'+
          '</select></div>'+
          '<div class="field"><label>Payment Status</label><select id="ord-pay-status">'+
            '<option>Unpaid</option><option>Paid</option><option>Partial</option><option>Refunded</option>'+
          '</select></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field" style="flex:2"><label>Customer</label>'+
            '<select id="ord-cust-select" style="background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 10px;font-size:13px;width:100%">'+
              '<option value="">-- Select Customer --</option>'+
            '</select>'+
          '</div>'+
          '<div class="field" style="flex:2"><label>Notes / Special Instructions</label><input id="ord-notes" placeholder="e.g. Custom engraving: SMITH FAMILY"></div>'+
          '<div class="field"><label>Shipping Cost ($)</label><input id="ord-ship" type="number" step="0.01" value="0"></div>'+
        '</div>'+
      '</div>'+

      '<div class="card" style="margin-bottom:20px">'+
        '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Line Items</h3>'+
        '<div style="display:flex;gap:8px;margin-bottom:12px;align-items:flex-end">'+
          '<div class="field" style="flex:2;margin:0"><label>Product</label>'+
            '<select id="ord-prod-select" style="background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 10px;font-size:13px;width:100%">'+
              '<option value="">-- Select Product --</option>'+
            '</select>'+
          '</div>'+
          '<div class="field" style="margin:0"><label>Qty</label><input id="ord-line-qty" type="number" min="1" value="1" style="width:70px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px;font-size:13px"></div>'+
          '<div class="field" style="margin:0"><label>Unit Price ($)</label><input id="ord-line-price" type="number" step="0.01" value="" style="width:110px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px;font-size:13px" placeholder="Auto"></div>'+
          '<button class="btn btn-primary" id="ord-add-line">Add Item</button>'+
        '</div>'+
        '<div id="ord-lines-list"><div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px" id="ord-lines-empty">No items yet. Add a product above.</div></div>'+
        '<div style="border-top:1px solid var(--border);padding-top:14px;margin-top:8px">'+
          '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px">'+
            '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">SUBTOTAL</div><div style="font-size:18px;font-weight:800;color:var(--text)" id="ord-sub-display">$0.00</div></div>'+
            '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">SHIPPING</div><div style="font-size:18px;font-weight:800;color:var(--text)" id="ord-ship-display">$0.00</div></div>'+
            '<div style="background:var(--bg);border:2px solid var(--accent);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">TOTAL</div><div style="font-size:18px;font-weight:800;color:var(--accent)" id="ord-total-display">$0.00</div></div>'+
            '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">COGS</div><div style="font-size:18px;font-weight:800;color:var(--red)" id="ord-cogs-display">$0.00</div></div>'+
            '<div style="background:var(--bg);border:2px solid var(--green);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">PROFIT</div><div style="font-size:18px;font-weight:800;color:var(--green)" id="ord-profit-display">$0.00</div></div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;gap:8px"><button class="btn btn-primary" id="ord-save-btn">Save Order</button><button class="btn btn-ghost" id="ord-cancel-btn">Cancel</button></div>'+
    '</div>'+

    '<div id="ord-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;align-items:center;justify-content:center">'+
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;width:min(700px,94vw);max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.5)">'+
        '<button id="ord-modal-x" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;color:var(--text-muted);cursor:pointer">x</button>'+
        '<div id="ord-modal-body"></div>'+
        '<div style="display:flex;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">'+
          '<button class="btn btn-primary" id="ord-modal-print" onclick="window.print()">Print Invoice</button>'+
          '<button class="btn btn-ghost" id="ord-modal-close">Close</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  frame.appendChild(panel);

  var orders=[], products=[], customers=[], lineItems=[], editId=null;
  function g(id){return document.getElementById(id);}
  function esc(v){return String(v===undefined||v===null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  var STATUS_COLORS={
    'Pending':'background:var(--gold);color:#000',
    'In Production':'background:var(--teal);color:#fff',
    'Ready':'background:var(--green);color:#fff',
    'Shipped':'background:var(--accent);color:#fff',
    'Delivered':'background:#059669;color:#fff',
    'Cancelled':'background:var(--red);color:#fff',
    'Refunded':'background:var(--text-muted);color:#fff'
  };
  var PAY_COLORS={
    'Paid':'background:var(--green);color:#fff',
    'Unpaid':'background:var(--red);color:#fff',
    'Partial':'background:var(--gold);color:#000',
    'Refunded':'background:var(--text-muted);color:#fff'
  };

  function switchTab(tab){
    if(tab==='list'){
      g('ord-list-pane').style.display='';g('ord-new-pane').style.display='none';
      g('ord-tab-list').style.cssText='padding:10px 28px;background:none;border:none;border-bottom:3px solid var(--accent);color:var(--accent);font-weight:700;font-size:14px;cursor:pointer;margin-bottom:-2px';
      g('ord-tab-new').style.cssText='padding:10px 28px;background:none;border:none;border-bottom:3px solid transparent;color:var(--text-muted);font-weight:600;font-size:14px;cursor:pointer;margin-bottom:-2px';
    }else{
      g('ord-list-pane').style.display='none';g('ord-new-pane').style.display='';
      g('ord-tab-new').style.cssText='padding:10px 28px;background:none;border:none;border-bottom:3px solid var(--accent);color:var(--accent);font-weight:700;font-size:14px;cursor:pointer;margin-bottom:-2px';
      g('ord-tab-list').style.cssText='padding:10px 28px;background:none;border:none;border-bottom:3px solid transparent;color:var(--text-muted);font-weight:600;font-size:14px;cursor:pointer;margin-bottom:-2px';
    }
  }
  g('ord-tab-list').addEventListener('click',function(){switchTab('list');});
  g('ord-tab-new').addEventListener('click',function(){clearForm();switchTab('new');});
  g('ord-new-btn').addEventListener('click',function(){clearForm();switchTab('new');});

  function generateOrderNumber(){
    var y=new Date().getFullYear();
    var used=orders.map(function(o){return o.orderNumber||'';});
    var max=0;
    used.forEach(function(n){var m=n.match(/ORD-\d+-(\d+)/);if(m)max=Math.max(max,parseInt(m[1]));});
    return 'ORD-'+y+'-'+String(max+1).padStart(4,'0');
  }

  function recalcTotals(){
    var sub=lineItems.reduce(function(s,l){return s+(l.qty||1)*(l.unitPrice||0);},0);
    var ship=parseFloat(g('ord-ship').value)||0;
    var total=sub+ship;
    var cogs=lineItems.reduce(function(s,l){return s+(l.qty||1)*(l.unitCogs||0);},0);
    var profit=total-cogs-ship;
    g('ord-sub-display').textContent='$'+sub.toFixed(2);
    g('ord-ship-display').textContent='$'+ship.toFixed(2);
    g('ord-total-display').textContent='$'+total.toFixed(2);
    g('ord-cogs-display').textContent='$'+cogs.toFixed(2);
    g('ord-profit-display').textContent='$'+profit.toFixed(2);
    g('ord-profit-display').style.color=profit>=0?'var(--green)':'var(--red)';
    return {sub:sub,ship:ship,total:total,cogs:cogs,profit:profit};
  }
  g('ord-ship').addEventListener('input',recalcTotals);

  function renderLines(){
    var container=g('ord-lines-list');
    var empty=g('ord-lines-empty');
    container.querySelectorAll('.ord-line-row').forEach(function(r){r.remove();});
    if(lineItems.length===0){empty.style.display='';return;}
    empty.style.display='none';
    lineItems.forEach(function(l,idx){
      var row=document.createElement('div');
      row.className='ord-line-row';
      row.style.cssText='display:flex;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:6px';
      row.innerHTML=
        '<div style="flex:2;min-width:0">'+
          '<div style="font-size:13px;font-weight:700">'+esc(l.productName)+'</div>'+
          '<div style="font-size:11px;color:var(--text-muted)">COGS: $'+Number(l.unitCogs||0).toFixed(2)+' each</div>'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:6px">'+
          '<label style="font-size:11px;color:var(--text-muted)">Qty</label>'+
          '<input type="number" min="1" value="'+l.qty+'" style="width:60px;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:6px 8px;font-size:13px" data-idx="'+idx+'" data-field="qty">'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:6px">'+
          '<label style="font-size:11px;color:var(--text-muted)">Price</label>'+
          '<input type="number" step="0.01" value="'+l.unitPrice+'" style="width:90px;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:6px 8px;font-size:13px" data-idx="'+idx+'" data-field="price">'+
        '</div>'+
        '<div style="font-size:13px;font-weight:800;color:var(--accent);width:80px;text-align:right">$'+((l.qty||1)*(l.unitPrice||0)).toFixed(2)+'</div>'+
        '<button class="btn btn-danger btn-sm ol-del" data-idx="'+idx+'">x</button>';
      container.appendChild(row);
    });
    container.querySelectorAll('input[data-idx]').forEach(function(inp){
      inp.addEventListener('input',function(){
        var i=parseInt(inp.dataset.idx);
        if(inp.dataset.field==='qty')lineItems[i].qty=parseFloat(inp.value)||1;
        else lineItems[i].unitPrice=parseFloat(inp.value)||0;
        renderLines();recalcTotals();
      });
    });
    container.querySelectorAll('.ol-del').forEach(function(btn){
      btn.addEventListener('click',function(){lineItems.splice(parseInt(btn.dataset.idx),1);renderLines();recalcTotals();});
    });
  }

  g('ord-prod-select').addEventListener('change',function(){
    var pid=g('ord-prod-select').value;
    var prod=products.find(function(p){return p.id===pid;});
    if(prod)g('ord-line-price').value=Number(prod.salePrice||0).toFixed(2);
    else g('ord-line-price').value='';
  });

  g('ord-add-line').addEventListener('click',function(){
    var pid=g('ord-prod-select').value;if(!pid)return;
    var prod=products.find(function(p){return p.id===pid;});if(!prod)return;
    var qty=parseFloat(g('ord-line-qty').value)||1;
    var price=parseFloat(g('ord-line-price').value);
    if(isNaN(price))price=Number(prod.salePrice||0);
    var ex=lineItems.find(function(l){return l.productId===pid;});
    if(ex){ex.qty+=qty;}
    else{lineItems.push({productId:pid,productName:prod.name,unitPrice:price,unitCogs:Number(prod.cogs||0),qty:qty});}
    g('ord-line-qty').value=1;g('ord-line-price').value='';
    renderLines();recalcTotals();
  });

  function clearForm(){
    editId=null;g('ord-form-title').textContent='New Order';
    g('ord-date').value=new Date().toISOString().slice(0,10);
    g('ord-src').value='Etsy';g('ord-status').value='Pending';g('ord-pay-status').value='Unpaid';
    g('ord-cust-select').value='';g('ord-notes').value='';g('ord-ship').value=0;
    lineItems=[];renderLines();recalcTotals();
  }

  function showModal(id){
    var o=orders.find(function(x){return x.id===id;});if(!o)return;
    var cust=customers.find(function(c){return c.id===o.customerId;});
    var sc=STATUS_COLORS[o.status]||'background:var(--surface)';
    var pc=PAY_COLORS[o.paymentStatus]||'background:var(--surface)';
    g('ord-modal-body').innerHTML=
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-right:30px">'+
        '<div>'+
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px">Invoice</div>'+
          '<div style="font-size:24px;font-weight:900;color:var(--accent)">'+esc(o.orderNumber)+'</div>'+
          '<div style="font-size:12px;color:var(--text-muted);margin-top:2px">'+esc(o.date)+' &bull; '+esc(o.source)+'</div>'+
        '</div>'+
        '<div style="text-align:right">'+
          '<span style="'+sc+';padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700;margin-bottom:4px;display:inline-block">'+esc(o.status)+'</span><br>'+
          '<span style="'+pc+';padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700;display:inline-block">'+esc(o.paymentStatus)+'</span>'+
        '</div>'+
      '</div>'+
      (cust?
        '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:16px">'+
          '<div style="font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-bottom:4px">Customer</div>'+
          '<div style="font-weight:700">'+esc(cust.name)+'</div>'+
          (cust.email?'<div style="font-size:12px;color:var(--text-muted)">'+esc(cust.email)+'</div>':'')+
          (cust.address?'<div style="font-size:12px;color:var(--text-muted)">'+esc(cust.address)+'</div>':'')+
        '</div>':'')+
      '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px">'+
        '<thead><tr style="border-bottom:2px solid var(--border)">'+
          '<th style="text-align:left;padding:6px 8px;color:var(--text-muted)">Product</th>'+
          '<th style="text-align:center;padding:6px 8px;color:var(--text-muted)">Qty</th>'+
          '<th style="text-align:right;padding:6px 8px;color:var(--text-muted)">Unit Price</th>'+
          '<th style="text-align:right;padding:6px 8px;color:var(--text-muted)">Line Total</th>'+
        '</tr></thead>'+
        '<tbody>'+
        (o.lineItems||[]).map(function(l){
          return '<tr style="border-bottom:1px solid var(--border)">'+
            '<td style="padding:8px 8px;font-weight:600">'+esc(l.productName)+'</td>'+
            '<td style="padding:8px 8px;text-align:center">'+l.qty+'</td>'+
            '<td style="padding:8px 8px;text-align:right;color:var(--text-muted)">$'+Number(l.unitPrice||0).toFixed(2)+'</td>'+
            '<td style="padding:8px 8px;text-align:right;font-weight:700">$'+((l.qty||1)*(l.unitPrice||0)).toFixed(2)+'</td>'+
          '</tr>';
        }).join('')+
        '</tbody>'+
      '</table>'+
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-bottom:16px">'+
        '<div style="font-size:13px">Subtotal: <strong>$'+Number(o.subtotal||0).toFixed(2)+'</strong></div>'+
        '<div style="font-size:13px">Shipping: <strong>$'+Number(o.shipping||0).toFixed(2)+'</strong></div>'+
        '<div style="font-size:16px;font-weight:800;color:var(--accent)">Total: $'+Number(o.total||0).toFixed(2)+'</div>'+
        '<div style="font-size:12px;color:var(--text-muted)">COGS: $'+Number(o.cogs||0).toFixed(2)+' &bull; Profit: <span style="color:var(--green);font-weight:700">$'+Number(o.profit||0).toFixed(2)+'</span></div>'+
      '</div>'+
      (o.notes?'<div style="font-size:12px;color:var(--text-muted);background:var(--bg);padding:10px;border-radius:8px;border:1px solid var(--border)">Notes: '+esc(o.notes)+'</div>':'')+
      '<div style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:14px">Just Jane Maker Lab &mdash; Beaconsfield, QC</div>';
    g('ord-modal').style.display='flex';
  }

  g('ord-modal').addEventListener('click',function(e){if(e.target===g('ord-modal'))g('ord-modal').style.display='none';});
  g('ord-modal-x').addEventListener('click',function(){g('ord-modal').style.display='none';});
  g('ord-modal-close').addEventListener('click',function(){g('ord-modal').style.display='none';});

  async function load(){
    try{products=await window.makerAPI.readData(PROD_FILE)||[];}catch(e){products=[];}
    try{customers=await window.makerAPI.readData(CUST_FILE)||[];}catch(e){customers=[];}
    try{orders=await window.makerAPI.readData(FILE)||[];}catch(e){orders=[];}
    var psel=g('ord-prod-select');
    psel.innerHTML='<option value="">-- Select Product --</option>';
    products.forEach(function(p){psel.innerHTML+='<option value="'+p.id+'">'+esc(p.name)+' ($'+Number(p.salePrice||0).toFixed(2)+')</option>';});
    var csel=g('ord-cust-select');
    csel.innerHTML='<option value="">-- Select Customer --</option>';
    customers.forEach(function(c){csel.innerHTML+='<option value="'+c.id+'">'+esc(c.name)+' ('+esc(c.source)+')</option>';});
    var today=new Date().toISOString().slice(0,10);
    if(!g('ord-date').value)g('ord-date').value=today;
    renderList();
  }
  async function sv(){await window.makerAPI.writeData(FILE,orders);}

  function renderList(){
    var q=g('ord-search').value.toLowerCase();
    var sf=g('ord-status-filter').value;
    var srcf=g('ord-src-filter').value;
    var fi=orders.filter(function(o){
      if(sf&&o.status!==sf)return false;
      if(srcf&&o.source!==srcf)return false;
      if(q&&JSON.stringify(o).toLowerCase().indexOf(q)<0)return false;
      return true;
    });
    var rev=orders.filter(function(o){return o.status!=='Cancelled'&&o.status!=='Refunded';}).reduce(function(s,o){return s+(o.total||0);},0);
    var prf=orders.filter(function(o){return o.status!=='Cancelled'&&o.status!=='Refunded';}).reduce(function(s,o){return s+(o.profit||0);},0);
    g('ord-total').textContent=orders.length;
    g('ord-revenue').textContent='$'+rev.toFixed(2);
    g('ord-profit').textContent='$'+prf.toFixed(2);
    g('ord-pending-count').textContent=orders.filter(function(o){return o.status==='Pending';}).length;
    var tbody=g('ord-tbody');tbody.innerHTML='';
    if(!fi.length){tbody.innerHTML='<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">No orders yet. Click "+ New Order" to record your first sale.</td></tr>';return;}
    fi.forEach(function(o){
      var cust=customers.find(function(c){return c.id===o.customerId;});
      var sc=STATUS_COLORS[o.status]||'background:var(--surface)';
      var pc=PAY_COLORS[o.paymentStatus]||'background:var(--surface)';
      var row=document.createElement('tr');
      row.style.cssText='border-bottom:1px solid var(--border);cursor:pointer';
      row.innerHTML=
        '<td style="padding:10px 10px;font-weight:800;color:var(--accent)">'+esc(o.orderNumber)+'</td>'+
        '<td style="padding:10px 10px;color:var(--text-muted)">'+esc(o.date)+'</td>'+
        '<td style="padding:10px 10px;font-weight:600">'+esc(cust?cust.name:o.customerName||'—')+'</td>'+
        '<td style="padding:10px 10px"><span style="background:var(--surface);border:1px solid var(--border);border-radius:5px;padding:2px 8px;font-size:11px;font-weight:600">'+esc(o.source)+'</span></td>'+
        '<td style="padding:10px 10px"><span style="'+sc+';padding:2px 10px;border-radius:5px;font-size:11px;font-weight:700">'+esc(o.status)+'</span></td>'+
        '<td style="padding:10px 10px;text-align:right;font-weight:800">$'+Number(o.total||0).toFixed(2)+'</td>'+
        '<td style="padding:10px 10px;text-align:right;font-weight:700;color:var(--green)">$'+Number(o.profit||0).toFixed(2)+'</td>'+
        '<td style="padding:10px 10px;text-align:right"><span style="'+pc+';padding:2px 8px;border-radius:5px;font-size:11px;font-weight:700">'+esc(o.paymentStatus)+'</span></td>'+
        '<td style="padding:10px 10px;text-align:right">'+
          '<div style="display:flex;gap:6px;justify-content:flex-end">'+
            '<button class="btn btn-primary btn-sm ov" data-id="'+o.id+'">Invoice</button>'+
            '<button class="btn btn-danger btn-sm od" data-id="'+o.id+'">Del</button>'+
          '</div>'+
        '</td>';
      row.querySelector('.ov').addEventListener('click',function(e){e.stopPropagation();showModal(o.id);});
      row.querySelector('.od').addEventListener('click',async function(e){e.stopPropagation();if(!confirm('Delete order '+o.orderNumber+'?'))return;orders=orders.filter(function(x){return x.id!==o.id;});await sv();renderList();});
      row.addEventListener('click',function(){showModal(o.id);});
      tbody.appendChild(row);
    });
  }

  g('ord-save-btn').addEventListener('click',async function(){
    if(!lineItems.length){alert('Add at least one product to the order.');return;}
    var totals=recalcTotals();
    var custSel=g('ord-cust-select').value;
    var cust=customers.find(function(c){return c.id===custSel;});
    var obj={
      id:editId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      orderNumber:editId?(orders.find(function(x){return x.id===editId;})||{}).orderNumber||generateOrderNumber():generateOrderNumber(),
      date:g('ord-date').value,source:g('ord-src').value,status:g('ord-status').value,
      paymentStatus:g('ord-pay-status').value,customerId:custSel,
      customerName:cust?cust.name:'',notes:g('ord-notes').value.trim(),
      lineItems:lineItems.map(function(l){return Object.assign({},l);}),
      subtotal:totals.sub,shipping:totals.ship,total:totals.total,cogs:totals.cogs,profit:totals.profit
    };
    if(editId){var idx=orders.findIndex(function(x){return x.id===editId;});if(idx>=0)orders[idx]=obj;}
    else orders.unshift(obj);
    await sv();clearForm();switchTab('list');renderList();
  });
  g('ord-cancel-btn').addEventListener('click',function(){clearForm();switchTab('list');});
  g('ord-search').addEventListener('input',renderList);
  g('ord-status-filter').addEventListener('change',renderList);
  g('ord-src-filter').addEventListener('change',renderList);

  window.__makerInit_orders=load;
})();
