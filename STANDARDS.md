🛠️ Maker Lab Architecture & Module Coding Standards
Document Version: 2.2.0

Target Environment: Electron / Vanilla JS Frontend + Google Sheets Backend API

Core Objective: Maintain a high-performance, database-driven architecture across all application modules using in-memory caching and real-time Google Sheets synchronization.

📑 Table of Contents
Core Architectural Principles

Data Flow & In-Memory Caching Architecture

Google Sheets Backend Integration (Code.gs)

Google Sheets Database Schema Standard

Required Utility Helpers

A. Multiline-Safe CSV Parser

B. Phone Number Normalizer

C. HTML Escaper (XSS Protection)

Electron UI & Event Handling Safety

Module Blueprint Template

1. Core Architectural Principles
Database First (No Pure Local JSON): All CRUD actions sync directly through window.MAKER_CONFIG.saveToDatabase(sheetName, rowArray) or window.makerAPI.saveRowData(sheetName, rowArray). Local JSON storage (makerAPI.writeData) is treated strictly as an offline fallback or secondary cache.

1D Row Array Alignment: Google Sheets API operations accept flat positional arrays. Arrays passed to database save functions must match the exact column index sequence (Column A through Column Z) defined in the database tab.

Unique Key Generation: Every database record must generate a collision-safe ID string using:

JavaScript
const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
State Hygiene: Every form must feature an explicit resetFormState() function that clears inputs, resets hidden fields, restores dynamic titles, and sets currentEditId = null.

2. Data Flow & In-Memory Caching Architecture
To ensure fast UI rendering and prevent exceeding Google Apps Script API rate limits, modules use a hybrid in-memory caching model.

Global Memory Stores: Data fetched from Google Sheets is stored in global memory window objects:

window.__inventoryCache for Inventory items.

window.__customerCache for Customer profiles.

window.__suppliersCache for Supplier profiles.

Instant Tab Switching: When navigating between app modules, the module's initializer checks if its corresponding window.__<module>Cache object exists. If populated, it renders instantly from local memory instead of making a new network request.

Optimistic Local Updates: Any user action that creates, edits, or deletes a record immediately updates the in-memory array and re-renders the UI, giving the user instant feedback without waiting for network latency.

Manual Sync: Users can click the 🔄 Sync button in any panel header to bypass the local cache and pull live, fresh data directly from the Google Sheet database.

3. Google Sheets Backend Integration (Code.gs)
The app communicates with a central Google Sheet via Google Apps Script web endpoints (doGet / doPost).

Dynamic Tab Operations: The Code.gs handler inspects incoming request payloads (sheet parameter) and targets or creates tabs dynamically (e.g., 'Customers', 'Inventory').

Column-Agnostic Matching: Code.gs inspects Column A (Record ID) of the target sheet:

Update: If a matching ID is found, it updates the existing row with the array payload.

Append: If the ID does not exist, it appends a new row to the bottom of the sheet.

4. Google Sheets Database Schema Standard
A. Customers Sheet Mapping
Column	Sheet Header	JavaScript Property	Default / Fallback
A	Customer_ID	id	Generated Hash
B	Name	name	'Unnamed'
C	Email	email	''
D	Phone	phone	'' (Formatted +1)
E	Address	address	''
F	Finish_Preference	finishPref	''
G	Instagram_Handle	igHandle	''
H	Customer_Type	type	'Personal'
I	Notes	notes	''
J	Created_At	createdAt	YYYY-MM-DD

*Note on Address Validation / Autocomplete:* The Customer shipping/mailing address (Column E) is integrated with Google Places API Autocomplete. The Places Autocomplete script is loaded dynamically using the key defined in `window.MAKER_CONFIG.googleMapsApiKey`. The dropdown has custom dark-themed styling overrides (`.pac-container`) and handles `Enter` key behavior to prevent form submission during selection.

B. Inventory Sheet Mapping
Column	Sheet Header	JavaScript Property	Default / Fallback
A	Item_ID	id	Generated Hash
B	SKU	sku	''
C	Name	name	'Unnamed Item'
D	Brand	brand	''
E	Category	cat	'FIL'
F	Subcategory	subcat	''
G	Type	type	''
H	Colour	colour	''
I	Qty	qty	0
J	LowStock	lowStock	2
K	Diameter	diameter	''
L	Weight	weight	''
M	PrintTemp	printTemp	''
N	BedTemp	bedTemp	''
O	Cost	cost	0
P	Location	location	''
Q	Supplier	supplier	''
R	Notes	notes	''

*Note on Database Normalization & Dynamic Enrichment:*
To prevent data redundancy and maintain a single source of truth (SSOT), the local file `inventory.json` is fully normalized. It does not store duplicate fields like `Name`, `Brand`, `Category`, or `Subcategory`.
Instead, the `makerAPI.readData('inventory.json')` and `makerAPI.writeData('inventory.json')` operations are intercepted globally inside `modules/config.js`. When reading inventory data, these fields are dynamically resolved and enriched in-memory directly from the master SKU catalog (`sku.json`), guaranteeing referential integrity and instant propagation of catalog edits to inventory lot representations.
Cost calculations, margin suggestions, and BOM-level estimation formulas dynamically query the master SKU's average cost metrics in real-time.

C. Suppliers Sheet Mapping
Column	Sheet Header	JavaScript Property	Default / Fallback
A	Supplier_ID	id	Generated Hash
B	Name	name	'Unnamed'
C	Category	category	'Filament'
D	Status	status	'Active'
E	Rating	rating	5
F	Website	website	''
G	Contact_Person	contact	''
H	Email	email	''
I	Phone	phone	'' (Formatted +1)
J	Lead_Time	lead	''
K	Min_Order	minOrder	''
L	Shipping_Policy	shipping	''
M	Notes	notes	''

5. Required Utility Helpers
Copy these utility functions into every module script (or a shared utils.js library) to maintain data consistency.

A. Multiline-Safe CSV Parser
Standard String.prototype.split('\n') corrupts database records when notes or addresses contain inline line breaks. Use this character-by-character scanner:

JavaScript
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
B. Phone Number Normalizer
Cleans raw numeric inputs from forms and CSV files into standard North American format:

JavaScript
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
C. HTML Escaper (XSS Protection)
Always wrap string variables inside HTML template literals with escapeHtml() prior to rendering tables:

JavaScript
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
6. Electron UI & Event Handling Safety
To prevent Electron window frameless dragging (-webkit-app-region: drag) from capturing clicks or blocking typing focus, every panel template must include the following style rules on its container elements:

CSS
#panel-[module-name], 
#panel-[module-name] * {
  -webkit-app-region: no-drag !important;
}

#panel-[module-name] input, 
#panel-[module-name] textarea, 
#panel-[module-name] button,
#panel-[module-name] select {
  pointer-events: auto !important;
  user-select: text !important;
  -webkit-user-select: text !important;
  position: relative !important;
  z-index: 99999 !important;
}
7. Module Blueprint Template
When building or converting any JS file (e.g., inventory.js, customers.js, orders.js), use this structural skeletal pattern with in-memory caching:

JavaScript
/**
 * Just Jane Maker Lab - [Module Name] Module
 * Path: modules/[module-name].js
 */

// Global in-memory cache variable
window.__[moduleName]Cache = null;

(function() {
  let currentEditId = null;

  // 1. DATABASE PERSISTENCE
  async function persistSingleItem(itemObj) {
    try {
      const rowArray = [
        itemObj.id || '',
        itemObj.field1 || '',
        itemObj.field2 || '',
        itemObj.createdAt || new Date().toISOString().slice(0, 10)
      ];

      if (window.MAKER_CONFIG && window.MAKER_CONFIG.saveToDatabase) {
        await window.MAKER_CONFIG.saveToDatabase('[SheetTabName]', rowArray);
      } else if (window.makerAPI && window.makerAPI.saveRowData) {
        await window.makerAPI.saveRowData('[SheetTabName]', rowArray);
      }
    } catch (err) {
      console.error('Database Sync Error:', err);
    }
  }

  // 2. INITIALIZATION ENTRY POINT
  window.__makerInit_[module-name] = async function() {
    buildPageLayout();
    await loadModuleData(false);
    attachEventListeners();
  };

  // 3. LAYOUT & UI BUILDER
  function buildPageLayout() {
    /* Inject panel HTML with Electron CSS overrides & Sync button */
  }

  // 4. DATA LOADER (WITH CACHING)
  async function loadModuleData(forceRefresh = false) {
    // Return instantly from memory cache if available
    if (!forceRefresh && window.__[moduleName]Cache && Array.isArray(window.__[moduleName]Cache)) {
      renderTable(window.__[moduleName]Cache);
      return;
    }

    try {
      let fetchFunc = (window.MAKER_CONFIG && window.MAKER_CONFIG.fetchFromDatabase) || 
                        (window.makerAPI && window.makerAPI.fetchSheetData);

      if (fetchFunc) {
        const remoteData = await fetchFunc('[SheetTabName]');
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
          const startIndex = (remoteData[0] && (remoteData[0][0] === 'ID' || remoteData[0][0] === 'id')) ? 1 : 0;
          
          window.__[moduleName]Cache = remoteData.slice(startIndex).map(row => ({
            id: row[0] || '',
            field1: row[1] || '',
            field2: row[2] || '',
            createdAt: row[3] || ''
          }));

          renderTable(window.__[moduleName]Cache);
          return;
        }
      }
    } catch (err) {
      console.error('Failed loading module data:', err);
    }

    if (!window.__[moduleName]Cache) window.__[moduleName]Cache = [];
    renderTable(window.__[moduleName]Cache);
  }

  // 5. TABLE RENDERER
  function renderTable(data) {
    /* InnerHTML mapping using escapeHtml */
  }

  // 6. EVENT LISTENERS & HANDLERS
  function attachEventListeners() {
    /* Submit, Edit, Delete, Search, Sync, CSV Import */
  }
})();