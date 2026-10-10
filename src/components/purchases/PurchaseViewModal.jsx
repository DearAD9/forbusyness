/**
 * PurchaseViewModal — Forbusyness Web ERP
 *
 * Clean inspection modal for steel inward purchase vouchers.
 * Displays supplier logistics, weighbridge slips, line items, and payment reconciliation.
 */

import styles from './PurchaseViewModal.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
}

export default function PurchaseViewModal({ purchase, onClose }) {
  if (!purchase) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.headerTitle}>Inward Goods Purchase Voucher</h2>
            <span className={styles.billBadge}>{purchase.billNo}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Logistics & Supplier Grid */}
          <div className={styles.infoGrid}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Supplier Details</span>
              <span className={styles.infoVal}>{purchase.supplier?.name || 'Cash / Direct Mill'}</span>
              {purchase.supplier?.city && (
                <span className={styles.infoValSub}>City: {purchase.supplier.city}</span>
              )}
            </div>

            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Inward Logistics & Bill Reference</span>
              <span className={styles.infoVal}>Date: {purchase.date}</span>
              <span className={styles.infoValSub}>
                Supplier Bill Ref: <strong>{purchase.supplierBillNo || '—'}</strong>
              </span>
              <span className={styles.infoValSub}>
                Vehicle / Truck No: <strong>{purchase.vehicleNo || '—'}</strong>
              </span>
              <span className={styles.infoValSub}>
                Weighbridge Slip: <strong>{purchase.weighbridgeSlip || '—'}</strong>
              </span>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Received Steel Materials ({purchase.items?.length || 0} items)
            </h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>#</th>
                  <th className={styles.th}>Material Description</th>
                  <th className={styles.th}>HSN</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Qty</th>
                  <th className={styles.th}>Unit</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Rate (₹)</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(purchase.items || []).map((item, index) => (
                  <tr key={index}>
                    <td className={styles.td}>{index + 1}</td>
                    <td className={styles.td}>
                      <strong>{item.productName || item.name}</strong>
                    </td>
                    <td className={styles.td}>{item.hsn || '—'}</td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      {Number(item.qty || 0).toLocaleString()}
                    </td>
                    <td className={styles.td}>{item.unit || 'KG'}</td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      {fmtINR(item.rate)}
                    </td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      <strong>{fmtINR(item.amount)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className={styles.summaryRow}>
            <div>
              {purchase.notes && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '0.8125rem',
                  color: '#475569'
                }}>
                  <strong style={{ color: '#0f172a' }}>Receiving Remarks:</strong> {purchase.notes}
                </div>
              )}
            </div>

            <div className={styles.financialsBox}>
              <div className={styles.finLine}>
                <span>Materials Subtotal:</span>
                <span>{fmtINR(purchase.subtotal)}</span>
              </div>

              {purchase.freightInward > 0 && (
                <div className={styles.finLine}>
                  <span>Inward Freight & Cartage:</span>
                  <span>+{fmtINR(purchase.freightInward)}</span>
                </div>
              )}

              {purchase.roundOff !== 0 && (
                <div className={styles.finLine}>
                  <span>Round Off:</span>
                  <span>{purchase.roundOff > 0 ? `+${fmtINR(purchase.roundOff)}` : fmtINR(purchase.roundOff)}</span>
                </div>
              )}

              <div className={styles.finLineTotal}>
                <span>Grand Total:</span>
                <span>{fmtINR(purchase.grandTotal)}</span>
              </div>

              <div className={styles.finLine}>
                <span>Paid on Inward:</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>{fmtINR(purchase.paid)}</span>
              </div>

              <div className={styles.finLineBalance}>
                <span>Outstanding Payable:</span>
                <span>{fmtINR(purchase.pending)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.btnPrint} onClick={handlePrint}>
            🖨️ Print Voucher
          </button>
          <button type="button" className={styles.btnClose} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
