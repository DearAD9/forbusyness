/**
 * BusinessPerformanceTable — Forbusyness Web ERP
 *
 * Operational P&L Matrix across Multiple Periods.
 * Dynamically aggregates Gross Revenue, Material Procurement, Trading Margin %,
 * Yard Operating Overheads, and Net Operating Profit.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BusinessPerformanceTable.module.css';

const PERIOD_COLUMNS = [
  { key: 'today',        label: 'Today'        },
  { key: 'thisWeek',     label: 'This Week'    },
  { key: 'thisMonth',    label: 'This Month'   },
  { key: 'lastMonth',    label: 'Last Month'   },
  { key: 'thisQuarter',  label: 'This Quarter' },
  { key: 'thisYear',     label: 'This FY'      },
];

const METRIC_ROWS = [
  { key: 'sales',            label: 'Sales',                isCurrency: true,  highlight: false, type: 'income' },
  { key: 'purchase',         label: 'Purchases',            isCurrency: true,  highlight: false, type: 'cogs' },
  { key: 'grossProfit',      label: 'Trading Profit',       isCurrency: true,  highlight: true,  type: 'profit' },
  { key: 'marginPct',        label: 'Margin %',             isCurrency: false, isPct: true,      type: 'pct' },
  { key: 'operatingExpense', label: 'Operating Expenses',   isCurrency: true,  highlight: false, type: 'expense' },
  { key: 'netProfit',        label: 'Net Profit',           isCurrency: true,  highlight: true,  type: 'net' },
];

function fmtINR(value) {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BusinessPerformanceTable({ matrix = {} }) {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

  const emptyRow = { sales: 0, purchase: 0, grossProfit: 0, marginPct: 0, operatingExpense: 0, netProfit: 0 };
  const data = {
    today:        matrix.today        || emptyRow,
    thisWeek:     matrix.thisWeek     || emptyRow,
    thisMonth:    matrix.thisMonth    || emptyRow,
    lastMonth:    matrix.lastMonth    || emptyRow,
    thisQuarter:  matrix.thisQuarter  || emptyRow,
    thisYear:     matrix.thisYear     || emptyRow,
  };

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.iconTag}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6d28d9"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div>
            <h2 className={styles.title}>Business Performance Matrix</h2>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.fullReportBtn}
            onClick={() => navigate('/reports')}
            title="Open comprehensive Business Intelligence &amp; Reports"
          >
            Full P&amp;L Report →
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thParticulars}>Financial Particulars</th>
              {PERIOD_COLUMNS.map(col => {
                const isActive = col.key === selectedPeriod;
                return (
                  <th
                    key={col.key}
                    className={`${styles.th} ${isActive ? styles.thActive : ''}`}
                    onClick={() => setSelectedPeriod(col.key)}
                    title={`Click to focus on ${col.label}`}
                  >
                    {col.label}
                    {isActive && <span className={styles.activeDot}>●</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {METRIC_ROWS.map((row) => {
              const isProfit = row.type === 'profit' || row.type === 'net';
              const isCogs = row.type === 'cogs' || row.type === 'expense';

              return (
                <tr
                  key={row.key}
                  className={`${styles.tr} ${row.highlight ? styles.trHighlight : ''}`}
                >
                  <td className={styles.tdLabel}>
                    <span className={styles.rowLabelText}>{row.label}</span>
                  </td>

                  {PERIOD_COLUMNS.map(col => {
                    const rawVal = data[col.key]?.[row.key];
                    const isActive = col.key === selectedPeriod;

                    let displayVal = '—';
                    if (row.isPct) {
                      displayVal = `${rawVal ?? 0}%`;
                    } else if (row.isCurrency) {
                      displayVal = fmtINR(rawVal);
                    }

                    return (
                      <td
                        key={col.key}
                        className={`
                          ${styles.td}
                          ${isActive ? styles.tdActive : ''}
                          ${isProfit ? styles.profitVal : ''}
                          ${isCogs ? styles.cogsVal : ''}
                        `}
                      >
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
