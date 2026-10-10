/**
 * productService.js — Forbusyness Web ERP
 *
 * Professional Product & Steel Inventory Catalog Service.
 * Manages:
 * - Steel material master: MS Pipes, MS Angles, MS Flats, TMT Bars, Beams, Hardware.
 * - Units & weights (KG, MT, PCS, MTR).
 * - Tax rates & HSN codes (7216, 7306, 7208, 8311, etc.).
 * - Commercial rates: Purchase Rate, Selling Rate, Margin % calculations.
 * - Persistent storage with zero initial sample data.
 */

const STORAGE_KEY = 'fb_products_data_v2';

// Purge legacy and temporary data keys
try {
  localStorage.removeItem('fb_products_data');
  localStorage.removeItem('fb_products_data_clean');
} catch {}

// Standard steel category taxonomy
export const STEEL_CATEGORIES = [
  'MS Pipes',
  'MS Angles',
  'MS Flats',
  'MS Round Bars',
  'MS Square Bars',
  'Beams & Channels',
  'Plates & Sheets',
  'Industrial Hardware',
];

// Standard Indian Steel HSN reference guide
export const STANDARD_HSN_CODES = [
  { hsn: '7306', desc: 'MS Pipes & Hollow Sections' },
  { hsn: '7216', desc: 'MS Angles, Shapes & Sections' },
  { hsn: '7208', desc: 'Flat-rolled Steel Products & HR Plates' },
  { hsn: '7214', desc: 'TMT Bars & Deformed Steel Rods' },
  { hsn: '8311', desc: 'Welding Electrodes & Wires' },
  { hsn: '6804', desc: 'Abrasive Cutting Wheels' },
  { hsn: '7307', desc: 'Pipe Fittings & MS Flanges' },
  { hsn: '7217', desc: 'GI & MS Binding Wire' },
];

// Template catalog available for 1-click catalog import if user wants quick steel inventory
export const STANDARD_STEEL_TEMPLATES = [
  {
    name: 'MS Pipe 1.5" Round (Heavy)',
    code: 'MSP-150-H',
    category: 'MS Pipes',
    unit: 'KG',
    altUnit: 'MTR',
    purchaseRate: 64.00,
    sellingRate: 72.50,
    hsn: '7306',
    minStock: 500,
    currentStock: 0,
    specifications: '1.5" OD, 3.2mm Wall, Length 6m',
  },
  {
    name: 'MS Pipe 2.0" Round (Medium)',
    code: 'MSP-200-M',
    category: 'MS Pipes',
    unit: 'KG',
    altUnit: 'MTR',
    purchaseRate: 75.00,
    sellingRate: 85.00,
    hsn: '7306',
    minStock: 500,
    currentStock: 0,
    specifications: '2.0" OD, 2.6mm Wall, Length 6m',
  },
  {
    name: 'MS Pipe 1.0" Square Box (1.6mm)',
    code: 'MSP-100-SQ',
    category: 'MS Pipes',
    unit: 'KG',
    altUnit: 'MTR',
    purchaseRate: 69.00,
    sellingRate: 78.00,
    hsn: '7306',
    minStock: 400,
    currentStock: 0,
    specifications: '25x25mm, 1.6mm Wall, Length 6m',
  },
  {
    name: 'MS Angle 40 x 40 x 5mm',
    code: 'MSA-405',
    category: 'MS Angles',
    unit: 'KG',
    altUnit: 'MTR',
    purchaseRate: 56.00,
    sellingRate: 64.00,
    hsn: '7216',
    minStock: 1000,
    currentStock: 0,
    specifications: 'IS 2062 Grade E250',
  },
  {
    name: 'MS Angle 50 x 50 x 6mm',
    code: 'MSA-506',
    category: 'MS Angles',
    unit: 'KG',
    altUnit: 'MTR',
    purchaseRate: 57.00,
    sellingRate: 65.00,
    hsn: '7216',
    minStock: 1000,
    currentStock: 0,
    specifications: 'IS 2062 Grade E250',
  },
  {
    name: 'MS Flat 50 x 6mm',
    code: 'MSF-506',
    category: 'MS Flats',
    unit: 'KG',
    altUnit: 'MTR',
    purchaseRate: 53.50,
    sellingRate: 61.50,
    hsn: '7208',
    minStock: 800,
    currentStock: 0,
    specifications: 'Hot Rolled Commercial Quality',
  },
  {
    name: 'MS Round Bar 12mm (TMT Fe550D)',
    code: 'MSR-12D',
    category: 'MS Round Bars',
    unit: 'KG',
    altUnit: 'MTR',
    purchaseRate: 55.00,
    sellingRate: 63.00,
    hsn: '7214',
    minStock: 1500,
    currentStock: 0,
    specifications: 'High Strength Thermo-Mechanically Treated',
  },
  {
    name: 'ISMB 200 Heavy Beam (9m Length)',
    code: 'BM-200H',
    category: 'Beams & Channels',
    unit: 'PCS',
    altUnit: 'KG',
    purchaseRate: 14800.00,
    sellingRate: 16800.00,
    hsn: '7216',
    minStock: 10,
    currentStock: 0,
    specifications: '200x100mm, 25.4 kg/m weight',
  },
];

// Clean initial store with zero sample data
const INITIAL_PRODUCTS = [];

function loadStoredProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [...INITIAL_PRODUCTS];
}

function persistProducts(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

let productsStore = loadStoredProducts();

/**
 * Get paginated & filtered list of products.
 */
export async function getProducts({
  search = '',
  category = 'All',
  page = 1,
  pageSize = 10,
  sortBy = 'name',
  sortOrder = 'asc',
} = {}) {
  await new Promise(r => setTimeout(r, 40));

  let filtered = [...productsStore];

  // 1. Search (Name, Code, HSN, Specifications)
  if (typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.hsn && p.hsn.toLowerCase().includes(q)) ||
      (p.specifications && p.specifications.toLowerCase().includes(q))
    );
  }

  // 2. Category filter
  if (category && category !== 'All') {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  // 3. Sorting
  filtered.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const items = filtered.slice(startIndex, startIndex + pageSize);

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

/**
 * Summary KPI stats for products overview.
 */
export async function getProductSummaryStats() {
  await new Promise(r => setTimeout(r, 30));

  const totalProducts = productsStore.length;
  const activeProducts = productsStore.filter(p => p.status !== 'Inactive').length;
  const categoriesCount = new Set(productsStore.map(p => p.category)).size;
  const lowStockCount = productsStore.filter(p => p.minStock && (p.currentStock || 0) <= p.minStock).length;

  return {
    totalProducts,
    activeProducts,
    categoriesCount,
    lowStockCount,
  };
}

/**
 * Search products for dropdown selectors (used in NewInvoicePage & NewPurchasePage).
 */
export async function searchProducts(query = '') {
  await new Promise(r => setTimeout(r, 30));
  const q = typeof query === 'string' ? query.trim().toLowerCase() : '';

  if (!q) {
    return productsStore.slice(0, 15);
  }

  return productsStore.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.code && p.code.toLowerCase().includes(q)) ||
    (p.category && p.category.toLowerCase().includes(q))
  );
}

/**
 * Get recently used products.
 */
export async function getRecentProducts() {
  await new Promise(r => setTimeout(r, 20));
  return productsStore.slice(0, 8);
}

/**
 * Find single product by numeric ID.
 */
export async function getProductById(id) {
  await new Promise(r => setTimeout(r, 30));
  const numericId = Number(id);
  return productsStore.find(p => p.id === numericId) || null;
}

/**
 * Create a new steel product.
 */
export async function createProduct(data) {
  await new Promise(r => setTimeout(r, 80));

  const maxId = productsStore.reduce((max, p) => Math.max(max, Number(p.id) || 0), 100);
  const nextId = maxId + 1;

  // Auto-generate code if empty: e.g. STL-101
  const categoryPrefix = data.category ? data.category.substring(0, 3).toUpperCase() : 'STL';
  const code = (data.code && data.code.trim()) || `${categoryPrefix}-${nextId}`;

  const purchaseRate = parseFloat(data.purchaseRate) || 0;
  const sellingRate = parseFloat(data.sellingRate) || 0;
  const marginPct = purchaseRate > 0 ? Math.round(((sellingRate - purchaseRate) / purchaseRate) * 100) : 0;

  const newProduct = {
    id: nextId,
    code,
    name: data.name.trim(),
    category: data.category || 'MS Pipes',
    unit: data.unit || 'KG',
    altUnit: data.altUnit || null,
    conversionRatio: parseFloat(data.conversionRatio) || null,
    hsn: data.hsn?.trim() || '7306',
    purchaseRate,
    sellingRate,
    marginPct,
    minStock: parseFloat(data.minStock) || 0,
    currentStock: parseFloat(data.currentStock) || 0,
    specifications: data.specifications?.trim() || '',
    status: data.status || 'Active',
    createdAt: new Date().toISOString(),
  };

  productsStore = [newProduct, ...productsStore];
  persistProducts(productsStore);
  return newProduct;
}

/**
 * Update an existing product.
 */
export async function updateProduct(id, data) {
  await new Promise(r => setTimeout(r, 80));
  const numericId = Number(id);
  const index = productsStore.findIndex(p => p.id === numericId);

  if (index === -1) {
    throw new Error(`Product with ID ${id} not found.`);
  }

  const existing = productsStore[index];
  const purchaseRate = data.purchaseRate !== undefined ? parseFloat(data.purchaseRate) || 0 : existing.purchaseRate;
  const sellingRate = data.sellingRate !== undefined ? parseFloat(data.sellingRate) || 0 : existing.sellingRate;
  const marginPct = purchaseRate > 0 ? Math.round(((sellingRate - purchaseRate) / purchaseRate) * 100) : 0;

  const updated = {
    ...existing,
    code: data.code !== undefined ? data.code.trim() : existing.code,
    name: data.name !== undefined ? data.name.trim() : existing.name,
    category: data.category || existing.category,
    unit: data.unit || existing.unit,
    altUnit: data.altUnit !== undefined ? data.altUnit : existing.altUnit,
    conversionRatio: data.conversionRatio !== undefined ? parseFloat(data.conversionRatio) || null : existing.conversionRatio,
    hsn: data.hsn !== undefined ? data.hsn.trim() : existing.hsn,
    purchaseRate,
    sellingRate,
    marginPct,
    minStock: data.minStock !== undefined ? parseFloat(data.minStock) || 0 : existing.minStock,
    currentStock: data.currentStock !== undefined ? parseFloat(data.currentStock) || 0 : existing.currentStock,
    specifications: data.specifications !== undefined ? data.specifications.trim() : existing.specifications,
    status: data.status || existing.status,
    updatedAt: new Date().toISOString(),
  };

  productsStore[index] = updated;
  persistProducts(productsStore);
  return updated;
}

/**
 * Seed standard steel templates (allows 1-click onboarding if user chooses).
 */
export async function importStandardSteelTemplates() {
  await new Promise(r => setTimeout(r, 100));

  const templatesWithIds = STANDARD_STEEL_TEMPLATES.map((tmpl, idx) => ({
    ...tmpl,
    id: 101 + idx,
    marginPct: tmpl.purchaseRate > 0 ? Math.round(((tmpl.sellingRate - tmpl.purchaseRate) / tmpl.purchaseRate) * 100) : 0,
    status: 'Active',
    createdAt: new Date().toISOString(),
  }));

  productsStore = [...templatesWithIds, ...productsStore];
  persistProducts(productsStore);
  return productsStore;
}

/**
 * Export products to CSV.
 */
export function exportProductsToCSV(productsList) {
  if (!productsList || productsList.length === 0) return;

  const headers = ['Code', 'Product Name', 'Category', 'Unit', 'HSN Code', 'Purchase Rate (INR)', 'Selling Rate (INR)', 'Margin %', 'Stock Qty', 'Min Reorder Qty', 'Status'];
  const rows = productsList.map(p => [
    `"${p.code || ''}"`,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${p.category || ''}"`,
    `"${p.unit || ''}"`,
    `"${p.hsn || ''}"`,
    p.purchaseRate || 0,
    p.sellingRate || 0,
    `"${p.marginPct || 0}%"`,
    p.currentStock || 0,
    p.minStock || 0,
    `"${p.status || 'Active'}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `forbusyness_products_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
