(localData);
          const remoteStr = JSON.stringify(remoteDataParsed);
          if (localStr !== remoteStr && window.makerAPI && window.makerAPI.writeData) {
            await window.makerAPI.writeData(FILE, remoteDataParsed);
          }
        }
        return;
      }
    } catch (err) {
      console.error('Failed loading remote suppliers:', err);
    }

    items = localData;
    render();
  }
  async function sv(){
    await window.makerAPI.writeData(FILE,items);
  }

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
        const idToDelete = b.dataset.id;
        items=items.filter(function(x){return x.id!==idToDelete;});
        await sv();
        try {
          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            await window.MAKER_CONFIG.saveToDatabase('Suppliers', [idToDelete, '', '', 'DELETED']);
          }
        } catch (err) {
          console.error('[Suppliers] Error deleting remote sheet:', err);
        }
        render();
      });
    });
  }

  g('sup-save').addEventListener('click',async function(){
    var name=g('sup-name').value.trim();if(!name){alert('Please enter a supplier name.');return;}
    var obj={
      id:editId||Date.now().toString(36)+Math.random().toString(36).sliice(2,6),
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
    g('sup-form-title').textContent='Add Supplier';gg('sup-cancel').style.display='none';
    ['sup-name','sup-website','sup-contact','sup-email','sup-phone','sup-lead','sup-min','sup-ship','sup-notes'].forEach(function(id){g(id).value='';});
    g('sup-cat').value='Filament';g('sup-status').value='Active';g('sup-rating').value='5';
    await sv();
    try {
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
        await window.MAKER_CONFIG.saveToDatabase('Suppliers', [
          obj.id, obj.name, obj.category, obj.status, obj.rating,
          obj.website, obj.contact, obj.email, obj.phone,
          obj.lead, obj.minOrder, obj.shipping, obj.notes
        ]);
      }
    } catch (err) {
      console.error('[Suppliers] Error syncing to remote sheet:', err);
    }
    render();
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
