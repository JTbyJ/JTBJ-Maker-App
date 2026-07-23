(function(){
  var FILE='sku.json';
  var frame=document.getElementById('module-frame');
  var panel=document.createElement('div');
  panel.id='panel-sku';panel.className='module-panel';

  /* ── SHARED OSOT CATEGORY SYSTEM ── */
  var OSOT_CATS={
    'FIL':{label:'Filament',     color:'var(--accent)',    subs:{PLA:'PLA',PTG:'PETG',TPU:'TPU',ABS:'ABS',SLK:'Silk',PLX:'PLA-CF',WOD:'PLA Wood'}},
    'MAT':{label:'Materials',    color:'var(--gold)',      subs:{WOD:'Wood Board',ACR:'Acrylic',MDF:'MDF',SLT:'Slate',LTH:'Leather',CRK:'Cork'}},
    'BLK':{label:'Blanks',       color:'var(--teal)',      subs:{MUG:'Mug',TBL:'Tumbler',TEE:'T-Shirt',TOT:'Tote Bag',TIL:'Tile',CST:'Coaster',PLW:'Pillow',MSP:'Mouse Pad',PHN:'Phone Case',ORN:'Ornament'}},
    'CONS':{label:'Consumables', color:'var(--green)',     subs:{INK:'Ink',PPR:'Paper',TFN:'Teflon Sheet',TPS:'Tape',GOV:'Gloves',SLG:'Silica Gel'}},
    'PKG':{label:'Packaging',    color:'var(--text-muted)',subs:{PLY:'Poly Mailer',BOX:'Box',TSS:'Tissue Paper',STK:'Sticker',RBN:'Ribbon',BAG:'Gift Bag'}},
    'SUB':{label:'Sublimation Supplies',color:'var(--red)',subs:{PPR:'Sub Paper',INK:'Sub Ink',MWP:'Mug Wrap',SHK:'Shrink Wrap'}}
  };

  /* ── AUTO-SEQUENCE: find next number for a given CAT-SUBCAT ── */
  function nextSeq(items,catCode,subCode){
    var prefix=catCode+'-'+subCode+'-';
    var max=0;
    items.forEach(function(i){
      if(i.sku&&i.sku.indexOf(prefix)===0){
        var n=parseInt(i.sku.slice(prefix.length))||0;
        if(n>max)max=n;
      }
    });
    return String(max+1).padStart(3,'0');
  }

  /* ── BUILD CATEGORY OPTIONS ── */
  function buildCatOptions(selected){
    var html='';
    Object.keys(OSOT_CATS).forEach(function(code){
      var sel=(selected===code)?' selected':'';
      html+='<option value="'+code+'"'+sel+'>'+code+' - '+OSOT_CATS[code].label+'</option>';
    });
    return html;
  }

  function buildSubcatOptions(catCode,selected){
    var html='';
    if(catCode&&OSOT_CATS[catCode]){
      Object.keys(OSOT_CATS[catCode].subs).forEach(function(sub){
        var sel=(selected===sub)?' selected':'';
        html+='<option value="'+sub+'"'+sel+'>'+sub+' - '+OSOT_CATS[catCode].subs[sub]+'</option>';
      });
    }
    return html;
  }

  /* ── PANEL HTML ── */
  panel.innerHTML=
    '<div class="page-header"><h2>SKU Builder</h2><p>Generate and manage product SKUs &mdash; CATEGORY-SUBCATEGORY-SEQUENCE</p></div>'+

    '<div class="stat-row">'+
      '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="sku-total">0</div><div class="sl">Total SKUs</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--gold)" id="sku-revenue">$0.00</div><div class="sl">Revenue Potential</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--green)" id="sku-margin">0%</div><div class="sl">Avg Margin</div></div>'+
    '</div>'+

    '<div class="card" style="margin-bottom:20px">'+
      '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="sku-form-title">Build New SKU</h3>'+

      /* SKU PREVIEW */
      '<div style="background:var(--bg);border:2px solid var(--accent);border-radius:10px;padding:16px;margin-bottom:16px;text-align:center">'+
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:6px">SKU Preview</div>'+
        '<div id="sku-preview" style="font-size:28px;font-weight:900;font-family:monospace;color:var(--accent);letter-spacing:2px">FIL-PLA-001</div>'+
        '<div style="font-size:11px;color:var(--text-muted);margin-top:6px">Format: CATEGORY-SUBCATEGORY-SEQUENCE</div>'+
      '</div>'+

      /* CATEGORY + SUBCATEGORY SELECTS */
      '<div class="input-row">'+
        '<div class="field">'+
          '<label>CATEGORY GROUP</label>'+
          '<select id="sku-catgroup" style="font-family:monospace;font-weight:700">'+
            buildCatOptions('FIL')+
          '</select>'+
        '</div>'+
        '<div class="field">'+
          '<label>SUB-CATEGORY CODE</label>'+
          '<select id="sku-subcat" style="font-family:monospace;font-weight:700">'+
            buildSubcatOptions('FIL','PLA')+
          '</select>'+
        '</div>'+
        '<div class="field">'+
          '<label>SEQUENCE #</label>'+
          '<input id="sku-seq" value="001" placeholder="001" style="font-family:monospace;font-weight:700;width:80px">'+
        '</div>'+
        '<div class="field">'+
          '<label>Custom Override SKU</label>'+
          '<input id="sku-custom" placeholder="Leave blank to auto-build" style="font-family:monospace">'+
        '</div>'+
      '</div>'+

      /* PRODUCT DETAILS */
      '<div class="input-row">'+
        '<div class="field" style="flex:2"><label>Product Name</label><input id="sku-pname" placeholder="e.g. Hyper PLA Blue 1kg"></div>'+
        '<div class="field"><label>Brand</label><input id="sku-brand" placeholder="e.g. CREALITY"></div>'+
        '<div class="field"><label>Status</label><select id="sku-status"><option>Active</option><option>Draft</option><option>Discontinued</option></select></div>'+
      '</div>'+

      /* PRICING */
      '<div class="input-row">'+
        '<div class="field"><label>Cost (CAD $)</label><input id="sku-cost" type="number" step="0.01" placeholder="0.00"></div>'+
        '<div class="field"><label>Price (CAD $)</label><input id="sku-price" type="number" step="0.01" placeholder="0.00"></div>'+
        '<div class="field"><label>Margin %</label>'+
          '<div id="sku-margin-live" style="padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;font-weight:700;font-size:14px;color:var(--text-muted)">--%</div>'+
        '</div>'+
        '<div class="field"><label>COGS (CAD $)</label><input id="sku-cogs" type="number" step="0.01" placeholder="e.g. 6.78"></div>'+
        '<div class="field"><label>Retail Price ($)</label><input id="sku-retail" type="number" step="0.01" placeholder="e.g. 18.00"></div>'+
      '</div>'+

      '<div class="input-row">'+
        '<div class="field" style="flex:2"><label>Description / Notes</label><input id="sku-notes" placeholder="e.g. 11oz sublimation mug, white poly-coated"></div>'+
      '</div>'+

      '<div style="display:flex;gap:8px;margin-top:10px">'+
        '<button class="btn btn-primary" id="sku-save">Save SKU</button>'+
        '<button class="btn btn-ghost" id="sku-cancel" style="display:none">Cancel</button>'+
      '</div>'+
    '</div>'+

    /* TOOLBAR */
    '<div class="toolbar">'+
      '<div class="search-box"><input id="sku-search" placeholder="Search SKUs..."></div>'+
      '<select id="sku-cat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
        '<option value="">All Categories</option>'+
        '<option value="FIL">FIL - Filament</option>'+
        '<option value="MAT">MAT - Materials</option>'+
        '<option value="BLK">BLK - Blanks</option>'+
        '<option value="CONS">CONS - Consumables</option>'+
        '<option value="PKG">PKG - Packaging</option>'+
        '<option value="SUB">SUB - Sublimation Supplies</option>'+
      '</select>'+
      '<select id="sku-stat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
        '<option value="">All Statuses</option>'+
        '<option>Active</option><option>Draft</option><option>Discontinued</option>'+
      '</select>'+
    '</div>'+
    '<div class="table-wrap"><table><thead><tr>'+
      '<th>SKU</th><th>Product Name</th><th>CAT</th><th>Brand</th><th>Cost</th><th>Price</th><th>COGS</th><th>Retail</th><th>Margin</th><th>Status</th><th>Actions</th>'+
    '</tr></thead><tbody id="sku-tbody"></tbody></table></div>';

  frame.appendChild(panel);

  var items=[],editId=null;
  function $(id){return document.getElementById(id);}

  /* ── PREVIEW BUILDER ── */
  function buildPreview(){
    var custom=$('sku-custom').value.trim();
    if(custom){$('sku-preview').textContent=custom.toUpperCase();return;}
    var cat=$('sku-catgroup').value||'FIL';
    var sub=$('sku-subcat').value||'PLA';
    var seq=$('sku-seq').value.trim()||nextSeq(items,cat,sub);
    $('sku-preview').textContent=cat+'-'+sub+'-'+String(parseInt(seq)||1).padStart(3,'0');
  }

  /* ── CATEGORY CHANGE ── */
  function onCatGroupChange(){
    var code=$('sku-catgroup').value;
    $('sku-subcat').innerHTML=buildSubcatOptions(code,'');
    buildPreview();
  }

  /* ── MARGIN CALCULATOR ── */
  function calcMargin(){
    var cost=parseFloat($('sku-cost').value)||0;
    var price=parseFloat($('sku-price').value)||0;
    var el=$('sku-margin-live');
    if(!price){el.textContent='--%';el.style.color='var(--text-muted)';return;}
    var m=((price-cost)/price*100);
    el.textContent=m.toFixed(1)+'%';
    el.style.color=m>=40?'var(--green)':m>=20?'var(--gold)':'var(--red)';
  }

  /* ── EVENT LISTENERS ON FORM FIELDS ── */
  ['sku-catgroup','sku-subcat','sku-seq','sku-custom'].forEach(function(id){
    var el=$(id);
    if(el){
      el.addEventListener('input',buildPreview);
      el.addEventListener('change',id==='sku-catgroup'?onCatGroupChange:buildPreview);
    }
  });
  ['sku-cost','sku-price'].forEach(function(id){$(id).addEventListener('input',calcMargin);});

  /* ── LOAD ── */
  async function load(){
    items=await window.makerAPI.readData(FILE)||[];
    buildPreview();
    render();
  }
  async function sv(){await window.makerAPI.writeData(FILE,items);}

  /* ── RENDER TABLE ── */
  function render(){
    var q=$('sku-search').value.toLowerCase();
    var cf=$('sku-cat-filter').value;
    var sf=$('sku-stat-filter').value;
    var fi=items.filter(function(i){
      var catOk=!cf||(i.cat||'')===cf;
      var statOk=!sf||i.status===sf;
      var qOk=!q||JSON.stringify(i).toLowerCase().indexOf(q)!==-1;
      return catOk&&statOk&&qOk;
    });

    /* Stats */
    $('sku-total').textContent=items.length;
    var activeItems=items.filter(function(i){return i.status==='Active'&&i.price;});
    $('sku-revenue').textContent='$'+activeItems.reduce(function(s,i){return s+Number(i.price||0);},0).toFixed(2);
    var margins=items.filter(function(i){return i.price&&i.cost;}).map(function(i){return(Number(i.price)-Number(i.cost))/Number(i.price)*100;});
    $('sku-margin').textContent=margins.length?(margins.reduce(function(a,b){return a+b;},0)/margins.length).toFixed(1)+'%':'0%';

    /* Status badge colours */
    var sc={Active:'badge-green',Draft:'badge-muted',Discontinued:'badge-red'};

    $('sku-tbody').innerHTML=fi.length?fi.map(function(i){
      var catInfo=OSOT_CATS[i.cat]||{label:i.cat||'—',color:'var(--text-muted)'};
      var catBadge='<span style="background:'+catInfo.color+';color:#fff;border-radius:5px;padding:2px 7px;font-size:11px;font-weight:800;font-family:monospace">'+
        (i.cat||'?')+'</span>';
      var margin=(i.price&&i.cost)?((Number(i.price)-Number(i.cost))/Number(i.price)*100).toFixed(1)+'%':'--';
      return '<tr>'+
        '<td style="font-family:monospace;font-weight:700;color:var(--accent)">'+i.sku+'</td>'+
        '<td style="font-weight:600">'+i.name+'</td>'+
        '<td>'+catBadge+'<br><span style="font-size:11px;color:var(--text-muted)">'+(i.subcat?i.subcat:'')+'</span></td>'+
        '<td>'+(i.brand||'')+'</td>'+
        '<td>$'+Number(i.cost||0).toFixed(2)+'</td>'+
        '<td>$'+Number(i.price||0).toFixed(2)+'</td>'+
        '<td>$'+Number(i.cogs||0).toFixed(2)+'</td>'+
        '<td>$'+Number(i.retail||0).toFixed(2)+'</td>'+
        '<td style="font-weight:700;color:'+(parseFloat(margin)>=40?'var(--green)':parseFloat(margin)>=20?'var(--gold)':'var(--red)')+'">'+margin+'</td>'+
        '<td><span class="badge '+(sc[i.status]||'')+'">'+i.status+'</span></td>'+
        '<td>'+
          '<button class="btn btn-ghost btn-sm skue" data-id="'+i.id+'">Edit</button> '+
          '<button class="btn btn-danger btn-sm skud" data-id="'+i.id+'">Del</button>'+
        '</td>'+
      '</tr>';
    }).join(''):'<tr><td colspan="11" class="empty-state"><p>No SKUs yet. Build your first one above!</p></td></tr>';

    /* Edit buttons */
    panel.querySelectorAll('.skue').forEach(function(b){
      b.addEventListener('click',function(){
        var i=items.find(function(x){return x.id===b.dataset.id;});if(!i)return;
        editId=b.dataset.id;
        $('sku-custom').value=i.sku||'';
        $('sku-catgroup').value=i.cat||'FIL';
        $('sku-subcat').innerHTML=buildSubcatOptions(i.cat||'FIL',i.subcat||'');
        $('sku-seq').value='';
        $('sku-pname').value=i.name||'';
        $('sku-brand').value=i.brand||'';
        $('sku-cost').value=i.cost||'';
        $('sku-price').value=i.price||'';
        $('sku-cogs').value=i.cogs||'';
        $('sku-retail').value=i.retail||'';
        $('sku-status').value=i.status||'Active';
        $('sku-notes').value=i.notes||'';
        buildPreview();calcMargin();
        $('sku-form-title').textContent='Edit SKU';
        $('sku-cancel').style.display='inline-flex';
        panel.querySelector('.page-header').scrollIntoView({behavior:'smooth'});
      });
    });
    /* Delete buttons */
    panel.querySelectorAll('.skud').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this SKU?'))return;
        items=items.filter(function(x){return x.id!==b.dataset.id;});
        await sv();render();
      });
    });
  }

  /* ── SAVE ── */
  $('sku-save').addEventListener('click',async function(){
    var name=$('sku-pname').value.trim();
    if(!name){alert('Product name is required.');return;}
    var skuVal=$('sku-custom').value.trim()||$('sku-preview').textContent;
    var catCode=$('sku-catgroup').value;
    var subCode=$('sku-subcat').value;
    var obj={
      id:editId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      sku:skuVal,
      name:name,
      cat:catCode,
      subcat:subCode,
      brand:$('sku-brand').value.trim(),
      cost:Number($('sku-cost').value)||0,
      price:Number($('sku-price').value)||0,
      cogs:Number($('sku-cogs').value)||0,
      retail:Number($('sku-retail').value)||0,
      status:$('sku-status').value,
      notes:$('sku-notes').value.trim()
    };
    if(editId){
      var idx=items.findIndex(function(x){return x.id===editId;});
      if(idx>=0)items[idx]=obj;
    } else {
      items.unshift(obj);
    }
    clearForm();
    await sv();render();
  });

  function clearForm(){
    editId=null;
    $('sku-form-title').textContent='Build New SKU';
    $('sku-cancel').style.display='none';
    $('sku-custom').value='';
    $('sku-pname').value='';
    $('sku-brand').value='';
    $('sku-cost').value='';
    $('sku-price').value='';
    $('sku-cogs').value='';
    $('sku-retail').value='';
    $('sku-notes').value='';
    $('sku-status').value='Active';
    $('sku-catgroup').value='FIL';
    $('sku-subcat').innerHTML=buildSubcatOptions('FIL','PLA');
    /* Auto-suggest next sequence */
    var nextNum=nextSeq(items,'FIL','PLA');
    $('sku-seq').value=nextNum;
    buildPreview();
    calcMargin();
  }

  $('sku-cancel').addEventListener('click',clearForm);
  $('sku-search').addEventListener('input',render);
  $('sku-cat-filter').addEventListener('change',render);
  $('sku-stat-filter').addEventListener('change',render);

  window.__makerInit_sku=load;
})();