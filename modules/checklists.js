(function(){
  var FILE='checklists.json';
  var frame=document.getElementById('module-frame');
  var panel=document.createElement('div');
  panel.id='panel-checklists';panel.className='module-panel';

  panel.innerHTML=
    '<div class="page-header"><h2>Checklists</h2><p>Step-by-step task lists for every craft process</p></div>'+
    '<div style="display:grid;grid-template-columns:260px 1fr;gap:20px;height:calc(100vh - 200px)">'+
      '<div style="display:flex;flex-direction:column;gap:12px">'+
        '<div class="card" style="padding:14px">'+
          '<div class="field" style="margin-bottom:8px"><label>List Name</label><input id="cl-new-name" placeholder="e.g. Sublimation Setup"></div>'+
          '<button class="btn btn-primary" id="cl-add-list" style="width:100%">+ New List</button>'+
        '</div>'+
        '<div id="cl-list-sidebar" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px"></div>'+
      '</div>'+
      '<div class="card" id="cl-detail-panel" style="display:flex;flex-direction:column">'+
        '<div id="cl-detail-empty" style="margin:auto;text-align:center;color:var(--text-muted)">'+
          '<div style="font-size:40px;margin-bottom:12px">&#9745;</div>'+
          '<div style="font-size:14px">Select a checklist from the left to get started</div>'+
        '</div>'+
        '<div id="cl-detail-content" style="display:none;flex-direction:column;height:100%">'+
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'+
            '<h3 id="cl-detail-title" style="font-size:16px;font-weight:700"></h3>'+
            '<div style="display:flex;gap:8px">'+
              '<button class="btn btn-ghost btn-sm" id="cl-rename-btn">Rename</button>'+
              '<button class="btn btn-danger btn-sm" id="cl-delete-list">Delete List</button>'+
            '</div>'+
          '</div>'+
          '<div id="cl-rename-row" style="display:none;margin-bottom:12px">'+
            '<div style="display:flex;gap:8px">'+
              '<input id="cl-rename-input" style="flex:1;background:var(--bg);border:1px solid var(--accent);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
              '<button class="btn btn-primary btn-sm" id="cl-rename-save">Save</button>'+
              '<button class="btn btn-ghost btn-sm" id="cl-rename-cancel">Cancel</button>'+
            '</div>'+
          '</div>'+
          '<div style="margin-bottom:12px">'+
            '<div style="background:var(--surface);border-radius:8px;height:8px;overflow:hidden">'+
              '<div id="cl-progress-bar" style="height:100%;background:var(--accent);border-radius:8px;transition:width .3s;width:0%"></div>'+
            '</div>'+
            '<div id="cl-progress-label" style="font-size:12px;color:var(--text-muted);margin-top:4px">0 / 0 complete</div>'+
          '</div>'+
          '<div style="display:flex;gap:8px;margin-bottom:12px">'+
            '<input id="cl-new-task" placeholder="Add a task..." style="flex:1;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
            '<button class="btn btn-primary" id="cl-add-task">Add</button>'+
            '<button class="btn btn-ghost" id="cl-reset-all">Reset All</button>'+
          '</div>'+
          '<div id="cl-task-list" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px"></div>'+
        '</div>'+
      '</div>'+
    '</div>';

  frame.appendChild(panel);

  var lists=[],activeId=null;
  function g(id){return document.getElementById(id);}

  async function load(){
    lists=await window.makerAPI.readData(FILE)||[];
    renderSidebar();
    if(activeId){
      var still=lists.find(function(l){return l.id===activeId;});
      if(still)renderDetail(activeId);else{activeId=null;showEmpty();}
    }
  }
  async function sv(){await window.makerAPI.writeData(FILE,lists);}

  function showEmpty(){
    g('cl-detail-empty').style.display='';
    g('cl-detail-content').style.display='none';
  }
  function showDetail(){
    g('cl-detail-empty').style.display='none';
    g('cl-detail-content').style.display='flex';
  }

  function renderSidebar(){
    var sb=g('cl-list-sidebar');
    if(lists.length===0){sb.innerHTML='<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:12px">No lists yet. Create one above.</div>';return;}
    sb.innerHTML=lists.map(function(l){
      var done=(l.tasks||[]).filter(function(t){return t.done;}).length;
      var total=(l.tasks||[]).length;
      var pct=total?Math.round(done/total*100):0;
      return '<div class="card" style="padding:12px;cursor:pointer;border:2px solid '+(l.id===activeId?'var(--accent)':'transparent')+';" data-lid="'+l.id+'">'+
        '<div style="font-weight:600;font-size:13px;margin-bottom:6px">'+esc(l.name)+'</div>'+
        '<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">'+done+' / '+total+' complete</div>'+
        '<div style="background:var(--surface);border-radius:4px;height:4px;overflow:hidden">'+
          '<div style="height:100%;background:var(--accent);border-radius:4px;width:'+pct+'%"></div>'+
        '</div>'+
      '</div>';
    }).join('');
    panel.querySelectorAll('[data-lid]').forEach(function(el){
      el.addEventListener('click',function(){renderDetail(el.dataset.lid);});
    });
  }

  function renderDetail(id){
    activeId=id;
    var l=lists.find(function(x){return x.id===id;});
    if(!l)return;
    showDetail();
    renderSidebar();
    g('cl-detail-title').textContent=l.name;
    g('cl-rename-row').style.display='none';
    g('cl-rename-input').value=l.name;
    var tasks=l.tasks||[];
    var done=tasks.filter(function(t){return t.done;}).length;
    var pct=tasks.length?Math.round(done/tasks.length*100):0;
    g('cl-progress-bar').style.width=pct+'%';
    g('cl-progress-label').textContent=done+' / '+tasks.length+' complete';
    var tl=g('cl-task-list');
    if(tasks.length===0){tl.innerHTML='<div style="font-size:13px;color:var(--text-muted);text-align:center;padding:20px">No tasks yet. Add one above.</div>';return;}
    tl.innerHTML=tasks.map(function(t,idx){
      return '<div style="display:flex;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;'+(t.done?'opacity:.6':'')+'">'+
        '<input type="checkbox" '+(t.done?'checked':'')+' data-idx="'+idx+'" style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer;flex-shrink:0">'+
        '<span style="flex:1;font-size:13px;'+(t.done?'text-decoration:line-through;color:var(--text-muted)':'')+'">'+esc(t.text)+'</span>'+
        '<button class="btn btn-ghost btn-sm cl-del-task" data-idx="'+idx+'" style="opacity:.5;padding:4px 8px">x</button>'+
      '</div>';
    }).join('');
    tl.querySelectorAll('input[type=checkbox]').forEach(function(cb){
      cb.addEventListener('change',async function(){
        var l2=lists.find(function(x){return x.id===activeId;});if(!l2)return;
        l2.tasks[parseInt(cb.dataset.idx)].done=cb.checked;
        await sv();renderDetail(activeId);
      });
    });
    tl.querySelectorAll('.cl-del-task').forEach(function(btn){
      btn.addEventListener('click',async function(){
        var l2=lists.find(function(x){return x.id===activeId;});if(!l2)return;
        l2.tasks.splice(parseInt(btn.dataset.idx),1);
        await sv();renderDetail(activeId);
      });
    });
  }

  function esc(v){return String(v===undefined||v===null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  g('cl-add-list').addEventListener('click',async function(){
    var name=g('cl-new-name').value.trim();if(!name)return;
    lists.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:name,tasks:[]});
    g('cl-new-name').value='';
    await sv();renderSidebar();
  });
  g('cl-new-name').addEventListener('keydown',function(e){if(e.key==='Enter')g('cl-add-list').click();});

  g('cl-add-task').addEventListener('click',async function(){
    var txt=g('cl-new-task').value.trim();if(!txt||!activeId)return;
    var l=lists.find(function(x){return x.id===activeId;});if(!l)return;
    l.tasks.push({id:Date.now().toString(36),text:txt,done:false});
    g('cl-new-task').value='';
    await sv();renderDetail(activeId);
  });
  g('cl-new-task').addEventListener('keydown',function(e){if(e.key==='Enter')g('cl-add-task').click();});

  g('cl-reset-all').addEventListener('click',async function(){
    if(!activeId)return;
    var l=lists.find(function(x){return x.id===activeId;});if(!l)return;
    l.tasks.forEach(function(t){t.done=false;});
    await sv();renderDetail(activeId);
  });

  g('cl-delete-list').addEventListener('click',async function(){
    if(!activeId)return;
    var l=lists.find(function(x){return x.id===activeId;});if(!l)return;
    if(!confirm('Delete list "'+l.name+'" and all its tasks?'))return;
    lists=lists.filter(function(x){return x.id!==activeId;});
    activeId=null;
    await sv();renderSidebar();showEmpty();
  });

  g('cl-rename-btn').addEventListener('click',function(){
    g('cl-rename-row').style.display=g('cl-rename-row').style.display==='none'?'':'none';
    if(g('cl-rename-row').style.display!=='none')g('cl-rename-input').focus();
  });
  g('cl-rename-cancel').addEventListener('click',function(){g('cl-rename-row').style.display='none';});
  g('cl-rename-save').addEventListener('click',async function(){
    var newName=g('cl-rename-input').value.trim();if(!newName||!activeId)return;
    var l=lists.find(function(x){return x.id===activeId;});if(!l)return;
    l.name=newName;g('cl-rename-row').style.display='none';
    await sv();renderDetail(activeId);
  });
  g('cl-rename-input').addEventListener('keydown',function(e){if(e.key==='Enter')g('cl-rename-save').click();});

  window.__makerInit_checklists=load;
})();
