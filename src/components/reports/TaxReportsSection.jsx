/**
 * TaxReportsSection.jsx — Forbusyness Web ERP
 *
 * GST & Tax Compliance Reporting module.
 * Sub-reports:
 * - Sales GST (GSTR-1 Outward Supplies)
 * - Purchase GST (GSTR-2 Inward Supplies)
 * - HSN / SAC Summary
 */

import React from 'react';
import styles from './TaxReportsSection.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function TaxReportsSection({ data, subType = 'gstr1' }) {
  if (!data) return null;

  const { summary = {}, rows = [] } = data;

  return (
    <div className={styles.container}>
      {/* ── Summary Statistics Banner ─────────────────────────────────── */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Taxable Value</span>
          <span className={styles.summaryValue}>{fmtINR(summary.totalTaxable)}</span>
        </div>
        {summary.totalCgst !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>CGST (Central Tax)</span>
            <span className={styles.summaryValue}>{fmtINR(summary.totalCgst)}</span>
          </div>
        )}
        {summary.totalSgst !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>SGST (State Tax)</span>
            <span className={styles.summaryValue}>{fmtINR(summary.totalSgst)}</span>
          </div>
        )}
        {summary.totalIgst !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>IGST (Integrated Tax)</span>
            <span className={styles.summaryValue}>{fmtINR(summary.totalIgst)}</span>
          </div>
        )}
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Tax</span>
          <span className={`${styles.summaryValue} ${styles.textWarning}`}>{fmtINR(summary.totalTax || summary.totalTaxAmount)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Invoice Total</span>
          <span className={`${styles.summaryValue} ${styles.cellBold}`}>{fmtINR(summary.grandTotal)}</span>
        </div>
      </div>

      {/* ── Sub-Report: GSTR-1 (Sales GST) ────────────────────────────── */}
      {subType === 'gstr1' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th>Customer GSTIN</th>
                  <th className={styles.textRight}>Taxable Value</th>
                  <th className={styles.textRight}>CGST (₹)</th>
                  <th className={styles.textRight}>SGST (₹)</th>
                  <th className={styles.textRight}>IGST (₹)</th>
                  <th className={styles.textRight}>Total Tax</th>
                  <th className={styles.textRight}>Invoice Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className={styles.cellCode}>{row.invoiceNo}</td>
                      <td>{row.date}</td>
                      <td className={styles.cellBold}>{row.customerName}</td>
                      <td>{row.customerGstin}</td>
                      <td className={styles.textRight}>{fmtINR(row.taxableValue)}</td>
                      <td className={styles.textRight}>{fmtINR(row.cgst)}</td>
                      <td className={styles.textRight}>{fmtINR(row.sgst)}</td>
                      <td className={styles.textRight}>{fmtINR(row.igst)}</td>
                      <td className={`${styles.textRight} ${styles.textWarning}`}>{fmtINR(row.totalTax)}</td>
                      <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(row.grandTotal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className={styles.emptyCell}>No outward supplies recorded for this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sub-Report: GSTR-2 (Purchase GST) ─────────────────────────── */}
      {subType === 'gstr2' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Date</th>
                  <th>Supplier Name</th>
                  <th>Supplier GSTIN</th>
                  <th className={styles.textRight}>Taxable Value</th>
                  <th className={styles.textRight}>Input CGST</th>
                  <th className={styles.textRight}>Input SGST</th>
                  <th className={styles.textRight}>Input IGST</th>
                  <th className={styles.textRight}>Total ITC Tax</th>
                  <th className={styles.textRight}>Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className={styles.cellCode}>{row.billNo}</td>
                      <td>{row.date}</td>
                      <td className={styles.cellBold}>{row.supplierName}</td>
                      <td>{row.supplierGstin}</td>
                      <td className={styles.textRight}>{fmtINR(row.taxableValue)}</td>
                      <td className={styles.textRight}>{fmtINR(row.cgst)}</td>
                      <td className={styles.textRight}>{fmtINR(row.sgst)}</td>
                      <td className={styles.textRight}>{fmtINR(row.igst)}</td>
                      <td className={`${styles.textRight} ${styles.textWarning}`}>{fmtINR(row.totalTax)}</td>
                      <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(row.grandTotal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className={styles.emptyCell}>No inward supplies recorded for this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sub-Report: HSN / SAC Summary ─────────────────────────────── */}
      {subType === 'hsn' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>HSN / SAC Code</th>
                  <th>Description</th>
                  <th className={styles.textRight}>Total Quantity</th>
                  <th className={styles.textRight}>Taxable Value</th>
                  <th className={styles.textCenter}>Tax Rate</th>
                  <th className={styles.textRight}>Tax Amount</th>
                  <th className={styles.textRight}>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className={styles.cellCode}>{row.hsn}</td>
                      <td className={styles.cellBold}>{row.description}</td>
                      <td className={styles.textRight}>{row.totalQuantity}</td>
                      <td className={styles.textRight}>{fmtINR(row.taxableValue)}</td>
                      <td className={styles.textCenter}>{row.taxRate}%</td>
                      <td className={`${styles.textRight} ${styles.textWarning}`}>{fmtINR(row.taxAmount)}</td>
                      <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(row.totalValue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>No HSN items billed.</td>
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
