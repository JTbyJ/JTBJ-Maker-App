(function(){
  var FILE='recipes.json';
  var frame=document.getElementById('module-frame');
  var panel=document.createElement('div');
  panel.id='panel-recipes';panel.className='module-panel';

  panel.innerHTML=
    '<div class="page-header"><h2>Recipe Book</h2><p>Store craft recipes, formulas &amp; how-to guides</p></div>'+
    '<div class="stat-row">'+
      '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="rec-total">0</div><div class="sl">Total Recipes</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--gold)" id="rec-favs">0</div><div class="sl">Favourites</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--teal)" id="rec-cats">0</div><div class="sl">Categories</div></div>'+
    '</div>'+
    '<div class="card" style="margin-bottom:20px">'+
      '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="rec-form-title">Add Recipe</h3>'+
      '<div class="input-row">'+
        '<div class="field" style="flex:2"><label>Recipe Name</label><input id="rec-name" placeholder="e.g. Resin Geode Coaster"></div>'+
        '<div class="field"><label>Category</label><select id="rec-cat"><option>Sublimation</option><option>Resin</option><option>Candle</option><option>Soap</option><option>Bath Bomb</option><option>Vinyl / HTV</option><option>3D Print</option><option>Embroidery</option><option>Polymer Clay</option><option>Other</option></select></div>'+
        '<div class="field"><label>Yield</label><input id="rec-yield" placeholder="e.g. 4 coasters"></div>'+
        '<div class="field"><label>Cure / Dry Time</label><input id="rec-cure" placeholder="e.g. 24 hrs"></div>'+
      '</div>'+
      '<div class="input-row">'+
        '<div class="field" style="flex:2"><label>Ingredients / Materials</label><input id="rec-ingredients" placeholder="e.g. 100g resin, 50g hardener, pigment powder"></div>'+
        '<div class="field"><label>Cost (CAD $)</label><input id="rec-cost" type="number" step="0.01" placeholder="5.00"></div>'+
      '</div>'+
      '<div class="field" style="margin-bottom:10px"><label>Steps / Instructions</label><textarea id="rec-steps" rows="4" style="width:100%;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:10px;font-size:13px;font-family:inherit;resize:vertical" placeholder="Step 1: Mix resin and hardener 2:1 ratio..."></textarea></div>'+
      '<div class="field" style="margin-bottom:10px"><label>Notes / Tips</label><input id="rec-notes" placeholder="e.g. Add pigment slowly to avoid clumping"></div>'+
      '<div style="display:flex;gap:8px;align-items:center;margin-top:10px">'+
        '<button class="btn btn-primary" id="rec-save">Save Recipe</button>'+
        '<button class="btn btn-ghost" id="rec-cancel" style="display:none">Cancel</button>'+
        '<label style="display:flex;align-items:center;gap:6px;margin-left:8px;font-size:13px;cursor:pointer"><input type="checkbox" id="rec-fav" style="width:16px;height:16px"> Favourite</label>'+
      '</div>'+
    '</div>'+
    '<div class="toolbar">'+
      '<div class="search-box"><input id="rec-search" placeholder="Search recipes..."></div>'+
      '<select id="rec-cat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px"><option value="">All Categories</option><option>Sublimation</option><option>Resin</option><option>Candle</option><option>Soap</option><option>Bath Bomb</option><option>Vinyl / HTV</option><option>3D Print</option><option>Embroidery</option><option>Polymer Clay</option><option>Other</option></select>'+
      '<select id="rec-fav-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px"><option value="">All Recipes</option><option value="1">Favourites Only</option></select>'+
    '</div>'+
    '<div id="rec-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-top:16px"></div>'+
    '<div id="rec-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;align-items:center;justify-content:center">'+
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;width:min(640px,90vw);max-height:85vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.5)">'+
        '<button id="rec-modal-x" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;color:var(--text-muted);cursor:pointer;line-height:1">x</button>'+
        '<div id="rec-modal-body"></div>'+
        '<div style="display:flex;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">'+
          '<button class="btn btn-primary" id="rec-modal-edit">Edit This Recipe</button>'+
          '<button class="btn btn-ghost" id="rec-modal-close">Close</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  frame.appendChild(panel);

  var items=[],editId=null,modalId=null;
  function g(id){return document.getElementById(id);}
  function esc(v){return String(v===undefined||v===null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function mf(label,val){
    if(val===undefined||val===null||val==='')return '';
    return '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:0">'+
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px">'+label+'</div>'+
      '<div style="font-size:14px;white-space:pre-wrap">'+esc(val)+'</div></div>';
  }

  function showModal(id){
    var i=items.find(function(x){return x.id===id;});if(!i)return;
    modalId=id;
    g('rec-modal-body').innerHTML=
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;padding-right:30px">'+
        '<div>'+
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);margin-bottom:4px">'+esc(i.category)+'</div>'+
          '<h3 style="font-size:20px;font-weight:800;margin:0">'+esc(i.name)+'</h3>'+
        '</div>'+
        '<span style="font-size:22px">'+(i.favourite?'&#9733;':'&#9734;')+'</span>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
        mf('Yield',i.yield)+mf('Cure / Dry Time',i.cure)+
        mf('Cost (CAD)','$'+Number(i.cost||0).toFixed(2))+
      '</div>'+
      (i.ingredients?'<div style="margin-top:10px">'+mf('Ingredients / Materials',i.ingredients)+'</div>':'')+
      (i.steps?'<div style="margin-top:10px">'+mf('Steps / Instructions',i.steps)+'</div>':'')+
      (i.notes?'<div style="margin-top:10px">'+mf('Notes / Tips',i.notes)+'</div>':'');
    g('rec-modal').style.display='flex';
  }

  g('rec-modal').addEventListener('click',function(e){if(e.target===g('rec-modal'))g('rec-modal').style.display='none';});
  g('rec-modal-x').addEventListener('click',function(){g('rec-modal').style.display='none';});
  g('rec-modal-close').addEventListener('click',function(){g('rec-modal').style.display='none';});
  g('rec-modal-edit').addEventListener('click',function(){
    g('rec-modal').style.display='none';
    if(!modalId)return;
    var i=items.find(function(x){return x.id===modalId;});if(!i)return;
    editId=modalId;
    g('rec-name').value=i.name||'';g('rec-cat').value=i.category||'Other';
    g('rec-yield').value=i.yield||'';g('rec-cure').value=i.cure||'';
    g('rec-ingredients').value=i.ingredients||'';g('rec-steps').value=i.steps||'';
    g('rec-cost').value=i.cost||'';g('rec-notes').value=i.notes||'';
    g('rec-fav').checked=!!i.favourite;
    g('rec-form-title').textContent='Edit Recipe';g('rec-cancel').style.display='inline-flex';
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  });

  async function load(){items=await window.makerAPI.readData(FILE)||[];render();}
  async function sv(){await window.makerAPI.writeData(FILE,items);}

  function render(){
    var q=g('rec-search').value.toLowerCase();
    var cf=g('rec-cat-filter').value;
    var ff=g('rec-fav-filter').value;
    var fi=items.filter(function(i){return(!cf||i.category===cf)&&(!ff||i.favourite)&&(!q||JSON.stringify(i).toLowerCase().indexOf(q)>-1);});
    g('rec-total').textContent=items.length;
    g('rec-favs').textContent=items.filter(function(i){return i.favourite;}).length;
    g('rec-cats').textContent=new Set(items.map(function(i){return i.category;})).size;
    if(fi.length===0){g('rec-grid').innerHTML='<div style="color:var(--text-muted);font-size:14px;grid-column:1/-1;text-align:center;padding:40px">No recipes yet. Add your first one above!</div>';return;}
    g('rec-grid').innerHTML=fi.map(function(i){
      return '<div class="card" style="position:relative;cursor:pointer" data-id="'+i.id+'" title="Click to view full recipe">'+
        '<div style="position:absolute;top:14px;right:14px;font-size:18px">'+(i.favourite?'&#9733;':'&#9734;')+'</div>'+
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);margin-bottom:4px">'+esc(i.category)+'</div>'+
        '<div style="font-size:16px;font-weight:700;margin-bottom:8px;padding-right:28px">'+esc(i.name)+'</div>'+
        (i.ingredients?'<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px"><strong>Materials:</strong> '+esc(i.ingredients.substring(0,80))+(i.ingredients.length>80?'...':'')+'</div>':'')+
        '<div style="display:flex;gap:12px;font-size:12px;color:var(--text-muted);margin-bottom:10px">'+
          (i.yield?'<span>Yield: '+esc(i.yield)+'</span>':'')+
          (i.cure?'<span>Cure: '+esc(i.cure)+'</span>':'')+
          (i.cost?'<span>$'+Number(i.cost).toFixed(2)+'</span>':'')+
        '</div>'+
        '<div style="display:flex;gap:8px;margin-top:12px">'+
          '<button class="btn btn-ghost btn-sm rece" data-id="'+i.id+'">Edit</button>'+
          '<button class="btn btn-danger btn-sm recd" data-id="'+i.id+'">Delete</button>'+
          '<button class="btn btn-primary btn-sm recv" data-id="'+i.id+'">View</button>'+
        '</div>'+
      '</div>';
    }).join('');
    panel.querySelectorAll('#rec-grid .card').forEach(function(card){
      card.addEventListener('click',function(e){if(e.target.closest('button'))return;showModal(card.dataset.id);});
    });
    panel.querySelectorAll('.recv').forEach(function(b){b.addEventListener('click',function(){showModal(b.dataset.id);});});
    panel.querySelectorAll('.rece').forEach(function(b){
      b.addEventListener('click',function(){
        var i=items.find(function(x){return x.id===b.dataset.id;});if(!i)return;
        editId=b.dataset.id;
        g('rec-name').value=i.name||'';g('rec-cat').value=i.category||'Other';
        g('rec-yield').value=i.yield||'';g('rec-cure').value=i.cure||'';
        g('rec-ingredients').value=i.ingredients||'';g('rec-steps').value=i.steps||'';
        g('rec-cost').value=i.cost||'';g('rec-notes').value=i.notes||'';
        g('rec-fav').checked=!!i.favourite;
        g('rec-form-title').textContent='Edit Recipe';g('rec-cancel').style.display='inline-flex';
        panel.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
    panel.querySelectorAll('.recd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this recipe?'))return;
        items=items.filter(function(x){return x.id!==b.dataset.id;});await sv();render();
      });
    });
  }

  g('rec-save').addEventListener('click',async function(){
    var name=g('rec-name').value.trim();if(!name)return;
    var obj={id:editId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      name:name,category:g('rec-cat').value,yield:g('rec-yield').value.trim(),
      cure:g('rec-cure').value.trim(),ingredients:g('rec-ingredients').value.trim(),
      steps:g('rec-steps').value.trim(),cost:g('rec-cost').value,
      notes:g('rec-notes').value.trim(),favourite:g('rec-fav').checked};
    if(editId){var idx=items.findIndex(function(x){return x.id===editId;});if(idx>=0)items[idx]=obj;}else items.unshift(obj);
    editId=null;g('rec-form-title').textContent='Add Recipe';g('rec-cancel').style.display='none';
    ['rec-name','rec-yield','rec-cure','rec-ingredients','rec-steps','rec-cost','rec-notes'].forEach(function(id){g(id).value='';});
    g('rec-cat').value='Sublimation';g('rec-fav').checked=false;
    await sv();render();
  });
  g('rec-cancel').addEventListener('click',function(){editId=null;g('rec-form-title').textContent='Add Recipe';g('rec-cancel').style.display='none';});
  g('rec-search').addEventListener('input',render);
  g('rec-cat-filter').addEventListener('change',render);
  g('rec-fav-filter').addEventListener('change',render);
  window.__makerInit_recipes=load;
})();