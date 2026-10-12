/**
 * PurchaseReportsSection.jsx — Forbusyness Web ERP
 *
 * Comprehensive Purchase & Inward Goods Reporting module.
 * Sub-reports:
 * - Purchase Register
 * - Supplier-wise Purchases
 * - Product-wise Purchases
 */

import React from 'react';
import styles from './PurchaseReportsSection.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function PurchaseReportsSection({ data, subType = 'register' }) {
  if (!data) return null;

  const { summary = {}, rows = [] } = data;

  return (
    <div className={styles.container}>
      {/* ── Summary Statistics Banner ─────────────────────────────────── */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Purchases</span>
          <span className={styles.summaryValue}>{fmtINR(summary.totalPurchases)}</span>
        </div>
        {summary.totalPaid !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Paid</span>
            <span className={`${styles.summaryValue} ${styles.textSuccess}`}>{fmtINR(summary.totalPaid)}</span>
          </div>
        )}
        {summary.totalBalance !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Balance Due (Payable)</span>
            <span className={`${styles.summaryValue} ${styles.textDanger}`}>{fmtINR(summary.totalBalance)}</span>
          </div>
        )}
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Records</span>
          <span className={styles.summaryValue}>{summary.count || 0}</span>
        </div>
      </div>

      {/* ── Sub-Report: Purchase Register ────────────────────────────── */}
      {subType === 'register' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Date</th>
                  <th>Supplier Name</th>
                  <th>Supplier Ref</th>
                  <th className={styles.textCenter}>Items</th>
                  <th className={styles.textRight}>Taxable</th>
                  <th className={styles.textRight}>Tax / GST</th>
                  <th className={styles.textRight}>Total Amount</th>
                  <th className={styles.textRight}>Paid</th>
                  <th className={styles.textRight}>Balance Due</th>
                  <th className={styles.textCenter}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row) => (
                    <tr key={row.id || row.billNo}>
                      <td className={styles.cellBillNo}>{row.billNo}</td>
                      <td>{row.date}</td>
                      <td className={styles.cellBold}>{row.supplierName}</td>
                      <td>{row.supplierBillNo}</td>
                      <td className={styles.textCenter}>{row.itemsCount}</td>
                      <td className={styles.textRight}>{fmtINR(row.subtotal)}</td>
                      <td className={styles.textRight}>{fmtINR(row.taxAmount)}</td>
                      <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(row.total)}</td>
                      <td className={`${styles.textRight} ${styles.textSuccess}`}>{fmtINR(row.paid)}</td>
                      <td className={`${styles.textRight} ${row.pending > 0 ? styles.textDanger : ''}`}>
                        {fmtINR(row.pending)}
                      </td>
                      <td className={styles.textCenter}>
                        <span className={`${styles.statusBadge} ${styles['status_' + (row.status || 'Paid').toLowerCase()]}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className={styles.emptyCell}>No purchase bills recorded for this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sub-Report: Supplier-wise Purchases ───────────────────────── */}
      {subType === 'supplier' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Contact</th>
                  <th className={styles.textCenter}>Bills Count</th>
                  <th className={styles.textRight}>Total Purchases</th>
                  <th className={styles.textRight}>Paid</th>
                  <th className={styles.textRight}>Outstanding Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className={styles.cellBold}>{row.supplierName}</td>
                      <td>{row.phone}</td>
                      <td className={styles.textCenter}>{row.billsCount}</td>
                      <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(row.totalPurchases)}</td>
                      <td className={`${styles.textRight} ${styles.textSuccess}`}>{fmtINR(row.totalPaid)}</td>
                      <td className={`${styles.textRight} ${row.outstandingBalance > 0 ? styles.textDanger : ''}`}>
                        {fmtINR(row.outstandingBalance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.emptyCell}>No supplier purchases found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sub-Report: Product-wise Purchases ────────────────────────── */}
      {subType === 'product' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Code / SKU</th>
                  <th className={styles.textCenter}>Unit</th>
                  <th className={styles.textRight}>Quantity Inward</th>
                  <th className={styles.textRight}>Average Rate</th>
                  <th className={styles.textRight}>Total Purchase Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className={styles.cellBold}>{row.productName}</td>
                      <td>{row.productCode}</td>
                      <td className={styles.textCenter}>{row.unit}</td>
                      <td className={styles.textRight}>{row.totalQuantity}</td>
                      <td className={styles.textRight}>{fmtINR(row.averageRate)}</td>
                      <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(row.totalAmount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.emptyCell}>No product purchases recorded.</td>
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
