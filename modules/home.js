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

  // 1. Updated buildHTML with multi-stat row
  function buildHTML() {
    var frame = document.getElementById('module-frame');
    if (document.getElementById('panel-home')) return;

    var homeStr = `
      <div id="panel-home" class="module-panel">
        
        <!-- Expanded Stats Row (Low Stock, Products, Orders, etc.) -->
        <div class="stat-row">
          <div class="stat-box">
            <div class="sv" id="hm-stat-low-stock">0</div>
            <div class="sl">Low Stock Items</div>
          </div>
          <div class="stat-box">
            <div class="sv" id="hm-stat-products">0</div>
            <div class="sl">Total Products</div>
          </div>
          <div class="stat-box">
            <div class="sv" id="hm-stat-orders">0</div>
            <div class="sl">Active Orders</div>
          </div>
          <div class="stat-box">
            <div class="sv" id="hm-stat-cogs">$0.00</div>
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

        <!-- Alerts -->
        <div class="card" style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; margin-bottom: 12px; color: var(--text);">Inventory Alerts</h3>
          <div id="hm-alerts-list">
            <p style="color: var(--muted); font-size: 13px;">Loading alerts...</p>
          </div>
        </div>

        <!-- Quick Access Grid -->
        <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Quick Access</h2>
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
      ['skuData', 'skus.json'],
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

  // 2. Updated renderStatCards to calculate all top metrics including valuation/COGS
  function renderStatCards() {
    var lowStockItems = store.invData.filter(isLowStock);
    var lowEl = document.getElementById('hm-stat-low-stock');
    if (lowEl) lowEl.textContent = lowStockItems.length;

    var prodEl = document.getElementById('hm-stat-products');
    if (prodEl) prodEl.textContent = store.prodData.length;

    var ordEl = document.getElementById('hm-stat-orders');
    if (ordEl) ordEl.textContent = store.ordData.length;

    // Calculate total inventory value / cost approximation
    var totalVal = store.invData.reduce(function(acc, item) {
      var qty = typeof item.qty === 'number' ? item.qty : 0;
      var cost = typeof item.cost === 'number' ? item.cost : (typeof item.price === 'number' ? item.price : 0);
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
      return;
    }

    var maxDisplay = 5;
    var displayedItems = lowStockItems.slice(0, maxDisplay);
    var hiddenCount = lowStockItems.length - maxDisplay;

    var html = displayedItems.map(function (item) {
      var name = item.name || 'Unnamed Item';
      var qty = typeof item.qty === 'number' ? item.qty : 0;
      return '<div style="background: rgba(255,82,82,0.1); border-left: 3px solid var(--red); padding: 8px 12px; margin-bottom: 8px; font-size: 13px; border-radius: 4px;">⚠️ Low Stock: <strong>' + name + '</strong> (' + qty + ' remaining)</div>';
    }).join('');

    if (hiddenCount > 0) {
      html += '<div style="text-align: center; margin-top: 12px; font-size: 12px; color: var(--muted);"><em>+ ' + hiddenCount + ' more items low on stock. Check Inventory Hub to view all.</em></div>';
    }

    alertContainer.innerHTML = html;
  }

  buildHTML();

  window.__makerInit_home = function () {
    buildHTML(); 
    wireSearch();
    loadData();
  };
  
  loadData();
})();