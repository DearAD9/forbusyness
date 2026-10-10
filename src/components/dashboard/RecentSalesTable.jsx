/**
 * RecentSalesTable — Forbusyness Web ERP
 *
 * Real-time Sales Invoices Activity Table.
 * Displays descending sequential invoices (#245, #244...), customer account,
 * date, amount, and payment reconciliation status.
 * Click row to open instant Invoice Inspection Modal.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InvoiceViewModal from '../sales/InvoiceViewModal';
import styles from './RecentSalesTable.module.css';

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

export default function RecentSalesTable({ rows = [], onViewAll }) {
  const navigate = useNavigate();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
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
                stroke="#6d28d9"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h2 className={styles.title}>Recent Sales Invoices</h2>
            </div>
          </div>

          <button
            type="button"
            className={styles.viewAllBtn}
            onClick={onViewAll}
            aria-label="View all sales invoices"
          >
            All Invoices →
          </button>
        </div>

        <div className={styles.tableWrapper}>
          {isEmpty ? (
            <div className={styles.emptyBox}>
              <div className={styles.emptyIcon}>📄</div>
              <p className={styles.emptyTitle}>No Sales Invoices Recorded</p>
              <p className={styles.emptyDesc}>Generate your first sales invoice for steel dispatch</p>
              <button
                type="button"
                className={styles.emptyActionBtn}
                onClick={() => navigate('/sales/invoices/new')}
              >
                + Create New Invoice
              </button>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Invoice No.</th>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Customer</th>
                  <th className={`${styles.th} ${styles.right}`}>Grand Total</th>
                  <th className={`${styles.th} ${styles.center}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, idx) => {
                  const statusKey = (row.status || 'pending').toLowerCase();
                  const s = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                  const customerName = row.customer?.name || row.customer || 'Direct Steel Customer';

                  return (
                    <tr
                      key={row.id || idx}
                      className={styles.row}
                      onClick={() => setSelectedInvoice(row)}
                      title="Click to inspect invoice and print challan"
                    >
                      <td className={`${styles.td} ${styles.mono}`}>
                        <span className={styles.invNoBadge}>
                          #{row.invoiceNo || row.id}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.dateText}>{row.date}</span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.customerName}>{customerName}</span>
                        {row.customer?.city && (
                          <span className={styles.customerCity}> • {row.customer.city}</span>
                        )}
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

      {/* Invoice Inspection Modal */}
      {selectedInvoice && (
        <InvoiceViewModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </>
  );
}
