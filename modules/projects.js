(function(){
  var FILE='projects.json';
  var frame=document.getElementById('module-frame');
  var panel=document.createElement('div');
  panel.id='panel-projects';panel.className='module-panel';

  panel.innerHTML=
    '<div class="page-header"><h2>Project Log</h2><p>Track craft projects, costs, revenue &amp; profit</p></div>'+
    '<div class="stat-row">'+
      '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="proj-total">0</div><div class="sl">Total Projects</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--teal)" id="proj-revenue">$0.00</div><div class="sl">Total Revenue</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--red)" id="proj-cost">$0.00</div><div class="sl">Total Cost</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--green)" id="proj-profit">$0.00</div><div class="sl">Net Profit</div></div>'+
    '</div>'+
    '<div class="card" style="margin-bottom:20px">'+
      '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="proj-form-title">Add Project</h3>'+
      '<div class="input-row">'+
        '<div class="field" style="flex:2"><label>Project Name</label><input id="proj-name" placeholder="e.g. Mug Order - Sarah Birthday"></div>'+
        '<div class="field"><label>Category</label><select id="proj-cat"><option>Sublimation</option><option>3D Print</option><option>Resin</option><option>Candle</option><option>Soap</option><option>Bath Bomb</option><option>Vinyl / HTV</option><option>Embroidery</option><option>Mixed</option><option>Other</option></select></div>'+
        '<div class="field"><label>Status</label><select id="proj-status"><option>Idea</option><option>In Progress</option><option>Completed</option><option>Sold</option><option>Gifted</option><option>Cancelled</option></select></div>'+
      '</div>'+
      '<div class="input-row">'+
        '<div class="field"><label>Start Date</label><input id="proj-start" type="date"></div>'+
        '<div class="field"><label>End Date</label><input id="proj-end" type="date"></div>'+
        '<div class="field"><label>Material Cost ($)</label><input id="proj-mat-cost" type="number" step="0.01" placeholder="12.50"></div>'+
        '<div class="field"><label>Labour Cost ($)</label><input id="proj-lab-cost" type="number" step="0.01" placeholder="15.00"></div>'+
        '<div class="field"><label>Revenue ($)</label><input id="proj-rev" type="number" step="0.01" placeholder="45.00"></div>'+
      '</div>'+
      '<div class="input-row">'+
        '<div class="field"><label>Profit (auto)</label><div id="proj-profit-live" style="padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;font-weight:700;font-size:14px;color:var(--green)">$0.00</div></div>'+
        '<div class="field" style="flex:3"><label>Notes</label><input id="proj-notes" placeholder="e.g. Custom design - 3 revisions"></div>'+
      '</div>'+
      '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary" id="proj-save">Save Project</button><button class="btn btn-ghost" id="proj-cancel" style="display:none">Cancel</button></div>'+
    '</div>'+
    '<div class="toolbar">'+
      '<div class="search-box"><input id="proj-search" placeholder="Search projects..."></div>'+
      '<select id="proj-cat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px"><option value="">All Categories</option><option>Sublimation</option><option>3D Print</option><option>Resin</option><option>Candle</option><option>Soap</option><option>Bath Bomb</option><option>Vinyl / HTV</option><option>Embroidery</option><option>Mixed</option><option>Other</option></select>'+
      '<select id="proj-stat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px"><option value="">All Statuses</option><option>Idea</option><option>In Progress</option><option>Completed</option><option>Sold</option><option>Gifted</option><option>Cancelled</option></select>'+
    '</div>'+
    '<div class="table-wrap"><table><thead><tr><th>Project Name</th><th>Category</th><th>Status</th><th>Start</th><th>End</th><th>Mat Cost</th><th>Labour</th><th>Revenue</th><th>Profit</th><th>Actions</th></tr></thead><tbody id="proj-tbody"></tbody></table></div>'+
    '<div id="proj-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;align-items:center;justify-content:center">'+
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;width:min(620px,90vw);max-height:85vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.5)">'+
        '<button id="proj-modal-x" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;color:var(--text-muted);cursor:pointer;line-height:1">x</button>'+
        '<div id="proj-modal-body"></div>'+
        '<div style="display:flex;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">'+
          '<button class="btn btn-primary" id="proj-modal-edit">Edit This Project</button>'+
          '<button class="btn btn-ghost" id="proj-modal-close">Close</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  frame.appendChild(panel);

  var items=[],editId=null,modalId=null;
  function g(id){return document.getElementById(id);}
  function esc(v){return String(v===undefined||v===null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function mf(label,val){
    if(val===undefined||val===null||val==='')return '';
    return '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px">'+
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px">'+label+'</div>'+
      '<div style="font-size:14px">'+esc(val)+'</div></div>';
  }

  function calcProfit(){
    var mat=parseFloat(g('proj-mat-cost').value)||0;
    var lab=parseFloat(g('proj-lab-cost').value)||0;
    var rev=parseFloat(g('proj-rev').value)||0;
    var profit=rev-(mat+lab);
    var el=g('proj-profit-live');
    el.textContent=(profit>=0?'+':'')+profit.toFixed(2);
    el.style.color=profit>=0?'var(--green)':'var(--red)';
  }

  function showModal(id){
    var i=items.find(function(x){return x.id===id;});if(!i)return;
    modalId=id;
    var sc={Idea:'badge-muted','In Progress':'badge-accent',Completed:'badge-green',Sold:'badge-teal',Gifted:'badge-gold',Cancelled:'badge-red'};
    var profit=Number(i.revenue||0)-Number(i.matCost||0)-Number(i.labCost||0);
    g('proj-modal-body').innerHTML=
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;padding-right:30px">'+
        '<div>'+
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);margin-bottom:4px">'+esc(i.category)+'</div>'+
          '<h3 style="font-size:20px;font-weight:800;margin:0">'+esc(i.name)+'</h3>'+
        '</div>'+
        '<span class="badge '+(sc[i.status]||'')+'">'+esc(i.status)+'</span>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
        mf('Start Date',i.startDate)+mf('End Date',i.endDate)+
        mf('Material Cost','$'+Number(i.matCost||0).toFixed(2))+mf('Labour Cost','$'+Number(i.labCost||0).toFixed(2))+
        mf('Revenue','$'+Number(i.revenue||0).toFixed(2))+
      '</div>'+
      '<div style="background:var(--bg);border:2px solid '+(profit>=0?'var(--green)':'var(--red)')+';border-radius:8px;padding:14px;text-align:center;margin-top:10px">'+
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px">Net Profit</div>'+
        '<div style="font-size:24px;font-weight:900;color:'+(profit>=0?'var(--green)':'var(--red)')+'">'+
          (profit>=0?'+':'')+profit.toFixed(2)+
        '</div>'+
      '</div>'+
      (i.notes?'<div style="margin-top:10px">'+mf('Notes',i.notes)+'</div>':'');
    g('proj-modal').style.display='flex';
  }

  g('proj-modal').addEventListener('click',function(e){if(e.target===g('proj-modal'))g('proj-modal').style.display='none';});
  g('proj-modal-x').addEventListener('click',function(){g('proj-modal').style.display='none';});
  g('proj-modal-close').addEventListener('click',function(){g('proj-modal').style.display='none';});
  g('proj-modal-edit').addEventListener('click',function(){
    g('proj-modal').style.display='none';
    if(!modalId)return;
    var i=items.find(function(x){return x.id===modalId;});if(!i)return;
    editId=modalId;
    g('proj-name').value=i.name||'';g('proj-cat').value=i.category||'Other';
    g('proj-status').value=i.status||'Idea';g('proj-start').value=i.startDate||'';
    g('proj-end').value=i.endDate||'';g('proj-mat-cost').value=i.matCost||'';
    g('proj-lab-cost').value=i.labCost||'';g('proj-rev').value=i.revenue||'';
    g('proj-notes').value=i.notes||'';calcProfit();
    g('proj-form-title').textContent='Edit Project';g('proj-cancel').style.display='inline-flex';
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  });

  ['proj-mat-cost','proj-lab-cost','proj-rev'].forEach(function(id){g(id).addEventListener('input',calcProfit);});

  async function load(){items=await window.makerAPI.readData(FILE)||[];render();}
  async function sv(){await window.makerAPI.writeData(FILE,items);}

  function render(){
    var q=g('proj-search').value.toLowerCase();
    var cf=g('proj-cat-filter').value;
    var sf=g('proj-stat-filter').value;
    var fi=items.filter(function(i){return(!cf||i.category===cf)&&(!sf||i.status===sf)&&(!q||JSON.stringify(i).toLowerCase().indexOf(q)>-1);});
    g('proj-total').textContent=items.length;
    g('proj-revenue').textContent='$'+items.reduce(function(s,i){return s+Number(i.revenue||0);},0).toFixed(2);
    var totalCost=items.reduce(function(s,i){return s+Number(i.matCost||0)+Number(i.labCost||0);},0);
    g('proj-cost').textContent='$'+totalCost.toFixed(2);
    var netProfit=items.reduce(function(s,i){return s+Number(i.revenue||0)-Number(i.matCost||0)-Number(i.labCost||0);},0);
    var pel=g('proj-profit');pel.textContent='$'+netProfit.toFixed(2);pel.style.color=netProfit>=0?'var(--green)':'var(--red)';
    var sc={Idea:'badge-muted','In Progress':'badge-accent',Completed:'badge-green',Sold:'badge-teal',Gifted:'badge-gold',Cancelled:'badge-red'};
    if(fi.length===0){g('proj-tbody').innerHTML='<tr><td colspan="10" class="empty-state"><p>No projects yet.</p></td></tr>';return;}
    g('proj-tbody').innerHTML=fi.map(function(i){
      var profit=Number(i.revenue||0)-Number(i.matCost||0)-Number(i.labCost||0);
      return '<tr data-id="'+i.id+'" style="cursor:pointer" title="Click row to view details">'+
        '<td style="font-weight:600">'+esc(i.name)+'</td><td>'+esc(i.category||'')+'</td>'+
        '<td><span class="badge '+(sc[i.status]||'')+'">'+esc(i.status)+'</span></td>'+
        '<td>'+esc(i.startDate||'')+'</td><td>'+esc(i.endDate||'')+'</td>'+
        '<td>$'+Number(i.matCost||0).toFixed(2)+'</td><td>$'+Number(i.labCost||0).toFixed(2)+'</td>'+
        '<td>$'+Number(i.revenue||0).toFixed(2)+'</td>'+
        '<td style="font-weight:700;color:'+(profit>=0?'var(--green)':'var(--red)')+'">'+
          (profit>=0?'+':'')+profit.toFixed(2)+'</td>'+
        '<td><button class="btn btn-ghost btn-sm prje" data-id="'+i.id+'">Edit</button> <button class="btn btn-danger btn-sm prjd" data-id="'+i.id+'">Del</button></td>'+
      '</tr>';
    }).join('');
    panel.querySelectorAll('#proj-tbody tr').forEach(function(tr){
      tr.addEventListener('click',function(e){if(e.target.closest('button'))return;showModal(tr.dataset.id);});
    });
    panel.querySelectorAll('.prje').forEach(function(b){
      b.addEventListener('click',function(){
        var i=items.find(function(x){return x.id===b.dataset.id;});if(!i)return;
        editId=b.dataset.id;
        g('proj-name').value=i.name||'';g('proj-cat').value=i.category||'Other';
        g('proj-status').value=i.status||'Idea';g('proj-start').value=i.startDate||'';
        g('proj-end').value=i.endDate||'';g('proj-mat-cost').value=i.matCost||'';
        g('proj-lab-cost').value=i.labCost||'';g('proj-rev').value=i.revenue||'';
        g('proj-notes').value=i.notes||'';calcProfit();
        g('proj-form-title').textContent='Edit Project';g('proj-cancel').style.display='inline-flex';
        panel.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
    panel.querySelectorAll('.prjd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this project?'))return;
        items=items.filter(function(x){return x.id!==b.dataset.id;});await sv();render();
      });
    });
  }

  g('proj-save').addEventListener('click',async function(){
    var name=g('proj-name').value.trim();if(!name)return;
    var obj={id:editId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      name:name,category:g('proj-cat').value,status:g('proj-status').value,
      startDate:g('proj-start').value,endDate:g('proj-end').value,
      matCost:Number(g('proj-mat-cost').value)||0,labCost:Number(g('proj-lab-cost').value)||0,
      revenue:Number(g('proj-rev').value)||0,notes:g('proj-notes').value.trim()};
    if(editId){var idx=items.findIndex(function(x){return x.id===editId;});if(idx>=0)items[idx]=obj;}else items.unshift(obj);
    editId=null;g('proj-form-title').textContent='Add Project';g('proj-cancel').style.display='none';
    ['proj-name','proj-start','proj-end','proj-mat-cost','proj-lab-cost','proj-rev','proj-notes'].forEach(function(id){g(id).value='';});
    g('proj-cat').value='Sublimation';g('proj-status').value='Idea';calcProfit();
    await sv();render();
  });
  g('proj-cancel').addEventListener('click',function(){editId=null;g('proj-form-title').textContent='Add Project';g('proj-cancel').style.display='none';});
  g('proj-search').addEventListener('input',render);
  g('proj-cat-filter').addEventListener('change',render);
  g('proj-stat-filter').addEventListener('change',render);
  window.__makerInit_projects=load;
})();