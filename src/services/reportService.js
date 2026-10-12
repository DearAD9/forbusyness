/**
 * reportService.js — Forbusyness Web ERP
 *
 * Core Business Intelligence & Comprehensive Financial Reporting Engine.
 * Aggregates live data across Sales, Purchases, Products, Customers, Suppliers,
 * Returns, and Double-entry Ledger accounts.
 *
 * Terminology:
 * Uses standard, simple business words (Sales, Purchases, Stock, Product, Customer, Supplier, Profit).
 * 100% domain-neutral (suitable for any trade, wholesale, distribution, manufacturing, or retail business).
 */

import { getInvoices } from './invoiceService';
import { getPurchases } from './purchaseService';
import { getProducts } from './productService';
import { getCustomers } from './customerService';
import { getSuppliers } from './supplierService';
import { getAccounts, getVouchers } from './accountService';

// Storage keys for direct synchronous read when needed
const STORAGE_INVOICES = 'fb_invoices_data_v2';
const STORAGE_PURCHASES = 'fb_purchases_data_v2';
const STORAGE_PRODUCTS = 'fb_products_data_v2';
const STORAGE_CUSTOMERS = 'fb_customers_data_v2';
const STORAGE_SUPPLIERS = 'fb_suppliers_data_v2';
const STORAGE_RETURNS = 'fb_returns_data_v2';

function readStorageArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

/**
 * Helper to calculate date boundaries from preset or custom range.
 */
export function getDateRangeBounds(preset = 'all', customFrom = '', customTo = '') {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === 'today') {
    const todayStr = fmt(now);
    return { from: todayStr, to: todayStr };
  }

  if (preset === 'week') {
    const day = now.getDay();
    const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(now.setDate(diffToMon));
    return { from: fmt(mon), to: fmt(new Date()) };
  }

  if (preset === 'month') {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { from: fmt(start), to: fmt(end) };
  }

  if (preset === 'quarter') {
    const qMonth = Math.floor(month / 3) * 3;
    const start = new Date(year, qMonth, 1);
    const end = new Date(year, qMonth + 3, 0);
    return { from: fmt(start), to: fmt(end) };
  }

  if (preset === 'fy') {
    // Indian FY: Apr 1 - Mar 31
    const fyStartYear = month >= 3 ? year : year - 1;
    const start = new Date(fyStartYear, 3, 1);
    const end = new Date(fyStartYear + 1, 2, 31);
    return { from: fmt(start), to: fmt(end) };
  }

  if (preset === 'custom') {
    return { from: customFrom || '', to: customTo || '' };
  }

  // 'all' or default
  return { from: '', to: '' };
}

function isWithinRange(dateStr, from, to) {
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

/**
 * Load all base ERP datasets concurrently.
 */
async function loadBaseDatasets() {
  const [invoicesRes, purchasesRes, productsRes, customersRes, suppliersRes, accounts, vouchers] = await Promise.all([
    getInvoices({ pageSize: 1000 }).catch(() => ({ items: readStorageArray(STORAGE_INVOICES) })),
    getPurchases({ pageSize: 1000 }).catch(() => ({ items: readStorageArray(STORAGE_PURCHASES) })),
    getProducts({ pageSize: 1000 }).catch(() => ({ items: readStorageArray(STORAGE_PRODUCTS) })),
    getCustomers({ pageSize: 1000 }).catch(() => ({ items: readStorageArray(STORAGE_CUSTOMERS) })),
    getSuppliers({ pageSize: 1000 }).catch(() => ({ items: readStorageArray(STORAGE_SUPPLIERS) })),
    getAccounts().catch(() => []),
    getVouchers().catch(() => []),
  ]);

  const returns = readStorageArray(STORAGE_RETURNS);

  return {
    invoices: invoicesRes.items || [],
    purchases: purchasesRes.items || [],
    products: productsRes.items || [],
    customers: customersRes.items || [],
    suppliers: suppliersRes.items || [],
    returns: returns || [],
    accounts: accounts || [],
    vouchers: vouchers || [],
  };
}

// ============================================================================
// 1. EXECUTIVE OVERVIEW REPORT
// ============================================================================
export async function getExecutiveOverview({ preset = 'all', dateFrom = '', dateTo = '' } = {}) {
  const { from, to } = getDateRangeBounds(preset, dateFrom, dateTo);
  const data = await loadBaseDatasets();

  const filteredInvoices = data.invoices.filter(inv => !from || isWithinRange(inv.date, from, to));
  const filteredPurchases = data.purchases.filter(p => !from || isWithinRange(p.date || p.billDate, from, to));
  const filteredReturns = data.returns.filter(r => !from || isWithinRange(r.date, from, to));

  // 1. Sales Totals
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal ?? inv.total) || 0), 0);
  const totalSalesCount = filteredInvoices.length;
  const totalSalesReturns = filteredReturns.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  const netSales = Math.max(0, totalSales - totalSalesReturns);

  // 2. Purchase Totals
  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (Number(p.grandTotal ?? p.total) || 0), 0);
  const totalPurchasesCount = filteredPurchases.length;

  // 3. Stock Valuation
  const totalStockValue = data.products.reduce((sum, p) => {
    const qty = Number(p.currentStock) || 0;
    const rate = Number(p.purchaseRate) || Number(p.sellingRate) || 0;
    return sum + (qty * rate);
  }, 0);
  const totalStockItems = data.products.reduce((sum, p) => sum + (Number(p.currentStock) || 0), 0);

  // 4. Receivables (Customer Outstanding) & Payables (Supplier Outstanding)
  const customerOutstanding = data.invoices.reduce((sum, inv) => sum + (Number(inv.pending) || 0), 0);
  const supplierOutstanding = data.purchases.reduce((sum, p) => sum + (Number(p.pending) || 0), 0);

  // 5. Cost of Goods Sold (COGS) & Profit Calculations
  // Calculate item-level sales cost when available, or fallback to Purchases
  let calculatedSalesCost = 0;
  filteredInvoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const qty = Number(item.quantity || item.qty) || 0;
      const product = data.products.find(p => p.id === item.productId || p.code === item.productCode);
      const costRate = Number(item.purchaseRate) || Number(product?.purchaseRate) || 0;
      calculatedSalesCost += qty * costRate;
    });
  });

  const cogs = calculatedSalesCost > 0 ? calculatedSalesCost : totalPurchases;
  const grossProfit = Math.max(0, netSales - cogs);
  const grossProfitPct = netSales > 0 ? Math.round((grossProfit / netSales) * 100) : 0;

  // Operating Expenses from accounts & vouchers
  const operatingExpenses = data.accounts
    .filter(a => a.category === 'Expenses' && a.type === 'Operating')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const netProfit = grossProfit - operatingExpenses;
  const netProfitPct = netSales > 0 ? Math.round((netProfit / netSales) * 100) : 0;

  // 6. Trend data (Month / Period breakdown)
  const monthlyMap = {};
  filteredInvoices.forEach(inv => {
    const m = (inv.date || '').slice(0, 7) || 'Current';
    if (!monthlyMap[m]) monthlyMap[m] = { period: m, sales: 0, purchases: 0 };
    monthlyMap[m].sales += Number(inv.grandTotal ?? inv.total) || 0;
  });
  filteredPurchases.forEach(p => {
    const m = (p.date || p.billDate || '').slice(0, 7) || 'Current';
    if (!monthlyMap[m]) monthlyMap[m] = { period: m, sales: 0, purchases: 0 };
    monthlyMap[m].purchases += Number(p.grandTotal ?? p.total) || 0;
  });

  const trendData = Object.values(monthlyMap).map(item => ({
    ...item,
    sales: Math.round(item.sales),
    purchases: Math.round(item.purchases),
    profit: Math.round(Math.max(0, item.sales - item.purchases)),
  }));

  // 7. Top Selling Products
  const productSalesMap = {};
  filteredInvoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const name = item.productName || item.name || 'Product';
      const qty = Number(item.quantity || item.qty) || 0;
      const amt = Number(item.total || item.amount) || (qty * (Number(item.rate) || 0));
      if (!productSalesMap[name]) {
        productSalesMap[name] = { name, quantity: 0, amount: 0 };
      }
      productSalesMap[name].quantity += qty;
      productSalesMap[name].amount += amt;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // 8. Top Customers
  const customerSalesMap = {};
  filteredInvoices.forEach(inv => {
    const name = inv.customer?.name || 'Customer';
    const amt = Number(inv.grandTotal ?? inv.total) || 0;
    const pending = Number(inv.pending) || 0;
    if (!customerSalesMap[name]) {
      customerSalesMap[name] = { name, invoiceCount: 0, totalSales: 0, pending: 0 };
    }
    customerSalesMap[name].invoiceCount += 1;
    customerSalesMap[name].totalSales += amt;
    customerSalesMap[name].pending += pending;
  });

  const topCustomers = Object.values(customerSalesMap)
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);

  return {
    period: { from, to, preset },
    kpi: {
      totalSales,
      totalSalesCount,
      netSales,
      totalSalesReturns,
      totalPurchases,
      totalPurchasesCount,
      grossProfit,
      grossProfitPct,
      operatingExpenses,
      netProfit,
      netProfitPct,
      totalStockValue,
      totalStockItems,
      customerOutstanding,
      supplierOutstanding,
    },
    trendData,
    topProducts,
    topCustomers,
  };
}

// ============================================================================
// 2. SALES REPORTS
// ============================================================================
export async function getSalesReportData({
  subType = 'register',
  preset = 'all',
  dateFrom = '',
  dateTo = '',
  search = '',
  customerId = '',
} = {}) {
  const { from, to } = getDateRangeBounds(preset, dateFrom, dateTo);
  const data = await loadBaseDatasets();

  let filteredInvoices = data.invoices.filter(inv => !from || isWithinRange(inv.date, from, to));

  if (customerId) {
    filteredInvoices = filteredInvoices.filter(inv => String(inv.customer?.id) === String(customerId));
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filteredInvoices = filteredInvoices.filter(inv =>
      (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(q)) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(q)) ||
      (inv.customer?.phone && inv.customer.phone.includes(q))
    );
  }

  // Summary Totals
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal ?? inv.total) || 0), 0);
  const totalReceived = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.received) || 0), 0);
  const totalDue = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.pending) || 0), 0);
  const count = filteredInvoices.length;

  if (subType === 'register') {
    const rows = filteredInvoices.map(inv => ({
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      date: inv.date,
      customerName: inv.customer?.name || 'Walk-in Customer',
      customerPhone: inv.customer?.phone || '—',
      itemsCount: inv.items?.length || 0,
      subtotal: Number(inv.subtotal) || 0,
      taxAmount: Number(inv.taxAmount ?? inv.gstTotal) || 0,
      total: Number(inv.grandTotal ?? inv.total) || 0,
      received: Number(inv.received) || 0,
      pending: Number(inv.pending) || 0,
      status: inv.status || (inv.pending <= 0 ? 'Paid' : inv.received > 0 ? 'Partial' : 'Unpaid'),
    }));
    return { summary: { totalSales, totalReceived, totalDue, count }, rows };
  }

  if (subType === 'customer') {
    const customerMap = {};
    filteredInvoices.forEach(inv => {
      const cId = inv.customer?.id || inv.customer?.name || 'unknown';
      const name = inv.customer?.name || 'Walk-in Customer';
      const phone = inv.customer?.phone || '—';
      const amt = Number(inv.grandTotal ?? inv.total) || 0;
      const rec = Number(inv.received) || 0;
      const pend = Number(inv.pending) || 0;

      if (!customerMap[cId]) {
        customerMap[cId] = {
          customerId: cId,
          customerName: name,
          phone,
          invoicesCount: 0,
          totalSales: 0,
          totalReceived: 0,
          outstandingBalance: 0,
        };
      }
      customerMap[cId].invoicesCount += 1;
      customerMap[cId].totalSales += amt;
      customerMap[cId].totalReceived += rec;
      customerMap[cId].outstandingBalance += pend;
    });

    const rows = Object.values(customerMap).sort((a, b) => b.totalSales - a.totalSales);
    return { summary: { totalSales, totalReceived, totalDue, count: rows.length }, rows };
  }

  if (subType === 'product') {
    const productMap = {};
    filteredInvoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const pId = item.productId || item.productCode || item.productName || item.name;
        const name = item.productName || item.name || 'Product';
        const code = item.productCode || item.code || '—';
        const unit = item.unit || 'Units';
        const qty = Number(item.quantity || item.qty) || 0;
        const amt = Number(item.total || item.amount) || (qty * (Number(item.rate) || 0));

        if (!productMap[pId]) {
          productMap[pId] = {
            productId: pId,
            productName: name,
            productCode: code,
            unit,
            totalQuantity: 0,
            totalAmount: 0,
            invoicesCount: 0,
          };
        }
        productMap[pId].totalQuantity += qty;
        productMap[pId].totalAmount += amt;
        productMap[pId].invoicesCount += 1;
      });
    });

    const rows = Object.values(productMap).map(row => ({
      ...row,
      averageRate: row.totalQuantity > 0 ? Math.round(row.totalAmount / row.totalQuantity) : 0,
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    return { summary: { totalSales, totalReceived, totalDue, count: rows.length }, rows };
  }

  if (subType === 'returns') {
    const filteredReturns = data.returns.filter(r => !from || isWithinRange(r.date, from, to));
    const rows = filteredReturns.map(r => ({
      id: r.id,
      returnNo: r.returnNo || `#${r.id}`,
      date: r.date,
      originalInvoiceNo: r.originalInvoiceNo || '—',
      customerName: r.customer?.name || r.customerName || 'Customer',
      itemsCount: r.items?.length || 0,
      totalAmount: Number(r.totalAmount) || 0,
      reason: r.reason || 'Sales Return',
    }));
    const totalReturnsAmt = rows.reduce((s, r) => s + r.totalAmount, 0);
    return { summary: { totalSales, totalReturns: totalReturnsAmt, count: rows.length }, rows };
  }

  return { summary: {}, rows: [] };
}

// ============================================================================
// 3. PURCHASE REPORTS
// ============================================================================
export async function getPurchaseReportData({
  subType = 'register',
  preset = 'all',
  dateFrom = '',
  dateTo = '',
  search = '',
  supplierId = '',
} = {}) {
  const { from, to } = getDateRangeBounds(preset, dateFrom, dateTo);
  const data = await loadBaseDatasets();

  let filteredPurchases = data.purchases.filter(p => !from || isWithinRange(p.date || p.billDate, from, to));

  if (supplierId) {
    filteredPurchases = filteredPurchases.filter(p => String(p.supplier?.id) === String(supplierId));
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filteredPurchases = filteredPurchases.filter(p =>
      (p.billNo && p.billNo.toLowerCase().includes(q)) ||
      (p.supplier?.name && p.supplier.name.toLowerCase().includes(q)) ||
      (p.supplierBillNo && p.supplierBillNo.toLowerCase().includes(q)) ||
      (p.vehicleNo && p.vehicleNo.toLowerCase().includes(q))
    );
  }

  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (Number(p.grandTotal ?? p.total) || 0), 0);
  const totalPaid = filteredPurchases.reduce((sum, p) => sum + (Number(p.paidAmount ?? p.paid) || 0), 0);
  const totalBalance = filteredPurchases.reduce((sum, p) => sum + (Number(p.pending) || 0), 0);
  const count = filteredPurchases.length;

  if (subType === 'register') {
    const rows = filteredPurchases.map(p => ({
      id: p.id,
      billNo: p.billNo,
      date: p.date || p.billDate,
      supplierName: p.supplier?.name || 'General Supplier',
      supplierBillNo: p.supplierBillNo || '—',
      vehicleNo: p.vehicleNo || '—',
      itemsCount: p.items?.length || 0,
      subtotal: Number(p.subtotal) || 0,
      taxAmount: Number(p.taxAmount ?? p.gstTotal) || 0,
      total: Number(p.grandTotal ?? p.total) || 0,
      paid: Number(p.paidAmount ?? p.paid) || 0,
      pending: Number(p.pending) || 0,
      status: p.status || (p.pending <= 0 ? 'Paid' : (p.paidAmount > 0 || p.paid > 0) ? 'Partial' : 'Pending'),
    }));
    return { summary: { totalPurchases, totalPaid, totalBalance, count }, rows };
  }

  if (subType === 'supplier') {
    const supplierMap = {};
    filteredPurchases.forEach(p => {
      const sId = p.supplier?.id || p.supplier?.name || 'unknown';
      const name = p.supplier?.name || 'General Supplier';
      const phone = p.supplier?.phone || '—';
      const amt = Number(p.grandTotal ?? p.total) || 0;
      const paid = Number(p.paidAmount ?? p.paid) || 0;
      const pending = Number(p.pending) || 0;

      if (!supplierMap[sId]) {
        supplierMap[sId] = {
          supplierId: sId,
          supplierName: name,
          phone,
          billsCount: 0,
          totalPurchases: 0,
          totalPaid: 0,
          outstandingBalance: 0,
        };
      }
      supplierMap[sId].billsCount += 1;
      supplierMap[sId].totalPurchases += amt;
      supplierMap[sId].totalPaid += paid;
      supplierMap[sId].outstandingBalance += pending;
    });

    const rows = Object.values(supplierMap).sort((a, b) => b.totalPurchases - a.totalPurchases);
    return { summary: { totalPurchases, totalPaid, totalBalance, count: rows.length }, rows };
  }

  if (subType === 'product') {
    const productMap = {};
    filteredPurchases.forEach(p => {
      (p.items || []).forEach(item => {
        const pId = item.productId || item.productCode || item.productName || item.name;
        const name = item.productName || item.name || 'Product';
        const code = item.productCode || item.code || '—';
        const unit = item.unit || 'Units';
        const qty = Number(item.quantity || item.qty) || 0;
        const amt = Number(item.total || item.amount) || (qty * (Number(item.rate) || 0));

        if (!productMap[pId]) {
          productMap[pId] = {
            productId: pId,
            productName: name,
            productCode: code,
            unit,
            totalQuantity: 0,
            totalAmount: 0,
            billsCount: 0,
          };
        }
        productMap[pId].totalQuantity += qty;
        productMap[pId].totalAmount += amt;
        productMap[pId].billsCount += 1;
      });
    });

    const rows = Object.values(productMap).map(row => ({
      ...row,
      averageRate: row.totalQuantity > 0 ? Math.round(row.totalAmount / row.totalQuantity) : 0,
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    return { summary: { totalPurchases, totalPaid, totalBalance, count: rows.length }, rows };
  }

  return { summary: {}, rows: [] };
}

// ============================================================================
// 4. LEDGER REPORTS (CUSTOMER, SUPPLIER, CASH/BANK, EXPENSE)
// ============================================================================
export async function getLedgerReportData({
  subType = 'customerLedger',
  partyId = '',
  preset = 'all',
  dateFrom = '',
  dateTo = '',
  search = '',
} = {}) {
  const { from, to } = getDateRangeBounds(preset, dateFrom, dateTo);
  const data = await loadBaseDatasets();

  // 1. Customer Ledger
  if (subType === 'customerLedger') {
    const customer = data.customers.find(c => String(c.id) === String(partyId)) || data.customers[0];
    const customerInvoices = data.invoices.filter(inv =>
      (!customer || inv.customer?.id === customer.id || inv.customer?.name === customer?.name)
    );
    const customerReturns = data.returns.filter(r =>
      (!customer || r.customer?.id === customer.id || r.customerName === customer?.name)
    );

    // Build timeline entries
    const entries = [];
    customerInvoices.forEach(inv => {
      const invTotal = Number(inv.grandTotal ?? inv.total) || 0;
      const invReceived = Number(inv.received) || 0;
      // Debit entry: Invoice billed to customer
      entries.push({
        date: inv.date,
        type: 'Invoice',
        refNo: inv.invoiceNo,
        description: `Sales Invoice #${inv.invoiceNo}`,
        debit: invTotal,
        credit: 0,
      });
      // Credit entry: Payment received on invoice
      if (invReceived > 0) {
        entries.push({
          date: inv.date,
          type: 'Receipt',
          refNo: `REC-${inv.invoiceNo}`,
          description: `Payment received (${inv.paymentMode || 'Cash/Bank'})`,
          debit: 0,
          credit: invReceived,
        });
      }
    });

    customerReturns.forEach(ret => {
      const retAmount = Number(ret.totalAmount) || 0;
      entries.push({
        date: ret.date,
        type: 'Credit Note',
        refNo: ret.returnNo || `#${ret.id}`,
        description: `Sales Return against #${ret.originalInvoiceNo || 'Invoice'}`,
        debit: 0,
        credit: retAmount,
      });
    });

    // Sort chronologically
    entries.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Filter by date range
    let runningBalance = Number(customer?.openingBalance) || 0;
    const initialOpening = runningBalance;
    const ledgerRows = [];

    entries.forEach(entry => {
      const isBefore = from && entry.date < from;
      const isIn = (!from || entry.date >= from) && (!to || entry.date <= to);

      if (isBefore) {
        runningBalance += (entry.debit - entry.credit);
      } else if (isIn) {
        runningBalance += (entry.debit - entry.credit);
        ledgerRows.push({
          ...entry,
          balance: runningBalance,
          balanceType: runningBalance >= 0 ? 'Dr' : 'Cr',
        });
      }
    });

    const totalDebits = ledgerRows.reduce((s, r) => s + r.debit, 0);
    const totalCredits = ledgerRows.reduce((s, r) => s + r.credit, 0);

    return {
      party: customer || { name: 'All Customers', phone: '—' },
      openingBalance: from ? runningBalance - (totalDebits - totalCredits) : initialOpening,
      closingBalance: runningBalance,
      totalDebits,
      totalCredits,
      rows: ledgerRows,
      partiesList: data.customers.map(c => ({ id: c.id, name: c.name })),
    };
  }

  // 2. Supplier Ledger
  if (subType === 'supplierLedger') {
    const supplier = data.suppliers.find(s => String(s.id) === String(partyId)) || data.suppliers[0];
    const supplierPurchases = data.purchases.filter(p =>
      (!supplier || p.supplier?.id === supplier.id || p.supplier?.name === supplier?.name)
    );

    const entries = [];
    supplierPurchases.forEach(p => {
      const billTotal = Number(p.grandTotal ?? p.total) || 0;
      const billPaid = Number(p.paidAmount ?? p.paid) || 0;
      // Credit entry: Purchase bill credited to supplier
      entries.push({
        date: p.date || p.billDate,
        type: 'Purchase Bill',
        refNo: p.billNo,
        description: `Purchase Bill #${p.billNo} ${p.supplierBillNo ? `(Ref: ${p.supplierBillNo})` : ''}`,
        debit: 0,
        credit: billTotal,
      });
      // Debit entry: Payment disbursed to supplier
      if (billPaid > 0) {
        entries.push({
          date: p.date || p.billDate,
          type: 'Payment',
          refNo: `PAY-${p.billNo}`,
          description: `Payment disbursed to supplier`,
          debit: billPaid,
          credit: 0,
        });
      }
    });

    entries.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    let runningBalance = Number(supplier?.openingBalance) || 0;
    const initialOpening = runningBalance;
    const ledgerRows = [];

    entries.forEach(entry => {
      const isBefore = from && entry.date < from;
      const isIn = (!from || entry.date >= from) && (!to || entry.date <= to);

      if (isBefore) {
        runningBalance += (entry.credit - entry.debit);
      } else if (isIn) {
        runningBalance += (entry.credit - entry.debit);
        ledgerRows.push({
          ...entry,
          balance: runningBalance,
          balanceType: runningBalance >= 0 ? 'Cr' : 'Dr',
        });
      }
    });

    const totalDebits = ledgerRows.reduce((s, r) => s + r.debit, 0);
    const totalCredits = ledgerRows.reduce((s, r) => s + r.credit, 0);

    return {
      party: supplier || { name: 'All Suppliers', phone: '—' },
      openingBalance: from ? runningBalance - (totalCredits - totalDebits) : initialOpening,
      closingBalance: runningBalance,
      totalDebits,
      totalCredits,
      rows: ledgerRows,
      partiesList: data.suppliers.map(s => ({ id: s.id, name: s.name })),
    };
  }

  // 3. Cash & Bank Ledger
  if (subType === 'cashBankLedger') {
    const bankAccounts = data.accounts.filter(a => a.type === 'Bank' || a.type === 'Cash');
    const selectedAccount = bankAccounts.find(a => String(a.id) === String(partyId)) || bankAccounts[0];

    const entries = [];
    // Receipts from Invoices
    data.invoices.forEach(inv => {
      const rec = Number(inv.received) || 0;
      if (rec > 0) {
        entries.push({
          date: inv.date,
          type: 'Receipt',
          refNo: inv.invoiceNo,
          description: `Customer collection (${inv.customer?.name || 'Customer'})`,
          debit: rec,
          credit: 0,
        });
      }
    });
    // Payments for Purchases
    data.purchases.forEach(p => {
      const paid = Number(p.paidAmount ?? p.paid) || 0;
      if (paid > 0) {
        entries.push({
          date: p.date || p.billDate,
          type: 'Payment',
          refNo: p.billNo,
          description: `Supplier payment (${p.supplier?.name || 'Supplier'})`,
          debit: 0,
          credit: paid,
        });
      }
    });

    entries.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    let balance = Number(selectedAccount?.balance) || 0;
    const ledgerRows = [];

    entries.forEach(entry => {
      const isIn = (!from || entry.date >= from) && (!to || entry.date <= to);
      if (isIn) {
        balance += (entry.debit - entry.credit);
        ledgerRows.push({
          ...entry,
          balance,
          balanceType: balance >= 0 ? 'Dr' : 'Cr',
        });
      }
    });

    return {
      party: selectedAccount || { name: 'Primary Bank & Cash Account' },
      openingBalance: 0,
      closingBalance: balance,
      totalDebits: ledgerRows.reduce((s, r) => s + r.debit, 0),
      totalCredits: ledgerRows.reduce((s, r) => s + r.credit, 0),
      rows: ledgerRows,
      partiesList: bankAccounts.map(b => ({ id: b.id, name: b.name })),
    };
  }

  // 4. Expense Ledger
  if (subType === 'expenseLedger') {
    const expenseAccounts = data.accounts.filter(a => a.category === 'Expenses');
    const rows = expenseAccounts.map(acc => ({
      id: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      description: acc.desc,
      balance: Number(acc.balance) || 0,
    }));
    const totalExpenses = rows.reduce((s, r) => s + r.balance, 0);

    return {
      party: { name: 'Expense Accounts Summary' },
      totalExpenses,
      rows,
      partiesList: expenseAccounts.map(e => ({ id: e.id, name: e.name })),
    };
  }

  return { rows: [] };
}

// ============================================================================
// 5. FINANCIAL REPORTS (P&L, TRIAL BALANCE, BALANCE SHEET)
// ============================================================================
export async function getFinancialReportData({
  subType = 'pl',
  preset = 'all',
  dateFrom = '',
  dateTo = '',
} = {}) {
  const { from, to } = getDateRangeBounds(preset, dateFrom, dateTo);
  const data = await loadBaseDatasets();

  const filteredInvoices = data.invoices.filter(inv => !from || isWithinRange(inv.date, from, to));
  const filteredPurchases = data.purchases.filter(p => !from || isWithinRange(p.date || p.billDate, from, to));
  const filteredReturns = data.returns.filter(r => !from || isWithinRange(r.date, from, to));

  if (subType === 'pl') {
    const grossSales = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal ?? inv.total) || 0), 0);
    const salesReturns = filteredReturns.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
    const netSales = Math.max(0, grossSales - salesReturns);

    const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (Number(p.grandTotal ?? p.total) || 0), 0);

    // Stock valuations for opening & closing
    const totalCurrentStockValue = data.products.reduce((sum, p) => {
      const qty = Number(p.currentStock) || 0;
      const rate = Number(p.purchaseRate) || Number(p.sellingRate) || 0;
      return sum + (qty * rate);
    }, 0);

    // COGS = Opening Stock (estimated) + Purchases - Closing Stock
    // If opening stock is not tracked separately, COGS is determined by item costs or net purchases
    const cogs = totalPurchases;
    const grossProfit = Math.max(0, netSales - cogs);
    const grossProfitPct = netSales > 0 ? Math.round((grossProfit / netSales) * 100) : 0;

    // Operating expenses breakdown
    const expenseBreakdown = data.accounts
      .filter(a => a.category === 'Expenses' && a.type === 'Operating')
      .map(a => ({
        name: a.name,
        amount: Number(a.balance) || 0,
      }));

    const totalOperatingExpenses = expenseBreakdown.reduce((s, e) => s + e.amount, 0);
    const netProfit = grossProfit - totalOperatingExpenses;
    const netProfitPct = netSales > 0 ? Math.round((netProfit / netSales) * 100) : 0;

    return {
      revenue: {
        grossSales,
        salesReturns,
        netSales,
      },
      cogs: {
        openingStock: 0,
        purchases: totalPurchases,
        closingStock: totalCurrentStockValue,
        totalCogs: cogs,
      },
      grossProfit,
      grossProfitPct,
      expenses: {
        items: expenseBreakdown,
        totalExpenses: totalOperatingExpenses,
      },
      netProfit,
      netProfitPct,
    };
  }

  if (subType === 'trialBalance') {
    // Generate Trial balance from accounts
    const rows = data.accounts.map(acc => {
      const bal = Number(acc.balance) || 0;
      const isDebitNature = acc.category === 'Assets' || acc.category === 'Expenses';
      return {
        code: acc.code,
        name: acc.name,
        category: acc.category,
        debit: isDebitNature ? bal : 0,
        credit: !isDebitNature ? bal : 0,
      };
    });

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    return {
      totalDebit,
      totalCredit,
      isBalanced: totalDebit === totalCredit,
      difference: Math.abs(totalDebit - totalCredit),
      rows,
    };
  }

  if (subType === 'balanceSheet') {
    const totalStockValue = data.products.reduce((sum, p) => {
      return sum + ((Number(p.currentStock) || 0) * (Number(p.purchaseRate) || Number(p.sellingRate) || 0));
    }, 0);

    const customerOutstanding = data.invoices.reduce((sum, inv) => sum + (Number(inv.pending) || 0), 0);
    const supplierOutstanding = data.purchases.reduce((sum, p) => sum + (Number(p.pending) || 0), 0);

    const bankBalance = data.accounts
      .filter(a => a.type === 'Bank' || a.type === 'Cash')
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    const totalAssets = bankBalance + customerOutstanding + totalStockValue;
    const totalLiabilities = supplierOutstanding;
    const netWorth = totalAssets - totalLiabilities;

    return {
      assets: {
        cashAndBank: bankBalance,
        accountsReceivable: customerOutstanding,
        stockValuation: totalStockValue,
        totalAssets,
      },
      liabilities: {
        accountsPayable: supplierOutstanding,
        loans: 0,
        totalLiabilities,
      },
      equity: {
        retainedEarnings: netWorth,
        totalEquity: netWorth,
      },
    };
  }

  return {};
}

// ============================================================================
// 6. OUTSTANDING & AGING REPORTS (RECEIVABLES & PAYABLES)
// ============================================================================
export async function getOutstandingReportData({
  subType = 'customerOutstanding',
  search = '',
} = {}) {
  const data = await loadBaseDatasets();
  const today = new Date();

  function getDaysOld(dateStr) {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    const diffTime = Math.abs(today - d);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  if (subType === 'customerOutstanding') {
    const customerMap = {};

    data.invoices.forEach(inv => {
      const pending = Number(inv.pending) || 0;
      if (pending > 0) {
        const cId = inv.customer?.id || inv.customer?.name || 'unknown';
        const name = inv.customer?.name || 'Customer';
        const phone = inv.customer?.phone || '—';
        const days = getDaysOld(inv.date);

        if (!customerMap[cId]) {
          customerMap[cId] = {
            id: cId,
            name,
            phone,
            totalPending: 0,
            bracketCurrent: 0,   // 0-30 days
            bracket30To60: 0,    // 31-60 days
            bracket60To90: 0,    // 61-90 days
            bracketAbove90: 0,   // 90+ days
            invoicesCount: 0,
          };
        }

        customerMap[cId].totalPending += pending;
        customerMap[cId].invoicesCount += 1;

        if (days <= 30) {
          customerMap[cId].bracketCurrent += pending;
        } else if (days <= 60) {
          customerMap[cId].bracket30To60 += pending;
        } else if (days <= 90) {
          customerMap[cId].bracket60To90 += pending;
        } else {
          customerMap[cId].bracketAbove90 += pending;
        }
      }
    });

    let rows = Object.values(customerMap);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.phone.includes(q));
    }
    rows.sort((a, b) => b.totalPending - a.totalPending);

    const totalOutstanding = rows.reduce((s, r) => s + r.totalPending, 0);
    const totalCurrent = rows.reduce((s, r) => s + r.bracketCurrent, 0);
    const total30To60 = rows.reduce((s, r) => s + r.bracket30To60, 0);
    const total60To90 = rows.reduce((s, r) => s + r.bracket60To90, 0);
    const totalAbove90 = rows.reduce((s, r) => s + r.bracketAbove90, 0);

    return {
      summary: {
        totalOutstanding,
        totalCurrent,
        total30To60,
        total60To90,
        totalAbove90,
        partyCount: rows.length,
      },
      rows,
    };
  }

  if (subType === 'supplierOutstanding') {
    const supplierMap = {};

    data.purchases.forEach(p => {
      const pending = Number(p.pending) || 0;
      if (pending > 0) {
        const sId = p.supplier?.id || p.supplier?.name || 'unknown';
        const name = p.supplier?.name || 'Supplier';
        const phone = p.supplier?.phone || '—';
        const days = getDaysOld(p.date || p.billDate);

        if (!supplierMap[sId]) {
          supplierMap[sId] = {
            id: sId,
            name,
            phone,
            totalPending: 0,
            bracketCurrent: 0,
            bracket30To60: 0,
            bracket60To90: 0,
            bracketAbove90: 0,
            billsCount: 0,
          };
        }

        supplierMap[sId].totalPending += pending;
        supplierMap[sId].billsCount += 1;

        if (days <= 30) {
          supplierMap[sId].bracketCurrent += pending;
        } else if (days <= 60) {
          supplierMap[sId].bracket30To60 += pending;
        } else if (days <= 90) {
          supplierMap[sId].bracket60To90 += pending;
        } else {
          supplierMap[sId].bracketAbove90 += pending;
        }
      }
    });

    let rows = Object.values(supplierMap);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.phone.includes(q));
    }
    rows.sort((a, b) => b.totalPending - a.totalPending);

    const totalOutstanding = rows.reduce((s, r) => s + r.totalPending, 0);
    const totalCurrent = rows.reduce((s, r) => s + r.bracketCurrent, 0);
    const total30To60 = rows.reduce((s, r) => s + r.bracket30To60, 0);
    const total60To90 = rows.reduce((s, r) => s + r.bracket60To90, 0);
    const totalAbove90 = rows.reduce((s, r) => s + r.bracketAbove90, 0);

    return {
      summary: {
        totalOutstanding,
        totalCurrent,
        total30To60,
        total60To90,
        totalAbove90,
        partyCount: rows.length,
      },
      rows,
    };
  }

  return { summary: {}, rows: [] };
}

// ============================================================================
// 7. INVENTORY / STOCK REPORTS
// ============================================================================
export async function getInventoryReportData({
  subType = 'stockSummary',
  search = '',
  category = '',
} = {}) {
  const data = await loadBaseDatasets();

  let products = [...data.products];

  if (category && category !== 'All') {
    products = products.filter(p => p.category === category);
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    products = products.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.hsn && p.hsn.includes(q))
    );
  }

  const totalStockValue = products.reduce((sum, p) => {
    return sum + ((Number(p.currentStock) || 0) * (Number(p.purchaseRate) || Number(p.sellingRate) || 0));
  }, 0);
  const totalStockUnits = products.reduce((sum, p) => sum + (Number(p.currentStock) || 0), 0);
  const lowStockCount = products.filter(p => (Number(p.currentStock) || 0) <= (Number(p.minStock) || 0)).length;
  const outOfStockCount = products.filter(p => (Number(p.currentStock) || 0) <= 0).length;

  if (subType === 'stockSummary') {
    const rows = products.map(p => {
      const stock = Number(p.currentStock) || 0;
      const pRate = Number(p.purchaseRate) || 0;
      const sRate = Number(p.sellingRate) || 0;
      const val = stock * (pRate || sRate);
      const isLow = stock <= (Number(p.minStock) || 0);

      return {
        id: p.id,
        code: p.code || '—',
        name: p.name,
        category: p.category || 'General',
        unit: p.unit || 'Units',
        currentStock: stock,
        minStock: Number(p.minStock) || 0,
        purchaseRate: pRate,
        sellingRate: sRate,
        stockValue: val,
        status: stock <= 0 ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock',
      };
    });

    return {
      summary: { totalStockValue, totalStockUnits, lowStockCount, outOfStockCount, productCount: products.length },
      rows,
    };
  }

  if (subType === 'lowStock') {
    const lowStockItems = products
      .filter(p => (Number(p.currentStock) || 0) <= (Number(p.minStock) || 0))
      .map(p => ({
        id: p.id,
        code: p.code || '—',
        name: p.name,
        category: p.category || 'General',
        currentStock: Number(p.currentStock) || 0,
        minStock: Number(p.minStock) || 0,
        deficit: Math.max(0, (Number(p.minStock) || 0) - (Number(p.currentStock) || 0)),
        unit: p.unit || 'Units',
        purchaseRate: Number(p.purchaseRate) || 0,
      }));

    return {
      summary: { lowStockCount: lowStockItems.length },
      rows: lowStockItems,
    };
  }

  if (subType === 'stockMovement') {
    // Collect all inward (purchases) and outward (sales) transactions
    const movements = [];

    data.purchases.forEach(p => {
      (p.items || []).forEach(item => {
        movements.push({
          date: p.date || p.billDate,
          documentNo: p.billNo,
          type: 'Inward (Purchase)',
          productName: item.productName || item.name || 'Product',
          quantity: Number(item.quantity || item.qty) || 0,
          rate: Number(item.rate) || 0,
          partyName: p.supplier?.name || 'Supplier',
        });
      });
    });

    data.invoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        movements.push({
          date: inv.date,
          documentNo: inv.invoiceNo,
          type: 'Outward (Sale)',
          productName: item.productName || item.name || 'Product',
          quantity: -(Number(item.quantity || item.qty) || 0),
          rate: Number(item.rate) || 0,
          partyName: inv.customer?.name || 'Customer',
        });
      });
    });

    movements.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    let filteredMovements = movements;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filteredMovements = filteredMovements.filter(m =>
        m.productName.toLowerCase().includes(q) ||
        m.documentNo.toLowerCase().includes(q) ||
        m.partyName.toLowerCase().includes(q)
      );
    }

    return {
      summary: { totalMovements: filteredMovements.length },
      rows: filteredMovements,
    };
  }

  return { summary: {}, rows: [] };
}

// ============================================================================
// 8. PROFITABILITY REPORTS
// ============================================================================
export async function getProfitabilityReportData({
  subType = 'product',
  preset = 'all',
  dateFrom = '',
  dateTo = '',
  search = '',
} = {}) {
  const { from, to } = getDateRangeBounds(preset, dateFrom, dateTo);
  const data = await loadBaseDatasets();

  const filteredInvoices = data.invoices.filter(inv => !from || isWithinRange(inv.date, from, to));

  if (subType === 'product') {
    const productProfits = {};

    filteredInvoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const pId = item.productId || item.productCode || item.productName || item.name;
        const name = item.productName || item.name || 'Product';
        const qty = Number(item.quantity || item.qty) || 0;
        const sellAmt = Number(item.total || item.amount) || (qty * (Number(item.rate) || 0));

        const product = data.products.find(p => p.id === item.productId || p.code === item.productCode);
        const pRate = Number(item.purchaseRate) || Number(product?.purchaseRate) || 0;
        const costAmt = qty * pRate;

        if (!productProfits[pId]) {
          productProfits[pId] = {
            id: pId,
            productName: name,
            quantitySold: 0,
            revenue: 0,
            cost: 0,
          };
        }

        productProfits[pId].quantitySold += qty;
        productProfits[pId].revenue += sellAmt;
        productProfits[pId].cost += costAmt;
      });
    });

    let rows = Object.values(productProfits).map(p => {
      const profit = Math.max(0, p.revenue - p.cost);
      const marginPct = p.revenue > 0 ? Math.round((profit / p.revenue) * 100) : 0;
      return {
        ...p,
        grossProfit: profit,
        marginPct,
      };
    });

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r => r.productName.toLowerCase().includes(q));
    }

    rows.sort((a, b) => b.grossProfit - a.grossProfit);

    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const totalCost = rows.reduce((s, r) => s + r.cost, 0);
    const totalProfit = rows.reduce((s, r) => s + r.grossProfit, 0);
    const overallMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    return {
      summary: { totalRevenue, totalCost, totalProfit, overallMargin, count: rows.length },
      rows,
    };
  }

  if (subType === 'customer') {
    const customerProfits = {};

    filteredInvoices.forEach(inv => {
      const cId = inv.customer?.id || inv.customer?.name || 'unknown';
      const name = inv.customer?.name || 'Customer';
      const rev = Number(inv.grandTotal ?? inv.total) || 0;

      let invoiceCost = 0;
      (inv.items || []).forEach(item => {
        const qty = Number(item.quantity || item.qty) || 0;
        const product = data.products.find(p => p.id === item.productId || p.code === item.productCode);
        const pRate = Number(item.purchaseRate) || Number(product?.purchaseRate) || 0;
        invoiceCost += qty * pRate;
      });

      if (!customerProfits[cId]) {
        customerProfits[cId] = {
          id: cId,
          customerName: name,
          revenue: 0,
          cost: 0,
          invoicesCount: 0,
        };
      }

      customerProfits[cId].revenue += rev;
      customerProfits[cId].cost += invoiceCost;
      customerProfits[cId].invoicesCount += 1;
    });

    let rows = Object.values(customerProfits).map(c => {
      const profit = Math.max(0, c.revenue - c.cost);
      const marginPct = c.revenue > 0 ? Math.round((profit / c.revenue) * 100) : 0;
      return {
        ...c,
        grossProfit: profit,
        marginPct,
      };
    });

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r => r.customerName.toLowerCase().includes(q));
    }

    rows.sort((a, b) => b.grossProfit - a.grossProfit);

    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const totalCost = rows.reduce((s, r) => s + r.cost, 0);
    const totalProfit = rows.reduce((s, r) => s + r.grossProfit, 0);
    const overallMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    return {
      summary: { totalRevenue, totalCost, totalProfit, overallMargin, count: rows.length },
      rows,
    };
  }

  if (subType === 'invoice') {
    let rows = filteredInvoices.map(inv => {
      const rev = Number(inv.grandTotal ?? inv.total) || 0;
      let cost = 0;
      (inv.items || []).forEach(item => {
        const qty = Number(item.quantity || item.qty) || 0;
        const product = data.products.find(p => p.id === item.productId || p.code === item.productCode);
        const pRate = Number(item.purchaseRate) || Number(product?.purchaseRate) || 0;
        cost += qty * pRate;
      });
      const profit = Math.max(0, rev - cost);
      const marginPct = rev > 0 ? Math.round((profit / rev) * 100) : 0;

      return {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        date: inv.date,
        customerName: inv.customer?.name || 'Customer',
        revenue: rev,
        cost,
        grossProfit: profit,
        marginPct,
      };
    });

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r => r.invoiceNo.toLowerCase().includes(q) || r.customerName.toLowerCase().includes(q));
    }

    rows.sort((a, b) => b.grossProfit - a.grossProfit);

    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const totalCost = rows.reduce((s, r) => s + r.cost, 0);
    const totalProfit = rows.reduce((s, r) => s + r.grossProfit, 0);
    const overallMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    return {
      summary: { totalRevenue, totalCost, totalProfit, overallMargin, count: rows.length },
      rows,
    };
  }

  return { summary: {}, rows: [] };
}

// ============================================================================
// 9. TAX & GST / HSN REPORTS
// ============================================================================
export async function getTaxReportData({
  subType = 'gstr1',
  preset = 'all',
  dateFrom = '',
  dateTo = '',
} = {}) {
  const { from, to } = getDateRangeBounds(preset, dateFrom, dateTo);
  const data = await loadBaseDatasets();

  const filteredInvoices = data.invoices.filter(inv => !from || isWithinRange(inv.date, from, to));
  const filteredPurchases = data.purchases.filter(p => !from || isWithinRange(p.date || p.billDate, from, to));

  if (subType === 'gstr1') {
    // Outward Supplies (Sales)
    const rows = filteredInvoices.map(inv => {
      const taxable = Number(inv.subtotal) || 0;
      const totalTax = Number(inv.taxAmount ?? inv.gstTotal) || 0;
      const grandTotal = Number(inv.grandTotal ?? inv.total) || 0;
      // Default to intra-state split (CGST 50%, SGST 50%) unless IGST indicated
      const isInterState = (inv.customer?.gstin && !inv.customer?.gstin.startsWith('27')); // Example State Code
      const cgst = isInterState ? 0 : Math.round(totalTax / 2);
      const sgst = isInterState ? 0 : Math.round(totalTax / 2);
      const igst = isInterState ? totalTax : 0;

      return {
        invoiceNo: inv.invoiceNo,
        date: inv.date,
        customerName: inv.customer?.name || 'Customer',
        customerGstin: inv.customer?.gstin || 'URP', // Unregistered Person
        taxableValue: taxable,
        cgst,
        sgst,
        igst,
        totalTax,
        grandTotal,
      };
    });

    const totalTaxable = rows.reduce((s, r) => s + r.taxableValue, 0);
    const totalCgst = rows.reduce((s, r) => s + r.cgst, 0);
    const totalSgst = rows.reduce((s, r) => s + r.sgst, 0);
    const totalIgst = rows.reduce((s, r) => s + r.igst, 0);
    const totalTaxAmount = rows.reduce((s, r) => s + r.totalTax, 0);
    const grandTotal = rows.reduce((s, r) => s + r.grandTotal, 0);

    return {
      summary: { totalTaxable, totalCgst, totalSgst, totalIgst, totalTaxAmount, grandTotal, count: rows.length },
      rows,
    };
  }

  if (subType === 'gstr2') {
    // Inward Supplies (Purchases)
    const rows = filteredPurchases.map(p => {
      const taxable = Number(p.subtotal) || 0;
      const totalTax = Number(p.taxAmount ?? p.gstTotal) || 0;
      const grandTotal = Number(p.grandTotal ?? p.total) || 0;
      const isInterState = (p.supplier?.gstin && !p.supplier?.gstin.startsWith('27'));
      const cgst = isInterState ? 0 : Math.round(totalTax / 2);
      const sgst = isInterState ? 0 : Math.round(totalTax / 2);
      const igst = isInterState ? totalTax : 0;

      return {
        billNo: p.billNo,
        supplierBillNo: p.supplierBillNo || '—',
        date: p.date || p.billDate,
        supplierName: p.supplier?.name || 'Supplier',
        supplierGstin: p.supplier?.gstin || 'URP',
        taxableValue: taxable,
        cgst,
        sgst,
        igst,
        totalTax,
        grandTotal,
      };
    });

    const totalTaxable = rows.reduce((s, r) => s + r.taxableValue, 0);
    const totalCgst = rows.reduce((s, r) => s + r.cgst, 0);
    const totalSgst = rows.reduce((s, r) => s + r.sgst, 0);
    const totalIgst = rows.reduce((s, r) => s + r.igst, 0);
    const totalTaxAmount = rows.reduce((s, r) => s + r.totalTax, 0);
    const grandTotal = rows.reduce((s, r) => s + r.grandTotal, 0);

    return {
      summary: { totalTaxable, totalCgst, totalSgst, totalIgst, totalTaxAmount, grandTotal, count: rows.length },
      rows,
    };
  }

  if (subType === 'hsn') {
    const hsnMap = {};

    filteredInvoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const product = data.products.find(p => p.id === item.productId || p.code === item.productCode);
        const hsn = item.hsn || product?.hsn || '9999';
        const desc = item.productName || item.name || product?.name || 'Product';
        const qty = Number(item.quantity || item.qty) || 0;
        const taxable = Number(item.total || item.amount) || 0;
        const taxRate = Number(item.taxRate || item.gstRate) || 18;
        const taxVal = Math.round((taxable * taxRate) / 100);

        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsn,
            description: desc,
            totalQuantity: 0,
            taxableValue: 0,
            taxRate,
            taxAmount: 0,
            totalValue: 0,
          };
        }

        hsnMap[hsn].totalQuantity += qty;
        hsnMap[hsn].taxableValue += taxable;
        hsnMap[hsn].taxAmount += taxVal;
        hsnMap[hsn].totalValue += (taxable + taxVal);
      });
    });

    const rows = Object.values(hsnMap).sort((a, b) => b.taxableValue - a.taxableValue);
    const totalTaxable = rows.reduce((s, r) => s + r.taxableValue, 0);
    const totalTax = rows.reduce((s, r) => s + r.taxAmount, 0);
    const grandTotal = rows.reduce((s, r) => s + r.totalValue, 0);

    return {
      summary: { totalTaxable, totalTax, grandTotal, count: rows.length },
      rows,
    };
  }

  return { summary: {}, rows: [] };
}

// ============================================================================
// UNIVERSAL EXPORTERS (CSV & EXCEL)
// ============================================================================

/**
 * Universal RFC-4180 CSV Exporter with BOM for perfect Excel UTF-8 display.
 */
export function exportReportToCsv(filename, headers, rows) {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(h => escapeCell(h.label || h.header || h.key)).join(',');
  const rowLines = rows.map(row => {
    return headers.map(h => escapeCell(row[h.key] ?? '')).join(',');
  });

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || 'report'}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Universal Excel XML/HTML spreadsheet exporter.
 */
export function exportReportToExcel(filename, sheetName, headers, rows) {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const escapeHtml = (val) => {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const headerCells = headers.map(h => `<th style="background:#2563eb;color:#ffffff;font-weight:bold;padding:8px;border:1px solid #cbd5e1;">${escapeHtml(h.label || h.header || h.key)}</th>`).join('');

  const rowCells = rows.map(row => {
    const cells = headers.map(h => {
      const val = row[h.key] ?? '';
      const isNum = typeof val === 'number';
      return `<td style="padding:6px;border:1px solid #e2e8f0;text-align:${isNum ? 'right' : 'left'};">${escapeHtml(val)}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${escapeHtml(sheetName || 'Report')}</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      </head>
      <body>
        <table style="border-collapse:collapse;font-family:Segoe UI, sans-serif;font-size:13px;">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${rowCells}</tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || 'report'}_${new Date().toISOString().slice(0, 10)}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Legacy compatibility wrapper for getExecutiveReportData().
 */
export async function getExecutiveReportData() {
  const overview = await getExecutiveOverview();
  return {
    grossSales: overview.kpi.totalSales,
    cogsPurchases: overview.kpi.totalPurchases,
    grossProfit: overview.kpi.grossProfit,
    grossMarginPct: overview.kpi.grossProfitPct,
    operatingExpenses: overview.kpi.operatingExpenses,
    netProfit: overview.kpi.netProfit,
    netMarginPct: overview.kpi.netProfitPct,
    totalStockValuation: overview.kpi.totalStockValue,
    totalStockUnits: overview.kpi.totalStockItems,
    tradeDebtors: overview.kpi.customerOutstanding,
    tradeCreditors: overview.kpi.supplierOutstanding,
    categoryBreakdown: [],
    commercialTrend: overview.trendData,
  };
}
