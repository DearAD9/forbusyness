/**
 * NewInvoicePage — Forbusyness Web ERP
 *
 * Professional ERP invoice-entry workbench.
 * Header: Sales → New Invoice
 *
 * Fields:
 * - Invoice Number: AUTO (read-only, sequential backend generation later)
 * - Invoice Date: today
 * - Customer: searchable customer combobox
 * - Reference: optional reference / PO
 *
 * NO Payment Mode on this screen!
 * Fast ERP product selection workflow:
 * Product → Enter → Qty → Rate → Enter → Next row
 * Supports decimal quantities (e.g. 12.5 KG).
 *
 * Actions:
 * - Save Invoice (F5)
 * - Save & Print (F6)
 * - Clear (F7) with confirmation if data entered
 * - Preview
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import ProductSearchSelect from '../components/sales/ProductSearchSelect';
import CustomerSelect from '../components/sales/CustomerSelect';
import PrintInvoiceModal from '../components/sales/PrintInvoiceModal';
import QuickProductDrawer from '../components/sales/QuickProductDrawer';
import { createInvoice } from '../services/invoiceService';
import { getCustomerById } from '../services/customerService';
import styles from './NewInvoicePage.module.css';

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

export default function NewInvoicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Invoice Header State
  const [invoiceDate, setInvoiceDate] = useState(getTodayISO);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [reference, setReference] = useState('');

  // Pre-select customer if customerId passed in URL
  useEffect(() => {
    const custId = searchParams.get('customerId');
    if (custId) {
      getCustomerById(custId).then((c) => {
        if (c) setSelectedCustomer(c);
      });
    }
  }, [searchParams]);

  // Line Items in Invoice
  const [items, setItems] = useState([]);

  // Draft Item Entry State
  const [draftProduct, setDraftProduct] = useState(null);
  const [draftQty, setDraftQty] = useState('');
  const [draftRate, setDraftRate] = useState('');
  const [draftDiscount, setDraftDiscount] = useState('0');

  // Summary State
  const [freight, setFreight] = useState('0');
  const [receivedToday, setReceivedToday] = useState('0');
  const [notes, setNotes] = useState('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [errors, setErrors] = useState({});

  // Floating Quick Product Drawer State
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [quickProductInitialName, setQuickProductInitialName] = useState('');

  // Input refs for fast keyboard workflow:
  // Product -> Qty -> Rate -> Enter -> Add & focus Product
  const productInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const rateInputRef = useRef(null);

  // Global Alt+P keyboard shortcut to open floating product creator
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setQuickProductInitialName('');
        setIsQuickProductOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Product Selection Callback ──────────────────────────────────
  const handleProductSelect = (product) => {
    setDraftProduct(product);
    setDraftRate(product.sellingRate ? String(product.sellingRate) : '');
    setDraftQty('1');
    setDraftDiscount('0');
    // Focus Qty next
    setTimeout(() => {
      if (qtyInputRef.current) {
        qtyInputRef.current.focus();
        qtyInputRef.current.select();
      }
    }, 40);
  };

  // ── Open Floating Drawer from Dropdown or Floating Tab ───────────
  const handleOpenQuickProduct = (name = '') => {
    setQuickProductInitialName(typeof name === 'string' ? name : '');
    setIsQuickProductOpen(true);
  };

  // ── Handle Newly Created Product from Drawer ────────────────────
  const handleProductCreated = (newProduct) => {
    setDraftProduct(newProduct);
    setDraftRate(newProduct.sellingRate ? String(newProduct.sellingRate) : '');
    setDraftQty('1');
    setDraftDiscount('0');
    setSuccessMessage(`Product "${newProduct.name}" created & inserted into invoice line!`);
    setTimeout(() => setSuccessMessage(''), 4500);

    // Focus Qty next for rapid workflow
    setTimeout(() => {
      if (qtyInputRef.current) {
        qtyInputRef.current.focus();
        qtyInputRef.current.select();
      }
    }, 60);
  };

  // ── Add Item to Table ───────────────────────────────────────────
  const handleAddItem = () => {
    if (!draftProduct) {
      setErrors((prev) => ({ ...prev, product: 'Select a product first.' }));
      if (productInputRef.current) productInputRef.current.focus();
      return;
    }

    const qty = parseFloat(draftQty);
    if (isNaN(qty) || qty <= 0) {
      setErrors((prev) => ({ ...prev, qty: 'Enter a valid quantity.' }));
      if (qtyInputRef.current) qtyInputRef.current.focus();
      return;
    }

    const rate = parseFloat(draftRate);
    if (isNaN(rate) || rate < 0) {
      setErrors((prev) => ({ ...prev, rate: 'Enter a valid rate.' }));
      if (rateInputRef.current) rateInputRef.current.focus();
      return;
    }

    const disc = parseFloat(draftDiscount) || 0;
    const grossAmount = qty * rate;
    const lineAmount = Math.max(0, grossAmount - disc);

    const newItem = {
      id: Date.now(),
      productId: draftProduct.id,
      productName: draftProduct.name,
      productCode: draftProduct.code,
      qty,
      unit: draftProduct.unit || 'KG',
      rate,
      discount: disc,
      amount: lineAmount,
    };

    setItems((prev) => [...prev, newItem]);

    // Reset draft fields
    setDraftProduct(null);
    setDraftQty('');
    setDraftRate('');
    setDraftDiscount('0');
    setErrors({});

    // Refocus Product search for rapid next entry
    setTimeout(() => {
      if (productInputRef.current) {
        productInputRef.current.focus();
      }
    }, 40);
  };

  const handleDeleteItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // ── Invoice Calculations ────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const totalItemDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const freightVal = parseFloat(freight) || 0;
  const rawGrandTotal = Math.max(0, subtotal - totalItemDiscount) + freightVal;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = parseFloat((grandTotal - rawGrandTotal).toFixed(2));

  const receivedVal = parseFloat(receivedToday) || 0;
  const pendingAmount = Math.max(0, grandTotal - receivedVal);

  // ── Form Validation ─────────────────────────────────────────────
  const validateForm = () => {
    const errs = {};
    if (!selectedCustomer) {
      errs.customer = 'Please select a customer.';
    }
    if (items.length === 0) {
      errs.items = 'Please add at least one item to the invoice.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save Invoice ────────────────────────────────────────────────
  const handleSave = async (andPrint = false) => {
    if (!validateForm()) {
      setErrorMessage('Please fix highlighted fields before saving.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const invoicePayload = {
        date: invoiceDate,
        customer: selectedCustomer,
        reference: reference.trim(),
        items,
        subtotal,
        discount: totalItemDiscount,
        freight: freightVal,
        roundOff,
        grandTotal,
        receivedToday: receivedVal,
        notes: notes.trim(),
      };

      const saved = await createInvoice(invoicePayload);
      setSuccessMessage(`Invoice #${saved.invoiceNo} saved successfully!`);

      if (andPrint) {
        setPreviewInvoice(saved);
        handleReset(false);
      } else {
        handleReset(false);
        setTimeout(() => {
          navigate('/sales/invoices');
        }, 700);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reset / Clear ───────────────────────────────────────────────
  const handleReset = (confirm = true) => {
    const hasData = selectedCustomer || items.length > 0 || reference || notes;
    if (confirm && hasData) {
      const ok = window.confirm('Are you sure you want to clear this invoice? All entered data will be lost.');
      if (!ok) return;
    }

    setSelectedCustomer(null);
    setReference('');
    setInvoiceDate(getTodayISO());
    setItems([]);
    setDraftProduct(null);
    setDraftQty('');
    setDraftRate('');
    setDraftDiscount('0');
    setFreight('0');
    setReceivedToday('0');
    setNotes('');
    setErrors({});
  };

  // ── Preview Current State ───────────────────────────────────────
  const handlePreviewCurrent = () => {
    const previewData = {
      invoiceNo: 'AUTO (DRAFT)',
      date: invoiceDate,
      customer: selectedCustomer || { name: 'Customer Not Selected', phone: '—' },
      reference,
      items,
      subtotal,
      discount: totalItemDiscount,
      freight: freightVal,
      roundOff,
      grandTotal,
      received: receivedVal,
      pending: pendingAmount,
      status: receivedVal >= grandTotal && grandTotal > 0 ? 'Paid' : (receivedVal > 0 ? 'Partially Paid' : 'Pending'),
      notes,
    };
    setPreviewInvoice(previewData);
  };

  // ── Keyboard Shortcuts (F5, F6, F7) ─────────────────────────────
  const handleSaveRef = useRef();
  const handleResetRef = useRef();

  useEffect(() => {
    handleSaveRef.current = handleSave;
    handleResetRef.current = handleReset;
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
        handleResetRef.current?.(true);
      }
    };
    window.addEventListener('keydown', handleKeyDownGlobal);
    return () => window.removeEventListener('keydown', handleKeyDownGlobal);
  }, []);

  return (
    <ERPLayout pageTitle="Sales → New Invoice">
      <div className={styles.container}>
        {/* ── Breadcrumb & Title ──────────────────────── */}
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.breadcrumbs}>
              Sales / <span className={styles.breadcrumbActive}>New Invoice</span>
            </div>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>New Sales Invoice</h1>
            </div>
          </div>
        </div>

        {/* Feedback messages */}
        {successMessage && (
          <div className={styles.alertSuccess} role="status">
            <span>{successMessage}</span>
            <button
              className={styles.btnClear}
              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              onClick={() => navigate('/sales/invoices')}
            >
              View Invoices →
            </button>
          </div>
        )}

        {errorMessage && (
          <div className={styles.alertError} role="alert">
            {errorMessage}
          </div>
        )}

        {/* ── Invoice Header Card ─────────────────────── */}
        <div className={styles.card}>
          <div className={styles.invoiceHeaderGrid}>
            {/* Invoice Number: AUTO (Read-Only) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Invoice No.</label>
              <input
                type="text"
                className={styles.inputAuto}
                value="AUTO"
                readOnly
                title="Invoice number will be generated sequentially by backend"
              />
            </div>

            {/* Invoice Date */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Invoice Date</label>
              <input
                type="date"
                className={styles.inputDate}
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            {/* Customer Search / Combobox */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Customer *</label>
              <CustomerSelect
                selectedCustomer={selectedCustomer}
                onSelect={(cust) => {
                  setSelectedCustomer(cust);
                  setErrors((prev) => ({ ...prev, customer: null }));
                }}
                hasError={Boolean(errors.customer)}
                placeholder="Search or select steel customer..."
              />
              {errors.customer && (
                <span style={{ fontSize: '0.6875rem', color: '#ef4444' }}>
                  {errors.customer}
                </span>
              )}
            </div>

            {/* Reference (PO / Order No.) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Reference / PO No.</label>
              <input
                type="text"
                className={styles.inputText}
                placeholder="e.g. PO-8891"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          {/* ── Product Quick Entry Bar ───────────────── */}
          <div className={styles.itemEntryCard}>
            <div className={styles.itemEntryHeader}>
              <div className={styles.itemEntryHeaderLeft}>
                <span className={styles.itemEntryTitle}>Add Material / Product</span>
                <button
                  type="button"
                  className={styles.newProductPillBtn}
                  onClick={() => handleOpenQuickProduct('')}
                  title="Create new steel product without leaving invoice (Alt+P)"
                >
                  <span className={styles.plusIcon}>+</span>
                  New Product
                </button>
              </div>
              <span className={styles.itemEntryShortcutHint}>
                Tab between fields · Press Enter to add line · <kbd className={styles.kbdHint}>Alt+P</kbd>
              </span>
            </div>

            <div className={styles.itemEntryRow}>
              {/* Product Selector */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Material / Product</label>
                <ProductSearchSelect
                  inputRef={productInputRef}
                  value={draftProduct ? draftProduct.name : ''}
                  onSelect={handleProductSelect}
                  onCreateProduct={handleOpenQuickProduct}
                  hasError={Boolean(errors.product)}
                />
              </div>

              {/* Quantity (Supports Decimals) */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Qty {draftProduct?.unit ? `(${draftProduct.unit})` : ''}
                </label>
                <input
                  ref={qtyInputRef}
                  type="number"
                  step="any"
                  className={styles.inputQty}
                  placeholder="0.00"
                  value={draftQty}
                  onChange={(e) => setDraftQty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      rateInputRef.current?.focus();
                      rateInputRef.current?.select();
                    }
                  }}
                />
              </div>

              {/* Unit display */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Unit</label>
                <input
                  type="text"
                  className={styles.inputAuto}
                  value={draftProduct?.unit || 'KG'}
                  readOnly
                />
              </div>

              {/* Selling Rate */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Rate (₹)</label>
                <input
                  ref={rateInputRef}
                  type="number"
                  step="any"
                  className={styles.inputRate}
                  placeholder="0.00"
                  value={draftRate}
                  onChange={(e) => setDraftRate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddItem();
                  }}
                />
              </div>

              {/* Discount */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Discount (₹)</label>
                <input
                  type="number"
                  step="any"
                  className={styles.inputDiscount}
                  placeholder="0"
                  value={draftDiscount}
                  onChange={(e) => setDraftDiscount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddItem();
                  }}
                />
              </div>

              {/* Line Amount preview */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Amount (₹)</label>
                <input
                  type="text"
                  className={styles.inputAuto}
                  value={
                    draftQty && draftRate
                      ? fmtINR(
                          Math.max(0, parseFloat(draftQty) * parseFloat(draftRate) - (parseFloat(draftDiscount) || 0))
                        )
                      : '₹0.00'
                  }
                  readOnly
                />
              </div>

              {/* Add Button */}
              <button
                type="button"
                className={styles.btnAddItem}
                onClick={handleAddItem}
              >
                + Add Item
              </button>
            </div>
          </div>
        </div>

        {/* ── Items Table ─────────────────────────────── */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }} className={styles.th}>#</th>
                  <th className={styles.th}>Product</th>
                  <th style={{ width: '100px' }} className={`${styles.th} ${styles.right}`}>Qty</th>
                  <th style={{ width: '70px' }} className={styles.th}>Unit</th>
                  <th style={{ width: '110px' }} className={`${styles.th} ${styles.right}`}>Rate</th>
                  <th style={{ width: '100px' }} className={`${styles.th} ${styles.right}`}>Discount</th>
                  <th style={{ width: '130px' }} className={`${styles.th} ${styles.right}`}>Amount</th>
                  <th style={{ width: '60px' }} className={`${styles.th} ${styles.center}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyItems}>
                      No materials added yet. Search and select a product above to add items.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className={`${styles.td} ${styles.mono}`}>{idx + 1}</td>
                      <td className={styles.td}>
                        <strong>{item.productName}</strong>
                        {item.productCode && (
                          <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block' }}>
                            {item.productCode}
                          </span>
                        )}
                      </td>
                      <td className={`${styles.td} ${styles.right} ${styles.mono}`}>{item.qty}</td>
                      <td className={styles.td}>{item.unit}</td>
                      <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                        {fmtINR(item.rate)}
                      </td>
                      <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                        {item.discount > 0 ? fmtINR(item.discount) : '—'}
                      </td>
                      <td className={`${styles.td} ${styles.right} ${styles.mono}`} style={{ fontWeight: 600 }}>
                        {fmtINR(item.amount)}
                      </td>
                      <td className={`${styles.td} ${styles.center}`}>
                        <button
                          type="button"
                          className={styles.btnDelete}
                          onClick={() => handleDeleteItem(idx)}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Summary & Notes Section ─────────────────── */}
        <div className={styles.bottomGrid}>
          {/* Notes / Terms */}
          <div className={styles.notesCard}>
            <label className={styles.label}>Notes / Terms & Conditions</label>
            <textarea
              className={styles.textareaNotes}
              placeholder="Enter invoice terms, vehicle delivery number, transport remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Summary Box */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryRow}>
              <span>Subtotal:</span>
              <span className={styles.mono}>{fmtINR(subtotal)}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Discount:</span>
              <span className={styles.mono}>-{fmtINR(totalItemDiscount)}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Freight (₹):</span>
              <input
                type="number"
                step="any"
                className={styles.summaryInput}
                value={freight}
                onChange={(e) => setFreight(e.target.value)}
              />
            </div>

            <div className={styles.summaryRow}>
              <span>Round Off:</span>
              <span className={styles.mono}>
                {roundOff > 0 ? `+${roundOff}` : roundOff}
              </span>
            </div>

            <div className={styles.grandTotalRow}>
              <span>Grand Total:</span>
              <span className={styles.mono}>{fmtINR(grandTotal)}</span>
            </div>

            {/* Received Today (Transaction workflow - NO payment mode dropdown) */}
            <div className={styles.receivedRow}>
              <span>Received Today (₹):</span>
              <input
                type="number"
                step="any"
                className={styles.summaryInput}
                style={{ borderColor: '#a7f3d0' }}
                value={receivedToday}
                onChange={(e) => setReceivedToday(e.target.value)}
              />
            </div>

            {/* Pending Amount */}
            <div className={styles.pendingRow}>
              <span>Pending Amount:</span>
              <span className={styles.mono}>{fmtINR(pendingAmount)}</span>
            </div>
          </div>
        </div>

        {/* ── Actions Bar ─────────────────────────────── */}
        <div className={styles.actionBar}>
          <div className={styles.actionLeft}>
            <button
              type="button"
              className={`${styles.btnAction} ${styles.btnClear}`}
              onClick={() => handleReset(true)}
              title="Clear invoice (F7)"
            >
              Clear <span className={styles.shortcutBadge}>F7</span>
            </button>
            <button
              type="button"
              className={`${styles.btnAction} ${styles.btnSecondary}`}
              onClick={handlePreviewCurrent}
              title="Preview invoice"
            >
              Preview
            </button>
          </div>

          <div className={styles.actionRight}>
            <button
              type="button"
              className={`${styles.btnAction} ${styles.btnSecondary}`}
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              title="Save & Print (F6)"
            >
              Save & Print <span className={styles.shortcutBadge}>F6</span>
            </button>
            <button
              type="button"
              className={`${styles.btnAction} ${styles.btnPrimary}`}
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
              title="Save Invoice (F5)"
            >
              {isSubmitting ? 'Saving…' : 'Save Invoice'} <span className={styles.shortcutBadge}>F5</span>
            </button>
          </div>
        </div>

        {/* Printable / Preview Modal */}
        {previewInvoice && (
          <PrintInvoiceModal
            invoice={previewInvoice}
            onClose={() => setPreviewInvoice(null)}
          />
        )}

        {/* ── Floating Tab for Rapid Product Creation ───────── */}
        <aside
          className={styles.floatingTabContainer}
          aria-label="Quick product creation tab"
        >
          <button
            type="button"
            className={styles.floatingProductTab}
            onClick={() => handleOpenQuickProduct('')}
            title="Create new steel product without leaving this page (Alt + P)"
          >
            <span className={styles.floatingTabIcon}>📦</span>
            <span className={styles.floatingTabText}>+ New Product</span>
            <span className={styles.floatingTabBadge}>Alt+P</span>
          </button>
        </aside>

        {/* ── Quick Product Creation Drawer Modal ───────────── */}
        <QuickProductDrawer
          isOpen={isQuickProductOpen}
          onClose={() => setIsQuickProductOpen(false)}
          onProductCreated={handleProductCreated}
          initialName={quickProductInitialName}
        />
      </div>
    </ERPLayout>
  );
}
