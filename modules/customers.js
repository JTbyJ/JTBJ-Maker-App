/**
 * Just Jane Maker Lab - Customers Module (With In-Memory Caching)
 * Path: modules/customers.js
 * Version: 1.1.2
 */

// Global cache to persist customer data across tab navigation
window.__customerCache = null;

(function() {
  let currentEditId = null;
  let placeAutocomplete = null;

  /**
   * Phone Number Formatter
   * Normalizes raw input/digits into +1 (XXX) XXX-XXXX format
   */
  function formatPhoneNumber(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    
    if (digits.length === 10) {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 0) {
      return `+${digits}`;
    }
    return phone;
  }

  /**
   * Syncs customer record directly to Google Sheets via MAKER_CONFIG / makerAPI
   * Schema: [ID(A), Name(B), Email(C), Phone(D), Address(E), FinishPref(F), IGHandle(G), CustomerType(H), Notes(I), CreatedAt(J)]
   */
  async function persistSingleCustomer(customerObj) {
    try {
      const rowArray = [
        customerObj.id || '',
        customerObj.name || '',
        customerObj.email || '',
        formatPhoneNumber(customerObj.phone || ''),
        customerObj.address || '',
        customerObj.finishPref || '',
        customerObj.igHandle || '',
        customerObj.type || 'Personal',
        customerObj.notes || '',
        customerObj.createdAt || new Date().toISOString().slice(0, 10)
      ];

      if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
        await window.MAKER_CONFIG.saveToDatabase('Customers', rowArray);
      } else if (window.makerAPI && window.makerAPI.saveRowData) {
        await window.makerAPI.saveRowData('Customers', rowArray);
      }

      if (window.makerAPI && window.makerAPI.writeData) {
        await window.makerAPI.writeData('customers.json', window.__customerCache || []);
      }
    } catch (err) {
      console.error('Failed syncing customer to Google Sheets:', err);
    }
  }

  // Cache to track if the Google Maps autocomplete script has been loaded
  let mapsScriptPromise = null;

  // Global callback for Google Maps authentication failures (e.g. referer, API activation, billing issues)
  window.gm_authFailure = function() {
    console.error('Google Maps API Authentication Failed.');
    const errorEl = document.getElementById('cust-address-err');
    if (errorEl) {
      errorEl.innerHTML = `⚠️ <strong>Google Maps Error</strong>: Authentication failed.<br>
        <span style="font-size: 11px; color: #a0aec0; display: block; margin-top: 4px; line-height: 1.3;">
          Common causes:<br>
          1. <strong>HTTP Referrer Restriction</strong>: If your API Key is restricted to specific websites, it will block local Electron apps (which run on <code>file://</code>). Go to Google Cloud Console and set Key Restrictions to "None" or "IP Addresses" (for local testing).<br>
          2. <strong>Billing</strong>: Ensure your Google Cloud Billing Account is active.<br>
          3. <strong>APIs Enabled</strong>: Ensure both <strong>"Maps JavaScript API"</strong> and <strong>"Places API"</strong> are enabled in your Google Cloud Console.
        </span>`;
      errorEl.style.display = 'block';
    }
  };

  function loadGoogleMapsScript() {
    if (mapsScriptPromise) return mapsScriptPromise;

    mapsScriptPromise = new Promise((resolve, reject) => {
      if (window.google && window.google.maps && window.google.maps.importLibrary) {
        resolve();
        return;
      }

      const apiKey = window.MAKER_CONFIG && window.MAKER_CONFIG.googleMapsApiKey;
      if (!apiKey) {
        console.warn('Google Maps API key not found in MAKER_CONFIG');
        reject(new Error('API key missing'));
        return;
      }

      const script = document.createElement('script');
      // Bootstrap Loader script is standard for Places API (New)
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&callback=__googleMapsInitCallback`;
      script.async = true;
      script.defer = true;

      window.__googleMapsInitCallback = function() {
        resolve();
      };

      script.onerror = function(err) {
        console.error('Failed to load Google Maps script', err);
        reject(err);
      };

      document.head.appendChild(script);
    });

    return mapsScriptPromise;
  }

  function initAutocomplete() {
    const addressInput = document.getElementById('cust-address');
    const autocompleteContainer = document.getElementById('cust-address-autocomplete-container');
    const errorEl = document.getElementById('cust-address-err');
    if (!addressInput || !autocompleteContainer) return;

    loadGoogleMapsScript().then(async () => {
      try {
        const { PlaceAutocompleteElement } = await google.maps.importLibrary('places');
        if (!PlaceAutocompleteElement) {
          if (errorEl) {
            errorEl.textContent = '⚠️ Google Maps loaded, but PlaceAutocompleteElement library is missing.';
            errorEl.style.display = 'block';
          }
          // Restore fallback standard text input
          addressInput.style.display = 'block';
          return;
        }

        // Hide original input and insert PlaceAutocompleteElement instead
        addressInput.style.display = 'none';
        autocompleteContainer.style.display = 'block';
        autocompleteContainer.innerHTML = '';

        placeAutocomplete = new PlaceAutocompleteElement();
        autocompleteContainer.appendChild(placeAutocomplete);

        // Keep original input updated on select
        placeAutocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
          if (!placePrediction) return;
          const place = placePrediction.toPlace();
          await place.fetchFields({ fields: ['formattedAddress'] });
          if (place && place.formattedAddress) {
            addressInput.value = place.formattedAddress;
          }
        });

        // Sync manual typing to addressInput to prevent data loss
        placeAutocomplete.addEventListener('input', () => {
          if (placeAutocomplete && placeAutocomplete.shadowRoot) {
            const shadowInput = placeAutocomplete.shadowRoot.querySelector('input');
            if (shadowInput) {
              addressInput.value = shadowInput.value;
            }
          }
        });

        // Prevent submit on pressing 'Enter' inside the autocomplete input field
        placeAutocomplete.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        });

      } catch (innerErr) {
        console.error('Failed importing places library:', innerErr);
        if (errorEl) {
          errorEl.textContent = '⚠️ Failed to initialize PlaceAutocompleteElement. Please ensure Places API (New) is enabled.';
          errorEl.style.display = 'block';
        }
        // Restore fallback standard text input
        addressInput.style.display = 'block';
        autocompleteContainer.style.display = 'none';
        placeAutocomplete = null;
      }
    }).catch(err => {
      console.warn('Could not initialize address autocomplete:', err);
      // Reset the promise cache so it can try reloading again on next visit
      mapsScriptPromise = null;
      if (errorEl) {
        errorEl.textContent = '⚠️ Could not load Google Maps API. Check your internet connection or API Key.';
        errorEl.style.display = 'block';
      }
      // Restore fallback standard text input
      addressInput.style.display = 'block';
      autocompleteContainer.style.display = 'none';
      placeAutocomplete = null;
    });
  }

  window.__makerInit_customers = async function() {
    buildCustomerPageLayout();
    await loadCustomerData(false);
    attachCustomerEventListeners();
    initAutocomplete();
  };

  function buildCustomerPageLayout() {
    const panel = document.getElementById('panel-customers');
    if (!panel) return;

    panel.innerHTML = `
      <style>
        #panel-customers, 
        #panel-customers * {
          -webkit-app-region: no-drag !important;
        }

        #panel-customers input, 
        #panel-customers textarea, 
        #panel-customers button,
        #panel-customers select {
          pointer-events: auto !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          position: relative !important;
          z-index: 99999 !important;
        }

        .badge-type {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-vip { background: #f59e0b; color: #000; }
        .badge-wholesale { background: #8b5cf6; color: #fff; }
        .badge-repeat { background: #10b981; color: #fff; }
        .badge-personal { background: #4b5563; color: #fff; }

        /* Dark mode styling for Google Autocomplete search results dropdown */
        .pac-container {
          background-color: var(--card, #1f2b47) !important;
          border: 1px solid var(--border, rgba(255,255,255,0.07)) !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 30px rgba(0,0,0,.5) !important;
          font-family: inherit !important;
          z-index: 999999 !important; /* Ensure it floats above all other overlays */
          margin-top: 4px !important;
        }
        .pac-item {
          border-top: 1px solid rgba(255,255,255,0.05) !important;
          padding: 8px 12px !important;
          color: var(--text, #e8eaf6) !important;
          cursor: pointer !important;
          transition: background 0.15s ease !important;
        }
        .pac-item:hover, .pac-item-selected {
          background-color: rgba(224,64,251,0.12) !important;
        }
        .pac-item-query {
          color: #fff !important;
          font-size: 13px !important;
        }
        .pac-matched {
          color: var(--accent, #e040fb) !important;
        }
        .pac-icon {
          filter: invert(1) !important; /* Invert Google pin icons to fit dark mode better */
        }

        /* Style for modern Google Place Autocomplete component */
        gmp-place-autocomplete {
          color-scheme: dark !important;
          width: 100% !important;
          display: block !important;
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        gmp-place-autocomplete::part(input) {
          background-color: var(--surface, #1a1a2e) !important;
          color: var(--text, #e8eaf6) !important;
          border: 1px solid var(--border, rgba(255,255,255,0.07)) !important;
          border-radius: 8px !important;
          font-size: 13px !important;
          font-family: inherit !important;
          height: 38px !important;
          box-sizing: border-box !important;
          width: 100% !important;
          padding: 8px 12px !important;
          outline: none !important;
          transition: border-color var(--trans, 0.2s ease) !important;
          color-scheme: dark !important;
        }

        gmp-place-autocomplete::part(input):focus {
          border-color: var(--accent, #e040fb) !important;
        }

        gmp-place-autocomplete::part(prediction-list) {
          background-color: var(--card, #1f2b47) !important;
          border: 1px solid var(--border, rgba(255,255,255,0.07)) !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 30px rgba(0,0,0,.5) !important;
          font-family: inherit !important;
          color: var(--text, #e8eaf6) !important;
          z-index: 999999 !important;
          margin-top: 4px !important;
          color-scheme: dark !important;
        }

        gmp-place-autocomplete::part(prediction) {
          color: var(--text, #e8eaf6) !important;
          background-color: transparent !important;
          transition: background 0.15s ease !important;
          cursor: pointer !important;
        }

        gmp-place-autocomplete::part(prediction):hover,
        gmp-place-autocomplete::part(prediction):focus {
          background-color: rgba(224, 64, 251, 0.12) !important;
        }
      </style>

      <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 700; color: #fff;">Customer Directory</h2>
          <p style="color: var(--muted, #a0aec0); font-size: 13px;">Manage customer profiles, finish preferences, shipping addresses, and social handles.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-ghost" id="btn-sync-cust" type="button" style="cursor: pointer;">
            🔄 Sync
          </button>
          <input type="file" id="cust-csv-input" accept=".csv" style="display: none !important;">
          <button class="btn btn-secondary" id="btn-import-csv" type="button" style="cursor: pointer;">
            📁 Import CSV
          </button>
        </div>
      </div>

      <div style="display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap;">
        <!-- LEFT: Form -->
        <div class="card" style="flex: 1; min-width: 320px; max-width: 420px; position: relative; z-index: 9999;">
          <form id="customer-form">
            <h3 id="form-title" style="font-size: 15px; font-weight: 700; margin-bottom: 14px; color: #fff;">Add New Customer</h3>
            
            <div class="field" style="margin-bottom: 10px;">
              <label for="cust-name">CUSTOMER NAME *</label>
              <input type="text" id="cust-name" required placeholder="e.g. Jane Doe">
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <div class="field" style="flex: 1;">
                <label for="cust-email">EMAIL ADDRESS</label>
                <input type="email" id="cust-email" placeholder="jane@example.com">
              </div>
              <div class="field" style="flex: 1;">
                <label for="cust-phone">PHONE NUMBER</label>
                <input type="tel" id="cust-phone" placeholder="+1 (514) 000-0000">
              </div>
            </div>

            <div class="field" style="margin-bottom: 10px;">
              <label for="cust-address">SHIPPING / MAILING ADDRESS</label>
              <input type="text" id="cust-address" placeholder="123 Main St, Laval, QC H7T 1A1">
              <div id="cust-address-autocomplete-container"></div>
              <div id="cust-address-err" style="color: #ff5252; font-size: 11px; margin-top: 4px; display: none; background: rgba(255,82,82,0.1); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,82,82,0.2);"></div>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <div class="field" style="flex: 1;">
                <label for="cust-type">CUSTOMER TYPE / TAG</label>
                <select id="cust-type" style="width: 100%; padding: 8px; border-radius: 6px; background: #1a202c; color: #fff; border: 1px solid #4a5568;">
                  <option value="Personal">Personal</option>
                  <option value="Repeat">Repeat Buyer</option>
                  <option value="VIP">VIP</option>
                  <option value="Wholesale">Wholesale</option>
                </select>
              </div>
              <div class="field" style="flex: 1;">
                <label for="cust-ig">INSTAGRAM / SOCIAL</label>
                <input type="text" id="cust-ig" placeholder="@janecrafts">
              </div>
            </div>

            <div class="field" style="margin-bottom: 10px;">
              <label for="cust-finish">DEFAULT FINISH PREFERENCE</label>
              <input type="text" id="cust-finish" placeholder="e.g. Pink Glitter, Matte Black, Natural Wood">
            </div>

            <div class="field" style="margin-bottom: 16px;">
              <label for="cust-notes">NOTES / PREFERENCES</label>
              <textarea id="cust-notes" placeholder="e.g. Prefers expedited shipping, allergic to nickel" rows="2"></textarea>
            </div>

            <div style="display: flex; gap: 10px;">
              <button type="submit" id="btn-submit-cust" class="btn btn-primary" style="flex: 1; cursor: pointer; background: #c026d3; color: #fff; border: none; padding: 10px; border-radius: 6px; font-weight: 600;">Save Customer</button>
              <button type="button" id="btn-cancel-edit" class="btn btn-ghost" style="display: none; cursor: pointer;">Cancel</button>
            </div>
          </form>
          <p id="customer-status" style="margin-top: 12px; font-weight: 600; font-size: 13px;"></p>
        </div>

        <!-- RIGHT: Table -->
        <div class="card" style="flex: 2; min-width: 580px; position: relative; z-index: 9999;">
          <div class="toolbar" style="margin-bottom: 16px;">
            <div class="search-box" style="width: 100%;">
              <input type="text" id="cust-search" placeholder="Search by name, email, phone, IG, finish, tag, or notes..." style="width: 100%;">
            </div>
          </div>

          <div class="table-wrap" style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th>CUSTOMER</th>
                  <th>CONTACT & ADDRESS</th>
                  <th>TAG</th>
                  <th>FINISH PREF</th>
                  <th>NOTES</th>
                  <th style="text-align: right;">ACTIONS</th>
                </tr>
              </thead>
              <tbody id="customer-table-body">
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Loads customer data from memory or fetches from Google Sheets.
   * @param {boolean} forceRefresh - If true, bypasses memory cache.
   */
  async function loadCustomerData(forceRefresh = false) {
    const tbody = document.getElementById('customer-table-body');

    // 1. Return from memory cache if available
    if (!forceRefresh && window.__customerCache && Array.isArray(window.__customerCache)) {
      renderCustomerTable(window.__customerCache);
      return;
    }

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--muted, #a0aec0); padding: 30px;">
            Syncing customers with Google Sheets...
          </td>
        </tr>`;
    }

    let localData = [];
    try {
      if (window.makerAPI && window.makerAPI.readData) {
        localData = await window.makerAPI.readData('customers.json') || [];
        if (!Array.isArray(localData)) localData = [];
      }
    } catch (e) {
      localData = [];
    }

    try {
      // 2. Fetch from database
      let fetchFunc = null;
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) {
        fetchFunc = window.MAKER_CONFIG.fetchFromDatabase;
      } else if (window.makerAPI && window.makerAPI.fetchSheetData) {
        fetchFunc = window.makerAPI.fetchSheetData;
      }

      let remoteDataParsed = null;
      if (fetchFunc) {
        const remoteData = await fetchFunc('Customers');
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          const startIndex = (remoteData[0] && (remoteData[0][0] === 'ID' || remoteData[0][0] === 'id')) ? 1 : 0;
          
          remoteDataParsed = remoteData.slice(startIndex).map(row => ({
            id: row[0] || '',
            name: row[1] || '',
            email: row[2] || '',
            phone: formatPhoneNumber(row[3] || ''),
            address: row[4] || '',
            finishPref: row[5] || '',
            igHandle: row[6] || '',
            type: row[7] || 'Personal',
            notes: row[8] || '',
            createdAt: row[9] || ''
          })).filter(c => c.name || c.email);
        }
      }

      if (remoteDataParsed !== null) {
        if (remoteDataParsed.length === 0 && localData.length > 0) {
          // Seed the remote sheet
          window.__customerCache = localData;
          renderCustomerTable(window.__customerCache);

          if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
            for (const cust of localData) {
              await window.MAKER_CONFIG.saveToDatabase('Customers', [
                cust.id, cust.name, cust.email, formatPhoneNumber(cust.phone),
                cust.address, cust.finishPref, cust.igHandle, cust.type,
                cust.notes, cust.createdAt
              ]);
            }
          }
        } else {
          window.__customerCache = remoteDataParsed;
          renderCustomerTable(window.__customerCache);

          const localStr = JSON.stringify(localData);
          const remoteStr = JSON.stringify(remoteDataParsed);
          if (localStr !== remoteStr && window.makerAPI && window.makerAPI.writeData) {
            await window.makerAPI.writeData('customers.json', remoteDataParsed);
          }
        }
        return;
      }
    } catch (err) {
      console.error('Failed loading customers:', err);
    }

    window.__customerCache = localData;
    renderCustomerTable(window.__customerCache);
  }

  function renderCustomerTable(data) {
    const tbody = document.getElementById('customer-table-body');
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--muted, #a0aec0); padding: 30px;">
            No customers found. Add one or import a CSV!
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = data.map(cust => {
      const tagClass = (cust.type || 'Personal').toLowerCase();
      const igDisplay = cust.igHandle ? (cust.igHandle.startsWith('@') ? cust.igHandle : '@' + cust.igHandle) : '';
      const formattedPhone = formatPhoneNumber(cust.phone);

      return `
        <tr style="border-bottom: 1px solid #2d3748;">
          <td style="padding: 12px; vertical-align: top;">
            <strong style="color: #fff; font-size: 14px;">${escapeHtml(cust.name)}</strong><br>
            <span style="color: #cbd5e0; font-size: 12px;">${escapeHtml(igDisplay)}</span>
          </td>
          <td style="padding: 12px; vertical-align: top; font-size: 12px; color: #e2e8f0; line-height: 1.4;">
            ${cust.email ? `✉️ ${escapeHtml(cust.email)}<br>` : ''}
            ${formattedPhone ? `📞 ${escapeHtml(formattedPhone)}<br>` : ''}
            ${cust.address ? `📍 ${escapeHtml(cust.address)}` : ''}
          </td>
          <td style="padding: 12px; vertical-align: top;">
            <span class="badge-type badge-${tagClass}">${escapeHtml(cust.type || 'Personal')}</span>
          </td>
          <td style="padding: 12px; vertical-align: top; color: #a0aec0; font-size: 12px;">
            ${escapeHtml(cust.finishPref || '—')}
          </td>
          <td style="padding: 12px; vertical-align: top; max-width: 200px; word-wrap: break-word; font-size: 12px; color: #a0aec0;">
            ${escapeHtml(cust.notes || '—')}
          </td>
          <td style="padding: 12px; vertical-align: top; text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" onclick="__editCustomer('${cust.id}')" style="cursor: pointer; padding: 4px 8px; font-size: 11px;">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="__deleteCustomer('${cust.id}')" style="cursor: pointer; padding: 4px 8px; font-size: 11px;">Del</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function attachCustomerEventListeners() {
    const form = document.getElementById('customer-form');
    const searchInput = document.getElementById('cust-search');
    const importBtn = document.getElementById('btn-import-csv');
    const fileInput = document.getElementById('cust-csv-input');
    const syncBtn = document.getElementById('btn-sync-cust');
    const cancelEditBtn = document.getElementById('btn-cancel-edit');

    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        await loadCustomerData(true);
      });
    }

    if (importBtn && fileInput) {
      importBtn.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
          handleCSVImport(evt.target.result);
        };
        reader.readAsText(file);
        fileInput.value = ''; // Reset
      });
    }

    function resetFormState() {
      currentEditId = null;
      form.reset();
      
      const formTitle = document.getElementById('form-title');
      const submitBtn = document.getElementById('btn-submit-cust');
      if (formTitle) formTitle.textContent = 'Add New Customer';
      if (submitBtn) submitBtn.textContent = 'Save Customer';
      if (cancelEditBtn) cancelEditBtn.style.display = 'none';

      // Clear custom PlaceAutocompleteElement input
      if (placeAutocomplete && placeAutocomplete.shadowRoot) {
        const shadowInput = placeAutocomplete.shadowRoot.querySelector('input');
        if (shadowInput) {
          shadowInput.value = '';
        }
      }
    }

    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', resetFormState);
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const statusEl = document.getElementById('customer-status');
        if (statusEl) {
          statusEl.style.color = '#3182ce';
          statusEl.textContent = 'Saving Customer...';
        }

        const name = document.getElementById('cust-name').value.trim();
        const email = document.getElementById('cust-email').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const address = document.getElementById('cust-address').value.trim();
        const type = document.getElementById('cust-type').value;
        const igHandle = document.getElementById('cust-ig').value.trim();
        const finishPref = document.getElementById('cust-finish').value.trim();
        const notes = document.getElementById('cust-notes').value.trim();

        if (!window.__customerCache) window.__customerCache = [];
        let targetCustomer = null;

        if (currentEditId) {
          const idx = window.__customerCache.findIndex(c => c.id === currentEditId);
          if (idx !== -1) {
            window.__customerCache[idx] = { 
              ...window.__customerCache[idx], 
              name, email, phone, address, type, igHandle, finishPref, notes 
            };
            targetCustomer = window.__customerCache[idx];
          }
        } else {
          targetCustomer = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name,
            email,
            phone,
            address,
            type,
            igHandle,
            finishPref,
            notes,
            createdAt: new Date().toISOString().slice(0, 10)
          };
          window.__customerCache.unshift(targetCustomer);
        }

        if (targetCustomer) {
          await persistSingleCustomer(targetCustomer);
        }

        if (statusEl) {
          statusEl.style.color = '#48bb78';
          statusEl.textContent = currentEditId ? 'Customer updated!' : 'Customer saved to Google Sheet!';
          setTimeout(() => { statusEl.textContent = ''; }, 3000);
        }

        resetFormState();
        renderCustomerTable(window.__customerCache);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!window.__customerCache) return;

        const filtered = window.__customerCache.filter(c =>
          (c.name && c.name.toLowerCase().includes(query)) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.phone && c.phone.toLowerCase().includes(query)) ||
          (c.address && c.address.toLowerCase().includes(query)) ||
          (c.igHandle && c.igHandle.toLowerCase().includes(query)) ||
          (c.finishPref && c.finishPref.toLowerCase().includes(query)) ||
          (c.type && c.type.toLowerCase().includes(query)) ||
          (c.notes && c.notes.toLowerCase().includes(query))
        );
        renderCustomerTable(filtered);
      });
    }
  }

  /**
   * Multiline-safe CSV Parser for Google/Apple/Outlook contacts exports
   */
  async function handleCSVImport(csvText) {
    const statusEl = document.getElementById('customer-status');
    if (statusEl) {
      statusEl.style.color = '#3b82f6';
      statusEl.textContent = 'Importing CSV and syncing with Google Sheets...';
    }

    function parseCSVRows(text) {
      const rows = [];
      let currentRow = [];
      let currentVal = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentVal += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          currentRow.push(currentVal.trim());
          currentVal = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
          if (char === '\r' && nextChar === '\n') i++;
          currentRow.push(currentVal.trim());
          if (currentRow.some(cell => cell.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      if (currentVal || currentRow.length > 0) {
        currentRow.push(currentVal.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
      }
      return rows;
    }

    const allRows = parseCSVRows(csvText);
    if (allRows.length === 0) return;

    const headers = allRows[0].map(h => h.toLowerCase().trim());

    const fnIdx = headers.findIndex(h => h === 'first name' || h === 'given name' || h.includes('first'));
    const lnIdx = headers.findIndex(h => h === 'last name' || h === 'family name' || h.includes('last'));
    const nameIdx = headers.findIndex(h => h === 'name' || h === 'display name' || h === 'full name');
    
    const emailIdx = headers.findIndex(h => h === 'e-mail 1 - value' || h === 'email 1 - value' || h === 'email' || h === 'email address');
    const fallbackEmailIdx = headers.findIndex(h => h.includes('e-mail') && h.includes('value'));
    const finalEmailIdx = emailIdx !== -1 ? emailIdx : fallbackEmailIdx;

    const phoneIdx = headers.findIndex(h => h === 'phone 1 - value' || h === 'mobile' || h === 'phone number' || h === 'phone');
    const fallbackPhoneIdx = headers.findIndex(h => h.includes('phone') && h.includes('value') && !h.includes('phonetic'));
    const finalPhoneIdx = phoneIdx !== -1 ? phoneIdx : fallbackPhoneIdx;

    const addrIdx = headers.findIndex(h => h.includes('address 1 - value') || h.includes('formatted address') || h.includes('street') || h.includes('address'));
    const notesIdx = headers.findIndex(h => h === 'notes' || h.includes('note') || h.includes('memo'));
    const finishIdx = headers.findIndex(h => h.includes('finish') || h.includes('preference'));
    const igIdx = headers.findIndex(h => h.includes('instagram') || h.includes('handle') || h.includes('social'));
    const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('tag') || h.includes('label'));

    let importedCount = 0;
    if (!window.__customerCache) window.__customerCache = [];

    for (let i = 1; i < allRows.length; i++) {
      const cols = allRows[i];

      let firstName = fnIdx !== -1 ? cols[fnIdx] : '';
      let lastName = lnIdx !== -1 ? cols[lnIdx] : '';
      let fullName = '';

      if (firstName || lastName) {
        fullName = `${firstName} ${lastName}`.trim();
      } else if (nameIdx !== -1 && cols[nameIdx]) {
        fullName = cols[nameIdx];
      }

      const email = finalEmailIdx !== -1 ? cols[finalEmailIdx] : '';
      const rawPhone = finalPhoneIdx !== -1 ? cols[finalPhoneIdx] : '';
      const phone = formatPhoneNumber(rawPhone);
      const address = addrIdx !== -1 ? cols[addrIdx] : '';
      const notes = notesIdx !== -1 ? cols[notesIdx] : '';
      const finishPref = finishIdx !== -1 ? cols[finishIdx] : '';
      const igHandle = igIdx !== -1 ? cols[igIdx] : '';
      const rawType = typeIdx !== -1 ? cols[typeIdx] : 'Personal';

      let type = 'Personal';
      if (rawType.toLowerCase().includes('vip')) type = 'VIP';
      else if (rawType.toLowerCase().includes('wholesale')) type = 'Wholesale';
      else if (rawType.toLowerCase().includes('repeat')) type = 'Repeat';

      if (!fullName && !email) continue;

      const newCust = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: fullName || 'Unknown Contact',
        email: email,
        phone: phone,
        address: address,
        finishPref: finishPref,
        igHandle: igHandle,
        type: type,
        notes: notes,
        createdAt: new Date().toISOString().slice(0, 10)
      };

      window.__customerCache.unshift(newCust);
      await persistSingleCustomer(newCust);
      importedCount++;
    }

    renderCustomerTable(window.__customerCache);

    if (statusEl) {
      statusEl.style.color = '#48bb78';
      statusEl.textContent = `Successfully imported ${importedCount} contacts!`;
      setTimeout(() => { statusEl.textContent = ''; }, 4000);
    }
  }

  window.__editCustomer = function(id) {
    if (!window.__customerCache) return;
    const cust = window.__customerCache.find(c => c.id === id);
    if (!cust) return;

    currentEditId = id;
    document.getElementById('cust-name').value = cust.name || '';
    document.getElementById('cust-email').value = cust.email || '';
    document.getElementById('cust-phone').value = formatPhoneNumber(cust.phone || '');
    document.getElementById('cust-address').value = cust.address || '';
    document.getElementById('cust-type').value = cust.type || 'Personal';
    document.getElementById('cust-ig').value = cust.igHandle || '';
    document.getElementById('cust-finish').value = cust.finishPref || '';
    document.getElementById('cust-notes').value = cust.notes || '';

    // Set custom PlaceAutocompleteElement input
    if (placeAutocomplete && placeAutocomplete.shadowRoot) {
      const shadowInput = placeAutocomplete.shadowRoot.querySelector('input');
      if (shadowInput) {
        shadowInput.value = cust.address || '';
      }
    }

    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('btn-submit-cust');
    const cancelBtn = document.getElementById('btn-cancel-edit');

    if (formTitle) formTitle.textContent = 'Edit Customer';
    if (submitBtn) submitBtn.textContent = 'Update Customer';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
  };

  window.__deleteCustomer = async function(id) {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    if (window.__customerCache) {
      window.__customerCache = window.__customerCache.filter(c => c.id !== id);
      renderCustomerTable(window.__customerCache);
    }

    try {
      if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
        await window.MAKER_CONFIG.saveToDatabase('Customers', [id, '', 'DELETED']);
      } else if (window.makerAPI && window.makerAPI.saveRowData) {
        await window.makerAPI.saveRowData('Customers', [id, '', 'DELETED']);
      }

      if (window.makerAPI && window.makerAPI.writeData) {
        await window.makerAPI.writeData('customers.json', window.__customerCache || []);
      }
    } catch (err) {
      console.error('Failed to delete customer from Google Sheet:', err);
    }
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
