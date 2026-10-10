/**
 * SalesReturnPage — Forbusyness Web ERP
 *
 * Professional Sales Return / Credit Note workflow:
 * 1. Enter original invoice number & click Fetch
 * 2. View customer & original invoice info
 * 3. View original invoice items with Available quantity calculation
 * 4. Add items to return table (enforces Return Qty <= Available)
 * 5. Select return reason & optional notes
 * 6. Review return summary with Total Return Amount emphasis
 * 7. Save Return (F5) / Save & Print (F6) / Clear (F7) / Preview
 */

import { useState, useRef, useEffect } from 'react';
import ERPLayout from '../components/layout/ERPLayout';
import { getOriginalInvoiceForReturn, createSalesReturn } from '../services/salesReturnService';
import styles from './SalesReturnPage.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(val || 0);
}

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

const RETURN_REASONS = [
  'Wrong material',
  'Damaged material',
  'Excess quantity',
  'Customer cancellation',
  'Quality issue',
  'Other',
];

export default function SalesReturnPage() {
  // Header State
  const [returnDate, setReturnDate] = useState(getTodayISO);
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  // Original Invoice Data
  const [originalInvoice, setOriginalInvoice] = useState(null);

  // Return Items (Items selected to return)
  // Each: { productId, productName, productCode, unit, rate, returnQty, available, returnAmount }
  const [returnItems, setReturnItems] = useState([]);

  // Return Reason & Notes
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [notes, setNotes] = useState('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [qtyErrors, setQtyErrors] = useState({});

  // ── Fetch Original Invoice ──────────────────────────────────────
  const handleFetchInvoice = async (e) => {
    e?.preventDefault();
    const cleanNo = invoiceQuery.trim().replace(/^#/, '');
    if (!cleanNo) {
      setErrorMessage('Please enter an original invoice number to fetch.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const data = await getOriginalInvoiceForReturn(cleanNo);
      setOriginalInvoice(data);
      setReturnItems([]); // reset return items on new fetch
    } catch (err) {
      setErrorMessage(err.message || 'Invoice not found.');
      setOriginalInvoice(null);
    } finally {
      setIsFetching(false);
    }
  };

  // ── Add Item to Return ──────────────────────────────────────────
  const handleAddItemToReturn = (origItem) => {
    // Check if already in return items
    const existing = returnItems.find((r) => r.productId === origItem.productId);
    if (existing) {
      setErrorMessage(`${origItem.productName} is already added in the return list below.`);
      return;
    }

    if (origItem.available <= 0) {
      setErrorMessage(`No available quantity left to return for ${origItem.productName}.`);
      return;
    }

    const defaultReturnQty = Math.min(1, origItem.available);
    const returnAmount = defaultReturnQty * origItem.originalRate;

    const newReturnItem = {
      productId: origItem.productId,
      productName: origItem.productName,
      productCode: origItem.productCode,
      unit: origItem.unit,
      rate: origItem.originalRate,
      soldQty: origItem.soldQty,
      available: origItem.available,
      returnQty: defaultReturnQty,
      returnAmount,
    };

    setReturnItems((prev) => [...prev, newReturnItem]);
    setErrorMessage('');
  };

  // ── Update Return Quantity with Strict Validation ───────────────
  const handleQtyChange = (productId, newQtyStr) => {
    const val = parseFloat(newQtyStr);

    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        // Validation rule: user cannot enter more than available
        if (val > item.available) {
          setQtyErrors((errs) => ({
            ...errs,
            [productId]: `Max returnable is ${item.available} ${item.unit}`,
          }));
        } else if (val <= 0 || isNaN(val)) {
          setQtyErrors((errs) => ({
            ...errs,
            [productId]: 'Quantity must be greater than 0',
          }));
        } else {
          setQtyErrors((errs) => {
            const next = { ...errs };
            delete next[productId];
            return next;
          });
        }

        const validQty = isNaN(val) ? 0 : val;
        return {
          ...item,
          returnQty: newQtyStr,
          returnAmount: validQty * item.rate,
        };
      })
    );
  };

  const handleDeleteReturnItem = (productId) => {
    setReturnItems((prev) => prev.filter((item) => item.productId !== productId));
    setQtyErrors((errs) => {
      const next = { ...errs };
      delete next[productId];
      return next;
    });
  };

  // ── Return Summary Calculations ─────────────────────────────────
  const totalItems = returnItems.length;
  const totalQuantity = returnItems.reduce(
    (sum, item) => sum + (parseFloat(item.returnQty) || 0),
    0
  );
  const subtotal = returnItems.reduce((sum, item) => sum + (item.returnAmount || 0), 0);
  const totalReturnAmount = Math.round(subtotal);
  const roundOff = parseFloat((totalReturnAmount - subtotal).toFixed(2));

  // ── Save Return ─────────────────────────────────────────────────
  const handleSave = async (andPrint = false) => {
    if (!originalInvoice) {
      setErrorMessage('Please fetch an original invoice first.');
      return;
    }

    if (returnItems.length === 0) {
      setErrorMessage('Please add at least one item to return.');
      return;
    }

    // Check for any quantity errors
    const hasErrors = Object.keys(qtyErrors).length > 0;
    if (hasErrors) {
      setErrorMessage('Please correct invalid return quantities before saving.');
      return;
    }

    // Validate that all return quantities are valid
    for (const item of returnItems) {
      const q = parseFloat(item.returnQty);
      if (isNaN(q) || q <= 0 || q > item.available) {
        setErrorMessage(
          `Invalid return quantity for ${item.productName}. Must be between 0.01 and ${item.available}.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const returnPayload = {
        returnDate,
        originalInvoiceNo: originalInvoice.invoiceNo,
        customer: originalInvoice.customer,
        reason,
        notes: notes.trim(),
        items: returnItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          unit: item.unit,
          rate: item.rate,
          returnQty: parseFloat(item.returnQty),
          returnAmount: item.returnAmount,
        })),
        totalItems,
        totalQty: totalQuantity,
        subtotal,
        roundOff,
        totalReturnAmount,
      };

      const saved = await createSalesReturn(returnPayload);
      setSuccessMessage(
        `Credit Note #${saved.returnNo} for Invoice #${originalInvoice.invoiceNo} created successfully! Total: ${fmtINR(
          totalReturnAmount
        )}`
      );

      if (andPrint) {
        window.print();
      }

      // Reset
      handleClear(false);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create sales return.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Clear ───────────────────────────────────────────────────────
  const handleClear = (confirm = true) => {
    if (confirm && (originalInvoice || returnItems.length > 0)) {
      const ok = window.confirm('Are you sure you want to clear this return?');
      if (!ok) return;
    }

    setInvoiceQuery('');
    setOriginalInvoice(null);
    setReturnItems([]);
    setNotes('');
    setReason(RETURN_REASONS[0]);
    setQtyErrors({});
  };

  // ── Keyboard Shortcuts (F5, F6, F7) ─────────────────────────────
  const handleSaveRef = useRef();
  const handleClearRef = useRef();

  useEffect(() => {
    handleSaveRef.current = handleSave;
    handleClearRef.current = handleClear;
  });

  useEffect(() => {
    const handleKeyDownGlobal = (e) => {
      if (e.key === 'F5') {
        e.preventDefault();
        handleSaveRef.current?.(false);
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleSaveRef.current?.(true);
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleClearRef.current?.(true);
      }
    };
    window.addEventListener('keydown', handleKeyDownGlobal);
    return () => window.removeEventListener('keydown', handleKeyDownGlobal);
  }, []);

  return (
    <ERPLayout pageTitle="Sales → Sales Return">
      <div className={styles.container}>
        {/* ── Page Header ────────────────────────────── */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.breadcrumbs}>
              Sales / <span className={styles.breadcrumbActive}>Sales Return</span>
            </div>
            <h1 className={styles.title}>Sales Return</h1>
            <p className={styles.subtitle}>Create a new sales return (Credit Note)</p>
          </div>
        </div>

        {/* Feedback messages */}
        {successMessage && (
          <div className={styles.alertSuccess} role="status">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className={styles.alertError} role="alert">
            {errorMessage}
          </div>
        )}

        {/* ── Header Form Card ───────────────────────── */}
        <div className={styles.card}>
          <div className={styles.returnHeaderGrid}>
            {/* Return No: AUTO */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Return No.</label>
              <input
                type="text"
                className={styles.inputAuto}
                value="AUTO"
                readOnly
                title="Return number is generated sequentially by backend"
              />
            </div>

            {/* Return Date */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Return Date</label>
              <input
                type="date"
                className={styles.inputDate}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>

            {/* Original Invoice No + Fetch Button */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Original Invoice No. *</label>
              <form className={styles.fetchGroup} onSubmit={handleFetchInvoice}>
                <input
                  type="text"
                  className={styles.inputText}
                  placeholder="Enter Invoice No. (e.g. 245, 244, 238)..."
                  value={invoiceQuery}
                  onChange={(e) => setInvoiceQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className={styles.btnFetch}
                  disabled={isFetching}
                >
                  {isFetching ? 'Fetching…' : 'Fetch'}
                </button>
              </form>
            </div>
          </div>

          {/* ── Original Invoice Information Banner ───── */}
          {originalInvoice && (
            <div className={styles.originalInvoiceBanner}>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Customer Name</span>
                <span className={styles.infoValue}>{originalInvoice.customer?.name}</span>
                <span className={styles.infoSub}>{originalInvoice.customer?.phone}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Original Invoice</span>
                <span className={styles.infoValue}>#{originalInvoice.invoiceNo}</span>
                <span className={styles.infoSub}>Date: {originalInvoice.date}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Original Invoice Total</span>
                <span className={styles.infoValue}>{fmtINR(originalInvoice.grandTotal)}</span>
                <span className={styles.infoSub}>Items: {originalInvoice.items?.length || 0}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Credit Note Status</span>
                <span className={styles.infoValue} style={{ color: '#2563eb' }}>
                  Ready to return items
                </span>
                <span className={styles.infoSub}>Select items below</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Original Invoice Items Table ───────────── */}
        {originalInvoice && (
          <div className={styles.card} style={{ padding: '16px' }}>
            <div className={styles.sectionTitle}>
              <span>Original Invoice Items</span>
              <span className={styles.badgeAvailable}>Available items for return</span>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }} className={styles.th}>#</th>
                      <th className={styles.th}>Product</th>
                      <th style={{ width: '100px' }} className={`${styles.th} ${styles.right}`}>Sold Qty</th>
                      <th style={{ width: '70px' }} className={styles.th}>Unit</th>
                      <th style={{ width: '110px' }} className={`${styles.th} ${styles.right}`}>Original Rate</th>
                      <th style={{ width: '120px' }} className={`${styles.th} ${styles.right}`}>Already Returned</th>
                      <th style={{ width: '100px' }} className={`${styles.th} ${styles.right}`}>Available</th>
                      <th style={{ width: '90px' }} className={`${styles.th} ${styles.center}`}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(originalInvoice.items || []).map((item, idx) => {
                      const isAdded = returnItems.some((r) => r.productId === item.productId);
                      const isZeroAvailable = item.available <= 0;

                      return (
                        <tr key={item.productId}>
                          <td className={`${styles.td} ${styles.mono}`}>{idx + 1}</td>
                          <td className={styles.td}>
                            <strong>{item.productName}</strong>
                            {item.productCode && (
                              <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block' }}>
                                {item.productCode}
                              </span>
                            )}
                          </td>
                          <td className={`${styles.td} ${styles.right} ${styles.mono}`}>{item.soldQty}</td>
                          <td className={styles.td}>{item.unit}</td>
                          <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                            {fmtINR(item.originalRate)}
                          </td>
                          <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                            {item.alreadyReturned > 0 ? (
                              <span style={{ color: '#b91c1c' }}>{item.alreadyReturned}</span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td
                            className={`${styles.td} ${styles.right} ${styles.mono}`}
                            style={{ fontWeight: 600, color: item.available > 0 ? '#047857' : '#94a3b8' }}
                          >
                            {item.available}
                          </td>
                          <td className={`${styles.td} ${styles.center}`}>
                            <button
                              type="button"
                              className={styles.btnAddItem}
                              disabled={isZeroAvailable || isAdded}
                              onClick={() => handleAddItemToReturn(item)}
                              title={
                                isZeroAvailable
                                  ? 'No quantity available to return'
                                  : isAdded
                                  ? 'Already added to return'
                                  : 'Add item to return'
                              }
                            >
                              {isAdded ? 'Added ✓' : '+ Add'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Return Items Table (Items being returned) ── */}
        <div className={styles.card} style={{ padding: '16px' }}>
          <div className={styles.sectionTitle}>
            <span>Return Items</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>
              ({returnItems.length} selected for return)
            </span>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }} className={styles.th}>#</th>
                    <th className={styles.th}>Product</th>
                    <th style={{ width: '130px' }} className={`${styles.th} ${styles.right}`}>Return Qty</th>
                    <th style={{ width: '70px' }} className={styles.th}>Unit</th>
                    <th style={{ width: '110px' }} className={`${styles.th} ${styles.right}`}>Rate (₹)</th>
                    <th style={{ width: '130px' }} className={`${styles.th} ${styles.right}`}>Return Amount</th>
                    <th style={{ width: '60px' }} className={`${styles.th} ${styles.center}`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {returnItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                        {originalInvoice
                          ? 'No items added yet. Click "+ Add" on any invoice item above.'
                          : 'Fetch an original invoice above to select items to return.'}
                      </td>
                    </tr>
                  ) : (
                    returnItems.map((item, idx) => {
                      const hasError = Boolean(qtyErrors[item.productId]);
                      return (
                        <tr key={item.productId}>
                          <td className={`${styles.td} ${styles.mono}`}>{idx + 1}</td>
                          <td className={styles.td}>
                            <strong>{item.productName}</strong>
                            <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block' }}>
                              Available: {item.available} {item.unit}
                            </span>
                          </td>
                          <td className={`${styles.td} ${styles.right}`}>
                            <input
                              type="number"
                              step="any"
                              className={`${styles.inputReturnQty} ${hasError ? styles.error : ''}`}
                              value={item.returnQty}
                              onChange={(e) => handleQtyChange(item.productId, e.target.value)}
                            />
                            {hasError && (
                              <span style={{ display: 'block', fontSize: '0.625rem', color: '#ef4444' }}>
                                {qtyErrors[item.productId]}
                              </span>
                            )}
                          </td>
                          <td className={styles.td}>{item.unit}</td>
                          <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                            {fmtINR(item.rate)}
                          </td>
                          <td className={`${styles.td} ${styles.right} ${styles.mono}`} style={{ fontWeight: 600 }}>
                            {fmtINR(item.returnAmount)}
                          </td>
                          <td className={`${styles.td} ${styles.center}`}>
                            <button
                              type="button"
                              className={styles.btnDelete}
                              onClick={() => handleDeleteReturnItem(item.productId)}
                              title="Remove return item"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Bottom Grid: Reason, Notes & Return Summary ── */}
        <div className={styles.bottomGrid}>
          {/* Reason & Notes */}
          <div className={styles.reasonCard}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Return Reason *</label>
              <select
                className={styles.selectReason}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Notes / Remarks (Optional)</label>
              <textarea
                className={styles.textareaNotes}
                placeholder="Reason details, inspection report remarks, damage observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Return Summary */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryRow}>
              <span>Total Items:</span>
              <span className={styles.mono}>{totalItems}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Total Quantity:</span>
              <span className={styles.mono}>{totalQuantity.toFixed(2)}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Subtotal:</span>
              <span className={styles.mono}>{fmtINR(subtotal)}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Round Off:</span>
              <span className={styles.mono}>
                {roundOff > 0 ? `+${roundOff}` : roundOff}
              </span>
            </div>

            {/* Total Return Amount (Primary visual emphasis) */}
            <div className={styles.totalReturnRow}>
              <span>Total Return Amount:</span>
              <span className={styles.mono}>{fmtINR(totalReturnAmount)}</span>
            </div>

            {/* Informational Message */}
            <div className={styles.infoNote}>
              ℹ️ This will create a credit note and adjust the customer's balance.
            </div>
          </div>
        </div>

        {/* ── Actions Bar ─────────────────────────────── */}
        <div className={styles.actionBar}>
          <div className={styles.actionLeft}>
            <button
              type="button"
              className={`${styles.btnAction} ${styles.btnClear}`}
              onClick={() => handleClear(true)}
              title="Clear return (F7)"
            >
              Clear <span className={styles.shortcutBadge}>F7</span>
            </button>
          </div>

          <div className={styles.actionRight}>
            <button
              type="button"
              className={`${styles.btnAction} ${styles.btnSecondary}`}
              onClick={() => handleSave(true)}
              disabled={isSubmitting || returnItems.length === 0}
              title="Save & Print (F6)"
            >
              Save & Print <span className={styles.shortcutBadge}>F6</span>
            </button>
            <button
              type="button"
              className={`${styles.btnAction} ${styles.btnPrimary}`}
              onClick={() => handleSave(false)}
              disabled={isSubmitting || returnItems.length === 0}
              title="Save Return (F5)"
            >
              {isSubmitting ? 'Saving…' : 'Save Return'} <span className={styles.shortcutBadge}>F5</span>
            </button>
          </div>
        </div>
      </div>
    </ERPLayout>
  );
}
