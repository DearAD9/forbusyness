/**
 * purchaseService.js — Forbusyness Web ERP
 *
 * Purchase entry and inward goods management for steel materials.
 * Supports:
 * - Sequential auto-numbering (PUR-001, PUR-002...)
 * - Inward inventory stock increment
 * - Supplier bill reference and weighbridge/vehicle tracking
 * - Summary statistics with paid & outstanding dues
 * - Persistent storage with zero initial sample data
 */

import { getProductById, updateProduct } from './productService';

const STORAGE_KEY = 'fb_purchases_data_v2';

// Purge legacy and temporary data keys
try {
  localStorage.removeItem('fb_purchases_data');
  localStorage.removeItem('fb_purchases_data_clean');
} catch {}

const INITIAL_PURCHASES = [];

function loadStoredPurchases() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [...INITIAL_PURCHASES];
}

function persistPurchases(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

let purchasesStore = loadStoredPurchases();

/**
 * Get paginated & filtered list of purchases in descending order.
 */
export async function getPurchases({
  search = '',
  supplierId = '',
  status = '',
  dateFrom = '',
  dateTo = '',
  page = 1,
  pageSize = 10,
} = {}) {
  await new Promise(r => setTimeout(r, 40));

  let filtered = [...purchasesStore];

  // 1. Search (Bill No, Supplier Name, Vehicle No, Reference)
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(p =>
      p.billNo.toLowerCase().includes(q) ||
      p.supplier?.name?.toLowerCase().includes(q) ||
      (p.vehicleNo && p.vehicleNo.toLowerCase().includes(q)) ||
      (p.supplierBillNo && p.supplierBillNo.toLowerCase().includes(q))
    );
  }

  // 2. Supplier filter
  if (supplierId) {
    filtered = filtered.filter(p => p.supplier?.id === Number(supplierId));
  }

  // 3. Status filter
  if (status && status !== 'All') {
    filtered = filtered.filter(p => p.status.toLowerCase() === status.toLowerCase());
  }

  // 4. Date filter
  if (dateFrom) {
    filtered = filtered.filter(p => p.date >= dateFrom);
  }
  if (dateTo) {
    filtered = filtered.filter(p => p.date <= dateTo);
  }

  // Descending order
  filtered.sort((a, b) => Number(b.id) - Number(a.id));

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
 * Summary KPI stats for Purchases dashboard/overview.
 */
export async function getPurchaseSummaryStats() {
  await new Promise(r => setTimeout(r, 30));

  const totalPurchases = purchasesStore.length;
  let totalAmount = 0;
  let totalPaid = 0;
  let totalPayables = 0;
  let totalTonnage = 0;

  purchasesStore.forEach(p => {
    totalAmount += p.grandTotal || 0;
    totalPaid += p.paid || 0;
    totalPayables += p.pending || 0;

    (p.items || []).forEach(item => {
      const q = parseFloat(item.qty || 0);
      if (item.unit === 'MT') {
        totalTonnage += q;
      } else if (item.unit === 'KG') {
        totalTonnage += q / 1000;
      }
    });
  });

  return {
    totalPurchases,
    totalAmount,
    totalPaid,
    totalPayables,
    totalTonnage: Math.round(totalTonnage * 10) / 10,
  };
}

export async function getPurchaseById(id) {
  await new Promise(r => setTimeout(r, 30));
  const numericId = Number(id);
  return purchasesStore.find(p => p.id === numericId || p.billNo === String(id)) || null;
}

/**
 * Create a new purchase bill.
 * Automatically increments product currentStock in inventory!
 */
export async function createPurchase(purchaseData) {
  await new Promise(r => setTimeout(r, 100));

  const maxId = purchasesStore.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
  const nextId = maxId + 1;
  const billNo = `PUR-${String(nextId).padStart(3, '0')}`;

  const grandTotal = Number(purchaseData.grandTotal) || 0;
  const paid = Number(purchaseData.paidToday) || 0;
  const pending = Math.max(0, grandTotal - paid);

  let status = 'Pending';
  if (paid >= grandTotal && grandTotal > 0) {
    status = 'Paid';
  } else if (paid > 0) {
    status = 'Partially Paid';
  }

  const newPurchase = {
    id: nextId,
    billNo,
    date: purchaseData.date || new Date().toISOString().split('T')[0],
    supplier: purchaseData.supplier,
    supplierBillNo: purchaseData.supplierBillNo || '',
    vehicleNo: purchaseData.vehicleNo || '',
    weighbridgeSlip: purchaseData.weighbridgeSlip || '',
    items: purchaseData.items || [],
    subtotal: Number(purchaseData.subtotal) || 0,
    freightInward: Number(purchaseData.freightInward) || 0,
    roundOff: Number(purchaseData.roundOff) || 0,
    grandTotal,
    paid,
    pending,
    status,
    notes: purchaseData.notes || '',
    createdAt: new Date().toISOString(),
  };

  // Inward stock increment
  for (const item of newPurchase.items) {
    if (item.productId) {
      try {
        const prod = await getProductById(item.productId);
        if (prod) {
          await updateProduct(prod.id, {
            currentStock: (prod.currentStock || 0) + Number(item.qty || 0),
            purchaseRate: Number(item.rate || prod.purchaseRate),
          });
        }
      } catch {}
    }
  }

  purchasesStore = [newPurchase, ...purchasesStore];
  persistPurchases(purchasesStore);
  return newPurchase;
}

/**
 * Export purchases to CSV.
 */
export function exportPurchasesToCSV(purchasesList) {
  if (!purchasesList || purchasesList.length === 0) return;

  const headers = ['Purchase Bill No', 'Date', 'Supplier', 'Supplier Ref', 'Vehicle No', 'Items Count', 'Grand Total (INR)', 'Paid (INR)', 'Payable Balance (INR)', 'Status'];
  const rows = purchasesList.map(p => [
    `"${p.billNo}"`,
    `"${p.date}"`,
    `"${(p.supplier?.name || '').replace(/"/g, '""')}"`,
    `"${p.supplierBillNo || ''}"`,
    `"${p.vehicleNo || ''}"`,
    p.items?.length || 0,
    p.grandTotal || 0,
    p.paid || 0,
    p.pending || 0,
    `"${p.status || 'Pending'}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `forbusyness_purchases_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
