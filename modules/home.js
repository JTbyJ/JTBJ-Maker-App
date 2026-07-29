(function () {
  'use strict';

  var store = {
    invData: [],
    skuData: [],
    prodData: [],
    ordData: [],
    custData: [],
    supData: [],
    hwData: [],
    swData: []
  };

  function isLowStock(item) {
    var qty = typeof item.qty === 'number' ? item.qty : 0;
    var threshold = typeof item.lowStock === 'number' ? item.lowStock : 1;
    return qty <= threshold;
  }

  function buildHTML() {
    var frame = document.getElementById('module-frame');
    if (document.getElementById('panel-home')) return;

    var homeStr = `
      <div id="panel-home" class="module-panel">
        
        <!-- Expanded Stats Row (Low Stock, Products, Orders, etc.) -->
        <div class="stat-row">
          <div class="stat-box">
            <div class="sv" id="hm-stat-low-stock" style="color: var(--red);">0</div>
            <div class="sl">Low Stock Items</div>
          </div>
          <div class="stat-box">
            <div class="sv" id="hm-stat-products" style="color: var(--teal);">0</div>
            <div class="sl">Total Products</div>
          </div>
          <div class="stat-box">
            <div class="sv" id="hm-stat-orders" style="color: var(--green);">0</div>
            <div class="sl">Active Orders</div>
          </div>
          <div class="stat-box">
            <div class="sv" id="hm-stat-cogs" style="color: var(--gold); font-family: monospace;">$0.00</div>
            <div class="sl">Est. Inventory Value</div>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="toolbar">
          <div class="search-box">
            <input type="text" id="hm-search-input" placeholder="Search inventory..." />
          </div>
          <button id="hm-search-clear" class="btn btn-ghost" style="display:none;">Clear</button>
        </div>
        <div id="hm-search-results" style="display:none; padding: 16px; margin-bottom: 20px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);"></div>

        <!-- Alerts & Analytics Grouped Card -->
        <div class="card" style="margin-bottom: 24px;">
          <h3 style="font-size: 15px; margin-bottom: 12px; color: var(--text); display: flex; align-items: center; gap: 8px;">
            <span>⚠️</span> Inventory Alerts &amp; Reorder Planner
          </h3>
          <div id="hm-alerts-list">
            <p style="color: var(--muted); font-size: 13px;">Loading alerts...</p>
          </div>
          
          <!-- Category Breakdown Placeholder -->
          <div id="hm-category-breakdown"></div>

          <!-- Grouped Supplier Reorder list -->
          <div id="hm-supplier-reorder-list"></div>
        </div>

        <!-- Quick Access Grid -->
        <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">Quick Access</h2>
        <div id="home-grid">
          <div class="home-card" data-goto="sublimation">
            <div class="hc-icon" style="color: var(--accent);">◈</div>
            <div class="hc-title">Sublimation Hub</div>
            <div class="hc-desc">Manage shirt & mug setups</div>
          </div>
          <div class="home-card" data-goto="laser">
            <div class="hc-icon" style="color: var(--red);">⬡</div>
            <div class="hc-title">Laser Hub</div>
            <div class="hc-desc">Sculpfun S30 settings & files</div>
          </div>
          <div class="home-card" data-goto="print3d">
            <div class="hc-icon" style="color: var(--teal);">⬡</div>
            <div class="hc-title">3D Print Hub</div>
            <div class="hc-desc">Creality K1C queue & profiles</div>
          </div>
          <div class="home-card" data-goto="orders">
            <div class="hc-icon" style="color: var(--green);">🧾</div>
            <div class="hc-title">Business Orders</div>
            <div class="hc-desc">Fulfill recent Etsy purchases</div>
          </div>
        </div>

      </div>
    `;
    frame.insertAdjacentHTML('beforeend', homeStr);
  }

  function loadData() {
    if (!window.makerAPI || !window.makerAPI.readData) return;

    var sources = [
      ['invData', 'inventory.json'],
      ['skuData', 'sku.json'],
      ['prodData', 'products.json'],
      ['ordData', 'orders.json'],
      ['custData', 'customers.json'],
      ['supData', 'suppliers.json'],
      ['hwData', 'hardware.json'],
      ['swData', 'software.json']
    ];

    var promises = sources.map(function (src) {
      return window.makerAPI.readData(src[1]).then(function (d) {
        store[src[0]] = Array.isArray(d) ? d : [];
      }).catch(function () {
        store[src[0]] = [];
      });
    });

    Promise.all(promises).then(function () {
      renderDashboard();
    });
  }

  function wireSearch() {
    var inp = document.getElementById('hm-search-input');
    var clearBtn = document.getElementById('hm-search-clear');
    var resultsEl = document.getElementById('hm-search-results');

    if (!inp) return;

    inp.addEventListener('input', function () {
      var q = inp.value.trim().toLowerCase();
      if (q.length > 0) {
        if (clearBtn) clearBtn.style.display = 'block';
        doSearch(q);
      } else {
        if (clearBtn) clearBtn.style.display = 'none';
        if (resultsEl) resultsEl.style.display = 'none';
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        inp.value = '';
        if (resultsEl) resultsEl.style.display = 'none';
        clearBtn.style.display = 'none';
      });
    }
  }

  function doSearch(q) {
    var resultsEl = document.getElementById('hm-search-results');
    if (!resultsEl) return;

    var matches = [];
    store.invData.forEach(function (i) {
      var title = i.name || 'Unnamed Item';
      if (title.toLowerCase().indexOf(q) !== -1) {
        matches.push({ title: title, type: 'Inventory' });
      }
    });

    if (matches.length > 0) {
      resultsEl.innerHTML = matches.map(function (m) {
        return '<div style="font-size: 13px; margin-bottom: 6px;"><strong style="color: var(--accent);">[' + m.type + ']</strong> ' + m.title + '</div>';
      }).join('');
      resultsEl.style.display = 'block';
    } else {
      resultsEl.innerHTML = '<div style="font-size: 13px; color: var(--muted);">No results found</div>';
      resultsEl.style.display = 'block';
    }
  }

  function renderDashboard() {
    renderStatCards();
    renderAlerts();
  }

  function renderStatCards() {
    var lowStockItems = store.invData.filter(isLowStock);
    var lowEl = document.getElementById('hm-stat-low-stock');
    if (lowEl) lowEl.textContent = lowStockItems.length;

    var prodEl = document.getElementById('hm-stat-products');
    if (prodEl) prodEl.textContent = store.prodData.length;

    var ordEl = document.getElementById('hm-stat-orders');
    if (ordEl) ordEl.textContent = store.ordData.length;

    // Calculate total inventory value
    var totalVal = store.invData.reduce(function(acc, item) {
      var qty = typeof item.qty === 'number' ? item.qty : 0;
      var cost = typeof item.cost === 'number' ? item.cost : 0;
      return acc + (qty * cost);
    }, 0);

    var cogsEl = document.getElementById('hm-stat-cogs');
    if (cogsEl) cogsEl.textContent = '$' + totalVal.toFixed(2);
  }

  function renderAlerts() {
    var alertContainer = document.getElementById('hm-alerts-list');
    if (!alertContainer) return;

    var lowStockItems = store.invData.filter(isLowStock);
    if (lowStockItems.length === 0) {
      alertContainer.innerHTML = '<p style="color: var(--muted); font-size: 13px;">No alerts at this time.</p>';
      document.getElementById('hm-category-breakdown').innerHTML = '';
      document.getElementById('hm-supplier-reorder-list').innerHTML = '';
      return;
    }

    var maxDisplay = 5;
    var displayedItems = lowStockItems.slice(0, maxDisplay);
    var hiddenCount = lowStockItems.length - maxDisplay;

    var html = displayedItems.map(function (item) {
      var name = item.name || 'Unnamed Item';
      var qty = typeof item.qty === 'number' ? item.qty : 0;
      return '<div style="background: rgba(255,82,82,0.06); border-left: 3px solid var(--red); padding: 8px 12px; margin-bottom: 8px; font-size: 13px; border-radius: 4px; display:flex; justify-content:space-between; align-items:center;"><span>⚠️ Low Stock: <strong>' + name + '</strong> (' + qty + ' remaining)</span><span class="tag" style="background:#000;">' + (item.location || 'No Location') + '</span></div>';
    }).join('');

    if (hiddenCount > 0) {
      html += '<div style="text-align: center; margin-top: 12px; font-size: 12px; color: var(--muted);"><em>+ ' + hiddenCount + ' more items low on stock. Check Inventory Hub to view all.</em></div>';
    }

    alertContainer.innerHTML = html;

    // Category Breakdown Chart
    var valByCat = {};
    store.invData.forEach(function(item) {
      var cat = item.cat || 'OTHER';
      var qty = typeof item.qty === 'number' ? item.qty : 0;
      var cost = typeof item.cost === 'number' ? item.cost : 0;
      valByCat[cat] = (valByCat[cat] || 0) + (qty * cost);
    });

    var totalVal = Object.values(valByCat).reduce((a, b) => a + b, 0);
    var colors = { FIL: 'var(--accent)', MAT: 'var(--gold)', BLK: 'var(--teal)', SUB: 'var(--red)', PKG: 'var(--green)', OTHER: 'var(--muted)' };
    
    var barHtml = '<div style="margin-top: 18px; border-top: 1px solid var(--border); padding-top: 16px;"><h4 style="font-size: 13px; font-weight:700; color:var(--teal); margin-bottom: 12px;">📊 Valuation by Category Breakdown</h4><div style="display:flex; height: 16px; border-radius: 6px; overflow:hidden; background: var(--bg); margin-bottom: 8px;">';
    
    if (totalVal > 0) {
      Object.keys(valByCat).forEach(function(cat) {
        var pct = (valByCat[cat] / totalVal * 100);
        if (pct > 0) {
          barHtml += '<div style="width: ' + pct + '%; background: ' + (colors[cat] || 'var(--muted)') + ';" title="' + cat + ': ' + pct.toFixed(1) + '%"></div>';
        }
      });
      barHtml += '</div><div style="display:flex; flex-wrap:wrap; gap:12px; font-size:11px;">';
      Object.keys(colors).forEach(function(cat) {
        var val = valByCat[cat] || 0;
        if (val > 0) {
          barHtml += '<span style="display:flex; align-items:center; gap:4px;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:' + colors[cat] + ';"></span> ' + cat + ': $' + val.toFixed(2) + '</span>';
        }
      });
      barHtml += '</div>';
    } else {
      barHtml += '<div style="font-size: 11px; color: var(--muted); text-align: center; width: 100%; padding: 4px;">No valuation data available.</div></div>';
    }
    barHtml += '</div>';
    document.getElementById('hm-category-breakdown').innerHTML = barHtml;

    // Group low-stock items by Supplier
    var groupedBySupplier = {};
    lowStockItems.forEach(function(item) {
      var supplier = item.supplier || 'Unspecified Supplier';
      if (!groupedBySupplier[supplier]) groupedBySupplier[supplier] = [];
      groupedBySupplier[supplier].push(item);
    });

    var reorderHtml = '<div style="margin-top: 18px; border-top: 1px solid var(--border); padding-top: 16px;"><h4 style="font-size: 13px; font-weight:700; color:var(--gold); margin-bottom: 10px;">📋 Dynamic Shopping List (Grouped by Supplier)</h4>';
    Object.keys(groupedBySupplier).forEach(function(supplier) {
      reorderHtml += '<div style="margin-bottom: 12px; background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 6px; padding: 10px;"><strong style="color: var(--accent); font-size: 12px;">🏢 ' + supplier + ' (' + groupedBySupplier[supplier].length + ' items to order)</strong>';
      groupedBySupplier[supplier].forEach(function(item) {
        reorderHtml += '<div style="font-size: 12px; margin-left: 10px; color: var(--text); margin-top: 5px;">• ' + item.name + ' <span class="tag" style="padding: 1px 4px; font-size: 10px; font-family: monospace;">SKU: ' + (item.sku || 'N/A') + '</span> (Current: ' + item.qty + ')</div>';
      });
      reorderHtml += '</div>';
    });
    reorderHtml += '</div>';
    document.getElementById('hm-supplier-reorder-list').innerHTML = reorderHtml;
  }

  buildHTML();

  window.__makerInit_home = function () {
    buildHTML(); 
    wireSearch();
    loadData();
  };
  
  loadData();
})();
