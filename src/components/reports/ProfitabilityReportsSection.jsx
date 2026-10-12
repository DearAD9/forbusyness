/**
 * ProfitabilityReportsSection.jsx — Forbusyness Web ERP
 *
 * Profitability & Gross Margin Intelligence module.
 * Sub-reports:
 * - Product-wise Profitability
 * - Customer-wise Profitability
 * - Invoice-wise Profitability
 */

import React from 'react';
import styles from './ProfitabilityReportsSection.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function ProfitabilityReportsSection({ data, subType = 'product' }) {
  if (!data) return null;

  const { summary = {}, rows = [] } = data;

  return (
    <div className={styles.container}>
      {/* ── Summary Statistics Banner ─────────────────────────────────── */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Sales Revenue</span>
          <span className={styles.summaryValue}>{fmtINR(summary.totalRevenue)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Product Cost</span>
          <span className={styles.summaryValue}>{fmtINR(summary.totalCost)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Gross Profit</span>
          <span className={`${styles.summaryValue} ${styles.textSuccess}`}>{fmtINR(summary.totalProfit)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Average Margin</span>
          <span className={`${styles.summaryValue} ${styles.textSuccess}`}>{summary.overallMargin || 0}%</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Records</span>
          <span className={styles.summaryValue}>{summary.count || 0}</span>
        </div>
      </div>

      {/* ── Sub-Report: Product Profitability ─────────────────────────── */}
      {subType === 'product' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th className={styles.textRight}>Quantity Sold</th>
                  <th className={styles.textRight}>Sales Revenue</th>
                  <th className={styles.textRight}>Estimated Cost</th>
                  <th className={styles.textRight}>Gross Profit</th>
                  <th className={styles.textCenter}>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className={styles.cellBold}>{row.productName}</td>
                      <td className={styles.textRight}>{row.quantitySold}</td>
                      <td className={styles.textRight}>{fmtINR(row.revenue)}</td>
                      <td className={styles.textRight}>{fmtINR(row.cost)}</td>
                      <td className={`${styles.textRight} ${styles.cellProfit}`}>{fmtINR(row.grossProfit)}</td>
                      <td className={styles.textCenter}>
                        <span className={`${styles.marginBadge} ${row.marginPct >= 20 ? styles.marginHigh : row.marginPct >= 10 ? styles.marginMed : styles.marginLow}`}>
                          {row.marginPct}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.emptyCell}>No sales records found for profitability analysis.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sub-Report: Customer Profitability ────────────────────────── */}
      {subType === 'customer' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th className={styles.textCenter}>Invoices</th>
                  <th className={styles.textRight}>Total Revenue</th>
                  <th className={styles.textRight}>Estimated Cost</th>
                  <th className={styles.textRight}>Gross Profit</th>
                  <th className={styles.textCenter}>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className={styles.cellBold}>{row.customerName}</td>
                      <td className={styles.textCenter}>{row.invoicesCount}</td>
                      <td className={styles.textRight}>{fmtINR(row.revenue)}</td>
                      <td className={styles.textRight}>{fmtINR(row.cost)}</td>
                      <td className={`${styles.textRight} ${styles.cellProfit}`}>{fmtINR(row.grossProfit)}</td>
                      <td className={styles.textCenter}>
                        <span className={`${styles.marginBadge} ${row.marginPct >= 20 ? styles.marginHigh : row.marginPct >= 10 ? styles.marginMed : styles.marginLow}`}>
                          {row.marginPct}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.emptyCell}>No customer profitability data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sub-Report: Invoice Profitability ─────────────────────────── */}
      {subType === 'invoice' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th className={styles.textRight}>Invoice Amount</th>
                  <th className={styles.textRight}>Product Cost</th>
                  <th className={styles.textRight}>Gross Margin (₹)</th>
                  <th className={styles.textCenter}>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className={styles.cellCode}>{row.invoiceNo}</td>
                      <td>{row.date}</td>
                      <td className={styles.cellBold}>{row.customerName}</td>
                      <td className={styles.textRight}>{fmtINR(row.revenue)}</td>
                      <td className={styles.textRight}>{fmtINR(row.cost)}</td>
                      <td className={`${styles.textRight} ${styles.cellProfit}`}>{fmtINR(row.grossProfit)}</td>
                      <td className={styles.textCenter}>
                        <span className={`${styles.marginBadge} ${row.marginPct >= 20 ? styles.marginHigh : row.marginPct >= 10 ? styles.marginMed : styles.marginLow}`}>
                          {row.marginPct}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>No invoice data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
