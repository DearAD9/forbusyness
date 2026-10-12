/**
 * SalesReportsSection.jsx — Forbusyness Web ERP
 *
 * Comprehensive Sales Reporting module.
 * Sub-reports:
 * - Sales Register
 * - Customer-wise Sales
 * - Product-wise Sales
 * - Sales Returns
 */

import React from 'react';
import styles from './SalesReportsSection.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function SalesReportsSection({ data, subType = 'register' }) {
  if (!data) return null;

  const { summary = {}, rows = [] } = data;

  return (
    <div className={styles.container}>
      {/* ── Summary Statistics Banner ─────────────────────────────────── */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Sales</span>
          <span className={styles.summaryValue}>{fmtINR(summary.totalSales)}</span>
        </div>
        {summary.totalReceived !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Received</span>
            <span className={`${styles.summaryValue} ${styles.textSuccess}`}>{fmtINR(summary.totalReceived)}</span>
          </div>
        )}
        {summary.totalDue !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Due (Outstanding)</span>
            <span className={`${styles.summaryValue} ${styles.textDanger}`}>{fmtINR(summary.totalDue)}</span>
          </div>
        )}
        {summary.totalReturns !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Returns</span>
            <span className={`${styles.summaryValue} ${styles.textWarning}`}>{fmtINR(summary.totalReturns)}</span>
          </div>
        )}
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Records</span>
          <span className={styles.summaryValue}>{summary.count || 0}</span>
        </div>
      </div>

      {/* ── Sub-Report: Sales Register ───────────────────────────────── */}
      {subType === 'register' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th className={styles.textCenter}>Items</th>
                  <th className={styles.textRight}>Taxable</th>
                  <th className={styles.textRight}>Tax / GST</th>
                  <th className={styles.textRight}>Total Amount</th>
                  <th className={styles.textRight}>Received</th>
                  <th className={styles.textRight}>Pending Due</th>
                  <th className={styles.textCenter}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row) => (
                    <tr key={row.id || row.invoiceNo}>
                      <td className={styles.cellInvoiceNo}>{row.invoiceNo}</td>
                      <td>{row.date}</td>
                      <td className={styles.cellBold}>
                        <div>{row.customerName}</div>
                        {row.customerPhone !== '—' && (
                          <div className={styles.cellSubText}>{row.customerPhone}</div>
                        )}
                      </td>
                      <td className={styles.textCenter}>{row.itemsCount}</td>
                      <td className={styles.textRight}>{fmtINR(row.subtotal)}</td>
                      <td className={styles.textRight}>{fmtINR(row.taxAmount)}</td>
                      <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(row.total)}</td>
                      <td className={`${styles.textRight} ${styles.textSuccess}`}>{fmtINR(row.received)}</td>
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
                    <td colSpan={10} className={styles.emptyCell}>No sales invoices recorded for this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sub-Report: Customer-wise Sales ──────────────────────────── */}
      {subType === 'customer' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Contact</th>
                  <th className={styles.textCenter}>Invoices</th>
                  <th className={styles.textRight}>Total Sales</th>
                  <th className={styles.textRight}>Received</th>
                  <th className={styles.textRight}>Outstanding Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className={styles.cellBold}>{row.customerName}</td>
                      <td>{row.phone}</td>
                      <td className={styles.textCenter}>{row.invoicesCount}</td>
                      <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(row.totalSales)}</td>
                      <td className={`${styles.textRight} ${styles.textSuccess}`}>{fmtINR(row.totalReceived)}</td>
                      <td className={`${styles.textRight} ${row.outstandingBalance > 0 ? styles.textDanger : ''}`}>
                        {fmtINR(row.outstandingBalance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.emptyCell}>No customer sales found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sub-Report: Product-wise Sales ───────────────────────────── */}
      {subType === 'product' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Code / SKU</th>
                  <th className={styles.textCenter}>Unit</th>
                  <th className={styles.textRight}>Quantity Sold</th>
                  <th className={styles.textRight}>Average Rate</th>
                  <th className={styles.textRight}>Total Sales Amount</th>
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
                    <td colSpan={6} className={styles.emptyCell}>No product sales recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sub-Report: Sales Returns ─────────────────────────────────── */}
      {subType === 'returns' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Return No</th>
                  <th>Date</th>
                  <th>Original Invoice</th>
                  <th>Customer Name</th>
                  <th className={styles.textCenter}>Items</th>
                  <th className={styles.textRight}>Return Amount</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className={styles.cellInvoiceNo}>{row.returnNo}</td>
                      <td>{row.date}</td>
                      <td>#{row.originalInvoiceNo}</td>
                      <td className={styles.cellBold}>{row.customerName}</td>
                      <td className={styles.textCenter}>{row.itemsCount}</td>
                      <td className={`${styles.textRight} ${styles.textWarning} ${styles.cellBold}`}>
                        {fmtINR(row.totalAmount)}
                      </td>
                      <td>{row.reason}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>No sales returns recorded.</td>
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
