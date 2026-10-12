/**
 * FinancialReportsSection.jsx — Forbusyness Web ERP
 *
 * Core Financial Statements module.
 * Sub-reports:
 * - Statement of Profit & Loss (P&L)
 * - Trial Balance
 * - Balance Sheet Summary
 */

import React from 'react';
import styles from './FinancialReportsSection.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function FinancialReportsSection({ data, subType = 'pl' }) {
  if (!data) return null;

  const {
    revenue = {},
    cogs = {},
    grossProfit = 0,
    grossProfitPct = 0,
    expenses = {},
    netProfit = 0,
    netProfitPct = 0,
    // Trial balance
    totalDebit = 0,
    totalCredit = 0,
    isBalanced = true,
    rows = [],
    // Balance sheet
    assets = {},
    liabilities = {},
    equity = {},
  } = data;

  return (
    <div className={styles.container}>
      {/* ── Sub-Report: Profit & Loss Statement (P&L) ─────────────────── */}
      {subType === 'pl' && (
        <div className={styles.statementCard}>
          <div className={styles.statementHeader}>
            <h3 className={styles.statementTitle}>Statement of Profit & Loss</h3>
            <p className={styles.statementSubtitle}>Operating income, purchase costs, and net business profitability</p>
          </div>

          <table className={styles.statementTable}>
            <thead>
              <tr>
                <th>Particulars</th>
                <th className={styles.textRight}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {/* 1. Revenue */}
              <tr className={styles.sectionHeaderRow}>
                <td colSpan={2}>1. REVENUE FROM SALES</td>
              </tr>
              <tr>
                <td className={styles.indent1}>Total Sales</td>
                <td className={styles.textRight}>{fmtINR(revenue.grossSales)}</td>
              </tr>
              {revenue.salesReturns > 0 && (
                <tr className={styles.deductionRow}>
                  <td className={styles.indent1}>Less: Sales Returns & Credit Notes</td>
                  <td className={styles.textRight}>- {fmtINR(revenue.salesReturns)}</td>
                </tr>
              )}
              <tr className={styles.subtotalRow}>
                <td>Net Sales (A)</td>
                <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(revenue.netSales)}</td>
              </tr>

              {/* 2. Cost of Goods Sold */}
              <tr className={styles.sectionHeaderRow}>
                <td colSpan={2}>2. COST OF GOODS SOLD (PURCHASES)</td>
              </tr>
              <tr>
                <td className={styles.indent1}>Stock Purchases Inward</td>
                <td className={styles.textRight}>{fmtINR(cogs.purchases)}</td>
              </tr>
              <tr className={styles.subtotalRow}>
                <td>Total Cost of Goods Sold (B)</td>
                <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(cogs.totalCogs)}</td>
              </tr>

              {/* 3. Gross Profit */}
              <tr className={styles.grossProfitRow}>
                <td>
                  <strong>GROSS PROFIT (A - B)</strong>
                  <span className={styles.marginTag}>{grossProfitPct}% Gross Margin</span>
                </td>
                <td className={`${styles.textRight} ${styles.grossProfitVal}`}>{fmtINR(grossProfit)}</td>
              </tr>

              {/* 4. Operating Expenses */}
              <tr className={styles.sectionHeaderRow}>
                <td colSpan={2}>3. OPERATING & ADMINISTRATIVE EXPENSES</td>
              </tr>
              {expenses.items && expenses.items.length > 0 ? (
                expenses.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className={styles.indent1}>{item.name}</td>
                    <td className={styles.textRight}>{fmtINR(item.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className={styles.indent1}>Operating Overheads & Administration</td>
                  <td className={styles.textRight}>₹0</td>
                </tr>
              )}
              <tr className={styles.subtotalRow}>
                <td>Total Operating Expenses (C)</td>
                <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(expenses.totalExpenses || 0)}</td>
              </tr>

              {/* 5. Net Profit */}
              <tr className={styles.netProfitRow}>
                <td>
                  <strong>NET OPERATING PROFIT (Gross Profit - C)</strong>
                  <span className={styles.netMarginTag}>{netProfitPct}% Net Margin</span>
                </td>
                <td className={`${styles.textRight} ${styles.netProfitVal}`}>{fmtINR(netProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sub-Report: Trial Balance ─────────────────────────────────── */}
      {subType === 'trialBalance' && (
        <div className={styles.statementCard}>
          <div className={styles.statementHeader}>
            <div className={styles.flexBetween}>
              <div>
                <h3 className={styles.statementTitle}>Trial Balance</h3>
                <p className={styles.statementSubtitle}>Summary of ledger account debit and credit balances</p>
              </div>
              <div>
                <span className={`${styles.statusBadge} ${isBalanced ? styles.statusBalanced : styles.statusUnbalanced}`}>
                  {isBalanced ? '✓ Balanced' : 'Unbalanced'}
                </span>
              </div>
            </div>
          </div>

          <table className={styles.statementTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Account Name</th>
                <th>Category</th>
                <th className={styles.textRight}>Debit Balance (Dr)</th>
                <th className={styles.textRight}>Credit Balance (Cr)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.code}>
                  <td className={styles.cellCode}>{row.code}</td>
                  <td className={styles.cellBold}>{row.name}</td>
                  <td>{row.category}</td>
                  <td className={`${styles.textRight} ${row.debit > 0 ? styles.textDr : ''}`}>
                    {row.debit > 0 ? fmtINR(row.debit) : '—'}
                  </td>
                  <td className={`${styles.textRight} ${row.credit > 0 ? styles.textCr : ''}`}>
                    {row.credit > 0 ? fmtINR(row.credit) : '—'}
                  </td>
                </tr>
              ))}
              <tr className={styles.totalRow}>
                <td colSpan={3}>
                  <strong>Total</strong>
                </td>
                <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(totalDebit)}</td>
                <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(totalCredit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sub-Report: Balance Sheet ─────────────────────────────────── */}
      {subType === 'balanceSheet' && (
        <div className={styles.balanceSheetGrid}>
          {/* Assets Side */}
          <div className={styles.statementCard}>
            <div className={styles.statementHeader}>
              <h3 className={styles.statementTitle}>Assets</h3>
            </div>
            <table className={styles.statementTable}>
              <thead>
                <tr>
                  <th>Asset Head</th>
                  <th className={styles.textRight}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.cellBold}>Cash & Bank Balances</td>
                  <td className={styles.textRight}>{fmtINR(assets.cashAndBank)}</td>
                </tr>
                <tr>
                  <td className={styles.cellBold}>Accounts Receivable (Customer Dues)</td>
                  <td className={styles.textRight}>{fmtINR(assets.accountsReceivable)}</td>
                </tr>
                <tr>
                  <td className={styles.cellBold}>Stock / Inventory Valuation</td>
                  <td className={styles.textRight}>{fmtINR(assets.stockValuation)}</td>
                </tr>
                <tr className={styles.totalRow}>
                  <td><strong>Total Assets</strong></td>
                  <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(assets.totalAssets)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Liabilities & Equity Side */}
          <div className={styles.statementCard}>
            <div className={styles.statementHeader}>
              <h3 className={styles.statementTitle}>Liabilities & Equity</h3>
            </div>
            <table className={styles.statementTable}>
              <thead>
                <tr>
                  <th>Liabilities & Equity Head</th>
                  <th className={styles.textRight}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.cellBold}>Accounts Payable (Supplier Dues)</td>
                  <td className={styles.textRight}>{fmtINR(liabilities.accountsPayable)}</td>
                </tr>
                <tr>
                  <td className={styles.cellBold}>Bank Loans / Overdrafts</td>
                  <td className={styles.textRight}>{fmtINR(liabilities.loans)}</td>
                </tr>
                <tr className={styles.subtotalRow}>
                  <td>Total Liabilities</td>
                  <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(liabilities.totalLiabilities)}</td>
                </tr>
                <tr>
                  <td className={styles.cellBold}>Retained Earnings & Reserves</td>
                  <td className={styles.textRight}>{fmtINR(equity.retainedEarnings)}</td>
                </tr>
                <tr className={styles.totalRow}>
                  <td><strong>Total Liabilities & Equity</strong></td>
                  <td className={`${styles.textRight} ${styles.cellBold}`}>
                    {fmtINR((liabilities.totalLiabilities || 0) + (equity.totalEquity || 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
