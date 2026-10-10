/**
 * RecentPurchasesTable — Forbusyness Web ERP
 *
 * Recent Inward Goods & Procurement Activity Table.
 * Shows sequential purchase bills (PUR-001...), Mill Supplier Name,
 * inward vehicle number, total invoice amount, and payment status.
 * Click row to open instant Purchase Inspection Modal.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PurchaseViewModal from '../purchases/PurchaseViewModal';
import styles from './RecentPurchasesTable.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

const STATUS_CONFIG = {
  paid:            { label: 'Paid',           className: 'statusPaid'    },
  'partially paid':{ label: 'Partially Paid', className: 'statusPartial' },
  pending:         { label: 'Pending',        className: 'statusPending' },
  overdue:         { label: 'Overdue',        className: 'statusOverdue' },
};

export default function RecentPurchasesTable({ rows = [], onViewAll }) {
  const navigate = useNavigate();
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const isEmpty = !rows || rows.length === 0;

  return (
    <>
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
                stroke="#0284c7"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <h2 className={styles.title}>Recent Purchases</h2>
            </div>
          </div>

          <button
            type="button"
            className={styles.viewAllBtn}
            onClick={onViewAll}
            aria-label="View all inward purchases"
          >
            All Purchases →
          </button>
        </div>

        <div className={styles.tableWrapper}>
          {isEmpty ? (
            <div className={styles.emptyBox}>
              <div className={styles.emptyIcon}>📦</div>
              <p className={styles.emptyTitle}>No Purchase Bills Recorded</p>
              <p className={styles.emptyDesc}>Log inward steel consignments and weighbridge slips to update stock</p>
              <button
                type="button"
                className={styles.emptyActionBtn}
                onClick={() => navigate('/purchases/new')}
              >
                + Record Purchase Bill
              </button>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Bill No.</th>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Supplier / Mill</th>
                  <th className={styles.th}>Vehicle No.</th>
                  <th className={`${styles.th} ${styles.right}`}>Grand Total</th>
                  <th className={`${styles.th} ${styles.center}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, idx) => {
                  const statusKey = (row.status || 'pending').toLowerCase();
                  const s = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                  const supplierName = row.supplier?.name || row.supplier || 'Steel Mill Consignment';

                  return (
                    <tr
                      key={row.id || idx}
                      className={styles.row}
                      onClick={() => setSelectedPurchase(row)}
                      title="Click to view inward details and weighbridge slip"
                    >
                      <td className={`${styles.td} ${styles.mono}`}>
                        <span className={styles.billBadge}>
                          {row.billNo || `PUR-${String(row.id).padStart(3, '0')}`}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.dateText}>{row.date}</span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.supplierName}>{supplierName}</span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.vehicleText}>{row.vehicleNo || 'Weighbridge direct'}</span>
                      </td>
                      <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                        <span className={styles.amountText}>
                          {fmtINR(row.grandTotal ?? row.amount)}
                        </span>
                      </td>
                      <td className={`${styles.td} ${styles.center}`}>
                        <span className={`${styles.badge} ${styles[s.className]}`}>
                          {row.status || s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Inward Purchase Inspection Modal */}
      {selectedPurchase && (
        <PurchaseViewModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      )}
    </>
  );
}
