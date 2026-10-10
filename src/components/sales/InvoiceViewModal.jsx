/**
 * InvoiceViewModal — Forbusyness Web ERP
 *
 * Read-only historical sales invoice viewer.
 * Shows:
 * - Invoice number
 * - Date
 * - Customer details
 * - Items (Qty, Unit, Rate, Discount, Amount)
 * - Freight, Round Off, Grand Total
 * - Received, Pending
 * - Status & Notes
 */

import styles from './InvoiceViewModal.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(val || 0);
}

export default function InvoiceViewModal({ invoice, onClose, onPrint }) {
  if (!invoice) return null;

  const statusClass =
    invoice.status === 'Paid'
      ? styles.badgePaid
      : invoice.status === 'Partially Paid'
      ? styles.badgePartially
      : styles.badgePending;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.title}>Invoice #{invoice.invoiceNo}</span>
            <span className={`${styles.badge} ${statusClass}`}>{invoice.status}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.body}>
          {/* Metadata */}
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Customer</span>
              <span className={styles.metaValue}>{invoice.customer?.name}</span>
              <span className={styles.metaSub}>{invoice.customer?.phone}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Invoice Date</span>
              <span className={styles.metaValue}>{invoice.date}</span>
              {invoice.reference && (
                <span className={styles.metaSub}>Ref: {invoice.reference}</span>
              )}
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Payment Status</span>
              <span className={styles.metaValue}>{invoice.status}</span>
              <span className={styles.metaSub}>
                Received: {fmtINR(invoice.received)} | Pending: {fmtINR(invoice.pending)}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>#</th>
                  <th className={styles.th}>Product</th>
                  <th className={`${styles.th} ${styles.right}`}>Qty</th>
                  <th className={styles.th}>Unit</th>
                  <th className={`${styles.th} ${styles.right}`}>Rate</th>
                  <th className={`${styles.th} ${styles.right}`}>Discount</th>
                  <th className={`${styles.th} ${styles.right}`}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className={`${styles.td} ${styles.mono}`}>{idx + 1}</td>
                    <td className={styles.td}>
                      <strong>{item.productName}</strong>
                      {item.productCode && (
                        <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748b' }}>
                          {item.productCode}
                        </span>
                      )}
                    </td>
                    <td className={`${styles.td} ${styles.right} ${styles.mono}`}>{item.qty}</td>
                    <td className={styles.td}>{item.unit}</td>
                    <td className={`${styles.td} ${styles.right} ${styles.mono}`}>{fmtINR(item.rate)}</td>
                    <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                      {item.discount ? fmtINR(item.discount) : '—'}
                    </td>
                    <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                      {fmtINR(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary & Notes */}
          <div className={styles.summaryRow}>
            <div className={styles.notesBox}>
              <div className={styles.notesLabel}>Notes / Terms</div>
              <p>{invoice.notes || 'No special terms recorded.'}</p>
            </div>

            <div className={styles.calcTable}>
              <div className={styles.calcRow}>
                <span>Subtotal:</span>
                <span className={styles.mono}>{fmtINR(invoice.subtotal)}</span>
              </div>
              {Number(invoice.discount) > 0 && (
                <div className={styles.calcRow}>
                  <span>Discount:</span>
                  <span className={styles.mono}>-{fmtINR(invoice.discount)}</span>
                </div>
              )}
              {Number(invoice.freight) > 0 && (
                <div className={styles.calcRow}>
                  <span>Freight:</span>
                  <span className={styles.mono}>+{fmtINR(invoice.freight)}</span>
                </div>
              )}
              {Number(invoice.roundOff) !== 0 && (
                <div className={styles.calcRow}>
                  <span>Round Off:</span>
                  <span className={styles.mono}>{invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                </div>
              )}
              <div className={`${styles.calcRow} ${styles.grand}`}>
                <span>Grand Total:</span>
                <span className={styles.mono}>{fmtINR(invoice.grandTotal)}</span>
              </div>
              <div className={`${styles.calcRow} ${styles.received}`}>
                <span>Received:</span>
                <span className={styles.mono}>{fmtINR(invoice.received)}</span>
              </div>
              <div className={`${styles.calcRow} ${styles.pending}`}>
                <span>Pending Balance:</span>
                <span className={styles.mono}>{fmtINR(invoice.pending)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={onClose}>
            Close
          </button>
          <button
            className={styles.btnPrint}
            onClick={() => {
              if (onPrint) onPrint(invoice);
              else window.print();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
