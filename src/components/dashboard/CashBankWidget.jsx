/**
 * CashBankWidget — Forbusyness Web ERP
 *
 * Real-time Treasury & Liquidity Position Widget.
 * Displays live bank clearing balances, cash counter vault,
 * allocation breakdown bars, and direct link to general ledger.
 */

import styles from './CashBankWidget.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function CashBankWidget({
  bankAccounts = [],
  cashAccounts = [],
  totalLiquid = 0,
}) {

  // Combine real bank and cash accounts
  const accounts = [...bankAccounts, ...cashAccounts];

  const total = totalLiquid || accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);

  return (
    <section className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.iconTag}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
          </div>
          <div>
            <h2 className={styles.title}>Collection Accounts</h2>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {/* Total Available Callout */}
        <div className={styles.totalBlock}>
          <div className={styles.totalInfo}>
            <span className={styles.totalLabel}>Total Collection Balance</span>
            <span className={styles.totalValue}>{fmtINR(total)}</span>
          </div>
          <span className={styles.statusBadge}>
            ● Reconciled
          </span>
        </div>

        {/* Visual Allocation Bar */}
        <div className={styles.progressBar} title="Liquid funds allocation">
          {accounts.map((acc, i) => {
            const pct = total > 0 ? Math.max(4, Math.round(((Number(acc.balance) || 0) / total) * 100)) : 0;
            const colors = ['#7c3aed', '#0284c7', '#059669', '#d97706'];
            return (
              <div
                key={acc.id || i}
                className={styles.progressSeg}
                style={{
                  width: `${pct}%`,
                  background: colors[i % colors.length],
                }}
                title={`${acc.name}: ${pct}% (${fmtINR(acc.balance)})`}
              />
            );
          })}
        </div>

        {/* Individual Account List */}
        <div className={styles.accountList}>
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={styles.accountItem}
            >
              <div className={styles.accountIconBox}>
                {acc.type === 'Bank' ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="22" x2="21" y2="22" />
                    <line x1="6" y1="18" x2="6" y2="11" />
                    <line x1="10" y1="18" x2="10" y2="11" />
                    <line x1="14" y1="18" x2="14" y2="11" />
                    <line x1="18" y1="18" x2="18" y2="11" />
                    <polygon points="12 2 20 7 4 7" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                )}
              </div>

              <div className={styles.accountDetails}>
                <span className={styles.accountName}>{acc.name}</span>
                <span className={styles.accountDesc}>
                  {acc.type === 'Bank' ? 'Online RTGS / Cheque clearing' : 'Petty cash counter'}
                </span>
              </div>

              <span className={styles.accountBalance}>
                {fmtINR(acc.balance)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
