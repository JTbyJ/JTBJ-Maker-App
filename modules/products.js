(function(){
  var FILE='products.json';
  var INV_FILE='inventory.json';
  var frame=document.getElementById('module-frame');
  var panel=document.createElement('div');
  panel.id='panel-products';panel.className='module-panel';

  panel.innerHTML=
    '<div class="page-header"><h2>Product Builder</h2><p>Build finished products from inventory + labour &mdash; auto COGS &amp; pricing</p></div>'+
    '<div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--border)">'+
      '<button id="prod-tab-list" style="padding:10px 28px;background:none;border:none;border-bottom:3px solid var(--accent);color:var(--accent);font-weight:700;font-size:14px;cursor:pointer;margin-bottom:-2px">Products</button>'+
      '<button id="prod-tab-build" style="padding:10px 28px;background:none;border:none;border-bottom:3px solid transparent;color:var(--text-muted);font-weight:600;font-size:14px;cursor:pointer;margin-bottom:-2px">Build / Edit</button>'+
    '</div>'+
    '<div id="prod-list-pane">'+
      '<div class="stat-row">'+
        '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="prod-total">0</div><div class="sl">Products</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--gold)" id="prod-avg-cogs">$0.00</div><div class="sl">Avg COGS</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--green)" id="prod-avg-margin">0%</div><div class="sl">Avg Margin</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--teal)" id="prod-cats">0</div><div class="sl">Categories</div></div>'+
      '</div>'+
      '<div class="toolbar">'+
        '<div class="search-box"><input id="prod-search" placeholder="Search products..."></div>'+
        '<select id="prod-cat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
          '<option value="">All Categories</option>'+
          '<option>Charcuterie Board</option><option>Sublimation Mug</option><option>Custom Tumbler</option>'+
          '<option>Laser Engraved</option><option>3D Print</option><option>Candle</option>'+
          '<option>Resin</option><option>Gift Set</option><option>Other</option>'+
        '</select>'+
        '<button class="btn btn-primary" id="prod-new-btn">+ New Product</button>'+
      '</div>'+
      '<div id="prod-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;margin-top:16px"></div>'+
    '</div>'+
    '<div id="prod-build-pane" style="display:none">'+
      '<div class="card" style="margin-bottom:20px">'+
        '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="prod-form-title">New Product</h3>'+
        '<div class="input-row">'+
          '<div class="field" style="flex:2"><label>Product Name</label><input id="prod-name" placeholder="e.g. Custom Charcuterie Board - Medium"></div>'+
          '<div class="field"><label>Category</label><select id="prod-cat">'+
            '<option>Charcuterie Board</option><option>Sublimation Mug</option><option>Custom Tumbler</option>'+
            '<option>Laser Engraved</option><option>3D Print</option><option>Candle</option>'+
            '<option>Resin</option><option>Gift Set</option><option>Other</option>'+
          '</select></div>'+
          '<div class="field"><label>SKU / Product Code</label><input id="prod-sku" placeholder="e.g. BLK-CHB-001" style="font-family:monospace;font-weight:700"></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field"><label>Status</label><select id="prod-status"><option>Active</option><option>Draft</option><option>Seasonal</option><option>Discontinued</option></select></div>'+
          '<div class="field"><label>Sale Price (CAD $)</label><input id="prod-price" type="number" step="0.01" placeholder="0.00"></div>'+
          '<div class="field"><label>Etsy Fee (CAD $)</label><input id="prod-etsy-fee" type="number" step="0.01" placeholder="0.00"></div>'+
          '<div class="field"><label>Platforms</label><select id="prod-platform" multiple style="background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:6px;font-size:13px;height:68px">'+
            '<option value="Etsy" selected>Etsy</option><option value="Facebook">Facebook</option>'+
            '<option value="In Person">In Person</option><option value="Custom Order">Custom Order</option>'+
          '</select></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field" style="flex:2"><label>Description</label><input id="prod-desc" placeholder="e.g. Handcrafted walnut charcuterie board, laser engraved with custom monogram"></div>'+
          '<div class="field" style="flex:2"><label>Notes</label><input id="prod-notes" placeholder="e.g. 40 min labour, 15 min laser time, seal with food-safe oil"></div>'+
        '</div>'+
      '</div>'+
      '<div class="card" style="margin-bottom:20px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'+
          '<h3 style="font-size:14px;font-weight:700;margin:0">Bill of Materials</h3>'+
          '<span style="font-size:12px;color:var(--text-muted)">Items from inventory used to make this product</span>'+
        '</div>'+
        '<div style="display:flex;gap:8px;margin-bottom:12px">'+
          '<select id="bom-inv-select" style="flex:2;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 10px;font-size:13px"><option value="">-- Select inventory item --</option></select>'+
          '<input id="bom-qty" type="number" step="0.01" min="0.01" value="1" style="width:80px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px;font-size:13px">'+
          '<button class="btn btn-primary" id="bom-add-btn">Add Item</button>'+
        '</div>'+
        '<div id="bom-list"><div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px" id="bom-empty">No materials added yet.</div></div>'+
        '<div style="border-top:1px solid var(--border);padding-top:14px;margin-top:8px">'+
          '<h4 style="font-size:13px;font-weight:700;margin-bottom:10px">Labour</h4>'+
          '<div class="input-row">'+
            '<div class="field"><label>Labour Hours</label><input id="prod-labour-hrs" type="number" step="0.25" value="0"></div>'+
            '<div class="field"><label>Hourly Rate ($)</label><input id="prod-labour-rate" type="number" step="0.01" value="20"></div>'+
            '<div class="field"><label>Labour Cost</label><div id="prod-labour-cost-display" style="padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;font-weight:700;color:var(--teal)">$0.00</div></div>'+
          '</div>'+
        '</div>'+
        '<div style="border-top:1px solid var(--border);padding-top:14px;margin-top:8px">'+
          '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">'+
            '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">MATERIALS</div><div style="font-size:18px;font-weight:800;color:var(--accent)" id="prod-mat-total">$0.00</div></div>'+
            '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">LABOUR</div><div style="font-size:18px;font-weight:800;color:var(--teal)" id="prod-lab-total">$0.00</div></div>'+
            '<div style="background:var(--bg);border:2px solid var(--accent);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">COGS</div><div style="font-size:18px;font-weight:800;color:var(--accent)" id="prod-cogs-display">$0.00</div></div>'+
            '<div style="background:var(--bg);border:2px solid var(--green);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">MARGIN</div><div style="font-size:18px;font-weight:800;color:var(--green)" id="prod-margin-display">--%</div></div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;gap:8px"><button class="btn btn-primary" id="prod-save-btn">Save Product</button><button class="btn btn-ghost" id="prod-cancel-btn">Cancel</button></div>'+
    '</div>'+
    '<div id="prod-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;align-items:center;justify-content:center">'+
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;width:min(680px,92vw);max-height:88vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.5)">'+
        '<button id="prod-modal-x" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;color:var(--text-muted);cursor:pointer">x</button>'+
        '<div id="prod-modal-body"></div>'+
        '<div style="display:flex;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">'+
          '<button class="btn btn-primary" id="prod-modal-edit">Edit Product</button>'+
          '<button class="btn btn-ghost" id="prod-modal-close">Close</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  frame.appendChild(panel);

  var products=[],invItems=[],bomItems=[],editId=null,modalId=null;
  function g(id){return document.getElementById(id);}
  function esc(v){return String(v===undefined||v===null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  function switchTab(tab){
    if(tab==='list'){
      g('prod-list-pane').style.display='';g('prod-build-pane').style.display='none';
      g('prod-tab-list').style.cssText='padding:10px 28px;background:none;border:none;border-bottom:3px solid var(--accent);color:var(--accent);font-weight:700;font-size:14px;cursor:pointer;margin-bottom:-2px';
      g('prod-tab-build').style.cssText='padding:10px 28px;background:none;border:none;border-bottom:3px solid transparent;color:var(--text-muted);font-weight:600;font-size:14px;cursor:pointer;margin-bottom:-2px';
    }else{
      g('prod-list-pane').style.display='none';g('prod-build-pane').style.display='';
      g('prod-tab-build').style.cssText='padding:10px 28px;background:none;border:none;border-bottom:3px solid var(--accent);color:var(--accent);font-weight:700;font-size:14px;cursor:pointer;margin-bottom:-2px';
      g('prod-tab-list').style.cssText='padding:10px 28px;background:none;border:none;border-bottom:3px solid transparent;color:var(--text-muted);font-weight:600;font-size:14px;cursor:pointer;margin-bottom:-2px';
    }
  }
  g('prod-tab-list').addEventListener('click',function(){switchTab('list');});
  g('prod-tab-build').addEventListener('click',function(){switchTab('build');});
  g('prod-new-btn').addEventListener('click',function(){clearBuildForm();switchTab('build');});

  function recalcCosts(){
    var matTotal=bomItems.reduce(function(s,b){return s+(b.unitCost||0)*(b.qty||1);},0);
    var hrs=parseFloat(g('prod-labour-hrs').value)||0;
    var rate=parseFloat(g('prod-labour-rate').value)||0;
    var labTotal=hrs*rate;
    var cogs=matTotal+labTotal;
    var price=parseFloat(g('prod-price').value)||0;
    var fee=parseFloat(g('prod-etsy-fee').value)||0;
    var margin=price>0?((price-fee-cogs)/(price-fee)*100):0;
    g('prod-labour-cost-display').textContent='$'+labTotal.toFixed(2);
    g('prod-mat-total').textContent='$'+matTotal.toFixed(2);
    g('prod-lab-total').textContent='$'+labTotal.toFixed(2);
    g('prod-cogs-display').textContent='$'+cogs.toFixed(2);
    g('prod-margin-display').textContent=margin.toFixed(1)+'%';
    g('prod-margin-display').style.color=margin>=40?'var(--green)':margin>=20?'var(--gold)':'var(--red)';
    return {matTotal:matTotal,labTotal:labTotal,cogs:cogs,margin:margin};
  }
  ['prod-labour-hrs','prod-labour-rate','prod-price','prod-etsy-fee'].forEach(function(id){g(id).addEventListener('input',recalcCosts);});

  function renderBOM(){
    var container=g('bom-list');
    var empty=g('bom-empty');
    if(bomItems.length===0){empty.style.display='';container.querySelectorAll('.bom-row').forEach(function(r){r.remove();});return;}
    empty.style.display='none';
    container.querySelectorAll('.bom-row').forEach(function(r){r.remove();});
    bomItems.forEach(function(b,idx){
      var row=document.createElement('div');
      row.className='bom-row';
      row.style.cssText='display:flex;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:6px';
      row.innerHTML=
        '<div style="flex:2;min-width:0"><div style="font-size:13px;font-weight:600">'+esc(b.name)+'</div>'+
        '<div style="font-size:11px;color:var(--text-muted)">'+esc(b.sku||'')+(b.unitCost?' &bull; $'+Number(b.unitCost).toFixed(2)+'/unit':'')+'</div></div>'+
        '<input type="number" step="0.01" min="0.01" value="'+b.qty+'" style="width:70px;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:6px 8px;font-size:13px" data-idx="'+idx+'">'+
        '<div style="font-size:13px;font-weight:700;color:var(--accent);width:70px;text-align:right">$'+((b.unitCost||0)*(b.qty||1)).toFixed(2)+'</div>'+
        '<button class="btn btn-danger btn-sm bom-del" data-idx="'+idx+'">x</button>';
      container.appendChild(row);
    });
    container.querySelectorAll('input[data-idx]').forEach(function(inp){
      inp.addEventListener('input',function(){bomItems[parseInt(inp.dataset.idx)].qty=parseFloat(inp.value)||1;renderBOM();recalcCosts();});
    });
    container.querySelectorAll('.bom-del').forEach(function(btn){
      btn.addEventListener('click',function(){bomItems.splice(parseInt(btn.dataset.idx),1);renderBOM();recalcCosts();});
    });
  }

  g('bom-add-btn').addEventListener('click',function(){
    var invId=g('bom-inv-select').value;if(!invId)return;
    var inv=invItems.find(function(i){return i.id===invId;});if(!inv)return;
    var qty=parseFloat(g('bom-qty').value)||1;
    var ex=bomItems.find(function(b){return b.invId===invId;});
    if(ex){ex.qty+=qty;}else{bomItems.push({invId:invId,name:inv.name,sku:inv.sku,unitCost:Number(inv.cost)||0,qty:qty});}
    g('bom-qty').value=1;renderBOM();recalcCosts();
  });

  async function loadInventory(){
    try{invItems=await window.makerAPI.readData(INV_FILE)||[];}catch(e){invItems=[];}
    var sel=g('bom-inv-select');
    sel.innerHTML='<option value="">-- Select inventory item --</option>';
    invItems.forEach(function(i){sel.innerHTML+='<option value="'+i.id+'">['+esc(i.cat||'')+'] '+esc(i.name)+' - $'+Number(i.cost||0).toFixed(2)+'</option>';});
  }

  function clearBuildForm(){
    editId=null;g('prod-form-title').textContent='New Product';
    g('prod-name').value='';g('prod-cat').value='Charcuterie Board';g('prod-sku').value='';
    g('prod-status').value='Active';g('prod-price').value='';g('prod-etsy-fee').value='';
    g('prod-desc').value='';g('prod-notes').value='';g('prod-labour-hrs').value=0;g('prod-labour-rate').value=20;
    var opts=g('prod-platform').options;for(var i=0;i<opts.length;i++){opts[i].selected=opts[i].value==='Etsy';}
    bomItems=[];renderBOM();recalcCosts();
  }

  function showModal(id){
    var p=products.find(function(x){return x.id===id;});if(!p)return;
    modalId=id;
    var sc={Active:'badge-green',Draft:'badge-muted',Seasonal:'badge-gold',Discontinued:'badge-red'};
    g('prod-modal-body').innerHTML=
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;padding-right:30px">'+
        '<div><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--accent);margin-bottom:4px">'+esc(p.category)+'</div>'+
        '<h3 style="font-size:20px;font-weight:800;margin:0 0 4px">'+esc(p.name)+'</h3>'+
        (p.sku?'<code style="font-size:12px;color:var(--accent)">'+esc(p.sku)+'</code>':'')+
        '</div><span class="badge '+(sc[p.status]||'')+'">'+esc(p.status)+'</span></div>'+
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">'+
        '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">SALE PRICE</div><div style="font-size:18px;font-weight:800;color:var(--accent)">$'+Number(p.salePrice||0).toFixed(2)+'</div></div>'+
        '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">COGS</div><div style="font-size:18px;font-weight:800;color:var(--red)">$'+Number(p.cogs||0).toFixed(2)+'</div></div>'+
        '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">MARGIN</div><div style="font-size:18px;font-weight:800;color:var(--green)">'+Number(p.margin||0).toFixed(1)+'%</div></div>'+
        '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">LABOUR</div><div style="font-size:18px;font-weight:800;color:var(--teal)">$'+Number(p.labourCost||0).toFixed(2)+'</div></div>'+
      '</div>'+
      (p.description?'<div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;font-style:italic">'+esc(p.description)+'</div>':'')+
      '<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">Bill of Materials</div>'+
      ((p.bom||[]).length?
        '<table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="color:var(--text-muted);border-bottom:1px solid var(--border)"><th style="text-align:left;padding:4px 6px">Item</th><th style="text-align:right;padding:4px 6px">Qty</th><th style="text-align:right;padding:4px 6px">Unit Cost</th><th style="text-align:right;padding:4px 6px">Line Total</th></tr>'+
        (p.bom||[]).map(function(b){return '<tr style="border-bottom:1px solid var(--border)"><td style="padding:5px 6px;font-weight:600">'+esc(b.name)+'</td><td style="padding:5px 6px;text-align:right">'+b.qty+'</td><td style="padding:5px 6px;text-align:right;color:var(--text-muted)">$'+Number(b.unitCost||0).toFixed(2)+'</td><td style="padding:5px 6px;text-align:right;font-weight:700;color:var(--accent)">$'+(Number(b.unitCost||0)*Number(b.qty||1)).toFixed(2)+'</td></tr>';}).join('')+
        '</table>':'<div style="color:var(--text-muted);font-size:13px">No materials recorded.</div>')+
      '</div>'+
      (p.platforms&&p.platforms.length?'<div style="font-size:12px;color:var(--text-muted)">Sold on: <strong>'+p.platforms.join(', ')+'</strong></div>':'')+
      (p.notes?'<div style="margin-top:8px;font-size:12px;color:var(--text-muted)">Notes: '+esc(p.notes)+'</div>':'');
    g('prod-modal').style.display='flex';
  }

  g('prod-modal').addEventListener('click',function(e){if(e.target===g('prod-modal'))g('prod-modal').style.display='none';});
  g('prod-modal-x').addEventListener('click',function(){g('prod-modal').style.display='none';});
  g('prod-modal-close').addEventListener('click',function(){g('prod-modal').style.display='none';});
  g('prod-modal-edit').addEventListener('click',function(){
    g('prod-modal').style.display='none';
    if(!modalId)return;
    var p=products.find(function(x){return x.id===modalId;});if(!p)return;
    editId=modalId;
    g('prod-form-title').textContent='Edit Product';g('prod-name').value=p.name||'';g('prod-cat').value=p.category||'Other';
    g('prod-sku').value=p.sku||'';g('prod-status').value=p.status||'Active';g('prod-price').value=p.salePrice||'';
    g('prod-etsy-fee').value=p.etsyFee||'';g('prod-desc').value=p.description||'';g('prod-notes').value=p.notes||'';
    g('prod-labour-hrs').value=p.labourHrs||0;g('prod-labour-rate').value=p.labourRate||20;
    var opts=g('prod-platform').options;var plats=p.platforms||[];
    for(var i=0;i<opts.length;i++){opts[i].selected=plats.indexOf(opts[i].value)>=0;}
    bomItems=(p.bom||[]).map(function(b){return Object.assign({},b);});
    renderBOM();recalcCosts();switchTab('build');
  });

  async function load(){
    await loadInventory();
    try{products=await window.makerAPI.readData(FILE)||[];}catch(e){products=[];}
    renderList();
  }
  async function sv(){await window.makerAPI.writeData(FILE,products);}

  function renderList(){
    var q=g('prod-search').value.toLowerCase();
    var cf=g('prod-cat-filter').value;
    var fi=products.filter(function(p){return(!cf||p.category===cf)&&(!q||JSON.stringify(p).toLowerCase().indexOf(q)>-1);});
    g('prod-total').textContent=products.length;
    g('prod-avg-cogs').textContent='$'+(products.length?products.reduce(function(s,p){return s+(p.cogs||0);},0)/products.length:0).toFixed(2);
    var wm=products.filter(function(p){return p.margin!=null;});
    g('prod-avg-margin').textContent=(wm.length?wm.reduce(function(s,p){return s+(p.margin||0);},0)/wm.length:0).toFixed(1)+'%';
    g('prod-cats').textContent=new Set(products.map(function(p){return p.category;})).size;
    if(!fi.length){g('prod-grid').innerHTML='<div style="color:var(--text-muted);font-size:14px;grid-column:1/-1;text-align:center;padding:40px">No products yet. Click "+ New Product" to build your first one.</div>';return;}
    var sc={Active:'badge-green',Draft:'badge-muted',Seasonal:'badge-gold',Discontinued:'badge-red'};
    g('prod-grid').innerHTML=fi.map(function(p){
      var mc=Number(p.margin||0)>=40?'var(--green)':Number(p.margin||0)>=20?'var(--gold)':'var(--red)';
      return '<div class="card" data-id="'+p.id+'" style="cursor:pointer;display:flex;flex-direction:column">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'+
          '<div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--accent);margin-bottom:2px">'+esc(p.category)+'</div>'+
          '<div style="font-size:16px;font-weight:700">'+esc(p.name)+'</div>'+
          (p.sku?'<code style="font-size:11px;color:var(--text-muted)">'+esc(p.sku)+'</code>':'')+'</div>'+
          '<span class="badge '+(sc[p.status]||'')+'">'+esc(p.status)+'</span></div>'+
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">'+
          '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:10px;color:var(--text-muted)">Price</div><div style="font-weight:800;color:var(--accent)">$'+Number(p.salePrice||0).toFixed(2)+'</div></div>'+
          '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:10px;color:var(--text-muted)">COGS</div><div style="font-weight:800;color:var(--red)">$'+Number(p.cogs||0).toFixed(2)+'</div></div>'+
          '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:10px;color:var(--text-muted)">Margin</div><div style="font-weight:800;color:'+mc+'">'+Number(p.margin||0).toFixed(1)+'%</div></div>'+
        '</div>'+
        (p.description?'<div style="font-size:12px;color:var(--text-muted);font-style:italic;margin-bottom:8px;flex:1">'+esc(p.description.substring(0,100))+'</div>':'<div style="flex:1"></div>')+
        '<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">'+((p.bom||[]).length)+' material'+(((p.bom||[]).length)===1?'':'s')+' &bull; '+(p.labourHrs||0)+'h labour &bull; '+(p.platforms||[]).join(', ')+'</div>'+
        '<div style="display:flex;gap:8px;border-top:1px solid var(--border);padding-top:10px">'+
          '<button class="btn btn-primary btn-sm prodv" data-id="'+p.id+'" style="flex:1">View Details</button>'+
          '<button class="btn btn-ghost btn-sm prode" data-id="'+p.id+'">Edit</button>'+
          '<button class="btn btn-danger btn-sm prodd" data-id="'+p.id+'">Del</button>'+
        '</div></div>';
    }).join('');
    panel.querySelectorAll('#prod-grid .card').forEach(function(c){c.addEventListener('click',function(e){if(e.target.closest('button'))return;showModal(c.dataset.id);});});
    panel.querySelectorAll('.prodv').forEach(function(b){b.addEventListener('click',function(){showModal(b.dataset.id);});});
    panel.querySelectorAll('.prode').forEach(function(b){
      b.addEventListener('click',function(){
        modalId=b.dataset.id;g('prod-modal-edit').click();
      });
    });
    panel.querySelectorAll('.prodd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this product?'))return;
        products=products.filter(function(x){return x.id!==b.dataset.id;});await sv();renderList();
      });
    });
  }

  g('prod-save-btn').addEventListener('click',async function(){
    var name=g('prod-name').value.trim();if(!name){alert('Product name is required.');return;}
    var costs=recalcCosts();
    var platforms=[];var opts=g('prod-platform').options;
    for(var i=0;i<opts.length;i++){if(opts[i].selected)platforms.push(opts[i].value);}
    var obj={
      id:editId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      name:name,category:g('prod-cat').value,sku:g('prod-sku').value.trim(),status:g('prod-status').value,
      platforms:platforms,salePrice:parseFloat(g('prod-price').value)||0,etsyFee:parseFloat(g('prod-etsy-fee').value)||0,
      description:g('prod-desc').value.trim(),notes:g('prod-notes').value.trim(),
      labourHrs:parseFloat(g('prod-labour-hrs').value)||0,labourRate:parseFloat(g('prod-labour-rate').value)||20,
      labourCost:costs.labTotal,materialCost:costs.matTotal,cogs:costs.cogs,margin:costs.margin,
      bom:bomItems.map(function(b){return Object.assign({},b);})
    };
    if(editId){var idx=products.findIndex(function(x){return x.id===editId;});if(idx>=0)products[idx]=obj;}
    else products.unshift(obj);
    await sv();clearBuildForm();switchTab('list');renderList();
  });
  g('prod-cancel-btn').addEventListener('click',function(){clearBuildForm();switchTab('list');});
  g('prod-search').addEventListener('input',renderList);
  g('prod-cat-filter').addEventListener('change',renderList);

  window.__makerInit_products=load;
})();