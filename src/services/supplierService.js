/**
 * supplierService.js — Forbusyness Web ERP
 *
 * Supplier management data service for steel material mills & stockists.
 * Supports:
 * - Persistent store with zero initial sample data
 * - Supplier search & dropdown lookup
 * - CRUD operations
 */

const STORAGE_KEY = 'fb_suppliers_data_v2';

// Purge legacy and temporary data keys
try {
  localStorage.removeItem('fb_suppliers_data');
  localStorage.removeItem('fb_suppliers_data_clean');
} catch {}

const INITIAL_SUPPLIERS = [];

function loadStoredSuppliers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [...INITIAL_SUPPLIERS];
}

function persistSuppliers(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

let suppliersStore = loadStoredSuppliers();

/**
 * Get paginated & filtered list of suppliers.
 */
export async function getSuppliers(options = {}) {
  await new Promise(r => setTimeout(r, 40));

  const isString = typeof options === 'string';
  const opts = isString ? { search: options } : (options || {});
  const { search = '', page = 1, pageSize = 20 } = opts;

  let filtered = [...suppliersStore];

  if (typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q))
    );
  }

  const total = filtered.length;

  if (isString || (!opts.page && !opts.pageSize)) {
    const list = [...filtered];
    list.items = filtered;
    list.total = total;
    return list;
  }

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

export async function getSupplierById(id) {
  await new Promise(r => setTimeout(r, 20));
  const numericId = Number(id);
  return suppliersStore.find(s => s.id === numericId) || null;
}

export async function createSupplier(data) {
  await new Promise(r => setTimeout(r, 60));

  const maxId = suppliersStore.reduce((max, s) => Math.max(max, Number(s.id) || 0), 0);
  const nextId = maxId + 1;
  const code = `SUP-${String(nextId).padStart(3, '0')}`;

  const newSupplier = {
    id: nextId,
    code,
    name: data.name.trim(),
    contactPerson: data.contactPerson?.trim() || '',
    phone: data.phone?.trim() || '',
    email: data.email?.trim() || '',
    address: data.address?.trim() || '',
    city: data.city?.trim() || '',
    state: data.state?.trim() || 'Maharashtra',
    bankName: data.bankName?.trim() || '',
    accountNumber: data.accountNumber?.trim() || '',
    ifscCode: data.ifscCode?.trim() || '',
    creditDays: Number(data.creditDays) || 30,
    creditLimit: Number(data.creditLimit) || 0,
    outstandingBalance: Number(data.outstandingBalance) || 0,
    status: data.status || 'Active',
    createdAt: new Date().toISOString(),
  };

  suppliersStore = [newSupplier, ...suppliersStore];
  persistSuppliers(suppliersStore);
  return newSupplier;
}

export async function updateSupplier(id, data) {
  await new Promise(r => setTimeout(r, 50));
  const numericId = Number(id);
  const idx = suppliersStore.findIndex(s => s.id === numericId);
  if (idx === -1) throw new Error(`Supplier #${id} not found.`);

  const existing = suppliersStore[idx];
  const updated = {
    ...existing,
    name: data.name !== undefined ? data.name.trim() : existing.name,
    contactPerson: data.contactPerson !== undefined ? data.contactPerson.trim() : existing.contactPerson,
    phone: data.phone !== undefined ? data.phone.trim() : existing.phone,
    email: data.email !== undefined ? data.email.trim() : existing.email,
    address: data.address !== undefined ? data.address.trim() : existing.address,
    city: data.city !== undefined ? data.city.trim() : existing.city,
    state: data.state !== undefined ? data.state.trim() : existing.state,
    bankName: data.bankName !== undefined ? data.bankName.trim() : existing.bankName,
    accountNumber: data.accountNumber !== undefined ? data.accountNumber.trim() : existing.accountNumber,
    ifscCode: data.ifscCode !== undefined ? data.ifscCode.trim() : existing.ifscCode,
    creditDays: data.creditDays !== undefined ? Number(data.creditDays) : existing.creditDays,
    creditLimit: data.creditLimit !== undefined ? Number(data.creditLimit) : existing.creditLimit,
    outstandingBalance: data.outstandingBalance !== undefined ? Number(data.outstandingBalance) : existing.outstandingBalance,
    status: data.status !== undefined ? data.status : existing.status,
    updatedAt: new Date().toISOString(),
  };

  suppliersStore[idx] = updated;
  persistSuppliers(suppliersStore);
  return updated;
}

export async function deleteSupplier(id) {
  await new Promise(r => setTimeout(r, 40));
  const numericId = Number(id);
  suppliersStore = suppliersStore.filter(s => s.id !== numericId);
  persistSuppliers(suppliersStore);
  return true;
}

export async function getSupplierSummaryStats() {
  await new Promise(r => setTimeout(r, 30));
  const totalSuppliers = suppliersStore.length;
  const activeSuppliers = suppliersStore.filter(s => s.status === 'Active').length;
  const totalPayables = suppliersStore.reduce((sum, s) => sum + (Number(s.outstandingBalance) || 0), 0);
  const citiesCount = new Set(suppliersStore.map(s => s.city).filter(Boolean)).size;

  return {
    totalSuppliers,
    activeSuppliers,
    totalPayables,
    citiesCount,
  };
}

export const STANDARD_SUPPLIER_TEMPLATES = [
  {
    name: 'Tata Steel BSL Limited',
    contactPerson: 'Rahul Khurana (Sales VP)',
    phone: '9820145522',
    email: 'commercial.tata@tatasteelbsl.co.in',
    address: 'Bombay House, 24 Homi Mody Street, Fort',
    city: 'Mumbai',
    state: 'Maharashtra',
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200049182341',
    ifscCode: 'HDFC0000060',
    creditDays: 45,
    creditLimit: 5000000,
    outstandingBalance: 1420500,
    status: 'Active',
  },
  {
    name: 'Jindal Steel & Power Ltd (JSPL)',
    contactPerson: 'Amitabh Sharma (Logistics Head)',
    phone: '9811234901',
    email: 'orders.steel@jindalsteel.com',
    address: 'OP Jindal Marg, Jindal Nagar',
    city: 'Raigarh',
    state: 'Chhattisgarh',
    bankName: 'State Bank of India',
    accountNumber: '38192049182',
    ifscCode: 'SBIN0000300',
    creditDays: 30,
    creditLimit: 3500000,
    outstandingBalance: 875000,
    status: 'Active',
  },
  {
    name: 'Steel Authority of India Ltd (SAIL)',
    contactPerson: 'S. Chatterjee (Branch Manager)',
    phone: '9433019283',
    email: 'cmo.east@sail.in',
    address: 'Ispat Bhawan, 40 Jawaharlal Nehru Road',
    city: 'Kolkata',
    state: 'West Bengal',
    bankName: 'Punjab National Bank',
    accountNumber: '0129002100034912',
    ifscCode: 'PUNB0012900',
    creditDays: 30,
    creditLimit: 2500000,
    outstandingBalance: 640000,
    status: 'Active',
  },
  {
    name: 'Shyam Metalics & Energy Ltd',
    contactPerson: 'Vikram Agarwal',
    phone: '9830022341',
    email: 'sales@shyammetalics.com',
    address: 'Trinity Tower, 83 Topsia Road',
    city: 'Kolkata',
    state: 'West Bengal',
    bankName: 'ICICI Bank Ltd',
    accountNumber: '000405018293',
    ifscCode: 'ICIC0000004',
    creditDays: 15,
    creditLimit: 2000000,
    outstandingBalance: 320000,
    status: 'Active',
  },
  {
    name: 'Kamdhenu Ispat stockists & Wire Ind',
    contactPerson: 'Rajesh Singhal',
    phone: '9829033412',
    email: 'kamdhenu.distributors@gmail.com',
    address: 'RIICO Industrial Area, Phase 2',
    city: 'Bhiwadi',
    state: 'Rajasthan',
    bankName: 'Axis Bank',
    accountNumber: '918020048192831',
    ifscCode: 'UTIB0000128',
    creditDays: 30,
    creditLimit: 1500000,
    outstandingBalance: 0,
    status: 'Active',
  },
];

export async function seedSupplierTemplates() {
  await new Promise(r => setTimeout(r, 60));
  const newSuppliers = [];
  let nextId = suppliersStore.reduce((max, s) => Math.max(max, Number(s.id) || 0), 0) + 1;

  for (const t of STANDARD_SUPPLIER_TEMPLATES) {
    const code = `SUP-${String(nextId).padStart(3, '0')}`;
    newSuppliers.push({
      id: nextId++,
      code,
      ...t,
      createdAt: new Date().toISOString(),
    });
  }

  suppliersStore = [...newSuppliers, ...suppliersStore];
  persistSuppliers(suppliersStore);
  return suppliersStore;
}

export function exportSuppliersToCSV(suppliers = []) {
  const headers = ['Code', 'Supplier Name', 'Contact Person', 'Phone', 'Email', 'City', 'State', 'Bank Name', 'A/c No', 'IFSC', 'Credit Days', 'Balance (INR)', 'Status'];
  const rows = suppliers.map(s => [
    s.code,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${(s.contactPerson || '').replace(/"/g, '""')}"`,
    s.phone,
    s.email,
    s.city,
    s.state,
    s.bankName,
    s.accountNumber,
    s.ifscCode,
    s.creditDays,
    s.outstandingBalance || 0,
    s.status,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `suppliers_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

