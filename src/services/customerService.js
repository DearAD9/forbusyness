/**
 * customerService.js — Forbusyness Web ERP
 *
 * Full customer management data service for steel-material business.
 * Supports:
 * - Persistent store (localStorage + seed data)
 * - Filtering (search, state, balance status: All, Outstanding, Zero, Advance)
 * - Sorting & pagination
 * - Summary statistics (Total Customers, Total Receivables, Overdue Count, Active Count)
 * - CRUD operations (Create, Read, Update)
 * - Customer Ledger (Statement of accounts linked with invoices)
 */

import { getInvoices } from './invoiceService';

const STORAGE_KEY = 'fb_customers_data_v2';

// Purge legacy and temporary data keys
try {
  localStorage.removeItem('fb_customers_data');
  localStorage.removeItem('fb_customers_data_clean');
  localStorage.removeItem('fb_mock_customers_v1');
} catch {}

const INITIAL_CUSTOMERS = [];

function loadStoredCustomers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [...INITIAL_CUSTOMERS];
}

function persistCustomers(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

let customersStore = loadStoredCustomers();

/**
 * Get paginated & filtered list of customers.
 * Accepts options object OR search string for fast dropdown usage.
 */
export async function getCustomers(options = {}) {
  await new Promise(r => setTimeout(r, 40));

  const isString = typeof options === 'string';
  const opts = isString ? { search: options } : (options || {});

  const {
    search = '',
    state = '',
    balanceStatus = 'All',
    page = 1,
    pageSize = 10,
    sortBy = 'name',
    sortOrder = 'asc',
  } = opts;

  let filtered = [...customersStore];

    // 1. Search (Name, Phone, Code, City)
    if (typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q))
      );
    }

  // 2. State filter
  if (state && state !== 'All') {
    filtered = filtered.filter(c => c.state.toLowerCase() === state.toLowerCase());
  }

  // 3. Balance status filter
  if (balanceStatus === 'Outstanding') {
    filtered = filtered.filter(c => c.balance > 0);
  } else if (balanceStatus === 'Zero') {
    filtered = filtered.filter(c => c.balance === 0);
  } else if (balanceStatus === 'Advance') {
    filtered = filtered.filter(c => c.balance < 0);
  }

  // Sorting
  filtered.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (typeof aVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const total = filtered.length;

  // If called without page/pageSize (e.g. for simple select dropdowns or string search)
  if (isString || (!opts.page && !opts.pageSize)) {
    const list = [...filtered];
    list.items = filtered;
    list.total = total;
    list.page = 1;
    list.pageSize = total;
    list.totalPages = 1;
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

/**
 * Get summary KPI stats for customer overview.
 */
export async function getCustomerSummaryStats() {
  await new Promise(r => setTimeout(r, 30));

  const totalCustomers = customersStore.length;
  let totalReceivables = 0;
  let overdueCount = 0;
  let activeCount = 0;

  customersStore.forEach(c => {
    if (c.balance > 0) {
      totalReceivables += c.balance;
      // If balance exceeds 50% credit limit, mark as attention/overdue
      if (c.creditLimit && c.balance > c.creditLimit * 0.5) {
        overdueCount++;
      }
    }
    if (c.status === 'Active') {
      activeCount++;
    }
  });

  return {
    totalCustomers,
    totalReceivables,
    overdueCount,
    activeCount,
  };
}

/**
 * Get customer by numeric ID.
 */
export async function getCustomerById(id) {
  await new Promise(r => setTimeout(r, 30));
  const numericId = Number(id);
  return customersStore.find(c => c.id === numericId) || null;
}

/**
 * Create a new customer.
 * Auto-assigns sequential ID and formatted code: CUST-009, etc.
 */
export async function createCustomer(data) {
  await new Promise(r => setTimeout(r, 100));

  const maxId = customersStore.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0);
  const nextId = maxId + 1;
  const code = `CUST-${String(nextId).padStart(3, '0')}`;

  const openingBalance = parseFloat(data.openingBalance) || 0;
  const creditLimit = parseFloat(data.creditLimit) || 0;
  const creditDays = parseInt(data.creditDays, 10) || 30;

  const newCustomer = {
    id: nextId,
    code,
    name: data.name.trim(),
    contactPerson: data.contactPerson?.trim() || '',
    phone: data.phone.trim(),
    altPhone: data.altPhone?.trim() || '',
    email: data.email?.trim() || '',
    pan: (data.pan || '').toUpperCase().trim(),
    address: data.address?.trim() || '',
    city: data.city?.trim() || '',
    state: data.state?.trim() || 'Maharashtra',
    pincode: data.pincode?.trim() || '',
    shippingAddress: data.shippingAddress?.trim() || data.address?.trim() || '',
    creditLimit,
    creditDays,
    openingBalance,
    balance: openingBalance,
    status: data.status || 'Active',
    bankDetails: {
      bankName: data.bankName || '',
      accountNo: data.accountNo || '',
      ifsc: data.ifsc || '',
    },
    notes: data.notes?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  customersStore = [newCustomer, ...customersStore];
  persistCustomers(customersStore);

  return newCustomer;
}

/**
 * Update existing customer.
 */
export async function updateCustomer(id, data) {
  await new Promise(r => setTimeout(r, 80));
  const numericId = Number(id);
  const index = customersStore.findIndex(c => c.id === numericId);

  if (index === -1) {
    throw new Error(`Customer with ID ${id} not found.`);
  }

  const existing = customersStore[index];
  const updated = {
    ...existing,
    name: data.name ? data.name.trim() : existing.name,
    contactPerson: data.contactPerson !== undefined ? data.contactPerson.trim() : existing.contactPerson,
    phone: data.phone ? data.phone.trim() : existing.phone,
    altPhone: data.altPhone !== undefined ? data.altPhone.trim() : existing.altPhone,
    email: data.email !== undefined ? data.email.trim() : existing.email,
    pan: data.pan !== undefined ? data.pan.toUpperCase().trim() : existing.pan,
    address: data.address !== undefined ? data.address.trim() : existing.address,
    city: data.city !== undefined ? data.city.trim() : existing.city,
    state: data.state !== undefined ? data.state.trim() : existing.state,
    pincode: data.pincode !== undefined ? data.pincode.trim() : existing.pincode,
    shippingAddress: data.shippingAddress !== undefined ? data.shippingAddress.trim() : existing.shippingAddress,
    creditLimit: data.creditLimit !== undefined ? parseFloat(data.creditLimit) || 0 : existing.creditLimit,
    creditDays: data.creditDays !== undefined ? parseInt(data.creditDays, 10) || 30 : existing.creditDays,
    status: data.status || existing.status,
    notes: data.notes !== undefined ? data.notes.trim() : existing.notes,
    bankDetails: {
      ...existing.bankDetails,
      ...(data.bankDetails || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  customersStore[index] = updated;
  persistCustomers(customersStore);
  return updated;
}

/**
 * Get customer statement / ledger history.
 * Aggregates invoices and returns for this customer into a running ledger.
 */
export async function getCustomerLedger(customerId) {
  await new Promise(r => setTimeout(r, 50));
  const customer = await getCustomerById(customerId);
  if (!customer) return { customer: null, transactions: [] };

  const { items: allInvoices } = await getInvoices({ pageSize: 500 });
  const custInvoices = allInvoices.filter(i => i.customer?.id === Number(customerId));

  const transactions = [];

  // Opening Balance transaction
  if (customer.openingBalance > 0) {
    transactions.push({
      id: 'ob',
      date: customer.createdAt ? customer.createdAt.split('T')[0] : '2026-01-01',
      type: 'Opening Balance',
      reference: 'OB-001',
      debit: customer.openingBalance,
      credit: 0,
      balance: customer.openingBalance,
      description: 'Initial account balance recorded',
    });
  }

  // Add sales invoices
  custInvoices.forEach(inv => {
    transactions.push({
      id: `inv-${inv.id}`,
      date: inv.date,
      type: 'Sales Invoice',
      reference: `#${inv.invoiceNo}`,
      debit: inv.grandTotal,
      credit: 0,
      invoiceId: inv.id,
      description: `${inv.items?.length || 0} steel material items`,
    });

    if (inv.received > 0) {
      transactions.push({
        id: `rec-${inv.id}`,
        date: inv.date,
        type: 'Payment Received',
        reference: `REC-#${inv.invoiceNo}`,
        debit: 0,
        credit: inv.received,
        description: `Payment received against Invoice #${inv.invoiceNo}`,
      });
    }
  });

  // Sort chronologically
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Compute running balance
  let running = 0;
  const processed = transactions.map(t => {
    running += (t.debit - t.credit);
    return {
      ...t,
      balance: running,
    };
  });

  return {
    customer,
    transactions: processed,
    currentBalance: running || customer.balance,
  };
}

export const ALL_INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

/**
 * Get list of available Indian States for filters/dropdowns.
 */
export function getIndianStates() {
  return [...ALL_INDIAN_STATES];
}


/**
 * Get aggregated steel material product purchase history for a customer.
 */
export async function getCustomerProductHistory(customerId) {
  const { items: allInvoices } = await getInvoices({ pageSize: 500 });
  const custInvoices = allInvoices.filter(i => i.customer?.id === Number(customerId));

  const productMap = {};

  custInvoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const pName = item.productName || item.product?.name || 'Steel Material';
      const key = pName.toLowerCase();
      if (!productMap[key]) {
        productMap[key] = {
          name: pName,
          code: item.productCode || item.product?.code || 'STL',
          unit: item.unit || 'MT',
          totalQty: 0,
          totalAmount: 0,
          ordersCount: 0,
          lastBoughtDate: inv.date,
        };
      }
      productMap[key].totalQty += parseFloat(item.quantity || 0);
      productMap[key].totalAmount += parseFloat(item.total || 0);
      productMap[key].ordersCount += 1;
      if (new Date(inv.date) > new Date(productMap[key].lastBoughtDate)) {
        productMap[key].lastBoughtDate = inv.date;
      }
    });
  });

  return Object.values(productMap).sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Export customer accounts to CSV download.
 */
export function exportCustomersToCSV(customersList) {
  if (!customersList || customersList.length === 0) return;

  const headers = ['Code', 'Company Name', 'Contact Person', 'Phone', 'Email', 'City', 'State', 'Credit Limit (INR)', 'Balance (INR)', 'Status'];
  const rows = customersList.map(c => [
    `"${c.code}"`,
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.contactPerson || '').replace(/"/g, '""')}"`,
    `"${c.phone || ''}"`,
    `"${c.email || ''}"`,
    `"${c.city || ''}"`,
    `"${c.state || ''}"`,
    c.creditLimit || 0,
    c.balance || 0,
    `"${c.status || 'Active'}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `forbusyness_customers_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
