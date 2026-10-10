/**
 * invoiceService.js — Forbusyness Web ERP
 *
 * Sales invoice data service.
 * Supports:
 * - Descending numeric invoice ordering (e.g. #245, #244... #1)
 * - Summary statistics with dominant Total Received and payment-method breakdown
 * - In-memory store for adding new invoices in frontend-first phase
 * - Filtering by search (no, customer, phone), customer, payment status, date
 * - Pagination
 */

const STORAGE_KEY = 'fb_invoices_data_v2';

// Purge legacy and temporary data keys
try {
  localStorage.removeItem('fb_invoices_data');
  localStorage.removeItem('fb_invoices_data_clean');
  localStorage.removeItem('fb_mock_invoices_v1');
  localStorage.removeItem('fb_mock_invoices_v2');
} catch {}

// Initial empty invoice store (no sample data)
const INITIAL_INVOICES = [];

function loadStoredInvoices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [...INITIAL_INVOICES];
}

function persistInvoices(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

let invoicesStore = loadStoredInvoices();

/**
 * Get paginated & filtered list of invoices.
 * Enforces NUMERIC DESCENDING order (#5, #4, #3... #1).
 */
export async function getInvoices({
  search = '',
  customerId = '',
  status = '',
  dateFrom = '',
  dateTo = '',
  page = 1,
  pageSize = 10,
} = {}) {
  await new Promise(r => setTimeout(r, 60));

  let filtered = [...invoicesStore];

  // 1. Search (Invoice number, Customer Name, Phone)
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(inv =>
      inv.invoiceNo.toLowerCase().includes(q) ||
      inv.customer?.name?.toLowerCase().includes(q) ||
      inv.customer?.phone?.includes(q) ||
      inv.reference?.toLowerCase().includes(q)
    );
  }

  // 2. Customer filter
  if (customerId) {
    filtered = filtered.filter(inv => inv.customer?.id === Number(customerId));
  }

  // 3. Payment Status filter
  if (status && status !== 'All') {
    filtered = filtered.filter(inv => inv.status.toLowerCase() === status.toLowerCase());
  }

  // 4. Date range filter
  if (dateFrom) {
    filtered = filtered.filter(inv => inv.date >= dateFrom);
  }
  if (dateTo) {
    filtered = filtered.filter(inv => inv.date <= dateTo);
  }

  // Must appear in DESCENDING numeric invoice-number order
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
 * Get summary stats for the dashboard / Sales Invoices cards.
 * Dominant Total Received + Cash/Bank/UPI/Other breakdown.
 */
export async function getInvoiceSummaryStats() {
  await new Promise(r => setTimeout(r, 40));

  const totalInvoices = invoicesStore.length;
  let totalSales = 0;
  let receivedAmount = 0;
  let pendingAmount = 0;

  const breakdown = {
    cash: 0,
    bank: 0,
    upi: 0,
    other: 0,
  };

  invoicesStore.forEach(inv => {
    totalSales += inv.grandTotal || 0;
    receivedAmount += inv.received || 0;
    pendingAmount += inv.pending || 0;

    if (inv.paymentBreakdown) {
      breakdown.cash += inv.paymentBreakdown.cash || 0;
      breakdown.bank += inv.paymentBreakdown.bank || 0;
      breakdown.upi += inv.paymentBreakdown.upi || 0;
      breakdown.other += inv.paymentBreakdown.other || 0;
    }
  });

  return {
    totalInvoices,
    totalSales,
    receivedAmount,
    pendingAmount,
    breakdown,
  };
}

/**
 * Fetch a single invoice by ID or Invoice Number.
 */
export async function getInvoiceById(id) {
  await new Promise(r => setTimeout(r, 40));
  const numericId = Number(id);
  return invoicesStore.find(i => i.id === numericId || i.invoiceNo === String(id)) || null;
}

/**
 * Create a new invoice.
 * Assigns next numeric sequential number (AUTO), e.g. 1, 2, 3...
 * Adds to store in memory and persists to localStorage.
 */
export async function createInvoice(invoiceData) {
  await new Promise(r => setTimeout(r, 120));

  // Determine next sequential integer ID
  const maxId = invoicesStore.reduce((max, inv) => Math.max(max, Number(inv.id) || 0), 0);
  const nextId = maxId + 1;
  const nextInvoiceNo = String(nextId);

  const grandTotal = Number(invoiceData.grandTotal) || 0;
  const received = Number(invoiceData.receivedToday) || 0;
  const pending = Math.max(0, grandTotal - received);

  let status = 'Pending';
  if (received >= grandTotal && grandTotal > 0) {
    status = 'Paid';
  } else if (received > 0) {
    status = 'Partially Paid';
  }

  // Payment breakdown simulation based on received amount
  const breakdown = {
    cash: received > 0 ? Math.round(received * 0.6) : 0,
    bank: received > 0 ? Math.round(received * 0.4) : 0,
    upi: 0,
    other: 0,
  };

  const newInvoice = {
    id: nextId,
    invoiceNo: nextInvoiceNo,
    date: invoiceData.date || new Date().toISOString().split('T')[0],
    customer: invoiceData.customer,
    reference: invoiceData.reference || '',
    items: invoiceData.items || [],
    subtotal: Number(invoiceData.subtotal) || 0,
    discount: Number(invoiceData.discount) || 0,
    freight: Number(invoiceData.freight) || 0,
    roundOff: Number(invoiceData.roundOff) || 0,
    grandTotal,
    received,
    pending,
    status,
    paymentBreakdown: breakdown,
    notes: invoiceData.notes || '',
    createdAt: new Date().toISOString(),
  };

  invoicesStore = [newInvoice, ...invoicesStore];
  persistInvoices(invoicesStore);

  return newInvoice;
}

/**
 * Reset mock store back to defaults if needed.
 */
export function resetMockInvoices() {
  invoicesStore = [...INITIAL_INVOICES];
  persistInvoices(invoicesStore);
}
