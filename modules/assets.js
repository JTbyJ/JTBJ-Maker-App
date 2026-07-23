(function(){
  var HW_FILE='assets_hw.json';
  var SW_FILE='assets_sw.json';
  var frame=document.getElementById('module-frame');
  var panel=document.createElement('div');
  panel.id='panel-assets';panel.className='module-panel';

  var HW_SEED=[
    {id:'hw001',name:'Creality K1C',category:'3D Printer',status:'Active',brand:'Creality',model:'K1C',serial:'',purchaseDate:'',price:'',warranty:'',notes:'CFS-C multi-filament system'},
    {id:'hw002',name:'Sculpfun Laser Engraver',category:'Laser Engraver',status:'Active',brand:'Sculpfun',model:'',serial:'',purchaseDate:'',price:'',warranty:'',notes:''},
    {id:'hw003',name:'Cricut Machine',category:'Vinyl / Craft Cutter',status:'Active',brand:'Cricut',model:'',serial:'',purchaseDate:'',price:'',warranty:'',notes:'Uses Cricut Design Space software'},
    {id:'hw004',name:'reMarkable Tablet',category:'Tablet',status:'Active',brand:'reMarkable',model:'',serial:'',purchaseDate:'',price:'',warranty:'',notes:'Used for handwritten notes'},
    {id:'hw005',name:'Epson ET-2850',category:'Sublimation Printer',status:'Active',brand:'Epson',model:'ET-2850',serial:'',purchaseDate:'',price:'',warranty:'',notes:'Network name: EPSON052C91'},
    {id:'hw006',name:'HP Color LaserJet Pro MFP M177fw',category:'Colour Laser MFP',status:'Active',brand:'HP',model:'M177fw',serial:'',purchaseDate:'',price:'',warranty:'',notes:'Office printing, scanning, and copying'},
    {id:'hw007',name:'HP ENVY Pro 6400',category:'Inkjet Printer',status:'Active',brand:'HP',model:'ENVY Pro 6400',serial:'',purchaseDate:'',price:'',warranty:'',notes:'Network: HP7B3AF0.lan - driver unavailable'},
    {id:'hw008',name:'HP OfficeJet Pro 8030',category:'Inkjet MFP',status:'Offline',brand:'HP',model:'OfficeJet Pro 8030',serial:'',purchaseDate:'',price:'',warranty:'',notes:'Network: HP8DC08B.lan - driver unavailable'}
  ];

  var SW_SEED=[
    {id:'sw001',name:'Google Workspace Business Starter',purpose:'Email, Drive, Meet, Docs',licenseType:'Subscription',loginEmail:'webb_jane@outlook.com',cost:'110.40',billingCycle:'Annual',renewalDate:'2027-02-24',licenseKey:'',status:'Active',notes:'Business Starter plan'}
  ];

  panel.innerHTML=
    '<div class="page-header"><h2>Assets &amp; Accounts</h2><p>Track hardware equipment, serial numbers, warranties &amp; software subscriptions</p></div>'+
    '<div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--border)">'+
      '<button id="ast-tab-hw" style="padding:10px 28px;background:none;border:none;border-bottom:3px solid var(--accent);color:var(--accent);font-weight:700;font-size:14px;cursor:pointer;margin-bottom:-2px">Hardware</button>'+
      '<button id="ast-tab-sw" style="padding:10px 28px;background:none;border:none;border-bottom:3px solid transparent;color:var(--text-muted);font-weight:600;font-size:14px;cursor:pointer;margin-bottom:-2px">Accounts &amp; Software</button>'+
    '</div>'+

    '<div id="ast-hw-pane">'+
      '<div class="stat-row">'+
        '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="hw-total">0</div><div class="sl">Total Equipment</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--green)" id="hw-active">0</div><div class="sl">Active</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--gold)" id="hw-expiring">0</div><div class="sl">Warranty Expiring (90d)</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--red)" id="hw-offline">0</div><div class="sl">Offline / Inactive</div></div>'+
      '</div>'+
      '<div class="card" style="margin-bottom:20px">'+
        '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="hw-form-title">Add Equipment</h3>'+
        '<div class="input-row">'+
          '<div class="field" style="flex:2"><label>Equipment Name</label><input id="hw-name" placeholder="e.g. Creality K1C"></div>'+
          '<div class="field"><label>Category</label><select id="hw-cat"><option>3D Printer</option><option>Laser Engraver</option><option>Vinyl / Craft Cutter</option><option>Sublimation Printer</option><option>Inkjet Printer</option><option>Colour Laser MFP</option><option>Inkjet MFP</option><option>Creative Tool</option><option>Tablet</option><option>Computer</option><option>Camera</option><option>Other</option></select></div>'+
          '<div class="field"><label>Status</label><select id="hw-status"><option>Active</option><option>Offline</option><option>In Repair</option><option>Retired</option></select></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field"><label>Brand</label><input id="hw-brand" placeholder="e.g. Creality"></div>'+
          '<div class="field"><label>Model</label><input id="hw-model" placeholder="e.g. K1C"></div>'+
          '<div class="field"><label>Serial Number</label><input id="hw-serial" placeholder="e.g. SN123456789"></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field"><label>Purchase Date</label><input id="hw-purchase" type="date"></div>'+
          '<div class="field"><label>Purchase Price (CAD $)</label><input id="hw-price" type="number" step="0.01" placeholder="0.00"></div>'+
          '<div class="field"><label>Warranty Expiry</label><input id="hw-warranty" type="date"></div>'+
        '</div>'+
        '<div class="field" style="margin-bottom:10px"><label>Notes</label><input id="hw-notes" placeholder="e.g. Network name: EPSON052C91, firmware v1.3.4"></div>'+
        '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary" id="hw-save">Save Equipment</button><button class="btn btn-ghost" id="hw-cancel" style="display:none">Cancel</button></div>'+
      '</div>'+
      '<div class="toolbar"><div class="search-box"><input id="hw-search" placeholder="Search equipment..."></div>'+
        '<select id="hw-cat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px"><option value="">All Categories</option><option>3D Printer</option><option>Laser Engraver</option><option>Vinyl / Craft Cutter</option><option>Sublimation Printer</option><option>Inkjet Printer</option><option>Colour Laser MFP</option><option>Inkjet MFP</option><option>Creative Tool</option><option>Tablet</option><option>Computer</option><option>Camera</option><option>Other</option></select>'+
        '<select id="hw-stat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px"><option value="">All Statuses</option><option>Active</option><option>Offline</option><option>In Repair</option><option>Retired</option></select>'+
      '</div>'+
      '<div class="table-wrap"><table><thead><tr><th>Equipment</th><th>Category</th><th>Brand / Model</th><th>Serial #</th><th>Purchase Date</th><th>Price</th><th>Warranty</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead><tbody id="hw-tbody"></tbody></table></div>'+
    '</div>'+

    '<div id="ast-sw-pane" style="display:none">'+
      '<div class="stat-row">'+
        '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="sw-total">0</div><div class="sl">Total Accounts</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--teal)" id="sw-subs">0</div><div class="sl">Subscriptions</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--gold)" id="sw-cost">$0.00</div><div class="sl">Annual Cost (CAD)</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--red)" id="sw-renewing">0</div><div class="sl">Renewing Soon (30d)</div></div>'+
      '</div>'+
      '<div class="card" style="margin-bottom:20px">'+
        '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="sw-form-title">Add Account / Software</h3>'+
        '<div class="input-row">'+
          '<div class="field" style="flex:2"><label>Platform Name</label><input id="sw-name" placeholder="e.g. Adobe Creative Cloud"></div>'+
          '<div class="field" style="flex:2"><label>Purpose</label><input id="sw-purpose" placeholder="e.g. Photo editing, vector design"></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field"><label>License Type</label><select id="sw-license"><option>Subscription</option><option>One-Time</option><option>Free</option><option>Trial</option><option>Open Source</option></select></div>'+
          '<div class="field"><label>Status</label><select id="sw-status"><option>Active</option><option>Inactive</option><option>Cancelled</option><option>Trial</option></select></div>'+
          '<div class="field"><label>Billing Cycle</label><select id="sw-billing"><option>Annual</option><option>Monthly</option><option>One-Time</option><option>N/A</option></select></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field"><label>Login Email / Username</label><input id="sw-login" placeholder="e.g. jane@justjanelab.com"></div>'+
          '<div class="field"><label>Cost (CAD $)</label><input id="sw-cost-in" type="number" step="0.01" placeholder="0.00"></div>'+
          '<div class="field"><label>Renewal Date</label><input id="sw-renewal" type="date"></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field" style="flex:2"><label>License Key / Account ID</label><input id="sw-key" placeholder="e.g. XXXX-XXXX-XXXX-XXXX"></div>'+
          '<div class="field" style="flex:2"><label>Notes</label><input id="sw-notes" placeholder="e.g. Shared with team, renews automatically"></div>'+
        '</div>'+
        '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary" id="sw-save">Save Account</button><button class="btn btn-ghost" id="sw-cancel" style="display:none">Cancel</button></div>'+
      '</div>'+
      '<div class="toolbar"><div class="search-box"><input id="sw-search" placeholder="Search accounts..."></div>'+
        '<select id="sw-type-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px"><option value="">All Types</option><option>Subscription</option><option>One-Time</option><option>Free</option><option>Trial</option><option>Open Source</option></select>'+
        '<select id="sw-stat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px"><option value="">All Statuses</option><option>Active</option><option>Inactive</option><option>Cancelled</option><option>Trial</option></select>'+
      '</div>'+
      '<div class="table-wrap"><table><thead><tr><th>Platform</th><th>Purpose</th><th>License</th><th>Login</th><th>Cost</th><th>Billing</th><th>Renewal</th><th>Status</th><th>Actions</th></tr></thead><tbody id="sw-tbody"></tbody></table></div>'+
    '</div>'+

    '<div id="ast-hw-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;align-items:center;justify-content:center">'+
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;width:min(620px,90vw);max-height:85vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.5)">'+
        '<button id="hw-modal-x" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;color:var(--text-muted);cursor:pointer;line-height:1">x</button>'+
        '<div id="hw-modal-body"></div>'+
        '<div style="display:flex;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">'+
          '<button class="btn btn-primary" id="hw-modal-edit">Edit This Item</button>'+
          '<button class="btn btn-ghost" id="hw-modal-close">Close</button>'+
        '</div>'+
      '</div>'+
    '</div>'+

    '<div id="ast-sw-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;align-items:center;justify-content:center">'+
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;width:min(620px,90vw);max-height:85vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.5)">'+
        '<button id="sw-modal-x" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;color:var(--text-muted);cursor:pointer;line-height:1">x</button>'+
        '<div id="sw-modal-body"></div>'+
        '<div style="display:flex;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">'+
          '<button class="btn btn-primary" id="sw-modal-edit">Edit This Account</button>'+
          '<button class="btn btn-ghost" id="sw-modal-close">Close</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  frame.appendChild(panel);

  var hwItems=[],swItems=[],hwEditId=null,swEditId=null,hwModalId=null,swModalId=null;
  function g(id){return document.getElementById(id);}
  function esc(v){return String(v===undefined||v===null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function mf(label,val){
    if(val===undefined||val===null||val==='')return '';
    return '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px">'+
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px">'+label+'</div>'+
      '<div style="font-size:14px">'+esc(val)+'</div></div>';
  }
  function warrantyBadge(dateStr){
    if(!dateStr)return '';
    var today=new Date();today.setHours(0,0,0,0);
    var exp=new Date(dateStr);
    var days=Math.round((exp-today)/(1000*60*60*24));
    var cls=days<=30?'badge-red':days<=90?'badge-gold':'badge-green';
    var label=days<0?'EXPIRED':days===0?'Expires Today':days+' days';
    return '<span class="badge '+cls+'">'+label+'</span>';
  }

  g('ast-tab-hw').addEventListener('click',function(){
    g('ast-hw-pane').style.display='';g('ast-sw-pane').style.display='none';
    g('ast-tab-hw').style.borderBottomColor='var(--accent)';g('ast-tab-hw').style.color='var(--accent)';g('ast-tab-hw').style.fontWeight='700';
    g('ast-tab-sw').style.borderBottomColor='transparent';g('ast-tab-sw').style.color='var(--text-muted)';g('ast-tab-sw').style.fontWeight='600';
  });
  g('ast-tab-sw').addEventListener('click',function(){
    g('ast-sw-pane').style.display='';g('ast-hw-pane').style.display='none';
    g('ast-tab-sw').style.borderBottomColor='var(--accent)';g('ast-tab-sw').style.color='var(--accent)';g('ast-tab-sw').style.fontWeight='700';
    g('ast-tab-hw').style.borderBottomColor='transparent';g('ast-tab-hw').style.color='var(--text-muted)';g('ast-tab-hw').style.fontWeight='600';
  });

  function showHwModal(id){
    var i=hwItems.find(function(x){return x.id===id;});if(!i)return;
    hwModalId=id;
    var sc={Active:'badge-green',Offline:'badge-red','In Repair':'badge-gold',Retired:'badge-muted'};
    g('hw-modal-body').innerHTML=
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;padding-right:30px">'+
        '<div>'+
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);margin-bottom:4px">'+esc(i.category)+'</div>'+
          '<h3 style="font-size:20px;font-weight:800;margin:0">'+esc(i.name)+'</h3>'+
        '</div>'+
        '<span class="badge '+(sc[i.status]||'')+'">'+esc(i.status)+'</span>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
        mf('Brand',i.brand)+mf('Model',i.model)+
        mf('Serial Number',i.serial)+mf('Purchase Date',i.purchaseDate)+
        mf('Purchase Price',i.price?('$'+Number(i.price).toFixed(2)+' CAD'):'')+
      '</div>'+
      (i.warranty?
        '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-top:10px;display:flex;align-items:center;justify-content:space-between">'+
          '<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px">Warranty Expiry</div>'+
          '<div style="font-size:14px">'+esc(i.warranty)+'</div></div>'+
          warrantyBadge(i.warranty)+
        '</div>':'')+
      (i.notes?'<div style="margin-top:10px">'+mf('Notes',i.notes)+'</div>':'');
    g('ast-hw-modal').style.display='flex';
  }

  function showSwModal(id){
    var i=swItems.find(function(x){return x.id===id;});if(!i)return;
    swModalId=id;
    var sc={Active:'badge-green',Inactive:'badge-muted',Cancelled:'badge-red',Trial:'badge-gold'};
    var lc={Subscription:'badge-accent','One-Time':'badge-teal',Free:'badge-green',Trial:'badge-gold','Open Source':'badge-muted'};
    g('sw-modal-body').innerHTML=
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;padding-right:30px">'+
        '<div>'+
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);margin-bottom:4px">'+esc(i.purpose)+'</div>'+
          '<h3 style="font-size:20px;font-weight:800;margin:0">'+esc(i.name)+'</h3>'+
        '</div>'+
        '<div style="display:flex;gap:6px;flex-direction:column;align-items:flex-end">'+
          '<span class="badge '+(sc[i.status]||'')+'">'+esc(i.status)+'</span>'+
          '<span class="badge '+(lc[i.licenseType]||'')+'">'+esc(i.licenseType)+'</span>'+
        '</div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
        mf('Login Email / Username',i.loginEmail)+mf('Billing Cycle',i.billingCycle)+
        mf('Cost (CAD)',i.cost?'$'+Number(i.cost).toFixed(2)+' / '+i.billingCycle:'')+
        mf('License Key / Account ID',i.licenseKey)+
      '</div>'+
      (i.renewalDate?
        '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-top:10px;display:flex;align-items:center;justify-content:space-between">'+
          '<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px">Renewal Date</div>'+
          '<div style="font-size:14px">'+esc(i.renewalDate)+'</div></div>'+
          warrantyBadge(i.renewalDate)+
        '</div>':'')+
      (i.notes?'<div style="margin-top:10px">'+mf('Notes',i.notes)+'</div>':'');
    g('ast-sw-modal').style.display='flex';
  }

  g('ast-hw-modal').addEventListener('click',function(e){if(e.target===g('ast-hw-modal'))g('ast-hw-modal').style.display='none';});
  g('hw-modal-x').addEventListener('click',function(){g('ast-hw-modal').style.display='none';});
  g('hw-modal-close').addEventListener('click',function(){g('ast-hw-modal').style.display='none';});
  g('hw-modal-edit').addEventListener('click',function(){
    g('ast-hw-modal').style.display='none';
    if(!hwModalId)return;
    var i=hwItems.find(function(x){return x.id===hwModalId;});if(!i)return;
    hwEditId=hwModalId;
    g('hw-name').value=i.name||'';g('hw-cat').value=i.category||'3D Printer';
    g('hw-status').value=i.status||'Active';g('hw-brand').value=i.brand||'';
    g('hw-model').value=i.model||'';g('hw-serial').value=i.serial||'';
    g('hw-purchase').value=i.purchaseDate||'';g('hw-price').value=i.price||'';
    g('hw-warranty').value=i.warranty||'';g('hw-notes').value=i.notes||'';
    g('hw-form-title').textContent='Edit Equipment';g('hw-cancel').style.display='inline-flex';
    g('ast-hw-pane').scrollIntoView({behavior:'smooth',block:'start'});
  });

  g('ast-sw-modal').addEventListener('click',function(e){if(e.target===g('ast-sw-modal'))g('ast-sw-modal').style.display='none';});
  g('sw-modal-x').addEventListener('click',function(){g('ast-sw-modal').style.display='none';});
  g('sw-modal-close').addEventListener('click',function(){g('ast-sw-modal').style.display='none';});
  g('sw-modal-edit').addEventListener('click',function(){
    g('ast-sw-modal').style.display='none';
    if(!swModalId)return;
    var i=swItems.find(function(x){return x.id===swModalId;});if(!i)return;
    swEditId=swModalId;
    g('sw-name').value=i.name||'';g('sw-purpose').value=i.purpose||'';
    g('sw-license').value=i.licenseType||'Subscription';g('sw-status').value=i.status||'Active';
    g('sw-billing').value=i.billingCycle||'Annual';g('sw-login').value=i.loginEmail||'';
    g('sw-cost-in').value=i.cost||'';g('sw-renewal').value=i.renewalDate||'';
    g('sw-key').value=i.licenseKey||'';g('sw-notes').value=i.notes||'';
    g('sw-form-title').textContent='Edit Account';g('sw-cancel').style.display='inline-flex';
    g('ast-sw-pane').scrollIntoView({behavior:'smooth',block:'start'});
    g('ast-tab-sw').click();
  });

  async function load(){
    hwItems=await window.makerAPI.readData(HW_FILE)||[];
    swItems=await window.makerAPI.readData(SW_FILE)||[];
    if(hwItems.length===0){hwItems=HW_SEED;await window.makerAPI.writeData(HW_FILE,hwItems);}
    if(swItems.length===0){swItems=SW_SEED;await window.makerAPI.writeData(SW_FILE,swItems);}
    renderHw();renderSw();
  }

  function renderHw(){
    var q=g('hw-search').value.toLowerCase();
    var cf=g('hw-cat-filter').value;
    var sf=g('hw-stat-filter').value;
    var fi=hwItems.filter(function(i){return(!cf||i.category===cf)&&(!sf||i.status===sf)&&(!q||JSON.stringify(i).toLowerCase().indexOf(q)>-1);});
    g('hw-total').textContent=hwItems.length;
    g('hw-active').textContent=hwItems.filter(function(i){return i.status==='Active';}).length;
    g('hw-offline').textContent=hwItems.filter(function(i){return i.status==='Offline'||i.status==='Retired';}).length;
    var today=new Date();today.setHours(0,0,0,0);
    g('hw-expiring').textContent=hwItems.filter(function(i){
      if(!i.warranty)return false;
      var days=Math.round((new Date(i.warranty)-today)/(1000*60*60*24));
      return days>=0&&days<=90;
    }).length;
    var sc={Active:'badge-green',Offline:'badge-red','In Repair':'badge-gold',Retired:'badge-muted'};
    if(fi.length===0){g('hw-tbody').innerHTML='<tr><td colspan="10" class="empty-state"><p>No equipment yet.</p></td></tr>';return;}
    g('hw-tbody').innerHTML=fi.map(function(i){
      return '<tr data-id="'+i.id+'" style="cursor:pointer" title="Click row to view details">'+
        '<td style="font-weight:600">'+esc(i.name)+'</td>'+
        '<td>'+esc(i.category)+'</td>'+
        '<td>'+esc((i.brand||'')+(i.model?' / '+i.model:''))+'</td>'+
        '<td style="font-family:monospace;font-size:12px">'+esc(i.serial||'--')+'</td>'+
        '<td>'+esc(i.purchaseDate||'')+'</td>'+
        '<td>'+(i.price?'$'+Number(i.price).toFixed(2):'--')+'</td>'+
        '<td>'+(i.warranty?esc(i.warranty)+' '+warrantyBadge(i.warranty):'--')+'</td>'+
        '<td><span class="badge '+(sc[i.status]||'')+'">'+esc(i.status)+'</span></td>'+
        '<td style="font-size:12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(i.notes||'')+'</td>'+
        '<td><button class="btn btn-ghost btn-sm hwe" data-id="'+i.id+'">Edit</button> <button class="btn btn-danger btn-sm hwd" data-id="'+i.id+'">Del</button></td>'+
      '</tr>';
    }).join('');
    panel.querySelectorAll('#hw-tbody tr').forEach(function(tr){
      tr.addEventListener('click',function(e){if(e.target.closest('button'))return;showHwModal(tr.dataset.id);});
    });
    panel.querySelectorAll('.hwe').forEach(function(b){
      b.addEventListener('click',function(){
        var i=hwItems.find(function(x){return x.id===b.dataset.id;});if(!i)return;
        hwEditId=b.dataset.id;
        g('hw-name').value=i.name||'';g('hw-cat').value=i.category||'3D Printer';
        g('hw-status').value=i.status||'Active';g('hw-brand').value=i.brand||'';
        g('hw-model').value=i.model||'';g('hw-serial').value=i.serial||'';
        g('hw-purchase').value=i.purchaseDate||'';g('hw-price').value=i.price||'';
        g('hw-warranty').value=i.warranty||'';g('hw-notes').value=i.notes||'';
        g('hw-form-title').textContent='Edit Equipment';g('hw-cancel').style.display='inline-flex';
        panel.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
    panel.querySelectorAll('.hwd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this equipment?'))return;
        hwItems=hwItems.filter(function(x){return x.id!==b.dataset.id;});
        await window.makerAPI.writeData(HW_FILE,hwItems);renderHw();
      });
    });
  }

  function renderSw(){
    var q=g('sw-search').value.toLowerCase();
    var tf=g('sw-type-filter').value;
    var sf=g('sw-stat-filter').value;
    var fi=swItems.filter(function(i){return(!tf||i.licenseType===tf)&&(!sf||i.status===sf)&&(!q||JSON.stringify(i).toLowerCase().indexOf(q)>-1);});
    g('sw-total').textContent=swItems.length;
    g('sw-subs').textContent=swItems.filter(function(i){return i.licenseType==='Subscription';}).length;
    var annualCost=swItems.filter(function(i){return i.licenseType==='Subscription'&&i.status==='Active';}).reduce(function(s,i){
      var c=Number(i.cost||0);
      return s+(i.billingCycle==='Monthly'?c*12:i.billingCycle==='Annual'?c:0);
    },0);
    g('sw-cost').textContent='$'+annualCost.toFixed(2);
    var today=new Date();today.setHours(0,0,0,0);
    g('sw-renewing').textContent=swItems.filter(function(i){
      if(!i.renewalDate)return false;
      var days=Math.round((new Date(i.renewalDate)-today)/(1000*60*60*24));
      return days>=0&&days<=30;
    }).length;
    var sc={Active:'badge-green',Inactive:'badge-muted',Cancelled:'badge-red',Trial:'badge-gold'};
    if(fi.length===0){g('sw-tbody').innerHTML='<tr><td colspan="9" class="empty-state"><p>No accounts yet.</p></td></tr>';return;}
    g('sw-tbody').innerHTML=fi.map(function(i){
      return '<tr data-id="'+i.id+'" style="cursor:pointer" title="Click row to view details">'+
        '<td style="font-weight:600">'+esc(i.name)+'</td>'+
        '<td>'+esc(i.purpose||'')+'</td>'+
        '<td>'+esc(i.licenseType||'')+'</td>'+
        '<td style="font-size:12px">'+esc(i.loginEmail||'')+'</td>'+
        '<td>'+(i.cost?'$'+Number(i.cost).toFixed(2):'--')+'</td>'+
        '<td>'+esc(i.billingCycle||'')+'</td>'+
        '<td>'+(i.renewalDate?esc(i.renewalDate)+' '+warrantyBadge(i.renewalDate):'--')+'</td>'+
        '<td><span class="badge '+(sc[i.status]||'')+'">'+esc(i.status)+'</span></td>'+
        '<td><button class="btn btn-ghost btn-sm swe" data-id="'+i.id+'">Edit</button> <button class="btn btn-danger btn-sm swd" data-id="'+i.id+'">Del</button></td>'+
      '</tr>';
    }).join('');
    panel.querySelectorAll('#sw-tbody tr').forEach(function(tr){
      tr.addEventListener('click',function(e){if(e.target.closest('button'))return;showSwModal(tr.dataset.id);});
    });
    panel.querySelectorAll('.swe').forEach(function(b){
      b.addEventListener('click',function(){
        var i=swItems.find(function(x){return x.id===b.dataset.id;});if(!i)return;
        swEditId=b.dataset.id;
        g('sw-name').value=i.name||'';g('sw-purpose').value=i.purpose||'';
        g('sw-license').value=i.licenseType||'Subscription';g('sw-status').value=i.status||'Active';
        g('sw-billing').value=i.billingCycle||'Annual';g('sw-login').value=i.loginEmail||'';
        g('sw-cost-in').value=i.cost||'';g('sw-renewal').value=i.renewalDate||'';
        g('sw-key').value=i.licenseKey||'';g('sw-notes').value=i.notes||'';
        g('sw-form-title').textContent='Edit Account';g('sw-cancel').style.display='inline-flex';
        panel.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
    panel.querySelectorAll('.swd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this account?'))return;
        swItems=swItems.filter(function(x){return x.id!==b.dataset.id;});
        await window.makerAPI.writeData(SW_FILE,swItems);renderSw();
      });
    });
  }

  g('hw-save').addEventListener('click',async function(){
    var name=g('hw-name').value.trim();if(!name)return;
    var obj={id:hwEditId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      name:name,category:g('hw-cat').value,status:g('hw-status').value,
      brand:g('hw-brand').value.trim(),model:g('hw-model').value.trim(),
      serial:g('hw-serial').value.trim(),purchaseDate:g('hw-purchase').value,
      price:g('hw-price').value,warranty:g('hw-warranty').value,notes:g('hw-notes').value.trim()};
    if(hwEditId){var idx=hwItems.findIndex(function(x){return x.id===hwEditId;});if(idx>=0)hwItems[idx]=obj;}else hwItems.unshift(obj);
    hwEditId=null;g('hw-form-title').textContent='Add Equipment';g('hw-cancel').style.display='none';
    ['hw-name','hw-brand','hw-model','hw-serial','hw-price','hw-notes'].forEach(function(id){g(id).value='';});
    g('hw-purchase').value='';g('hw-warranty').value='';
    g('hw-cat').value='3D Printer';g('hw-status').value='Active';
    await window.makerAPI.writeData(HW_FILE,hwItems);renderHw();
  });
  g('hw-cancel').addEventListener('click',function(){hwEditId=null;g('hw-form-title').textContent='Add Equipment';g('hw-cancel').style.display='none';});
  g('hw-search').addEventListener('input',renderHw);g('hw-cat-filter').addEventListener('change',renderHw);g('hw-stat-filter').addEventListener('change',renderHw);

  g('sw-save').addEventListener('click',async function(){
    var name=g('sw-name').value.trim();if(!name)return;
    var obj={id:swEditId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      name:name,purpose:g('sw-purpose').value.trim(),licenseType:g('sw-license').value,
      status:g('sw-status').value,billingCycle:g('sw-billing').value,
      loginEmail:g('sw-login').value.trim(),cost:g('sw-cost-in').value,
      renewalDate:g('sw-renewal').value,licenseKey:g('sw-key').value.trim(),notes:g('sw-notes').value.trim()};
    if(swEditId){var idx=swItems.findIndex(function(x){return x.id===swEditId;});if(idx>=0)swItems[idx]=obj;}else swItems.unshift(obj);
    swEditId=null;g('sw-form-title').textContent='Add Account / Software';g('sw-cancel').style.display='none';
    ['sw-name','sw-purpose','sw-login','sw-cost-in','sw-key','sw-notes'].forEach(function(id){g(id).value='';});
    g('sw-renewal').value='';
    g('sw-license').value='Subscription';g('sw-status').value='Active';g('sw-billing').value='Annual';
    await window.makerAPI.writeData(SW_FILE,swItems);renderSw();
  });
  g('sw-cancel').addEventListener('click',function(){swEditId=null;g('sw-form-title').textContent='Add Account / Software';g('sw-cancel').style.display='none';});
  g('sw-search').addEventListener('input',renderSw);g('sw-type-filter').addEventListener('change',renderSw);g('sw-stat-filter').addEventListener('change',renderSw);

  window.__makerInit_assets=load;
})();
