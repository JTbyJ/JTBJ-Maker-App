(function(){
  var MAT_FILE='laser_mat.json';
  var LB_FILE='laser_lb.json';
  var LOG_FILE='laser_log.json';
  var frame=document.getElementById('module-frame');
  var panel=document.createElement('div');
  panel.id='panel-laser';panel.className='module-panel';

  var MAT_SEED=[
    {id:'lm001',material:'Birch Plywood',thickness:'3mm',mode:'Cut',speed:15,power:80,passes:2,freq:'',airAssist:'Yes',result:'Good',notes:'Clean cut, slight charring on back. Mask recommended.'},
    {id:'lm002',material:'Birch Plywood',thickness:'3mm',mode:'Engrave',speed:300,power:45,passes:1,freq:'',airAssist:'Yes',result:'Excellent',notes:'Deep, clean engraving. Good contrast.'},
    {id:'lm003',material:'Acrylic (Clear)',thickness:'3mm',mode:'Cut',speed:8,power:90,passes:2,freq:'',airAssist:'Yes',result:'Good',notes:'Clean edges, remove paper mask before engraving.'},
    {id:'lm004',material:'Acrylic (Coloured)',thickness:'3mm',mode:'Engrave',speed:400,power:30,passes:1,freq:'',airAssist:'No',result:'Excellent',notes:'Frosted finish. Air assist can cause micro-cracks.'},
    {id:'lm005',material:'Slate',thickness:'',mode:'Engrave',speed:200,power:80,passes:1,freq:'',airAssist:'No',result:'Excellent',notes:'White contrast. No masking needed. Clean with damp cloth after.'},
    {id:'lm006',material:'Leather (Genuine)',thickness:'2mm',mode:'Engrave',speed:250,power:50,passes:1,freq:'',airAssist:'Yes',result:'Good',notes:'Light burnt smell. Test first, leather varies by tannage.'},
    {id:'lm007',material:'Ceramic Tile (White)',thickness:'',mode:'Engrave',speed:200,power:70,passes:1,freq:'',airAssist:'No',result:'Good',notes:'Apply black paint coat first, laser removes paint to reveal white.'},
    {id:'lm008',material:'Cork',thickness:'3mm',mode:'Engrave',speed:400,power:35,passes:1,freq:'',airAssist:'Yes',result:'Excellent',notes:'Fast and clean. Light setting to avoid burning through.'},
    {id:'lm009',material:'Cork',thickness:'3mm',mode:'Cut',speed:20,power:75,passes:2,freq:'',airAssist:'Yes',result:'Good',notes:'Slightly compressed edge. Pin down firmly.'},
    {id:'lm010',material:'MDF',thickness:'3mm',mode:'Cut',speed:12,power:85,passes:2,freq:'',airAssist:'Yes',result:'Good',notes:'Heavy fume output. Good ventilation essential.'},
    {id:'lm011',material:'MDF',thickness:'3mm',mode:'Engrave',speed:300,power:55,passes:1,freq:'',airAssist:'Yes',result:'Good',notes:'Good depth. Sand lightly after for smooth finish.'},
    {id:'lm012',material:'Cardstock / Paper',thickness:'0.3mm',mode:'Cut',speed:80,power:25,passes:1,freq:'',airAssist:'No',result:'Excellent',notes:'Very fast. Watch for fire. Never leave unattended.'},
    {id:'lm013',material:'Anodised Aluminium',thickness:'1mm',mode:'Engrave',speed:150,power:90,passes:1,freq:'',airAssist:'No',result:'Good',notes:'Removes anodising layer to reveal silver. High contrast result.'}
  ];

  var LB_SEED=[
    {id:'lb001',name:'Wood Engrave - Standard',category:'Engrave',speed:300,power:45,passes:1,dpi:254,notes:'Good all-round setting for plywood and basswood engraving.'},
    {id:'lb002',name:'Wood Cut - 3mm',category:'Cut',speed:15,power:80,passes:2,dpi:'',notes:'Reliable cut for 3mm birch. Use air assist.'},
    {id:'lb003',name:'Acrylic Cut - 3mm',category:'Cut',speed:8,power:90,passes:2,dpi:'',notes:'Slow and steady. Remove protective film after.'},
    {id:'lb004',name:'Slate Photo Engrave',category:'Photo',speed:200,power:80,passes:1,dpi:254,notes:'Stucchi dithering, gamma 1.8. Excellent results on dark slate.'},
    {id:'lb005',name:'Leather Mark',category:'Engrave',speed:250,power:50,passes:1,dpi:254,notes:'Test on scrap first. Genuine leather only.'},
    {id:'lb006',name:'Cork Score & Snap',category:'Score',speed:100,power:40,passes:1,dpi:'',notes:'Score line for clean snapping rather than cutting through.'},
    {id:'lb007',name:'Cardstock Cut',category:'Cut',speed:80,power:25,passes:1,dpi:'',notes:'Fast, clean. Never leave unattended.'},
    {id:'lb008',name:'Ceramic Paint Engrave',category:'Engrave',speed:200,power:70,passes:1,dpi:254,notes:'Black spray coat first. Laser removes paint. Wipe clean after.'},
    {id:'lb009',name:'Fill - Dark Wood',category:'Fill',speed:300,power:60,passes:1,dpi:254,notes:'Fill mode for solid dark areas. Good for logos.'},
    {id:'lb010',name:'Photo - Jarvis Dither',category:'Photo',speed:250,power:55,passes:1,dpi:254,notes:'Jarvis dithering, gamma 2.0. Good for portraits on wood.'}
  ];

  panel.innerHTML=
    '<div class="page-header"><h2>Laser Hub</h2><p>Sculpfun laser engraver — material settings, LightBurn presets &amp; change log</p></div>'+

    '<div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--border)">'+
      '<button id="las-tab-mat" style="padding:10px 24px;background:none;border:none;border-bottom:3px solid var(--accent);color:var(--accent);font-weight:700;font-size:14px;cursor:pointer;margin-bottom:-2px">Material Settings</button>'+
      '<button id="las-tab-lb" style="padding:10px 24px;background:none;border:none;border-bottom:3px solid transparent;color:var(--text-muted);font-weight:600;font-size:14px;cursor:pointer;margin-bottom:-2px">LightBurn Presets</button>'+
      '<button id="las-tab-log" style="padding:10px 24px;background:none;border:none;border-bottom:3px solid transparent;color:var(--text-muted);font-weight:600;font-size:14px;cursor:pointer;margin-bottom:-2px">Change Log</button>'+
    '</div>'+

    /* ===== MATERIAL TAB ===== */
    '<div id="las-mat-pane">'+
      '<div class="stat-row">'+
        '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="mat-total">0</div><div class="sl">Total Profiles</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--green)" id="mat-excellent">0</div><div class="sl">Excellent Results</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--teal)" id="mat-materials">0</div><div class="sl">Materials Tested</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--gold)" id="mat-modes">0</div><div class="sl">Cut / Engrave / Other</div></div>'+
      '</div>'+

      '<div class="card" style="margin-bottom:20px">'+
        '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="mat-form-title">Add Material Profile</h3>'+
        '<div class="input-row">'+
          '<div class="field" style="flex:2"><label>Material</label><input id="mat-material" placeholder="e.g. Birch Plywood"></div>'+
          '<div class="field"><label>Thickness</label><input id="mat-thickness" placeholder="e.g. 3mm"></div>'+
          '<div class="field"><label>Mode</label><select id="mat-mode"><option>Engrave</option><option>Cut</option><option>Score</option><option>Fill</option><option>Photo</option></select></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field"><label>Speed (mm/min)</label><input id="mat-speed" type="number" placeholder="300"></div>'+
          '<div class="field"><label>Power (%)</label><input id="mat-power" type="number" min="1" max="100" placeholder="50"></div>'+
          '<div class="field"><label>Passes</label><input id="mat-passes" type="number" min="1" placeholder="1"></div>'+
          '<div class="field"><label>Frequency / DPI</label><input id="mat-freq" placeholder="e.g. 254 DPI"></div>'+
          '<div class="field"><label>Air Assist</label><select id="mat-air"><option>Yes</option><option>No</option></select></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field"><label>Result Rating</label><select id="mat-result"><option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option><option>Failed</option><option>Untested</option></select></div>'+
          '<div class="field" style="flex:3"><label>Notes</label><input id="mat-notes" placeholder="e.g. Mask back before cutting, slight charring on edges"></div>'+
        '</div>'+
        '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary" id="mat-save">Save Profile</button><button class="btn btn-ghost" id="mat-cancel" style="display:none">Cancel</button></div>'+
      '</div>'+

      '<div class="toolbar">'+
        '<div class="search-box"><input id="mat-search" placeholder="Search materials..."></div>'+
        '<select id="mat-mode-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px"><option value="">All Modes</option><option>Engrave</option><option>Cut</option><option>Score</option><option>Fill</option><option>Photo</option></select>'+
        '<select id="mat-result-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px"><option value="">All Results</option><option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option><option>Failed</option><option>Untested</option></select>'+
      '</div>'+
      '<div class="table-wrap"><table><thead><tr>'+
        '<th>Material</th><th>Thickness</th><th>Mode</th><th>Speed</th><th>Power</th><th>Passes</th><th>Freq/DPI</th><th>Air</th><th>Result</th><th>Notes</th><th>Actions</th>'+
      '</tr></thead><tbody id="mat-tbody"></tbody></table></div>'+
    '</div>'+

    /* ===== LIGHTBURN TAB ===== */
    '<div id="las-lb-pane" style="display:none">'+
      '<div class="stat-row">'+
        '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="lb-total">0</div><div class="sl">Total Presets</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--green)" id="lb-cats">0</div><div class="sl">Categories</div></div>'+
      '</div>'+

      '<div class="card" style="margin-bottom:20px">'+
        '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="lb-form-title">Add LightBurn Preset</h3>'+
        '<div class="input-row">'+
          '<div class="field" style="flex:2"><label>Preset Name</label><input id="lb-name" placeholder="e.g. Wood Engrave - Standard"></div>'+
          '<div class="field"><label>Category</label><select id="lb-cat"><option>Engrave</option><option>Cut</option><option>Score</option><option>Fill</option><option>Photo</option><option>Other</option></select></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field"><label>Speed (mm/min)</label><input id="lb-speed" type="number" placeholder="300"></div>'+
          '<div class="field"><label>Power (%)</label><input id="lb-power" type="number" min="1" max="100" placeholder="50"></div>'+
          '<div class="field"><label>Passes</label><input id="lb-passes" type="number" min="1" placeholder="1"></div>'+
          '<div class="field"><label>DPI (Photo only)</label><input id="lb-dpi" type="number" placeholder="254"></div>'+
        '</div>'+
        '<div class="field" style="margin-bottom:10px"><label>Notes / Tips</label><input id="lb-notes" placeholder="e.g. Jarvis dithering, gamma 2.0 for portraits"></div>'+
        '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary" id="lb-save">Save Preset</button><button class="btn btn-ghost" id="lb-cancel" style="display:none">Cancel</button></div>'+
      '</div>'+

      '<div class="toolbar">'+
        '<div class="search-box"><input id="lb-search" placeholder="Search presets..."></div>'+
        '<select id="lb-cat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px"><option value="">All Categories</option><option>Engrave</option><option>Cut</option><option>Score</option><option>Fill</option><option>Photo</option><option>Other</option></select>'+
      '</div>'+
      '<div id="lb-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-top:16px"></div>'+
    '</div>'+

    /* ===== CHANGE LOG TAB ===== */
    '<div id="las-log-pane" style="display:none">'+
      '<div class="stat-row">'+
        '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="log-total">0</div><div class="sl">Total Entries</div></div>'+
        '<div class="stat-box"><div class="sv" style="color:var(--teal)" id="log-recent">--</div><div class="sl">Last Entry</div></div>'+
      '</div>'+

      '<div class="card" style="margin-bottom:20px">'+
        '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Log a Settings Change</h3>'+
        '<div class="input-row">'+
          '<div class="field" style="flex:2"><label>What Changed</label><input id="log-what" placeholder="e.g. Birch 3mm cut - reduced speed from 20 to 15"></div>'+
          '<div class="field"><label>Date</label><input id="log-date" type="date"></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field"><label>Material / Preset</label><input id="log-ref" placeholder="e.g. Birch Plywood 3mm Cut"></div>'+
          '<div class="field"><label>Before</label><input id="log-before" placeholder="e.g. Speed 20, Power 75, 2 passes"></div>'+
          '<div class="field"><label>After</label><input id="log-after" placeholder="e.g. Speed 15, Power 80, 2 passes"></div>'+
        '</div>'+
        '<div class="input-row">'+
          '<div class="field"><label>Reason / Result</label><select id="log-reason"><option>Better Result</option><option>Fix Problem</option><option>New Material Test</option><option>Machine Calibration</option><option>Other</option></select></div>'+
          '<div class="field" style="flex:3"><label>Notes</label><input id="log-notes" placeholder="e.g. Back side was charred, slowing speed improved clean cut"></div>'+
        '</div>'+
        '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary" id="log-save">Log Change</button></div>'+
      '</div>'+

      '<div class="table-wrap"><table><thead><tr>'+
        '<th>Date</th><th>Material / Preset</th><th>What Changed</th><th>Before</th><th>After</th><th>Reason</th><th>Notes</th><th>Actions</th>'+
      '</tr></thead><tbody id="log-tbody"></tbody></table></div>'+
    '</div>'+

    /* ===== MATERIAL MODAL ===== */
    '<div id="mat-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;align-items:center;justify-content:center">'+
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;width:min(640px,90vw);max-height:85vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.5)">'+
        '<button id="mat-modal-x" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;color:var(--text-muted);cursor:pointer;line-height:1">x</button>'+
        '<div id="mat-modal-body"></div>'+
        '<div style="display:flex;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">'+
          '<button class="btn btn-primary" id="mat-modal-edit">Edit This Profile</button>'+
          '<button class="btn btn-ghost" id="mat-modal-log">Log a Change</button>'+
          '<button class="btn btn-ghost" id="mat-modal-close">Close</button>'+
        '</div>'+
      '</div>'+
    '</div>'+

    /* ===== LB MODAL ===== */
    '<div id="lb-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;align-items:center;justify-content:center">'+
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;width:min(580px,90vw);max-height:85vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.5)">'+
        '<button id="lb-modal-x" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;color:var(--text-muted);cursor:pointer;line-height:1">x</button>'+
        '<div id="lb-modal-body"></div>'+
        '<div style="display:flex;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">'+
          '<button class="btn btn-primary" id="lb-modal-edit">Edit This Preset</button>'+
          '<button class="btn btn-ghost" id="lb-modal-close">Close</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  frame.appendChild(panel);

  var matItems=[],lbItems=[],logItems=[];
  var matEditId=null,lbEditId=null,matModalId=null,lbModalId=null;

  function g(id){return document.getElementById(id);}
  function esc(v){return String(v===undefined||v===null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function mf(label,val,mono){
    if(val===undefined||val===null||val==='')return '';
    return '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px">'+
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px">'+label+'</div>'+
      '<div style="font-size:14px'+(mono?';font-family:monospace;font-weight:700':'')+'">'+esc(val)+'</div></div>';
  }

  /* ---- TAB SWITCHING ---- */
  function switchTab(tab){
    var tabs=['mat','lb','log'];
    tabs.forEach(function(t){
      var btn=g('las-tab-'+t);var pane=g('las-'+t+'-pane');
      if(t===tab){
        btn.style.borderBottomColor='var(--accent)';btn.style.color='var(--accent)';btn.style.fontWeight='700';
        pane.style.display='';
      }else{
        btn.style.borderBottomColor='transparent';btn.style.color='var(--text-muted)';btn.style.fontWeight='600';
        pane.style.display='none';
      }
    });
  }
  g('las-tab-mat').addEventListener('click',function(){switchTab('mat');});
  g('las-tab-lb').addEventListener('click',function(){switchTab('lb');});
  g('las-tab-log').addEventListener('click',function(){switchTab('log');});

  /* ---- RESULT BADGE ---- */
  function resultBadge(r){
    var map={Excellent:'badge-green',Good:'badge-accent',Fair:'badge-gold',Poor:'badge-red',Failed:'badge-red',Untested:'badge-muted'};
    return '<span class="badge '+(map[r]||'badge-muted')+'">'+esc(r)+'</span>';
  }

  /* ---- MATERIAL MODAL ---- */
  function showMatModal(id){
    var i=matItems.find(function(x){return x.id===id;});if(!i)return;
    matModalId=id;
    g('mat-modal-body').innerHTML=
      '<div style="margin-bottom:18px;padding-right:30px">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">'+
          '<span class="badge badge-accent">'+esc(i.mode)+'</span>'+
          (i.airAssist==='Yes'?'<span class="badge badge-teal">Air Assist</span>':'')+
          resultBadge(i.result)+
        '</div>'+
        '<h3 style="font-size:20px;font-weight:800;margin:0">'+esc(i.material)+'</h3>'+
        (i.thickness?'<div style="font-size:13px;color:var(--text-muted);margin-top:2px">Thickness: '+esc(i.thickness)+'</div>':'')+
      '</div>'+
      '<div style="background:var(--bg);border:2px solid var(--accent);border-radius:10px;padding:16px;margin-bottom:16px">'+
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:10px">Settings</div>'+
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">'+
          mf('Speed',i.speed?i.speed+' mm/min':'',true)+
          mf('Power',i.power?i.power+'%':'',true)+
          mf('Passes',String(i.passes||1),true)+
          mf('Freq / DPI',i.freq,false)+
          mf('Air Assist',i.airAssist,false)+
        '</div>'+
      '</div>'+
      (i.notes?mf('Notes',i.notes):'');
    g('mat-modal').style.display='flex';
  }

  g('mat-modal').addEventListener('click',function(e){if(e.target===g('mat-modal'))g('mat-modal').style.display='none';});
  g('mat-modal-x').addEventListener('click',function(){g('mat-modal').style.display='none';});
  g('mat-modal-close').addEventListener('click',function(){g('mat-modal').style.display='none';});
  g('mat-modal-edit').addEventListener('click',function(){
    g('mat-modal').style.display='none';
    if(!matModalId)return;
    var i=matItems.find(function(x){return x.id===matModalId;});if(!i)return;
    matEditId=matModalId;
    g('mat-material').value=i.material||'';g('mat-thickness').value=i.thickness||'';
    g('mat-mode').value=i.mode||'Engrave';g('mat-speed').value=i.speed||'';
    g('mat-power').value=i.power||'';g('mat-passes').value=i.passes||1;
    g('mat-freq').value=i.freq||'';g('mat-air').value=i.airAssist||'Yes';
    g('mat-result').value=i.result||'Good';g('mat-notes').value=i.notes||'';
    g('mat-form-title').textContent='Edit Material Profile';g('mat-cancel').style.display='inline-flex';
    switchTab('mat');panel.scrollIntoView({behavior:'smooth',block:'start'});
  });
  g('mat-modal-log').addEventListener('click',function(){
    g('mat-modal').style.display='none';
    if(!matModalId)return;
    var i=matItems.find(function(x){return x.id===matModalId;});if(!i)return;
    switchTab('log');
    g('log-ref').value=i.material+(i.thickness?' '+i.thickness:'')+(i.mode?' '+i.mode:'');
    g('log-date').value=new Date().toISOString().slice(0,10);
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  });

  /* ---- LB MODAL ---- */
  function showLbModal(id){
    var i=lbItems.find(function(x){return x.id===id;});if(!i)return;
    lbModalId=id;
    g('lb-modal-body').innerHTML=
      '<div style="margin-bottom:18px;padding-right:30px">'+
        '<div style="margin-bottom:6px"><span class="badge badge-accent">'+esc(i.category)+'</span></div>'+
        '<h3 style="font-size:20px;font-weight:800;margin:0">'+esc(i.name)+'</h3>'+
      '</div>'+
      '<div style="background:var(--bg);border:2px solid var(--accent);border-radius:10px;padding:16px;margin-bottom:16px">'+
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:10px">Settings</div>'+
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">'+
          mf('Speed',i.speed?i.speed+' mm/min':'',true)+
          mf('Power',i.power?i.power+'%':'',true)+
          mf('Passes',String(i.passes||1),true)+
          (i.dpi?mf('DPI',String(i.dpi),true):'')+
        '</div>'+
      '</div>'+
      (i.notes?mf('Notes / Tips',i.notes):'');
    g('lb-modal').style.display='flex';
  }

  g('lb-modal').addEventListener('click',function(e){if(e.target===g('lb-modal'))g('lb-modal').style.display='none';});
  g('lb-modal-x').addEventListener('click',function(){g('lb-modal').style.display='none';});
  g('lb-modal-close').addEventListener('click',function(){g('lb-modal').style.display='none';});
  g('lb-modal-edit').addEventListener('click',function(){
    g('lb-modal').style.display='none';
    if(!lbModalId)return;
    var i=lbItems.find(function(x){return x.id===lbModalId;});if(!i)return;
    lbEditId=lbModalId;
    g('lb-name').value=i.name||'';g('lb-cat').value=i.category||'Engrave';
    g('lb-speed').value=i.speed||'';g('lb-power').value=i.power||'';
    g('lb-passes').value=i.passes||1;g('lb-dpi').value=i.dpi||'';
    g('lb-notes').value=i.notes||'';
    g('lb-form-title').textContent='Edit Preset';g('lb-cancel').style.display='inline-flex';
    switchTab('lb');panel.scrollIntoView({behavior:'smooth',block:'start'});
  });

  /* ---- LOAD / SAVE ---- */
  async function load(){
    matItems=await window.makerAPI.readData(MAT_FILE)||[];
    lbItems=await window.makerAPI.readData(LB_FILE)||[];
    logItems=await window.makerAPI.readData(LOG_FILE)||[];
    if(matItems.length===0){matItems=MAT_SEED;await window.makerAPI.writeData(MAT_FILE,matItems);}
    if(lbItems.length===0){lbItems=LB_SEED;await window.makerAPI.writeData(LB_FILE,lbItems);}
    renderMat();renderLb();renderLog();
  }

  /* ---- RENDER MATERIALS ---- */
  function renderMat(){
    var q=g('mat-search').value.toLowerCase();
    var mf2=g('mat-mode-filter').value;
    var rf=g('mat-result-filter').value;
    var fi=matItems.filter(function(i){return(!mf2||i.mode===mf2)&&(!rf||i.result===rf)&&(!q||JSON.stringify(i).toLowerCase().indexOf(q)>-1);});
    g('mat-total').textContent=matItems.length;
    g('mat-excellent').textContent=matItems.filter(function(i){return i.result==='Excellent';}).length;
    g('mat-materials').textContent=new Set(matItems.map(function(i){return i.material;})).size;
    var modeCounts={};matItems.forEach(function(i){modeCounts[i.mode]=(modeCounts[i.mode]||0)+1;});
    g('mat-modes').textContent=Object.keys(modeCounts).length;
    if(fi.length===0){g('mat-tbody').innerHTML='<tr><td colspan="11" class="empty-state"><p>No material profiles yet.</p></td></tr>';return;}
    g('mat-tbody').innerHTML=fi.map(function(i){
      return '<tr data-id="'+i.id+'" style="cursor:pointer" title="Click to view full settings">'+
        '<td style="font-weight:600">'+esc(i.material)+'</td>'+
        '<td>'+esc(i.thickness||'')+'</td>'+
        '<td><span class="badge badge-accent">'+esc(i.mode)+'</span></td>'+
        '<td style="font-family:monospace;font-weight:700">'+esc(String(i.speed||''))+'</td>'+
        '<td style="font-family:monospace;font-weight:700">'+esc(String(i.power||''))+'%</td>'+
        '<td>'+esc(String(i.passes||1))+'</td>'+
        '<td>'+esc(i.freq||'')+'</td>'+
        '<td>'+(i.airAssist==='Yes'?'<span class="badge badge-teal">Yes</span>':'No')+'</td>'+
        '<td>'+resultBadge(i.result)+'</td>'+
        '<td style="font-size:12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(i.notes||'')+'">'+esc(i.notes||'')+'</td>'+
        '<td>'+
          '<button class="btn btn-ghost btn-sm mate" data-id="'+i.id+'">Edit</button> '+
          '<button class="btn btn-danger btn-sm matd" data-id="'+i.id+'">Del</button>'+
        '</td>'+
      '</tr>';
    }).join('');
    panel.querySelectorAll('#mat-tbody tr').forEach(function(tr){
      tr.addEventListener('click',function(e){if(e.target.closest('button'))return;showMatModal(tr.dataset.id);});
    });
    panel.querySelectorAll('.mate').forEach(function(b){
      b.addEventListener('click',function(){
        var i=matItems.find(function(x){return x.id===b.dataset.id;});if(!i)return;
        matEditId=b.dataset.id;
        g('mat-material').value=i.material||'';g('mat-thickness').value=i.thickness||'';
        g('mat-mode').value=i.mode||'Engrave';g('mat-speed').value=i.speed||'';
        g('mat-power').value=i.power||'';g('mat-passes').value=i.passes||1;
        g('mat-freq').value=i.freq||'';g('mat-air').value=i.airAssist||'Yes';
        g('mat-result').value=i.result||'Good';g('mat-notes').value=i.notes||'';
        g('mat-form-title').textContent='Edit Material Profile';g('mat-cancel').style.display='inline-flex';
        panel.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
    panel.querySelectorAll('.matd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this material profile?'))return;
        matItems=matItems.filter(function(x){return x.id!==b.dataset.id;});
        await window.makerAPI.writeData(MAT_FILE,matItems);renderMat();
      });
    });
  }

  /* ---- RENDER LIGHTBURN ---- */
  function renderLb(){
    var q=g('lb-search').value.toLowerCase();
    var cf=g('lb-cat-filter').value;
    var fi=lbItems.filter(function(i){return(!cf||i.category===cf)&&(!q||JSON.stringify(i).toLowerCase().indexOf(q)>-1);});
    g('lb-total').textContent=lbItems.length;
    g('lb-cats').textContent=new Set(lbItems.map(function(i){return i.category;})).size;
    var catColor={Engrave:'badge-accent',Cut:'badge-red',Score:'badge-gold',Fill:'badge-green',Photo:'badge-teal',Other:'badge-muted'};
    g('lb-grid').innerHTML=fi.length?fi.map(function(i){
      return '<div class="card" data-id="'+i.id+'" style="cursor:pointer" title="Click to view full preset">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'+
          '<div style="font-size:16px;font-weight:700;flex:1;padding-right:8px">'+esc(i.name)+'</div>'+
          '<span class="badge '+(catColor[i.category]||'badge-muted')+'">'+esc(i.category)+'</span>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">'+
          '<div style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px;text-align:center">'+
            '<div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">SPEED</div>'+
            '<div style="font-size:15px;font-weight:800;font-family:monospace;color:var(--accent)">'+esc(String(i.speed||''))+'</div>'+
          '</div>'+
          '<div style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px;text-align:center">'+
            '<div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">POWER</div>'+
            '<div style="font-size:15px;font-weight:800;font-family:monospace;color:var(--accent)">'+esc(String(i.power||''))+'%</div>'+
          '</div>'+
          '<div style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px;text-align:center">'+
            '<div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">PASSES</div>'+
            '<div style="font-size:15px;font-weight:800;font-family:monospace;color:var(--accent)">'+esc(String(i.passes||1))+'</div>'+
          '</div>'+
        '</div>'+
        (i.dpi?'<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">DPI: '+esc(String(i.dpi))+'</div>':'')+
        (i.notes?'<div style="font-size:12px;color:var(--text-muted);font-style:italic;margin-bottom:10px">'+esc(i.notes.substring(0,90))+(i.notes.length>90?'...':'')+'</div>':'')+
        '<div style="display:flex;gap:8px;margin-top:auto">'+
          '<button class="btn btn-primary btn-sm lbv" data-id="'+i.id+'">View</button>'+
          '<button class="btn btn-ghost btn-sm lbe" data-id="'+i.id+'">Edit</button>'+
          '<button class="btn btn-danger btn-sm lbd" data-id="'+i.id+'">Del</button>'+
        '</div>'+
      '</div>';
    }).join(''):'<div style="color:var(--text-muted);font-size:14px;grid-column:1/-1;text-align:center;padding:40px">No presets yet. Add one above!</div>';
    panel.querySelectorAll('#lb-grid .card').forEach(function(card){
      card.addEventListener('click',function(e){if(e.target.closest('button'))return;showLbModal(card.dataset.id);});
    });
    panel.querySelectorAll('.lbv').forEach(function(b){b.addEventListener('click',function(){showLbModal(b.dataset.id);});});
    panel.querySelectorAll('.lbe').forEach(function(b){
      b.addEventListener('click',function(){
        var i=lbItems.find(function(x){return x.id===b.dataset.id;});if(!i)return;
        lbEditId=b.dataset.id;
        g('lb-name').value=i.name||'';g('lb-cat').value=i.category||'Engrave';
        g('lb-speed').value=i.speed||'';g('lb-power').value=i.power||'';
        g('lb-passes').value=i.passes||1;g('lb-dpi').value=i.dpi||'';
        g('lb-notes').value=i.notes||'';
        g('lb-form-title').textContent='Edit Preset';g('lb-cancel').style.display='inline-flex';
        panel.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
    panel.querySelectorAll('.lbd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this preset?'))return;
        lbItems=lbItems.filter(function(x){return x.id!==b.dataset.id;});
        await window.makerAPI.writeData(LB_FILE,lbItems);renderLb();
      });
    });
  }

  /* ---- RENDER CHANGE LOG ---- */
  function renderLog(){
    g('log-total').textContent=logItems.length;
    g('log-recent').textContent=logItems.length?logItems[0].date:'--';
    if(logItems.length===0){g('log-tbody').innerHTML='<tr><td colspan="8" class="empty-state"><p>No changes logged yet. Use this tab to track every settings tweak.</p></td></tr>';return;}
    g('log-tbody').innerHTML=logItems.map(function(i){
      return '<tr>'+
        '<td style="font-size:12px;white-space:nowrap">'+esc(i.date||'')+'</td>'+
        '<td style="font-weight:600">'+esc(i.ref||'')+'</td>'+
        '<td>'+esc(i.what||'')+'</td>'+
        '<td style="font-size:12px;font-family:monospace">'+esc(i.before||'')+'</td>'+
        '<td style="font-size:12px;font-family:monospace;color:var(--green)">'+esc(i.after||'')+'</td>'+
        '<td><span class="badge badge-muted">'+esc(i.reason||'')+'</span></td>'+
        '<td style="font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(i.notes||'')+'</td>'+
        '<td><button class="btn btn-danger btn-sm logd" data-id="'+i.id+'">Del</button></td>'+
      '</tr>';
    }).join('');
    panel.querySelectorAll('.logd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this log entry?'))return;
        logItems=logItems.filter(function(x){return x.id!==b.dataset.id;});
        await window.makerAPI.writeData(LOG_FILE,logItems);renderLog();
      });
    });
  }

  /* ---- SAVE MATERIAL ---- */
  g('mat-save').addEventListener('click',async function(){
    var material=g('mat-material').value.trim();if(!material)return;
    var obj={id:matEditId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      material:material,thickness:g('mat-thickness').value.trim(),mode:g('mat-mode').value,
      speed:Number(g('mat-speed').value)||0,power:Number(g('mat-power').value)||0,
      passes:Number(g('mat-passes').value)||1,freq:g('mat-freq').value.trim(),
      airAssist:g('mat-air').value,result:g('mat-result').value,notes:g('mat-notes').value.trim()};
    if(matEditId){var idx=matItems.findIndex(function(x){return x.id===matEditId;});if(idx>=0)matItems[idx]=obj;}else matItems.unshift(obj);
    matEditId=null;g('mat-form-title').textContent='Add Material Profile';g('mat-cancel').style.display='none';
    ['mat-material','mat-thickness','mat-speed','mat-power','mat-passes','mat-freq','mat-notes'].forEach(function(id){g(id).value='';});
    g('mat-mode').value='Engrave';g('mat-air').value='Yes';g('mat-result').value='Good';
    await window.makerAPI.writeData(MAT_FILE,matItems);renderMat();
  });
  g('mat-cancel').addEventListener('click',function(){matEditId=null;g('mat-form-title').textContent='Add Material Profile';g('mat-cancel').style.display='none';});
  g('mat-search').addEventListener('input',renderMat);
  g('mat-mode-filter').addEventListener('change',renderMat);
  g('mat-result-filter').addEventListener('change',renderMat);

  /* ---- SAVE LB PRESET ---- */
  g('lb-save').addEventListener('click',async function(){
    var name=g('lb-name').value.trim();if(!name)return;
    var obj={id:lbEditId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      name:name,category:g('lb-cat').value,speed:Number(g('lb-speed').value)||0,
      power:Number(g('lb-power').value)||0,passes:Number(g('lb-passes').value)||1,
      dpi:g('lb-dpi').value?Number(g('lb-dpi').value):null,notes:g('lb-notes').value.trim()};
    if(lbEditId){var idx=lbItems.findIndex(function(x){return x.id===lbEditId;});if(idx>=0)lbItems[idx]=obj;}else lbItems.unshift(obj);
    lbEditId=null;g('lb-form-title').textContent='Add LightBurn Preset';g('lb-cancel').style.display='none';
    ['lb-name','lb-speed','lb-power','lb-passes','lb-dpi','lb-notes'].forEach(function(id){g(id).value='';});
    g('lb-cat').value='Engrave';
    await window.makerAPI.writeData(LB_FILE,lbItems);renderLb();
  });
  g('lb-cancel').addEventListener('click',function(){lbEditId=null;g('lb-form-title').textContent='Add LightBurn Preset';g('lb-cancel').style.display='none';});
  g('lb-search').addEventListener('input',renderLb);
  g('lb-cat-filter').addEventListener('change',renderLb);

  /* ---- SAVE LOG ---- */
  g('log-save').addEventListener('click',async function(){
    var what=g('log-what').value.trim();if(!what)return;
    var obj={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      date:g('log-date').value||new Date().toISOString().slice(0,10),
      ref:g('log-ref').value.trim(),what:what,
      before:g('log-before').value.trim(),after:g('log-after').value.trim(),
      reason:g('log-reason').value,notes:g('log-notes').value.trim()};
    logItems.unshift(obj);
    ['log-what','log-ref','log-before','log-after','log-notes'].forEach(function(id){g(id).value='';});
    g('log-date').value='';g('log-reason').value='Better Result';
    await window.makerAPI.writeData(LOG_FILE,logItems);renderLog();
  });

  window.__makerInit_laser=load;
})();
