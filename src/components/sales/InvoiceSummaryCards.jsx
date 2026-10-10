/**
 * InvoiceSummaryCards — Forbusyness Web ERP
 *
 * Cards:
 * 1. Total Invoices
 * 2. Total Sales
 * 3. Received Amount (APPROVED DESIGN: TOTAL RECEIVED first, then breakdown Cash/Bank/UPI/Other with compact progress bar, expandable/collapsible)
 * 4. Pending Amount
 */

import { useState } from 'react';
import styles from './InvoiceSummaryCards.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function InvoiceSummaryCards({
  totalInvoices = 0,
  totalSales = 0,
  receivedAmount = 0,
  pendingAmount = 0,
  breakdown = { cash: 0, bank: 0, upi: 0, other: 0 },
}) {
  const [breakdownOpen, setBreakdownOpen] = useState(true);

  // Compute percentage segments for progress bar
  const totalReceived = receivedAmount || 1;
  const cashPct = Math.round(((breakdown.cash || 0) / totalReceived) * 100);
  const bankPct = Math.round(((breakdown.bank || 0) / totalReceived) * 100);
  const upiPct = Math.round(((breakdown.upi || 0) / totalReceived) * 100);
  const otherPct = Math.max(0, 100 - (cashPct + bankPct + upiPct));

  return (
    <div className={styles.summaryGrid}>
      {/* 1. Total Invoices */}
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.cardTitle}>Total Invoices</span>
          <div className={styles.cardIcon} style={{ background: '#f5f3ff', color: '#6d28d9' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
        </div>
        <div className={styles.cardValue}>{totalInvoices}</div>
        <div className={styles.cardSub}>All recorded sales invoices</div>
      </div>

      {/* 2. Total Sales */}
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.cardTitle}>Total Sales</span>
          <div className={styles.cardIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
        </div>
        <div className={styles.cardValue}>{fmtINR(totalSales)}</div>
        <div className={styles.cardSub}>Gross invoiced value</div>
      </div>

      {/* 3. Received Amount (APPROVED DESIGN: TOTAL FIRST + EXPANDABLE BREAKDOWN) */}
      <div className={`${styles.card} ${styles.receivedCard}`}>
        <div className={styles.cardTop}>
          <span className={styles.cardTitle}>Received Amount</span>
          <button
            type="button"
            className={styles.toggleBreakdownBtn}
            onClick={() => setBreakdownOpen(o => !o)}
            title={breakdownOpen ? 'Hide payment breakdown' : 'Show payment breakdown'}
          >
            {breakdownOpen ? '▲ Breakdown' : '▼ Breakdown'}
          </button>
        </div>

        {/* Visually dominant total */}
        <div className={styles.cardValue} style={{ color: '#047857' }}>
          {fmtINR(receivedAmount)}
        </div>

        {/* Progress bar breakdown visualization */}
        <div className={styles.progressContainer} title={`Cash ${cashPct}%, Bank ${bankPct}%, UPI ${upiPct}%`}>
          <div className={`${styles.progressBar} ${styles.barCash}`} style={{ width: `${cashPct}%` }} />
          <div className={`${styles.progressBar} ${styles.barBank}`} style={{ width: `${bankPct}%` }} />
          <div className={`${styles.progressBar} ${styles.barUpi}`} style={{ width: `${upiPct}%` }} />
          <div className={`${styles.progressBar} ${styles.barOther}`} style={{ width: `${otherPct}%` }} />
        </div>

        {/* Expandable breakdown */}
        {breakdownOpen && (
          <div className={styles.breakdownGrid}>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>
                <span className={`${styles.dot} ${styles.dotCash}`} />
                Cash
              </span>
              <span className={styles.breakdownVal}>{fmtINR(breakdown.cash)}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>
                <span className={`${styles.dot} ${styles.dotBank}`} />
                Bank
              </span>
              <span className={styles.breakdownVal}>{fmtINR(breakdown.bank)}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>
                <span className={`${styles.dot} ${styles.dotUpi}`} />
                UPI
              </span>
              <span className={styles.breakdownVal}>{fmtINR(breakdown.upi)}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>
                <span className={`${styles.dot} ${styles.dotOther}`} />
                Other
              </span>
              <span className={styles.breakdownVal}>{fmtINR(breakdown.other)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Pending Amount */}
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.cardTitle}>Pending Amount</span>
          <div className={styles.cardIcon} style={{ background: '#fef2f2', color: '#dc2626' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
        </div>
        <div className={styles.cardValue} style={{ color: '#b91c1c' }}>
          {fmtINR(pendingAmount)}
        </div>
        <div className={styles.cardSub}>Outstanding customer receivables</div>
      </div>
    </div>
  );
}
