/**
 * OutstandingReportsSection.jsx — Forbusyness Web ERP
 *
 * Receivables & Payables Aging Analysis module.
 * Sub-reports:
 * - Customer Outstanding (Receivables Aging)
 * - Supplier Outstanding (Payables Aging)
 */

import React from 'react';
import styles from './OutstandingReportsSection.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function OutstandingReportsSection({
  data,
  subType = 'customerOutstanding',
  onNavigateToLedger,
}) {
  if (!data) return null;

  const { summary = {}, rows = [] } = data;
  const isCustomer = subType === 'customerOutstanding';

  return (
    <div className={styles.container}>
      {/* ── Aging Summary Bracket Cards ───────────────────────────────── */}
      <div className={styles.agingGrid}>
        <div className={`${styles.agingCard} ${styles.agingTotal}`}>
          <span className={styles.agingLabel}>Total Outstanding</span>
          <span className={styles.agingValue}>{fmtINR(summary.totalOutstanding)}</span>
          <span className={styles.agingMeta}>{summary.partyCount || 0} Parties with dues</span>
        </div>

        <div className={`${styles.agingCard} ${styles.agingCurrent}`}>
          <span className={styles.agingLabel}>0 – 30 Days (Current)</span>
          <span className={styles.agingValue}>{fmtINR(summary.totalCurrent)}</span>
          <span className={styles.agingMeta}>Within standard credit period</span>
        </div>

        <div className={`${styles.agingCard} ${styles.aging30To60}`}>
          <span className={styles.agingLabel}>31 – 60 Days</span>
          <span className={styles.agingValue}>{fmtINR(summary.total30To60)}</span>
          <span className={styles.agingMeta}>Follow-up recommended</span>
        </div>

        <div className={`${styles.agingCard} ${styles.aging60To90}`}>
          <span className={styles.agingLabel}>61 – 90 Days</span>
          <span className={styles.agingValue}>{fmtINR(summary.total60To90)}</span>
          <span className={styles.agingMeta}>Urgent recovery attention</span>
        </div>

        <div className={`${styles.agingCard} ${styles.agingAbove90}`}>
          <span className={styles.agingLabel}>90+ Days (Overdue)</span>
          <span className={`${styles.agingValue} ${styles.textOverdue}`}>{fmtINR(summary.totalAbove90)}</span>
          <span className={styles.agingMeta}>Critical overdue balance</span>
        </div>
      </div>

      {/* ── Detailed Party Aging Table ────────────────────────────────── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>
            {isCustomer ? 'Customer Receivables Ageing Schedule' : 'Supplier Payables Ageing Schedule'}
          </h3>
          <p className={styles.tableSubtitle}>
            Breakdown of outstanding amounts categorized by invoice maturity and aging brackets
          </p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{isCustomer ? 'Customer Name' : 'Supplier Name'}</th>
                <th>Contact</th>
                <th className={styles.textCenter}>{isCustomer ? 'Invoices' : 'Bills'}</th>
                <th className={styles.textRight}>0–30 Days</th>
                <th className={styles.textRight}>31–60 Days</th>
                <th className={styles.textRight}>61–90 Days</th>
                <th className={styles.textRight}>90+ Days</th>
                <th className={styles.textRight}>Total Pending Due</th>
                <th className={styles.textCenter}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className={styles.cellBold}>{row.name}</td>
                    <td>{row.phone}</td>
                    <td className={styles.textCenter}>{row.invoicesCount || row.billsCount}</td>
                    <td className={styles.textRight}>
                      {row.bracketCurrent > 0 ? fmtINR(row.bracketCurrent) : '—'}
                    </td>
                    <td className={`${styles.textRight} ${row.bracket30To60 > 0 ? styles.textAmber : ''}`}>
                      {row.bracket30To60 > 0 ? fmtINR(row.bracket30To60) : '—'}
                    </td>
                    <td className={`${styles.textRight} ${row.bracket60To90 > 0 ? styles.textOrange : ''}`}>
                      {row.bracket60To90 > 0 ? fmtINR(row.bracket60To90) : '—'}
                    </td>
                    <td className={`${styles.textRight} ${row.bracketAbove90 > 0 ? styles.textOverdue : ''}`}>
                      {row.bracketAbove90 > 0 ? fmtINR(row.bracketAbove90) : '—'}
                    </td>
                    <td className={`${styles.textRight} ${styles.cellTotalDue}`}>
                      {fmtINR(row.totalPending)}
                    </td>
                    <td className={styles.textCenter}>
                      {onNavigateToLedger && (
                        <button
                          type="button"
                          className={styles.ledgerBtn}
                          onClick={() => onNavigateToLedger(isCustomer ? 'customerLedger' : 'supplierLedger', row.id)}
                          title="View Ledger Statement"
                        >
                          View Ledger
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className={styles.emptyCell}>
                    No outstanding dues recorded! All accounts are fully settled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
