/**
 * ReportsOverviewSection.jsx — Forbusyness Web ERP
 *
 * Executive Dashboard & Overview Section.
 * Features:
 * - 7 Key Performance Indicators (Total Sales, Total Purchases, Gross Profit,
 *   Stock Value, Customer Outstanding, Supplier Outstanding, Net Profit)
 * - Sales vs Purchases monthly comparison chart (Recharts)
 * - Top Selling Products table
 * - Top Customers table
 * - Quick jump cards into detailed reports
 */

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import styles from './ReportsOverviewSection.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function ReportsOverviewSection({ data, onNavigateCategory }) {
  if (!data) return null;

  const { kpi = {}, trendData = [], topProducts = [], topCustomers = [] } = data;

  return (
    <div className={styles.container}>
      {/* ── KPI Summary Cards (Simple, clear words) ────────────────────── */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiSales}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Total Sales</span>
            <span className={styles.kpiBadgeBlue}>{kpi.totalSalesCount || 0} Invoices</span>
          </div>
          <div className={styles.kpiValue}>{fmtINR(kpi.totalSales)}</div>
          <div className={styles.kpiSub}>
            Net Sales: <strong>{fmtINR(kpi.netSales)}</strong>
            {kpi.totalSalesReturns > 0 && <span> (Returns: {fmtINR(kpi.totalSalesReturns)})</span>}
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiPurchases}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Total Purchases</span>
            <span className={styles.kpiBadgePurple}>{kpi.totalPurchasesCount || 0} Bills</span>
          </div>
          <div className={styles.kpiValue}>{fmtINR(kpi.totalPurchases)}</div>
          <div className={styles.kpiSub}>
            Cost of inward stock & materials
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiProfit}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Gross Profit</span>
            <span className={styles.kpiBadgeGreen}>{kpi.grossProfitPct || 0}% Margin</span>
          </div>
          <div className={styles.kpiValue}>{fmtINR(kpi.grossProfit)}</div>
          <div className={styles.kpiSub}>
            Sales less Cost of Goods Sold
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiStock}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Stock Value</span>
            <span className={styles.kpiBadgeAmber}>{kpi.totalStockItems || 0} Units</span>
          </div>
          <div className={styles.kpiValue}>{fmtINR(kpi.totalStockValue)}</div>
          <div className={styles.kpiSub}>
            Current inventory stock valuation
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiReceivables}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Customer Outstanding</span>
            <span className={styles.kpiBadgeRose}>Receivable</span>
          </div>
          <div className={styles.kpiValue}>{fmtINR(kpi.customerOutstanding)}</div>
          <div className={styles.kpiSub}>
            Pending payment dues from customers
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiPayables}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Supplier Outstanding</span>
            <span className={styles.kpiBadgeOrange}>Payable</span>
          </div>
          <div className={styles.kpiValue}>{fmtINR(kpi.supplierOutstanding)}</div>
          <div className={styles.kpiSub}>
            Pending payment dues owed to suppliers
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiNet}`}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Net Profit</span>
            <span className={styles.kpiBadgeTeal}>{kpi.netProfitPct || 0}% Net</span>
          </div>
          <div className={styles.kpiValue}>{fmtINR(kpi.netProfit)}</div>
          <div className={styles.kpiSub}>
            After operating expenses ({fmtINR(kpi.operatingExpenses)})
          </div>
        </div>
      </div>

      {/* ── Sales vs Purchases Comparison Chart ────────────────────────── */}
      <div className={styles.chartCard}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Sales vs Purchases Trend</h3>
            <p className={styles.cardDesc}>Monthly revenue inflow compared to stock purchase costs</p>
          </div>
        </div>

        <div className={styles.chartWrapper}>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="purchasesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    fmtINR(value),
                    name === 'sales' ? 'Sales' : name === 'purchases' ? 'Purchases' : 'Gross Profit',
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#purchasesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.noDataPlaceholder}>
              <p>No billing or purchase transactions recorded yet for this period.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Two-Column Tables: Top Selling Products & Top Customers ───── */}
      <div className={styles.splitGrid}>
        {/* Top Products */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Top Selling Products</h3>
              <p className={styles.cardDesc}>Highest revenue generating products</p>
            </div>
            {onNavigateCategory && (
              <button
                type="button"
                className={styles.viewAllBtn}
                onClick={() => onNavigateCategory('inventory', 'stockSummary')}
              >
                View Stock →
              </button>
            )}
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th className={styles.textRight}>Qty Sold</th>
                  <th className={styles.textRight}>Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length > 0 ? (
                  topProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td className={styles.cellBold}>{p.name}</td>
                      <td className={styles.textRight}>{p.quantity}</td>
                      <td className={`${styles.textRight} ${styles.cellAmount}`}>{fmtINR(p.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className={styles.emptyCell}>No sales records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Top Customers</h3>
              <p className={styles.cardDesc}>Highest volume customer accounts</p>
            </div>
            {onNavigateCategory && (
              <button
                type="button"
                className={styles.viewAllBtn}
                onClick={() => onNavigateCategory('outstanding', 'customerOutstanding')}
              >
                View Outstanding →
              </button>
            )}
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th className={styles.textCenter}>Invoices</th>
                  <th className={styles.textRight}>Sales Amount</th>
                  <th className={styles.textRight}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.length > 0 ? (
                  topCustomers.map((c, idx) => (
                    <tr key={idx}>
                      <td className={styles.cellBold}>{c.name}</td>
                      <td className={styles.textCenter}>{c.invoiceCount}</td>
                      <td className={`${styles.textRight} ${styles.cellAmount}`}>{fmtINR(c.totalSales)}</td>
                      <td className={`${styles.textRight} ${c.pending > 0 ? styles.textDanger : ''}`}>
                        {fmtINR(c.pending)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={styles.emptyCell}>No customer sales found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
