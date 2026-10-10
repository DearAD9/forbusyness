/**
 * reportService.js — Forbusyness Web ERP
 *
 * Financial & Operational ERP Analytics Engine.
 * Aggregates live data across Sales Invoices, Inward Consignments,
 * Steel Material Catalog, and Double-entry Ledger accounts.
 */

import { getInvoices } from './invoiceService';
import { getPurchases } from './purchaseService';
import { getProducts } from './productService';
import { getAccounts } from './accountService';

export async function getExecutiveReportData() {
  const [invoicesRes, purchasesRes, productsRes, accounts] = await Promise.all([
    getInvoices({ pageSize: 500 }),
    getPurchases({ pageSize: 500 }),
    getProducts({ pageSize: 500 }),
    getAccounts(),
  ]);

  const invoices = invoicesRes.items || [];
  const purchases = purchasesRes.items || [];
  const products = productsRes.items || [];

  // ── 1. Profit & Loss Metrics
  const grossSales = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const cogsPurchases = purchases.reduce((sum, p) => sum + (Number(p.grandTotal) || 0), 0);
  const grossProfit = Math.max(0, grossSales - cogsPurchases);
  const grossMarginPct = grossSales > 0 ? Math.round((grossProfit / grossSales) * 100) : 0;

  const operatingExpenses = accounts
    .filter(a => a.category === 'Expenses' && a.type === 'Operating')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const netProfit = grossProfit - operatingExpenses;
  const netMarginPct = grossSales > 0 ? Math.round((netProfit / grossSales) * 100) : 0;

  // ── 3. Inventory Stock Valuation
  const totalStockValuation = products.reduce((sum, p) => {
    const qty = Number(p.currentStock) || 0;
    const rate = Number(p.purchaseRate) || Number(p.sellingRate) || 0;
    return sum + (qty * rate);
  }, 0);

  const totalStockUnits = products.reduce((sum, p) => sum + (Number(p.currentStock) || 0), 0);

  // Category breakdown for Stock Valuation
  const categoryBreakdownMap = {};
  products.forEach(p => {
    const cat = p.category || 'Other Steel';
    const val = (Number(p.currentStock) || 0) * (Number(p.purchaseRate) || Number(p.sellingRate) || 0);
    if (val > 0) {
      categoryBreakdownMap[cat] = (categoryBreakdownMap[cat] || 0) + val;
    }
  });

  const categoryBreakdown = Object.keys(categoryBreakdownMap).length > 0
    ? Object.entries(categoryBreakdownMap).map(([name, value]) => ({ name, value: Math.round(value) }))
    : [];

  // ── 4. Monthly Sales vs Purchase Trend (Recharts)
  const monthlyTrend = [];

  // ── 5. Ageing Buckets
  const ageingData = {
    receivables: [],
    payables: [],
  };

  return {
    grossSales,
    cogsPurchases,
    grossProfit,
    grossMarginPct,
    operatingExpenses,
    netProfit,
    netMarginPct,
    totalStockValuation,
    totalStockUnits,
    categoryBreakdown,
    monthlyTrend,
    ageingData,
  };
}
