# JTBJ Maker App v2.2.0: Comprehensive Architectural and Code Review
**Focus Areas: Data Structure Optimization, Item Management, and Product Costing/Design Workflows**

---

## Executive Summary (TL;DR)
This architectural and code review provides a structural blueprint to transition the **JTBJ Maker App** to an optimized, highly scalable enterprise-grade desktop environment. By eliminating data redundancy between catalogs and physical inventory, centralizing duplicate Bill of Materials (BOM) codebases, introducing an on-the-fly SKU builder, and establishing a unified Pricing Engine, we lay out the roadmap for **Version 2.2.0**.

---

## 1. Data Architecture & Deduplication (Single Source of Truth)

### Current Architecture Vulnerabilities
* **Two Parallel Databases:** Currently, raw stock items reside in `inventory.json` with attributes like `sku`, `name`, `brand`, `cat`, `subcat`, and `supplier`. Concurrently, `sku.json` functions as the master SKU register, replicating those exact same fields (`sku`, `name`, `cat`, `subcat`, `brand`, `supplier`).
* **Data Mutation & De-synchronization Risk:** When inventory item details are updated, they are not automatically synchronized with the catalog SKU. This leads to name mismatches, brand inconsistencies, and pricing skew.
* **Redundant Migration Tasks:** The application relies on `runSkuMigration()` to scan inventory items and copy them into `sku.json`, creating an unnecessary layer of duplicate state check-and-write cycles.

### Proposed Normalized Schema Design
We propose declaring **`sku.json` (SKU Catalog) as the absolute Single Source of Truth (SSOT)** for product specs. Physical inventory records should operate strictly as physical stock markers.

```json
/* Master Catalog (sku.json - SSOT) */
{
  "id": "mrxtl7dajepy",
  "sku": "FIL-TPU-OV-001",
  "name": "High Speed TPU Natural/White 1kg",
  "cat": "FIL",
  "subcat": "TPU",
  "brand": "Overture",
  "supplier": "Filaments.ca",
  "cost": 19.00,
  "price": 32.00,
  "cogs": 19.00,
  "retail": 45.00,
  "status": "Active",
  "classification": "Raw Component / Material (BOM Input)",
  "notes": "Verified spool weight"
}

/* Physical Inventory / Stock Register (inventory.json) */
{
  "id": "inv001",
  "skuId": "mrxtl7dajepy",       // Reference to Catalog ID (Foreign Key)
  "qty": 3,                       // Physical stock count
  "location": "Filament Box C",   // Storage location
  "lowStock": 2,                  // Restock threshold
  "parameters": {                 // Specialized custom attributes (dynamic)
    "diameter": "1.75mm",
    "printTemp": "220C",
    "bedTemp": "60C"
  }
}
```

### Benefits of Normalization
* **Zero Duplication:** Updating a product name or supplier in the SKU catalog instantly reflects in the inventory view, projects, products, and orders.
* **Reduced Database Footprint:** Physical stock tracking requires only reference links, making remote synchronizations faster.

---

## 2. Flexible Item Creation (Global On-the-Fly SKU Builder)

### The Friction Point
Users currently experience workflow blocks when configuring a Project or defining a finished Product. If a raw material is missing, the user has to interrupt their current screen, navigate to "SKU Builder", create the SKU, write down the code, navigate back to their task, re-render, and search. This disrupts creator focus.

### The Solution: Global SKU Builder Dialog
We propose a **Global SKU Builder Modal** instantiated in `index.html` and available globally via a shared script hook:

```javascript
window.openGlobalSkuBuilder({
  onSuccess: function(newSkuObject) {
    // Callback to automatically select the newly built SKU in the active form
  }
});
```

### Implementation Mechanics
1. **Dynamic Dropdowns:** Dynamically binds Categories/Subcategories from `window.OSOT_CATS`.
2. **Standardized 5-Part SKU Code Formatting:** Auto-generates SKUs using the 5-part structure: `[CAT]-[SUBCAT]-[TYPE]-[BRAND]-[COLOR]` (e.g. `FIL-PLA-SLK-OVR-FGRN`, `FIL-PLA-HYP-CRL-BLUE`).
3. **Event Pipeline:** Broadcasts a custom event (`'skuCatalogUpdated'`) across panels to refresh all active dropdown selects inline.

---

## 3. Project Design & Sales Creation (Prototype to Product Lifecycle)

### Unifying the Workflow
In a maker-focused workshop, ideas start as **Prototype Projects**. As they stabilize, they are commercialized as **Finished Products**. We propose formalizing this lifecycle transition.

```
[PROTOTYPE PROJECT] ─────► [STABLE LOG & BOM] ─────► [EXPORT TO PRODUCT]
(Needs NO SKU yet)         (Calculates actual)        (Assigns unique Master SKU)
                                                      (BOM converted automatically)
```

### Transition Steps
1. **The Sandbox State:** A Project in `projects.js` does *not* require a SKU upon initial registration. It uses a dynamic, local Prototype BOM to record material consumption and labor.
2. **The "Convert to Product" Trigger:** When a project is ready for commercialization:
   - A modal prompts the user to input target pricing, retail pricing, and product identification details.
   - The app auto-generates a master **Finished Product SKU** using the standard category builder.
   - The Prototype BOM is cloned and locked into the new **Product Catalog (`products.json`)** record.
   - A link is retained on the Project record pointing to the newly generated Product SKU (`productSku`).

---

## 4. Cost Calculation & Pricing Engine

### The BOM Calculation Engine
Both Projects and Products currently use custom algorithms to estimate BOM costs. We propose establishing a centralized, unified calculation engine (`modules/pricingEngine.js`) to enforce standardization.

### Core Pricing Equation
$$\text{Total Cost} = \text{Material Cost (BOM)} + \text{Labor Cost} + \text{Overhead Cost}$$

$$\text{Target Margin Price} = \frac{\text{Total Cost}}{1 - \text{Target Margin \%}}$$

### Standardized Calculation Model
```javascript
window.PricingEngine = {
  // Method 1: Fetch Live/Current Cost
  getLiveCost: function(bomItems, skuCatalog) {
    let total = 0;
    bomItems.forEach(item => {
      const spec = skuCatalog.find(s => s.sku === item.itemId);
      const unitCost = spec ? Number(spec.cost || 0) : Number(item.unitCost || 0);
      const qtyWithWaste = item.qty * (1 + (item.waste || 0) / 100);
      total += unitCost * qtyWithWaste;
    });
    return total;
  },

  // Method 2: Get Lock-in / Historical Cost
  getLockedCost: function(bomItems) {
    let total = 0;
    bomItems.forEach(item => {
      const unitCost = Number(item.unitCost || 0);
      const qtyWithWaste = item.qty * (1 + (item.waste || 0) / 100);
      total += unitCost * qtyWithWaste;
    });
    return total;
  },

  // Method 3: Simplified Margin & Taxes Pricing
  calculateTargetPrice: function(baseCost, laborHours, laborRate, overheadPct, targetMarginPct, taxPct) {
    const labor = laborHours * laborRate;
    const overhead = (baseCost + labor) * (overheadPct / 100);
    const totalCost = baseCost + labor + overhead;

    // Profit margin calculation
    const priceExcludingTax = totalCost / (1 - (targetMarginPct / 100));
    const taxAmount = priceExcludingTax * (taxPct / 100);
    const finalPrice = priceExcludingTax + taxAmount;

    return {
      totalCost: totalCost,
      preTaxPrice: priceExcludingTax,
      finalPrice: finalPrice,
      taxAmount: taxAmount
    };
  }
};
```

---

## 5. Technical Bug Analysis: Google Sheets Array Truncation & Undefined Fields

### The Bug Origin & Diagnostic
When mapping remote arrays retrieved from Google Sheets (`fetchFromDatabase`), the rows representing trailing empty cells are often returned as shorter arrays (e.g., `r.length < header.length`).
In current parsing structures:
```javascript
code: codeIdx !== -1 ? r[codeIdx] : ''
```
If `codeIdx` is greater than or equal to `r.length`, `r[codeIdx]` evaluates directly to `undefined`. Because the parser lacks a final safety fallback, the application populates properties like `code`, `name`, and `category` with literal `undefined` values.

### Visual Impact in UI
This bug is visually captured in the DevTools console and UI, resulting in:
* **Category Group selector** populating as `"undefined - undefined"`.
* **SKU Preview** outputting `"undefined-WOD-OVF-001"`.
* In-memory cache contamination that propagates back to local JSON files and Google Sheets databases as stringified `"undefined"`, corrupting persistent records.

### The Corrective Refactoring Fix
All property extractions must be wrapped with a robust safety coalescing fallback:
```javascript
// Safely resolves to an empty string instead of undefined when rows are truncated
code: (codeIdx !== -1 ? r[codeIdx] : '') || ''
```
Additionally, all numeric fields must be parsed through a fallback coercer:
```javascript
cost: costIdx !== -1 ? (Number(r[costIdx]) || 0) : 0
```

---

## 6. Recommended Action Plan & Implementation Roadmap

| Phase | Description | Key Deliverables | Estimated Effort |
|:---|:---|:---|:---|
| **Phase 1** | **Data Normalization & Schema Update** | Update `inventory.json` schema to reference SKU IDs; modify load/save code in `inventory.js` to perform relational joins. | 2 Days |
| **Phase 2** | **BOM Logic Consolidation** | Create a unified BOM engine and refactor both `products.js` and `projects.js` to consume the shared engine. | 3 Days |
| **Phase 3** | **Global SKU Modal Integration** | Add the global modal to `index.html` and expose `window.openGlobalSkuBuilder` with cross-panel update events. | 2 Days |
| **Phase 4** | **Lifecycle Conversion Workflow** | Build the "Export Project to Product Catalog" button, mapping Prototype BOM variables to the Product Catalog. | 1.5 Days |
| **Phase 5** | **Robust Truncation Bug Fix & QA** | Apply safety null/undefined fallbacks `(val || '')` to all Sheet row-parsers and clean up any defunct console ReferenceErrors. | 1 Day |

---

## 7. Review & Verification of Reference Resolution

We have audited the initialization sequence in `modules/sku.js` and verified that:
1. No legacy or defunct `populateBrandsDropdown` calls are executed at runtime.
2. Form initialization safely loads suppliers using `loadSuppliers()` from the centralized `suppliers.json` database.
3. Live SKU preview updates smoothly in response to Brand/Manufacturer text modifications.
4. Input focus transitions securely to form fields on first-tab initialization without interface lockups.
