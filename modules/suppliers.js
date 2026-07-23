(function(){
  var FILE='suppliers.json';
  var frame=document.getElementById('module-frame');
  var panel=document.createElement('div');
  panel.id='panel-suppliers';panel.className='module-panel';

  var SEED=[
    {id:'sup001',name:'Filaments.ca',category:'Filament',status:'Active',
     website:'filaments.ca',contact:'',email:'',phone:'',
     lead:'3-7 business days',minOrder:'',shipping:'Free shipping over $75 CAD',rating:5,
     notes:'Canadian-based filament supplier. Wide range of PLA, PETG, TPU. Fast domestic shipping. Loyalty points program.'},
    {id:'sup002',name:'Creality Official Store',category:'Equipment',status:'Active',
     website:'store.creality.com',contact:'',email:'',phone:'',
     lead:'7-21 days (international)',minOrder:'',shipping:'Varies by order',rating:4,
     notes:'Official Creality parts, filament and accessories. Use for K1C-specific parts, hardened nozzles, CFS-C accessories.'},
    {id:'sup003',name:'Innovative Colour Corp (ICC)',category:'Sublimation',status:'Active',
     website:'icccanada.com',contact:'',email:'',phone:'',
     lead:'3-5 business days',minOrder:'',shipping:'Free shipping over threshold',rating:5,
     notes:'Canadian sublimation blank supplier. Mugs, tumblers, tiles, apparel. Best for Canadian orders - no duties or border delays.'},
    {id:'sup004',name:'Conde Systems',category:'Sublimation',status:'Active',
     website:'condeinc.com',contact:'',email:'',phone:'',
     lead:'5-10 days (US to CA)',minOrder:'',shipping:'International shipping available',rating:4,
     notes:'Large US sublimation blank supplier. Wide selection. Import duties may apply. Good for specialty items not available in Canada.'},
    {id:'sup005',name:'Coastal Business Supplies',category:'Sublimation',status:'Active',
     website:'coastalbusiness.com',contact:'',email:'',phone:'',
     lead:'7-14 days (US to CA)',minOrder:'',shipping:'International shipping available',rating:4,
     notes:'US sublimation supplies. Ink, paper, blanks. Compare with ICC before ordering - duties can add 15-20% to cost.'},
    {id:'sup006',name:'Uline Canada',category:'Packaging',status:'Active',
     website:'uline.ca',contact:'',email:'',phone:'1-800-295-5510',
     lead:'1-3 business days',minOrder:'No minimum',shipping:'Competitive rates, volume discounts',rating:5,
     notes:'Canadian warehouse (Brampton ON). Poly mailers, boxes, tissue, tape, labels. Fast and reliable. Best pricing on volume packaging.'},
    {id:'sup007',name:'ArtResin',category:'Resin',status:'Active',
     website:'artresin.com',contact:'',email:'',phone:'',
     lead:'3-7 days',minOrder:'',shipping:'Free shipping over $35 CAD',rating:4,
     notes:'Canadian epoxy resin brand (Toronto). Non-toxic formula, food-safe when cured. Good for coasters, river tables, art pieces.'},
    {id:'sup008',name:'Siser North America',category:'Vinyl / HTV',status:'Active',
     website:'siserna.com',contact:'',email:'',phone:'',
     lead:'Varies by distributor',minOrder:'',shipping:'Via Canadian distributors',rating:4,
     notes:'Premium HTV brand. Buy through Canadian distributors for best pricing and no duties. EasyWeed and Glitter lines work well with Cricut.'},
    {id:'sup009',name:'Expressions Vinyl',category:'Vinyl / HTV',status:'Active',
     website:'expressionsvinyl.com',contact:'',email:'',phone:'',
     lead:'7-14 days (US to CA)',minOrder:'',shipping:'International available - budget for duties',rating:4,
     notes:'Large US HTV and craft vinyl supplier. Great variety and pricing. Factor in ~15% duties for Canadian orders. Stock up to justify shipping.'},
    {id:'sup010',name:'SanMar Canada',category:'Blanks',status:'Active',
     website:'sanmar.com',contact:'',email:'',phone:'',
     lead:'3-7 business days',minOrder:'No minimum (case pricing available)',shipping:'Canadian distribution',rating:4,
     notes:'Wholesale apparel blanks. T-shirts, hoodies, totes. Require account setup. Port & Company and Gildan lines popular for sublimation.'},
    {id:'sup011',name:'Michaels Canada',category:'Craft Supplies',status:'Active',
     website:'michaels.com/ca',contact:'',email:'',phone:'',
     lead:'Same day (in-store)',minOrder:'No minimum',shipping:'Free over $49 online',rating:3,
     notes:'Local craft chain. Good for resin supplies, molds, acrylic paints, candle supplies, packaging accents. Price-match available. Check weekly sales.'},
    {id:'sup012',name:'Home Depot / Rona',category:'Materials',status:'Active',
     website:'homedepot.ca',contact:'',email:'',phone:'',
     lead:'Same day (in-store)',minOrder:'No minimum',shipping:'Delivery available',rating:3,
     notes:'Local source for wood boards, MDF, plywood, acrylic panels. Cut to size service available at some locations. Good for Sculpfun C30 Ultra materials.'}
  ];

  function starHTML(rating){
    var s='';
    for(var i=1;i<=5;i++){
      s+='<span style="color:'+(i<=rating?'var(--gold)':'var(--border)')+'">&#9733;</span>';
    }
    return s;
  }

  panel.innerHTML=
    '<div class="page-header"><h2>Suppliers</h2><p>12 Canadian-friendly vendors covering all OSOT categories &mdash; FIL, MAT, BLK, CONS, PKG, SUB</p></div>'+

    '<div class="stat-row">'+
      '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="sup-total">0</div><div class="sl">Total Suppliers</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--green)" id="sup-active">0</div><div class="sl">Active</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--gold)" id="sup-avg-rating">0.0</div><div class="sl">Avg Rating</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--teal)" id="sup-cats">0</div><div class="sl">Categories</div></div>'+
    '</div>'+

    '<div class="card" style="margin-bottom:20px">'+
      '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="sup-form-title">Add Supplier</h3>'+
      '<div class="input-row">'+
        '<div class="field" style="flex:2"><label>Supplier Name</label><input id="sup-name" placeholder="e.g. Filaments.ca"></div>'+
        '<div class="field"><label>Category</label><select id="sup-cat">'+
          '<option>Filament</option><option>Sublimation</option><option>Blanks</option>'+
          '<option>Vinyl / HTV</option><option>Packaging</option><option>Materials</option>'+
          '<option>Craft Supplies</option><option>Resin</option><option>Equipment</option>'+
          '<option>Apparel</option><option>Other</option>'+
        '</select></div>'+
        '<div class="field"><label>Status</label><select id="sup-status"><option>Active</option><option>Inactive</option><option>On Hold</option></select></div>'+
        '<div class="field"><label>Rating (1-5)</label><select id="sup-rating">'+
          '<option value="5">5 stars</option><option value="4">4 stars</option>'+
          '<option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option>'+
        '</select></div>'+
      '</div>'+
      '<div class="input-row">'+
        '<div class="field"><label>Website</label><input id="sup-website" placeholder="e.g. filaments.ca"></div>'+
        '<div class="field"><label>Contact Name</label><input id="sup-contact" placeholder="e.g. Jane Smith"></div>'+
        '<div class="field"><label>Contact Email</label><input id="sup-email" placeholder="e.g. support@supplier.ca"></div>'+
        '<div class="field"><label>Phone</label><input id="sup-phone" placeholder="e.g. 1-800-555-1234"></div>'+
      '</div>'+
      '<div class="input-row">'+
        '<div class="field"><label>Lead Time</label><input id="sup-lead" placeholder="e.g. 3-5 business days"></div>'+
        '<div class="field"><label>Min. Order</label><input id="sup-min" placeholder="e.g. $25 CAD"></div>'+
        '<div class="field"><label>Shipping Notes</label><input id="sup-ship" placeholder="e.g. Free over $75, duties may apply"></div>'+
      '</div>'+
      '<div class="field" style="margin-bottom:10px"><label>Notes</label><input id="sup-notes" placeholder="e.g. Best prices for PETG, check monthly sales, budget for duties on US orders"></div>'+
      '<div style="display:flex;gap:8px;margin-top:10px">'+
        '<button class="btn btn-primary" id="sup-save">Save Supplier</button>'+
        '<button class="btn btn-ghost" id="sup-cancel" style="display:none">Cancel</button>'+
      '</div>'+
    '</div>'+

    '<div class="toolbar">'+
      '<div class="search-box"><input id="sup-search" placeholder="Search suppliers..."></div>'+
      '<select id="sup-cat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
        '<option value="">All Categories</option>'+
        '<option>Filament</option><option>Sublimation</option><option>Blanks</option>'+
        '<option>Vinyl / HTV</option><option>Packaging</option><option>Materials</option>'+
        '<option>Craft Supplies</option><option>Resin</option><option>Equipment</option>'+
        '<option>Apparel</option><option>Other</option>'+
      '</select>'+
      '<select id="sup-stat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
        '<option value="">All Statuses</option><option>Active</option><option>Inactive</option><option>On Hold</option>'+
      '</select>'+
      '<select id="sup-rating-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
        '<option value="">All Ratings</option>'+
        '<option value="5">5 stars only</option><option value="4">4+ stars</option><option value="3">3+ stars</option>'+
      '</select>'+
    '</div>'+

    '<div id="sup-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;margin-top:16px"></div>'+

    '<div id="sup-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;align-items:center;justify-content:center">'+
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;width:min(600px,90vw);max-height:85vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.5)">'+
        '<button id="sup-modal-x" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;color:var(--text-muted);cursor:pointer;line-height:1">x</button>'+
        '<div id="sup-modal-body"></div>'+
        '<div style="display:flex;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">'+
          '<button class="btn btn-primary" id="sup-modal-edit">Edit This Supplier</button>'+
          '<button class="btn btn-ghost" id="sup-modal-close">Close</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  frame.appendChild(panel);

  var items=[],editId=null,modalId=null;
  function g(id){return document.getElementById(id);}
  function esc(v){return String(v===undefined||v===null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  function mf(label,val){
    if(!val&&val!==0)return '';
    return '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px">'+
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px">'+label+'</div>'+
      '<div style="font-size:14px">'+esc(val)+'</div></div>';
  }

  function showModal(id){
    var i=items.find(function(x){return x.id===id;});if(!i)return;
    modalId=id;
    var sc={Active:'badge-green',Inactive:'badge-muted','On Hold':'badge-gold'};
    g('sup-modal-body').innerHTML=
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;padding-right:30px">'+
        '<div>'+
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);margin-bottom:4px">'+esc(i.category)+'</div>'+
          '<h3 style="font-size:20px;font-weight:800;margin:0 0 4px">'+esc(i.name)+'</h3>'+
          '<div style="font-size:18px">'+starHTML(i.rating||0)+'</div>'+
        '</div>'+
        '<span class="badge '+(sc[i.status]||'')+'">'+esc(i.status)+'</span>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
        mf('Website',i.website)+
        mf('Contact',i.contact)+
        mf('Email',i.email)+
        mf('Phone',i.phone)+
        mf('Lead Time',i.lead)+
        mf('Min. Order',i.minOrder)+
      '</div>'+
      (i.shipping?'<div style="margin-top:10px">'+mf('Shipping',i.shipping)+'</div>':'')+
      (i.notes?'<div style="margin-top:10px">'+mf('Notes',i.notes)+'</div>':'');
    g('sup-modal').style.display='flex';
  }

  g('sup-modal').addEventListener('click',function(e){if(e.target===g('sup-modal'))g('sup-modal').style.display='none';});
  g('sup-modal-x').addEventListener('click',function(){g('sup-modal').style.display='none';});
  g('sup-modal-close').addEventListener('click',function(){g('sup-modal').style.display='none';});
  g('sup-modal-edit').addEventListener('click',function(){
    g('sup-modal').style.display='none';
    if(!modalId)return;
    var i=items.find(function(x){return x.id===modalId;});if(!i)return;
    editId=modalId;
    g('sup-name').value=i.name||'';g('sup-cat').value=i.category||'Filament';
    g('sup-status').value=i.status||'Active';g('sup-rating').value=String(i.rating||5);
    g('sup-website').value=i.website||'';g('sup-contact').value=i.contact||'';
    g('sup-email').value=i.email||'';g('sup-phone').value=i.phone||'';
    g('sup-lead').value=i.lead||'';g('sup-min').value=i.minOrder||'';
    g('sup-ship').value=i.shipping||'';g('sup-notes').value=i.notes||'';
    g('sup-form-title').textContent='Edit Supplier';g('sup-cancel').style.display='inline-flex';
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  });

  async function load(){
    items=await window.makerAPI.readData(FILE)||[];
    if(!items.length){items=SEED.slice();await window.makerAPI.writeData(FILE,items);}
    render();
  }
  async function sv(){await window.makerAPI.writeData(FILE,items);}

  function render(){
    var q=g('sup-search').value.toLowerCase();
    var cf=g('sup-cat-filter').value;
    var sf=g('sup-stat-filter').value;
    var rf=parseInt(g('sup-rating-filter').value)||0;
    var fi=items.filter(function(i){
      return(!cf||i.category===cf)&&(!sf||i.status===sf)&&
             (!rf||(i.rating||0)>=rf)&&
             (!q||JSON.stringify(i).toLowerCase().indexOf(q)>-1);
    });

    g('sup-total').textContent=items.length;
    g('sup-active').textContent=items.filter(function(i){return i.status==='Active';}).length;
    g('sup-cats').textContent=new Set(items.map(function(i){return i.category;})).size;
    var rated=items.filter(function(i){return i.rating;});
    var avgR=rated.length?(rated.reduce(function(s,i){return s+(i.rating||0);},0)/rated.length).toFixed(1):'0.0';
    g('sup-avg-rating').textContent=avgR;

    var sc={Active:'badge-green',Inactive:'badge-muted','On Hold':'badge-gold'};

    if(!fi.length){
      g('sup-grid').innerHTML='<div style="color:var(--text-muted);font-size:14px;grid-column:1/-1;text-align:center;padding:40px">No suppliers found.</div>';
      return;
    }

    g('sup-grid').innerHTML=fi.map(function(i){
      return '<div class="card" data-id="'+i.id+'" style="cursor:pointer;display:flex;flex-direction:column" title="Click to view full details">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);margin-bottom:2px">'+esc(i.category)+'</div>'+
            '<div style="font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(i.name)+'</div>'+
          '</div>'+
          '<span class="badge '+(sc[i.status]||'')+'">'+esc(i.status)+'</span>'+
        '</div>'+
        '<div style="font-size:15px;margin-bottom:8px">'+starHTML(i.rating||0)+'</div>'+
        (i.website?'<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">&#127760; '+esc(i.website)+'</div>':'')+
        (i.lead?'<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">&#128336; '+esc(i.lead)+'</div>':'')+
        (i.shipping?'<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">&#128666; '+esc(i.shipping)+'</div>':'')+
        (i.notes?'<div style="font-size:12px;color:var(--text-muted);font-style:italic;margin-bottom:10px;flex:1">'+esc(i.notes.substring(0,100))+(i.notes.length>100?'...':'')+'</div>':'<div style="flex:1"></div>')+
        '<div style="display:flex;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">'+
          '<button class="btn btn-primary btn-sm supv" data-id="'+i.id+'" style="flex:1">View Details</button>'+
          '<button class="btn btn-ghost btn-sm supe" data-id="'+i.id+'">Edit</button>'+
          '<button class="btn btn-danger btn-sm supd" data-id="'+i.id+'">Del</button>'+
        '</div>'+
      '</div>';
    }).join('');

    panel.querySelectorAll('#sup-grid .card').forEach(function(card){
      card.addEventListener('click',function(e){if(e.target.closest('button'))return;showModal(card.dataset.id);});
    });
    panel.querySelectorAll('.supv').forEach(function(b){b.addEventListener('click',function(){showModal(b.dataset.id);});});
    panel.querySelectorAll('.supe').forEach(function(b){
      b.addEventListener('click',function(){
        var i=items.find(function(x){return x.id===b.dataset.id;});if(!i)return;
        editId=b.dataset.id;
        g('sup-name').value=i.name||'';g('sup-cat').value=i.category||'Filament';
        g('sup-status').value=i.status||'Active';g('sup-rating').value=String(i.rating||5);
        g('sup-website').value=i.website||'';g('sup-contact').value=i.contact||'';
        g('sup-email').value=i.email||'';g('sup-phone').value=i.phone||'';
        g('sup-lead').value=i.lead||'';g('sup-min').value=i.minOrder||'';
        g('sup-ship').value=i.shipping||'';g('sup-notes').value=i.notes||'';
        g('sup-form-title').textContent='Edit Supplier';g('sup-cancel').style.display='inline-flex';
        panel.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
    panel.querySelectorAll('.supd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this supplier?'))return;
        items=items.filter(function(x){return x.id!==b.dataset.id;});await sv();render();
      });
    });
  }

  g('sup-save').addEventListener('click',async function(){
    var name=g('sup-name').value.trim();if(!name){alert('Please enter a supplier name.');return;}
    var obj={
      id:editId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      name:name,category:g('sup-cat').value,status:g('sup-status').value,
      rating:parseInt(g('sup-rating').value)||5,
      website:g('sup-website').value.trim(),contact:g('sup-contact').value.trim(),
      email:g('sup-email').value.trim(),phone:g('sup-phone').value.trim(),
      lead:g('sup-lead').value.trim(),minOrder:g('sup-min').value.trim(),
      shipping:g('sup-ship').value.trim(),notes:g('sup-notes').value.trim()
    };
    if(editId){var idx=items.findIndex(function(x){return x.id===editId;});if(idx>=0)items[idx]=obj;}
    else items.unshift(obj);
    editId=null;
    g('sup-form-title').textContent='Add Supplier';g('sup-cancel').style.display='none';
    ['sup-name','sup-website','sup-contact','sup-email','sup-phone','sup-lead','sup-min','sup-ship','sup-notes'].forEach(function(id){g(id).value='';});
    g('sup-cat').value='Filament';g('sup-status').value='Active';g('sup-rating').value='5';
    await sv();render();
  });
  g('sup-cancel').addEventListener('click',function(){
    editId=null;g('sup-form-title').textContent='Add Supplier';g('sup-cancel').style.display='none';
  });
  g('sup-search').addEventListener('input',render);
  g('sup-cat-filter').addEventListener('change',render);
  g('sup-stat-filter').addEventListener('change',render);
  g('sup-rating-filter').addEventListener('change',render);

  window.__makerInit_suppliers=load;
})();
