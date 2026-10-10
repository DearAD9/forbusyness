/**
 * PrintInvoiceModal — Forbusyness Web ERP
 *
 * Professional printable invoice / preview modal.
 * Clean steel-business layout for printing or PDF export.
 */

import styles from './PrintInvoiceModal.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(val || 0);
}

export default function PrintInvoiceModal({ invoice, onClose }) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.topBar}>
          <span>Print Preview — Invoice #{invoice.invoiceNo}</span>
          <button className={styles.btnClose} onClick={onClose} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
            ✕
          </button>
        </div>

        {/* Printable Sheet */}
        <div className={styles.printSheet}>
          <div className={styles.invoiceHeader}>
            <div>
              <div className={styles.companyTitle}>forbusyness</div>
              <div className={styles.companySub}>Steel & Iron Materials Trading</div>
              <div className={styles.companySub}>Kalamboli Steel Yard, Navi Mumbai</div>
            </div>
            <div className={styles.invoiceTitleBlock}>
              <div className={styles.docTitle}>INVOICE</div>
              <div className={styles.docMeta}>
                <strong>Invoice No:</strong> #{invoice.invoiceNo}
              </div>
              <div className={styles.docMeta}>
                <strong>Date:</strong> {invoice.date}
              </div>
              {invoice.reference && (
                <div className={styles.docMeta}>
                  <strong>Ref:</strong> {invoice.reference}
                </div>
              )}
            </div>
          </div>

          <div className={styles.partiesGrid}>
            <div className={styles.partyBox}>
              <h4>Billed To (Customer):</h4>
              <div className={styles.partyName}>{invoice.customer?.name}</div>
              <div className={styles.partyDetails}>{invoice.customer?.address || invoice.customer?.city}</div>
              <div className={styles.partyDetails}>Phone: {invoice.customer?.phone}</div>
            </div>
            <div className={styles.partyBox}>
              <h4>Payment & Supply:</h4>
              <div className={styles.partyDetails}>
                <strong>Status:</strong> {invoice.status}
              </div>
              <div className={styles.partyDetails}>
                <strong>Received:</strong> {fmtINR(invoice.received)}
              </div>
              <div className={styles.partyDetails}>
                <strong>Balance Due:</strong> {fmtINR(invoice.pending)}
              </div>
              {invoice.notes && (
                <div className={styles.partyDetails} style={{ marginTop: '4px' }}>
                  <strong>Notes:</strong> {invoice.notes}
                </div>
              )}
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Material Description</th>
                <th className={styles.right} style={{ width: '80px' }}>Qty</th>
                <th style={{ width: '60px' }}>Unit</th>
                <th className={styles.right} style={{ width: '100px' }}>Rate</th>
                <th className={styles.right} style={{ width: '90px' }}>Discount</th>
                <th className={styles.right} style={{ width: '120px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{item.productName}</strong>
                    {item.productCode && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '6px' }}>
                        ({item.productCode})
                      </span>
                    )}
                  </td>
                  <td className={styles.right}>{item.qty}</td>
                  <td>{item.unit}</td>
                  <td className={styles.right}>{fmtINR(item.rate)}</td>
                  <td className={styles.right}>{item.discount ? fmtINR(item.discount) : '—'}</td>
                  <td className={styles.right}>{fmtINR(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.totalsRow}>
            <div className={styles.totalsTable}>
              <div className={styles.rowItem}>
                <span>Subtotal:</span>
                <span>{fmtINR(invoice.subtotal)}</span>
              </div>
              {Number(invoice.discount) > 0 && (
                <div className={styles.rowItem}>
                  <span>Discount:</span>
                  <span>-{fmtINR(invoice.discount)}</span>
                </div>
              )}
              {Number(invoice.freight) > 0 && (
                <div className={styles.rowItem}>
                  <span>Freight:</span>
                  <span>+{fmtINR(invoice.freight)}</span>
                </div>
              )}
              {Number(invoice.roundOff) !== 0 && (
                <div className={styles.rowItem}>
                  <span>Round Off:</span>
                  <span>{invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                </div>
              )}
              <div className={`${styles.rowItem} ${styles.grand}`}>
                <span>Grand Total:</span>
                <span>{fmtINR(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className={styles.termsFooter}>
            <div>
              <p>1. Weight tolerance ±2% as per IS specifications.</p>
              <p>2. Goods once sold will not be accepted back without Credit Note.</p>
              <p>3. Subject to local jurisdiction.</p>
            </div>
            <div className={styles.signBlock}>
              Authorized Signatory
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnClose} onClick={onClose}>
            Close
          </button>
          <button className={styles.btnPrint} onClick={handlePrint}>
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
