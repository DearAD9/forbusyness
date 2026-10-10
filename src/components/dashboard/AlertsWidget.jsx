/**
 * AlertsWidget — Forbusyness Web ERP
 *
 * Operational & Compliance Alerts Center.
 * Evaluates live data across inventory thresholds, payment overdue windows,
 * and tax compliance milestones. Direct 1-click navigation to relevant ERP modules.
 */

import { useNavigate } from 'react-router-dom';
import styles from './AlertsWidget.module.css';

const SEVERITY_CONFIG = {
  danger: {
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    dot: '#ef4444',
  },
  warning: {
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    dot: '#f59e0b',
  },
  info: {
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
    dot: '#0ea5e9',
  },
  success: {
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    dot: '#10b981',
  },
};

export default function AlertsWidget({ alerts = [] }) {
  const navigate = useNavigate();

  const handleAlertClick = (route) => {
    if (route) {
      navigate(route);
    }
  };

  // Real live alerts from system
  const items = alerts || [];

  const totalUrgent = items.filter(a => a.severity === 'danger' && a.count > 0).length;

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
              stroke="#b87333"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <h2 className={styles.title}>Alerts &amp; Action Items</h2>
          </div>
        </div>

        {totalUrgent > 0 ? (
          <span className={styles.urgentPill}>
            {totalUrgent} Attention
          </span>
        ) : (
          <span className={styles.clearPill}>
            All Normal
          </span>
        )}
      </div>

      <div className={styles.body}>
        {items.map((item) => {
          const cfg = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.warning;
          const isClear = !item.count || item.count === 0;

          return (
            <button
              key={item.id}
              type="button"
              className={styles.alertRow}
              onClick={() => handleAlertClick(item.route)}
              title={`Click to view ${item.label}`}
            >
              <div className={styles.alertLeft}>
                <span
                  className={styles.dot}
                  style={{ background: isClear ? '#10b981' : cfg.dot }}
                />
                <div className={styles.alertTextGroup}>
                  <span className={styles.alertLabel}>{item.label}</span>
                  {item.description && (
                    <span className={styles.alertDesc}>{item.description}</span>
                  )}
                </div>
              </div>

              <div className={styles.alertRight}>
                {!isClear ? (
                  <span
                    className={styles.countBadge}
                    style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                  >
                    {item.count}
                  </span>
                ) : (
                  <span className={styles.clearBadge}>
                    ✓ Clear
                  </span>
                )}
                <span className={styles.arrowIcon}>→</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
