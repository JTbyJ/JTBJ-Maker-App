(function(){
  var FILE='print3d.json';
  var frame=document.getElementById('module-frame');
  var panel=document.createElement('div');
  panel.id='panel-print3d';panel.className='module-panel';

  panel.innerHTML=
    '<div class="page-header"><h2>3D Print Hub</h2><p>Track print jobs, filament settings &amp; results — Creality K1C</p></div>'+

    '<div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--border)">'+
      '<button id="p3-tab-jobs" style="padding:10px 28px;background:none;border:none;border-bottom:3px solid var(--accent);color:var(--accent);font-weight:700;font-size:14px;cursor:pointer;margin-bottom:-2px">Jobs</button>'+
      '<button id="p3-tab-ref" style="padding:10px 28px;background:none;border:none;border-bottom:3px solid transparent;color:var(--text-muted);font-weight:600;font-size:14px;cursor:pointer;margin-bottom:-2px">Filament Guide</button>'+
    '</div>'+

    /* ===== JOBS PANE ===== */
    '<div id="p3-jobs-pane">'+
    '<div class="stat-row">'+
      '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="p3-total">0</div><div class="sl">Total Jobs</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--green)" id="p3-success">0</div><div class="sl">Successful</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--teal)" id="p3-time">0h</div><div class="sl">Print Time</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--gold)" id="p3-grams">0g</div><div class="sl">Filament Used</div></div>'+
    '</div>'+

    '<div class="card" style="margin-bottom:20px">'+
      '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="p3-form-title">Add Print Job</h3>'+
      '<div class="input-row">'+
        '<div class="field" style="flex:2"><label>Job Name</label><input id="p3-name" placeholder="e.g. Phone Stand v2"></div>'+
        '<div class="field" style="flex:1"><label>Printer</label><input id="p3-printer" value="Creality K1C" placeholder="Creality K1C"></div>'+
        '<div class="field" style="flex:1"><label>Slicer</label><input id="p3-slicer" value="Creality Print" placeholder="Creality Print"></div>'+
      '</div>'+
      '<div class="input-row">'+
        '<div class="field"><label>Filament Brand</label><select id="p3-brand"><option value="">-- Select --</option></select></div>'+
        '<div class="field"><label>Material</label><select id="p3-material"><option>CR-PLA</option><option>CR-PLA WOOD</option><option>Hyper PLA</option><option>Luminous PLA</option><option>PLA-CF</option><option>PLA Silk</option><option>PETG</option><option>High Speed TPU</option><option>ABS</option><option>ASA</option><option>Resin</option><option>Other</option></select></div>'+
        '<div class="field"><label>Colour</label><input id="p3-colour" placeholder="e.g. Blue"></div>'+
        '<div class="field"><label>Nozzle C</label><input id="p3-nozzle" type="number" placeholder="220"></div>'+
        '<div class="field"><label>Bed C</label><input id="p3-bed" type="number" placeholder="60"></div>'+
      '</div>'+
      '<div class="input-row">'+
        '<div class="field"><label>Layer (mm)</label><input id="p3-layer" placeholder="0.20"></div>'+
        '<div class="field"><label>Infill %</label><input id="p3-infill" type="number" placeholder="15"></div>'+
        '<div class="field"><label>Print Time</label><input id="p3-ptime" placeholder="e.g. 2h 30m"></div>'+
        '<div class="field"><label>Grams Used</label><input id="p3-grams-in" type="number" placeholder="45"></div>'+
        '<div class="field"><label>Status</label><select id="p3-status"><option>Queued</option><option>Printing</option><option>Success</option><option>Failed</option><option>Paused</option><option>Cancelled</option></select></div>'+
      '</div>'+
      '<div class="field"><label>Notes</label><input id="p3-notes" placeholder="e.g. First layer issues - increased bed temp to 65C"></div>'+
      '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary" id="p3-save">Save Job</button><button class="btn btn-ghost" id="p3-cancel" style="display:none">Cancel</button></div>'+
    '</div>'+

    '<div class="toolbar">'+
      '<div class="search-box"><input id="p3-search" placeholder="Search jobs..."></div>'+
      '<select id="p3-mat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
        '<option value="">All Materials</option>'+
        '<option>CR-PLA</option><option>CR-PLA WOOD</option><option>Hyper PLA</option>'+
        '<option>PLA Silk</option><option>PLA-CF</option><option>PETG</option>'+
        '<option>High Speed TPU</option><option>ABS</option><option>ASA</option><option>Resin</option>'+
      '</select>'+
      '<select id="p3-stat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
        '<option value="">All Statuses</option><option>Queued</option><option>Printing</option>'+
        '<option>Success</option><option>Failed</option><option>Paused</option><option>Cancelled</option>'+
      '</select>'+
    '</div>'+
    '<div class="table-wrap"><table><thead><tr>'+
      '<th>Job Name</th><th>Brand</th><th>Material</th><th>Colour</th><th>Nozzle</th><th>Bed</th><th>Layer</th><th>Infill</th><th>Time</th><th>Grams</th><th>Status</th><th>Actions</th>'+
    '</tr></thead><tbody id="p3-tbody"></tbody></table></div>'+
    '</div>'+

    /* ===== FILAMENT GUIDE PANE ===== */
    '<div id="p3-ref-pane" style="display:none">'+

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">'+

        /* Settings table card */
        '<div class="card" style="grid-column:1/-1">'+
          '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">FDM Filament Quick-Reference &mdash; Creality K1C</h3>'+
          '<div class="table-wrap">'+
          '<table><thead><tr>'+
            '<th>Material</th><th>Nozzle Range</th><th>Bed Temp</th><th>Speed</th><th>Dry Temp</th><th>Meters / 1kg</th><th>CFS-C Safe</th><th>Notes</th>'+
          '</tr></thead><tbody id="p3-ref-tbody"></tbody></table>'+
          '</div>'+
        '</div>'+

        /* Storage rules */
        '<div class="card">'+
          '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Filament Storage Rules</h3>'+
          '<div style="display:flex;flex-direction:column;gap:10px">'+
            '<div style="display:flex;gap:10px;align-items:flex-start">'+
              '<div style="background:var(--accent);color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">1</div>'+
              '<div><div style="font-weight:600;font-size:13px">Humidity: below 40% RH</div><div style="font-size:12px;color:var(--text-muted)">Use silica gel packets in sealed containers. Check hygrometer weekly. PETG and TPU are most sensitive.</div></div>'+
            '</div>'+
            '<div style="display:flex;gap:10px;align-items:flex-start">'+
              '<div style="background:var(--accent);color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">2</div>'+
              '<div><div style="font-weight:600;font-size:13px">Temperature: 18-22C</div><div style="font-size:12px;color:var(--text-muted)">Avoid direct sunlight and heat sources. Do not store near windows or vents. Stable temp reduces brittle spools.</div></div>'+
            '</div>'+
            '<div style="display:flex;gap:10px;align-items:flex-start">'+
              '<div style="background:var(--accent);color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">3</div>'+
              '<div><div style="font-weight:600;font-size:13px">Vacuum bags + silica gel</div><div style="font-size:12px;color:var(--text-muted)">Seal opened spools in vacuum storage bags with 2-4 silica gel packets. Label with open date.</div></div>'+
            '</div>'+
            '<div style="display:flex;gap:10px;align-items:flex-start">'+
              '<div style="background:var(--accent);color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">4</div>'+
              '<div><div style="font-weight:600;font-size:13px">Recharge silica gel</div><div style="font-size:12px;color:var(--text-muted)">Bake silica gel at 120C for 2-3 hrs when colour indicator turns pink/white. Rechargeable indefinitely.</div></div>'+
            '</div>'+
            '<div style="display:flex;gap:10px;align-items:flex-start">'+
              '<div style="background:var(--gold);color:#000;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">!</div>'+
              '<div><div style="font-weight:600;font-size:13px">TPU Warning</div><div style="font-size:12px;color:var(--text-muted)">Overture High Speed TPU — SPOOL HOLDER ONLY. Do NOT load into CFS-C multi-filament system. Causes jams.</div></div>'+
            '</div>'+
          '</div>'+
        '</div>'+

        /* Wet filament */
        '<div class="card">'+
          '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Wet Filament Warning Signs</h3>'+
          '<div style="display:flex;flex-direction:column;gap:8px">'+
            '<div style="background:var(--bg);border-radius:8px;padding:10px;border-left:3px solid var(--red)">'+
              '<div style="font-weight:600;font-size:13px;color:var(--red)">Popping / Crackling sounds</div>'+
              '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">Steam bubbles in melted filament. Most obvious sign. Stop printing immediately and dry the spool.</div>'+
            '</div>'+
            '<div style="background:var(--bg);border-radius:8px;padding:10px;border-left:3px solid var(--gold)">'+
              '<div style="font-weight:600;font-size:13px;color:var(--gold)">Excessive stringing</div>'+
              '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">Thin hairs between features. More than usual for that material = moisture issue, not a settings issue.</div>'+
            '</div>'+
            '<div style="background:var(--bg);border-radius:8px;padding:10px;border-left:3px solid var(--gold)">'+
              '<div style="font-weight:600;font-size:13px;color:var(--gold)">Poor first-layer adhesion</div>'+
              '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">Warping, lifting corners, prints not sticking even with clean bed. Often moisture causing inconsistent extrusion.</div>'+
            '</div>'+
            '<div style="background:var(--bg);border-radius:8px;padding:10px;border-left:3px solid var(--gold)">'+
              '<div style="font-weight:600;font-size:13px;color:var(--gold)">Rough / bubbly surface texture</div>'+
              '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">Surface looks pitted or sandy. Small bubbles in layers. Steam disrupting extrusion flow.</div>'+
            '</div>'+
            '<div style="background:var(--bg);border-radius:8px;padding:10px;border-left:3px solid var(--teal)">'+
              '<div style="font-weight:600;font-size:13px;color:var(--teal)">Fix: Dry your filament</div>'+
              '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">PLA: 45C / 4-8 hrs. PETG: 65C / 4-8 hrs. TPU: 50C / 4-6 hrs. ABS: 70C / 4-8 hrs. Use food dehydrator or oven with door cracked.</div>'+
            '</div>'+
          '</div>'+
        '</div>'+

        /* Resin guide */
        '<div class="card" style="grid-column:1/-1">'+
          '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Resin Quick-Reference (UV 405nm)</h3>'+
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-bottom:14px">'+
            '<div style="background:var(--bg);border-radius:8px;padding:12px;text-align:center">'+
              '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:4px">UV Wavelength</div>'+
              '<div style="font-size:22px;font-weight:800;color:var(--accent)">405nm</div>'+
              '<div style="font-size:11px;color:var(--text-muted)">Standard for MSLA printers</div>'+
            '</div>'+
            '<div style="background:var(--bg);border-radius:8px;padding:12px;text-align:center">'+
              '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:4px">Bottom Layers</div>'+
              '<div style="font-size:22px;font-weight:800;color:var(--gold)">4-6</div>'+
              '<div style="font-size:11px;color:var(--text-muted)">With 40-60s exposure each</div>'+
            '</div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:12px;text-align:center">'+
              '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:4px">Normal Layers</div>'+
              '<div style="font-size:22px;font-weight:800;color:var(--teal)">2-4s</div>'+
              '<div style="font-size:11px;color:var(--text-muted)">Varies by resin brand / colour</div>'+
            '</div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:12px;text-align:center">'+
              '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:4px">Post Cure</div>'+
              '<div style="font-size:22px;font-weight:800;color:var(--green)">2-4 min</div>'+
              '<div style="font-size:11px;color:var(--text-muted)">UV station after IPA wash</div>'+
            '</div>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
            '<div>'+
              '<div style="font-weight:600;font-size:13px;margin-bottom:6px">Wash Process</div>'+
              '<div style="font-size:12px;color:var(--text-muted);display:flex;flex-direction:column;gap:4px">'+
                '<div>1. Drain excess resin back into bottle</div>'+
                '<div>2. Wash in 99% IPA — 30-60 seconds agitation</div>'+
                '<div>3. Second rinse in clean IPA</div>'+
                '<div>4. Air dry completely before UV curing</div>'+
                '<div>5. UV cure station 2-4 minutes</div>'+
              '</div>'+
            '</div>'+
            '<div>'+
              '<div style="font-weight:600;font-size:13px;margin-bottom:6px;color:var(--red)">Safety Essentials</div>'+
              '<div style="font-size:12px;color:var(--text-muted);display:flex;flex-direction:column;gap:4px">'+
                '<div>Always wear nitrile gloves — resin is a skin irritant</div>'+
                '<div>Good ventilation or respirator with organic vapour filter</div>'+
                '<div>UV-blocking safety glasses during printing</div>'+
                '<div>Never pour liquid resin down drain — cure first</div>'+
                '<div>Dispose of IPA wash as hazardous waste after evaporating</div>'+
                '<div>Keep resin away from direct sunlight when lid is open</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+

      '</div>'+
    '</div>';

  frame.appendChild(panel);

  function g(id){return document.getElementById(id);}

  /* TAB SWITCHING */
  g('p3-tab-jobs').addEventListener('click',function(){
    g('p3-jobs-pane').style.display='';g('p3-ref-pane').style.display='none';
    g('p3-tab-jobs').style.borderBottomColor='var(--accent)';g('p3-tab-jobs').style.color='var(--accent)';g('p3-tab-jobs').style.fontWeight='700';
    g('p3-tab-ref').style.borderBottomColor='transparent';g('p3-tab-ref').style.color='var(--text-muted)';g('p3-tab-ref').style.fontWeight='600';
  });
  g('p3-tab-ref').addEventListener('click',function(){
    g('p3-jobs-pane').style.display='none';g('p3-ref-pane').style.display='';
    g('p3-tab-ref').style.borderBottomColor='var(--accent)';g('p3-tab-ref').style.color='var(--accent)';g('p3-tab-ref').style.fontWeight='700';
    g('p3-tab-jobs').style.borderBottomColor='transparent';g('p3-tab-jobs').style.color='var(--text-muted)';g('p3-tab-jobs').style.fontWeight='600';
  });

  var items=[],editId=null;
  var PARAM_FILE='filament_parameters.json';
  var params=[];

  function parseTime(t){
    if(!t)return 0;
    var h=0,m=0;
    var hm=t.match(/(\d+)\s*h/i);var mm=t.match(/(\d+)\s*m/i);
    if(hm)h=parseInt(hm[1]);if(mm)m=parseInt(mm[1]);
    return h+(m/60);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function loadFilamentParameters() {
    try {
      let fetchFunc = null;
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) {
        fetchFunc = window.MAKER_CONFIG.fetchFromDatabase;
      }
      if (fetchFunc) {
        const remoteData = await fetchFunc('Filament Parameters ');
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          const startIndex = (remoteData[0] && (remoteData[0][0] === 'Material' || remoteData[0][0] === 'material')) ? 1 : 0;
          params = remoteData.slice(startIndex).map(row => ({
            material: row[0] || '',
            bestFor: row[1] || '',
            uv: row[2] || '',
            water: row[3] || '',
            foodSafe: row[4] || '',
            strength: row[5] || '',
            flexibility: row[6] || '',
            cfscSafe: row[7] || '',
            notes: row[8] || '',
            meters: parseInt(row[9]) || 0,
            nozzle: row[10] || '',
            bed: row[11] || '',
            speed: row[12] || '',
            dry: row[13] || ''
          })).filter(p => p.material);

          await window.makerAPI.writeData(PARAM_FILE, params);
          return;
        }
      }
    } catch (err) {
      console.error('[Print3D] Failed loading remote filament parameters:', err);
    }

    try {
      params = await window.makerAPI.readData(PARAM_FILE) || [];
    } catch (e) {
      params = [];
    }
  }

  async function load(){
    if (window.populateBrandsDropdown) window.populateBrandsDropdown('p3-brand');
    items=await window.makerAPI.readData(FILE)||[];
    await loadFilamentParameters();
    render();
  }
  async function sv(){await window.makerAPI.writeData(FILE,items);}

  function render(){
    var q=g('p3-search').value.toLowerCase();
    var mf=g('p3-mat-filter').value;
    var sf=g('p3-stat-filter').value;
    var fi=items.filter(function(i){
      return(!mf||i.material===mf)&&(!sf||i.status===sf)&&(!q||JSON.stringify(i).toLowerCase().indexOf(q)>-1);
    });
    g('p3-total').textContent=items.length;
    g('p3-success').textContent=items.filter(function(i){return i.status==='Success';}).length;
    var totalH=items.reduce(function(s,i){return s+parseTime(i.ptime);},0);
    g('p3-time').textContent=totalH.toFixed(1)+'h';
    g('p3-grams').textContent=items.reduce(function(s,i){return s+Number(i.grams||0);},0)+'g';
    var sc={Queued:'badge-muted',Printing:'badge-gold',Success:'badge-green',Failed:'badge-red',Paused:'badge-gold',Cancelled:'badge-muted'};
    g('p3-tbody').innerHTML=fi.length?fi.map(function(i){
      return '<tr>'+
        '<td style="font-weight:600">'+i.name+'</td>'+
        '<td>'+(i.brand||'')+'</td>'+
        '<td>'+i.material+'</td>'+
        '<td>'+(i.colour||'')+'</td>'+
        '<td>'+(i.nozzle||'-')+'C</td>'+
        '<td>'+(i.bed||'-')+'C</td>'+
        '<td>'+(i.layer||'-')+'mm</td>'+
        '<td>'+(i.infill||'-')+'%</td>'+
        '<td>'+(i.ptime||'-')+'</td>'+
        '<td>'+(i.grams||'-')+'g</td>'+
        '<td><span class="badge '+(sc[i.status]||'')+'">'+i.status+'</span></td>'+
        '<td>'+
          '<button class="btn btn-ghost btn-sm p3e" data-id="'+i.id+'">Edit</button> '+
          '<button class="btn btn-danger btn-sm p3d" data-id="'+i.id+'">Del</button>'+
        '</td>'+
      '</tr>';
    }).join(''):'<tr><td colspan="12" class="empty-state"><p>No print jobs yet.</p></td></tr>';
    panel.querySelectorAll('.p3e').forEach(function(b){
      b.addEventListener('click',function(){
        var i=items.find(function(x){return x.id===b.dataset.id;});
        if(!i)return;
        editId=b.dataset.id;
        g('p3-name').value=i.name||'';g('p3-printer').value=i.printer||'Creality K1C';
        g('p3-slicer').value=i.slicer||'Creality Print';g('p3-brand').value=i.brand||'';
        g('p3-material').value=i.material||'CR-PLA';g('p3-colour').value=i.colour||'';
        g('p3-nozzle').value=i.nozzle||'';g('p3-bed').value=i.bed||'';
        g('p3-layer').value=i.layer||'';g('p3-infill').value=i.infill||'';
        g('p3-ptime').value=i.ptime||'';g('p3-grams-in').value=i.grams||'';
        g('p3-status').value=i.status||'Queued';g('p3-notes').value=i.notes||'';
        g('p3-form-title').textContent='Edit Print Job';g('p3-cancel').style.display='inline-flex';
      });
    });
    panel.querySelectorAll('.p3d').forEach(function(b){
      b.addEventListener('click',async function(){
        items=items.filter(function(x){return x.id!==b.dataset.id;});await sv();render();
      });
    });

    var refTbody = g('p3-ref-tbody');
    if (refTbody && params && params.length > 0) {
      refTbody.innerHTML = params.map(function(p) {
        return '<tr>' +
          '<td style="font-weight:700;color:var(--accent)">' + escapeHtml(p.material) + '</td>' +
          '<td>' + escapeHtml(p.nozzle) + '</td>' +
          '<td>' + escapeHtml(p.bed) + '</td>' +
          '<td>' + escapeHtml(p.speed) + '</td>' +
          '<td>' + escapeHtml(p.dry) + '</td>' +
          '<td style="font-family:monospace;font-weight:700;color:var(--teal)">' + (p.meters ? p.meters + ' m' : '—') + '</td>' +
          '<td>' + escapeHtml(p.cfscSafe) + '</td>' +
          '<td>' + escapeHtml(p.notes) + '</td>' +
          '</tr>';
      }).join('');
    }
  }

  g('p3-save').addEventListener('click',async function(){
    var name=g('p3-name').value.trim();if(!name)return;
    var obj={
      id:editId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      name:name,printer:g('p3-printer').value,slicer:g('p3-slicer').value,
      brand:g('p3-brand').value,material:g('p3-material').value,colour:g('p3-colour').value.trim(),
      nozzle:g('p3-nozzle').value,bed:g('p3-bed').value,layer:g('p3-layer').value,
      infill:g('p3-infill').value,ptime:g('p3-ptime').value,grams:g('p3-grams-in').value,
      status:g('p3-status').value,notes:g('p3-notes').value.trim()
    };
    if(editId){var idx=items.findIndex(function(x){return x.id===editId;});if(idx>=0)items[idx]=obj;}
    else items.unshift(obj);
    editId=null;g('p3-form-title').textContent='Add Print Job';g('p3-cancel').style.display='none';
    ['p3-name','p3-colour','p3-nozzle','p3-bed','p3-layer','p3-infill','p3-ptime','p3-grams-in','p3-notes'].forEach(function(id){g(id).value='';});
    g('p3-printer').value='Creality K1C';g('p3-slicer').value='Creality Print';
    g('p3-brand').value='';g('p3-material').value='CR-PLA';g('p3-status').value='Queued';
    await sv();render();
  });
  g('p3-cancel').addEventListener('click',function(){
    editId=null;g('p3-form-title').textContent='Add Print Job';g('p3-cancel').style.display='none';
  });
  g('p3-search').addEventListener('input',render);
  g('p3-mat-filter').addEventListener('change',render);
  g('p3-stat-filter').addEventListener('change',render);

  window.__makerInit_print3d=load;
})();
