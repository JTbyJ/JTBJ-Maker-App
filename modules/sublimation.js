(function(){
  var FILE='sublimation.json';
  var frame=document.getElementById('module-frame');
  var panel=document.createElement('div');
  panel.id='panel-sublimation';panel.className='module-panel';

  panel.innerHTML=
    '<div class="page-header"><h2>Sublimation Hub</h2><p>Track sublimation press jobs, settings &amp; results</p></div>'+

    '<div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--border)">'+
      '<button id="sub-tab-jobs" style="padding:10px 28px;background:none;border:none;border-bottom:3px solid var(--accent);color:var(--accent);font-weight:700;font-size:14px;cursor:pointer;margin-bottom:-2px">Jobs</button>'+
      '<button id="sub-tab-ref" style="padding:10px 28px;background:none;border:none;border-bottom:3px solid transparent;color:var(--text-muted);font-weight:600;font-size:14px;cursor:pointer;margin-bottom:-2px">Press Settings Reference</button>'+
    '</div>'+

    /* ===== JOBS PANE ===== */
    '<div id="sub-jobs-pane">'+
    '<div class="stat-row">'+
      '<div class="stat-box"><div class="sv" style="color:var(--accent)" id="sub-total">0</div><div class="sl">Total Jobs</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--green)" id="sub-success">0</div><div class="sl">Successful</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--gold)" id="sub-cost">$0.00</div><div class="sl">Total Cost</div></div>'+
      '<div class="stat-box"><div class="sv" style="color:var(--teal)" id="sub-substrates">0</div><div class="sl">Substrates Used</div></div>'+
    '</div>'+

    '<div class="card" style="margin-bottom:20px">'+
      '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px" id="sub-form-title">Add Sublimation Job</h3>'+
      '<div class="input-row">'+
        '<div class="field" style="flex:2"><label>Job Name</label><input id="sub-name" placeholder="e.g. Mug - Blue Floral"></div>'+
        '<div class="field" style="flex:1"><label>Date</label><input id="sub-date" type="date"></div>'+
      '</div>'+
      '<div class="input-row">'+
        '<div class="field"><label>Substrate</label><select id="sub-substrate">'+
          '<option>Mug (11oz)</option><option>Mug (15oz)</option><option>Tumbler (20oz)</option>'+
          '<option>Tile</option><option>Coaster (Ceramic)</option><option>Coaster (Hardboard)</option>'+
          '<option>T-Shirt</option><option>Tote Bag</option><option>Pillow Cover</option>'+
          '<option>Mouse Pad</option><option>Phone Case</option><option>Other</option>'+
        '</select></div>'+
        '<div class="field"><label>Press Temp (C)</label><input id="sub-temp" type="number" placeholder="190"></div>'+
        '<div class="field"><label>Press Time (sec)</label><input id="sub-time" type="number" placeholder="60"></div>'+
        '<div class="field"><label>Pressure</label><select id="sub-pressure"><option>Light</option><option>Medium</option><option>Heavy</option><option>Firm</option></select></div>'+
      '</div>'+
      '<div class="input-row">'+
        '<div class="field"><label>Ink Brand</label><input id="sub-ink" placeholder="e.g. Hiipoo"></div>'+
        '<div class="field"><label>Paper Brand</label><input id="sub-paper" placeholder="e.g. A-SUB"></div>'+
        '<div class="field"><label>Cost (CAD $)</label><input id="sub-cost-in" type="number" step="0.01" placeholder="2.50"></div>'+
        '<div class="field"><label>Status</label><select id="sub-status"><option>Planned</option><option>Success</option><option>Failed</option><option>Archived</option></select></div>'+
      '</div>'+
      '<div class="field"><label>Notes</label><input id="sub-notes" placeholder="e.g. Slight ghosting - reduce time by 5s next run"></div>'+
      '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-primary" id="sub-save">Save Job</button><button class="btn btn-ghost" id="sub-cancel" style="display:none">Cancel</button></div>'+
    '</div>'+

    '<div class="toolbar">'+
      '<div class="search-box"><input id="sub-search" placeholder="Search jobs..."></div>'+
      '<select id="sub-sub-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
        '<option value="">All Substrates</option>'+
        '<option>Mug (11oz)</option><option>Mug (15oz)</option><option>Tumbler (20oz)</option>'+
        '<option>Tile</option><option>Coaster (Ceramic)</option><option>Coaster (Hardboard)</option>'+
        '<option>T-Shirt</option><option>Tote Bag</option><option>Pillow Cover</option>'+
        '<option>Mouse Pad</option><option>Phone Case</option><option>Other</option>'+
      '</select>'+
      '<select id="sub-stat-filter" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
        '<option value="">All Statuses</option><option>Planned</option><option>Success</option><option>Failed</option><option>Archived</option>'+
      '</select>'+
    '</div>'+
    '<div class="table-wrap"><table><thead><tr>'+
      '<th>Job Name</th><th>Date</th><th>Substrate</th><th>Temp</th><th>Time</th><th>Pressure</th><th>Ink</th><th>Paper</th><th>Cost</th><th>Status</th><th>Actions</th>'+
    '</tr></thead><tbody id="sub-tbody"></tbody></table></div>'+
    '</div>'+

    /* ===== PRESS SETTINGS REFERENCE PANE ===== */
    '<div id="sub-ref-pane" style="display:none">'+
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">'+
        '<input id="sub-ref-search" placeholder="Filter by blank type..." style="flex:1;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px 12px;font-size:13px">'+
        '<span style="font-size:12px;color:var(--text-muted)">Epson ET-2850 | Hiipoo Ink | A-SUB Paper</span>'+
      '</div>'+

      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px" id="sub-ref-cards">'+

        '<div class="card sub-ref-card" style="border-left:4px solid var(--accent)">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
            '<div style="font-size:15px;font-weight:700">Mug &mdash; 11oz</div>'+
            '<span class="badge badge-green">Most Common</span>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--gold)">400F</div><div style="font-size:10px;color:var(--text-muted)">204C</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Temperature</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent)">150-180s</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Time</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--teal)">Medium</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Pressure</div></div>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--text-muted)"><strong style="color:var(--text)">Pre-press:</strong> 5s to warm mug. <strong style="color:var(--text)">Tips:</strong> Wrap butcher paper tight. Cool before removing. Check for ghosting.</div>'+
        '</div>'+

        '<div class="card sub-ref-card" style="border-left:4px solid var(--accent)">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
            '<div style="font-size:15px;font-weight:700">Mug &mdash; 15oz</div>'+
            '<span class="badge badge-muted">Jumbo</span>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--gold)">400F</div><div style="font-size:10px;color:var(--text-muted)">204C</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Temperature</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent)">180-210s</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Time</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--teal)">Medium</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Pressure</div></div>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--text-muted)"><strong style="color:var(--text)">Pre-press:</strong> 5s. <strong style="color:var(--text)">Tips:</strong> Use curved press insert for even contact. Tape securely at seam.</div>'+
        '</div>'+

        '<div class="card sub-ref-card" style="border-left:4px solid var(--teal)">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
            '<div style="font-size:15px;font-weight:700">Tumbler &mdash; 20oz</div>'+
            '<span class="badge badge-muted">Oven Method</span>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--gold)">380F</div><div style="font-size:10px;color:var(--text-muted)">193C</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Temperature</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent)">240s</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Time</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--teal)">Firm</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Pressure</div></div>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--text-muted)"><strong style="color:var(--text)">Pre-press:</strong> 5s. <strong style="color:var(--text)">Tips:</strong> Full wrap transfer, use heat-resistant tape every 1 inch. Oven or rotary press. Travel Tumbler: add 15s. Do NOT use standard flat press.</div>'+
        '</div>'+

        '<div class="card sub-ref-card" style="border-left:4px solid var(--gold)">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
            '<div style="font-size:15px;font-weight:700">Tile &mdash; 6x6</div>'+
            '<span class="badge badge-muted">Flat Press</span>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--gold)">400F</div><div style="font-size:10px;color:var(--text-muted)">204C</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Temperature</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent)">240s</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Time</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--teal)">Heavy</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Pressure</div></div>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--text-muted)"><strong style="color:var(--text)">Pre-press:</strong> None. <strong style="color:var(--text)">Tips:</strong> Face down on Teflon sheet. Place foam pad on back for even pressure. Cool completely before removing paper.</div>'+
        '</div>'+

        '<div class="card sub-ref-card" style="border-left:4px solid var(--gold)">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
            '<div style="font-size:15px;font-weight:700">Coaster &mdash; Ceramic</div>'+
            '<span class="badge badge-muted">Flat Press</span>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--gold)">400F</div><div style="font-size:10px;color:var(--text-muted)">204C</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Temperature</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent)">150s</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Time</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--teal)">Heavy</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Pressure</div></div>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--text-muted)"><strong style="color:var(--text)">Pre-press:</strong> None. <strong style="color:var(--text)">Tips:</strong> Tape transfer flat. Foam pad under coaster helps even pressure. Vibrant colours.</div>'+
        '</div>'+

        '<div class="card sub-ref-card" style="border-left:4px solid var(--gold)">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
            '<div style="font-size:15px;font-weight:700">Coaster &mdash; Hardboard</div>'+
            '<span class="badge badge-muted">Flat Press</span>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--gold)">385F</div><div style="font-size:10px;color:var(--text-muted)">196C</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Temperature</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent)">60s</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Time</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--teal)">Medium</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Pressure</div></div>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--text-muted)"><strong style="color:var(--text)">Pre-press:</strong> None. <strong style="color:var(--text)">Tips:</strong> Use parchment paper over transfer. Fast release after press. Check corners carefully.</div>'+
        '</div>'+

        '<div class="card sub-ref-card" style="border-left:4px solid var(--green)">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
            '<div style="font-size:15px;font-weight:700">T-Shirt</div>'+
            '<span class="badge badge-muted">100% Polyester</span>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--gold)">380F</div><div style="font-size:10px;color:var(--text-muted)">193C</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Temperature</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent)">45s</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Time</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--teal)">Medium</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Pressure</div></div>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--text-muted)"><strong style="color:var(--text)">Pre-press:</strong> 5s to remove moisture and wrinkles. <strong style="color:var(--text)">Tips:</strong> Mirror image. White / light poly only. Peel hot. Use parchment over print.</div>'+
        '</div>'+

        '<div class="card sub-ref-card" style="border-left:4px solid var(--green)">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
            '<div style="font-size:15px;font-weight:700">Tote Bag</div>'+
            '<span class="badge badge-muted">Poly Canvas</span>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--gold)">380F</div><div style="font-size:10px;color:var(--text-muted)">193C</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Temperature</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent)">50s</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Time</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--teal)">Medium</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Pressure</div></div>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--text-muted)"><strong style="color:var(--text)">Pre-press:</strong> 5s. <strong style="color:var(--text)">Tips:</strong> Insert cardboard inside bag to prevent bleed-through. Mirror image. Peel hot.</div>'+
        '</div>'+

        '<div class="card sub-ref-card" style="border-left:4px solid var(--green)">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
            '<div style="font-size:15px;font-weight:700">Pillow Cover</div>'+
            '<span class="badge badge-muted">Poly Cover</span>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--gold)">385F</div><div style="font-size:10px;color:var(--text-muted)">196C</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Temperature</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent)">60s</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Time</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--teal)">Medium</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Pressure</div></div>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--text-muted)"><strong style="color:var(--text)">Pre-press:</strong> 5s. <strong style="color:var(--text)">Tips:</strong> Insert thick cardboard to prevent bleed-through. Remove insert after pressing. Peel warm.</div>'+
        '</div>'+

        '<div class="card sub-ref-card" style="border-left:4px solid var(--accent)">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
            '<div style="font-size:15px;font-weight:700">Mouse Pad</div>'+
            '<span class="badge badge-muted">Flat Press</span>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--gold)">400F</div><div style="font-size:10px;color:var(--text-muted)">204C</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Temperature</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent)">90s</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Time</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--teal)">Medium</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Pressure</div></div>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--text-muted)"><strong style="color:var(--text)">Pre-press:</strong> None. <strong style="color:var(--text)">Tips:</strong> Remove rubber backing before pressing. Replace backing after cooling. Peel hot for vivid colours.</div>'+
        '</div>'+

        '<div class="card sub-ref-card" style="border-left:4px solid var(--accent)">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
            '<div style="font-size:15px;font-weight:700">Phone Case</div>'+
            '<span class="badge badge-muted">Poly-coated</span>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--gold)">400F</div><div style="font-size:10px;color:var(--text-muted)">204C</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Temperature</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent)">60-90s</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Time</div></div>'+
            '<div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--teal)">Medium</div><div style="font-size:10px;color:var(--text-muted);margin-top:12px">Pressure</div></div>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--text-muted)"><strong style="color:var(--text)">Pre-press:</strong> None. <strong style="color:var(--text)">Tips:</strong> Use 3D phone case press or silicone wrap. Tape transfer securely. Check edges after pressing. Mirror image required.</div>'+
        '</div>'+

      '</div>'+

      '<div style="margin-top:16px;padding:12px 16px;background:var(--surface);border-radius:8px;font-size:12px;color:var(--text-muted)">'+
        '<strong style="color:var(--text)">General Tips:</strong> Always mirror your image. Use butcher paper or parchment over transfer. Pre-press blank to remove moisture. '+
        'Let cool 10-15s before peeling. Test on a spare blank first. Ink: Hiipoo. Paper: A-SUB. Printer: Epson ET-2850.'+
      '</div>'+
    '</div>';

  frame.appendChild(panel);

  function g(id){return document.getElementById(id);}

  /* TAB SWITCHING */
  g('sub-tab-jobs').addEventListener('click',function(){
    g('sub-jobs-pane').style.display='';g('sub-ref-pane').style.display='none';
    g('sub-tab-jobs').style.borderBottomColor='var(--accent)';g('sub-tab-jobs').style.color='var(--accent)';g('sub-tab-jobs').style.fontWeight='700';
    g('sub-tab-ref').style.borderBottomColor='transparent';g('sub-tab-ref').style.color='var(--text-muted)';g('sub-tab-ref').style.fontWeight='600';
  });
  g('sub-tab-ref').addEventListener('click',function(){
    g('sub-jobs-pane').style.display='none';g('sub-ref-pane').style.display='';
    g('sub-tab-ref').style.borderBottomColor='var(--accent)';g('sub-tab-ref').style.color='var(--accent)';g('sub-tab-ref').style.fontWeight='700';
    g('sub-tab-jobs').style.borderBottomColor='transparent';g('sub-tab-jobs').style.color='var(--text-muted)';g('sub-tab-jobs').style.fontWeight='600';
  });

  /* REF SEARCH FILTER */
  g('sub-ref-search').addEventListener('input',function(){
    var q=g('sub-ref-search').value.toLowerCase();
    panel.querySelectorAll('.sub-ref-card').forEach(function(c){
      c.style.display=c.textContent.toLowerCase().indexOf(q)>-1?'':'none';
    });
  });

  var items=[],editId=null;

  async function load(){items=await window.makerAPI.readData(FILE)||[];render();}
  async function sv(){await window.makerAPI.writeData(FILE,items);}

  function render(){
    var q=g('sub-search').value.toLowerCase();
    var sf=g('sub-sub-filter').value;
    var stf=g('sub-stat-filter').value;
    var fi=items.filter(function(i){
      return(!sf||i.substrate===sf)&&(!stf||i.status===stf)&&(!q||JSON.stringify(i).toLowerCase().indexOf(q)>-1);
    });

    g('sub-total').textContent=items.length;
    g('sub-success').textContent=items.filter(function(i){return i.status==='Success';}).length;
    g('sub-cost').textContent='$'+items.reduce(function(s,i){return s+Number(i.cost||0);},0).toFixed(2);
    g('sub-substrates').textContent=new Set(items.map(function(i){return i.substrate;})).size;

    var sc={Planned:'badge-muted',Success:'badge-green',Failed:'badge-red',Archived:'badge-gold'};

    if(!fi.length){
      g('sub-tbody').innerHTML='<tr><td colspan="11" class="empty-state"><p>No sublimation jobs found.</p></td></tr>';
      return;
    }

    g('sub-tbody').innerHTML=fi.map(function(i){
      return '<tr>'+
        '<td style="font-weight:600">'+(i.name||'')+'</td>'+
        '<td>'+(i.date||'')+'</td>'+
        '<td>'+(i.substrate||'')+'</td>'+
        '<td>'+(i.temp?i.temp+'&deg;C':'')+'</td>'+
        '<td>'+(i.time?i.time+'s':'')+'</td>'+
        '<td>'+(i.pressure||'')+'</td>'+
        '<td>'+(i.ink||'')+'</td>'+
        '<td>'+(i.paper||'')+'</td>'+
        '<td>$'+Number(i.cost||0).toFixed(2)+'</td>'+
        '<td><span class="badge '+(sc[i.status]||'')+'">'+(i.status||'')+'</span></td>'+
        '<td>'+
          '<button class="btn btn-ghost btn-sm sube" data-id="'+i.id+'">Edit</button> '+
          '<button class="btn btn-danger btn-sm subd" data-id="'+i.id+'">Del</button>'+
        '</td>'+
      '</tr>';
    }).join('');

    panel.querySelectorAll('.sube').forEach(function(b){
      b.addEventListener('click',function(){
        var i=items.find(function(x){return x.id===b.dataset.id;});if(!i)return;
        editId=b.dataset.id;
        g('sub-name').value=i.name||'';
        g('sub-date').value=i.date||'';
        g('sub-substrate').value=i.substrate||'Mug (11oz)';
        g('sub-temp').value=i.temp||'';
        g('sub-time').value=i.time||'';
        g('sub-pressure').value=i.pressure||'Medium';
        g('sub-ink').value=i.ink||'';
        g('sub-paper').value=i.paper||'';
        g('sub-cost-in').value=i.cost||'';
        g('sub-status').value=i.status||'Planned';
        g('sub-notes').value=i.notes||'';
        g('sub-form-title').textContent='Edit Sublimation Job';
        g('sub-cancel').style.display='inline-flex';
        panel.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });

    panel.querySelectorAll('.subd').forEach(function(b){
      b.addEventListener('click',async function(){
        if(!confirm('Delete this sublimation job?'))return;
        items=items.filter(function(x){return x.id!==b.dataset.id;});
        await sv();render();
      });
    });
  }

  g('sub-save').addEventListener('click',async function(){
    var name=g('sub-name').value.trim();if(!name){alert('Job name is required.');return;}
    var obj={
      id:editId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      name:name,
      date:g('sub-date').value,
      substrate:g('sub-substrate').value,
      temp:g('sub-temp').value,
      time:g('sub-time').value,
      pressure:g('sub-pressure').value,
      ink:g('sub-ink').value.trim(),
      paper:g('sub-paper').value.trim(),
      cost:Number(g('sub-cost-in').value)||0,
      status:g('sub-status').value,
      notes:g('sub-notes').value.trim()
    };
    if(editId){
      var idx=items.findIndex(function(x){return x.id===editId;});
      if(idx>=0)items[idx]=obj;
    }else{
      items.unshift(obj);
    }
    clearForm();
    await sv();render();
  });

  function clearForm(){
    editId=null;
    g('sub-form-title').textContent='Add Sublimation Job';
    g('sub-cancel').style.display='none';
    ['sub-name','sub-date','sub-temp','sub-time','sub-ink','sub-paper','sub-cost-in','sub-notes'].forEach(function(id){g(id).value='';});
    g('sub-substrate').value='Mug (11oz)';
    g('sub-pressure').value='Medium';
    g('sub-status').value='Planned';
  }

  g('sub-cancel').addEventListener('click',clearForm);
  g('sub-search').addEventListener('input',render);
  g('sub-sub-filter').addEventListener('change',render);
  g('sub-stat-filter').addEventListener('change',render);

  window.__makerInit_sublimation=load;
})();