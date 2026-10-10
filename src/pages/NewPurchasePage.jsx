/**
 * NewPurchasePage — Forbusyness Web ERP
 *
 * Professional Steel Inward Goods & Purchase Entry Workbench.
 * Features:
 * - Dual-pane ergonomic workbench
 * - Automatic purchase sequence (e.g. PUR-001)
 * - Steel transport logistics (Vehicle / Truck No, Weighbridge Slip Ref, Supplier Bill No)
 * - Dynamic material rows with live product lookup from productService
 * - Automatic inward stock increment upon submission
 * - Real-time totals and payables calculations
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import { getSuppliers, createSupplier } from '../services/supplierService';
import { getProducts } from '../services/productService';
import { createPurchase } from '../services/purchaseService';
import styles from './NewPurchasePage.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
}

export default function NewPurchasePage() {
  const navigate = useNavigate();

  // Reference Data
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Quick Add Supplier inline state
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCity, setNewSupplierCity] = useState('');

  // Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierBillNo: '',
    supplierBillDate: new Date().toISOString().split('T')[0],
    vehicleNo: '',
    weighbridgeSlip: '',
    freightInward: '',
    paidToday: '',
    notes: '',
  });

  // Material Line Items
  const [items, setItems] = useState([
    {
      productId: '',
      productName: '',
      hsn: '',
      qty: '',
      unit: 'KG',
      rate: '',
    },
  ]);

  // Load suppliers and products
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supRes = await getSuppliers();
        const prodRes = await getProducts({ pageSize: 100 });
        if (!mounted) return;
        setSuppliers(Array.isArray(supRes) ? supRes : (supRes.items || []));
        setProducts(prodRes.items || []);
      } catch (err) {
        console.error('Failed to load initial purchase reference data:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Quick Add Supplier handler
  const handleQuickAddSupplier = async () => {
    if (!newSupplierName.trim()) return;
    try {
      const created = await createSupplier({
        name: newSupplierName,
        city: newSupplierCity,
      });
      setSuppliers(prev => [created, ...prev]);
      setForm(prev => ({ ...prev, supplierId: created.id }));
      setShowQuickSupplier(false);
      setNewSupplierName('');
      setNewSupplierCity('');
    } catch (err) {
      console.error('Failed to create quick supplier:', err);
    }
  };

  // Item row operations
  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      if (field === 'productId') {
        const prod = products.find(p => p.id === Number(value));
        if (prod) {
          item.productName = prod.name;
          item.unit = prod.unit || 'KG';
          item.hsn = prod.hsn || '7306';
          item.rate = prod.purchaseRate || 0;
        }
      }

      next[index] = item;
      return next;
    });
  };

  const handleAddItem = () => {
    const defaultProd = products[0] || {};
    setItems(prev => [
      ...prev,
      {
        productId: defaultProd.id || '',
        productName: defaultProd.name || '',
        hsn: defaultProd.hsn || '',
        qty: '',
        unit: defaultProd.unit || 'KG',
        rate: defaultProd.purchaseRate || '',
      },
    ]);
  };

  const handleDeleteItem = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Financial Calculations
  const calculatedItems = useMemo(() => {
    return items.map(item => {
      const q = parseFloat(item.qty) || 0;
      const r = parseFloat(item.rate) || 0;
      const amount = Math.round(q * r * 100) / 100;
      return {
        ...item,
        amount,
      };
    });
  }, [items]);

  const subtotal = useMemo(() => {
    return calculatedItems.reduce((acc, it) => acc + (it.amount || 0), 0);
  }, [calculatedItems]);

  const freight = parseFloat(form.freightInward) || 0;
  const rawGrandTotal = subtotal + freight;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Math.round((grandTotal - rawGrandTotal) * 100) / 100;

  const paidToday = parseFloat(form.paidToday) || 0;
  const balancePayable = Math.max(0, grandTotal - paidToday);

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (items.length === 0) {
      setErrorMsg('Please add at least one steel material line item.');
      return;
    }

    const selectedSupplier = suppliers.find(s => s.id === Number(form.supplierId)) || null;

    setIsSubmitting(true);
    try {
      await createPurchase({
        date: form.date,
        supplier: selectedSupplier,
        supplierBillNo: form.supplierBillNo,
        supplierBillDate: form.supplierBillDate,
        vehicleNo: form.vehicleNo,
        weighbridgeSlip: form.weighbridgeSlip,
        items: calculatedItems,
        subtotal,
        freightInward: freight,
        roundOff,
        grandTotal,
        paidToday,
        notes: form.notes,
      });

      setSuccessMsg('Inward goods purchase bill successfully recorded! Inventory stock has been incremented.');
      setForm({
        date: new Date().toISOString().split('T')[0],
        supplierId: '',
        supplierBillNo: '',
        supplierBillDate: new Date().toISOString().split('T')[0],
        vehicleNo: '',
        weighbridgeSlip: '',
        freightInward: '',
        paidToday: '',
        notes: '',
      });
      setSelectedSupplier(null);
      setItems([
        {
          productId: '',
          productName: '',
          hsn: '',
          qty: '',
          unit: 'KG',
          rate: '',
        },
      ]);
      setTimeout(() => {
        navigate('/purchases');
      }, 700);
    } catch (err) {
      console.error('Failed to save purchase bill:', err);
      setErrorMsg(err.message || 'Error occurred while saving inward purchase bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ERPLayout>
      <div className={styles.container}>
        {/* ── Top Header ───────────────────────────────── */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.breadcrumbs}>
              <Link to="/purchases" className={styles.breadcrumbLink}>Purchases</Link>
              <span>/</span>
              <span className={styles.breadcrumbActive}>Record Inward Purchase</span>
            </div>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>Record Inward Consignment</h1>
              <span className={styles.billBadge}>Auto-Sequence PUR</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              className={styles.btnDiscard}
              onClick={() => navigate('/purchases')}
              style={{ width: 'auto', padding: '0 16px' }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* ── Notification Banners ──────────────────────── */}
        {successMsg && (
          <div className={styles.alertSuccess}>
            <span>✓ {successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className={styles.alertError}>
            <span>✕ {errorMsg}</span>
          </div>
        )}

        {/* ── Dual-Pane Workbench Grid ──────────────────── */}
        <form onSubmit={handleSubmit} className={styles.workbenchGrid}>
          {/* Main Column: Supplier, Logistics, and Steel Items */}
          <div className={styles.mainCol}>
            {/* Section 1: Supplier & Commercial Details */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon} style={{ background: '#ede9fe', color: '#6d28d9' }}>
                    🏭
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>Supplier & Consignment Date</h2>
                    <p className={styles.sectionSubtitle}>Select the steel manufacturing mill or wholesale supplier</p>
                  </div>
                </div>

                {!showQuickSupplier && (
                  <button
                    type="button"
                    onClick={() => setShowQuickSupplier(true)}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#6d28d9',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    + Quick Add Supplier
                  </button>
                )}
              </div>

              {showQuickSupplier && (
                <div style={{
                  background: '#faf5ff',
                  border: '1px solid #d8b4fe',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#6d28d9' }}>
                    Quick Add Supplier
                  </span>
                  <div className={styles.grid2}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Supplier / Mill Name *"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                    />
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="City / Region"
                      value={newSupplierCity}
                      onChange={(e) => setNewSupplierCity(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleQuickAddSupplier}
                      style={{
                        padding: '6px 14px',
                        background: '#7c3aed',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Save Supplier
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQuickSupplier(false)}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Supplier Name
                  </label>
                  <select
                    className={styles.select}
                    value={form.supplierId}
                    onChange={(e) => setForm(prev => ({ ...prev, supplierId: e.target.value }))}
                  >
                    <option value="">Direct Cash / Mill Purchase</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.city ? `(${s.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Inward Date</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={form.date}
                    onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Supplier Bill / Invoice Ref</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. INV-9844"
                    value={form.supplierBillNo}
                    onChange={(e) => setForm(prev => ({ ...prev, supplierBillNo: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Steel Transport & Weighbridge Logistics */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                    🚚
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>Transport & Weighbridge Logistics</h2>
                    <p className={styles.sectionSubtitle}>Truck and weighing slip references for inward audit</p>
                  </div>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Vehicle / Truck Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. MH-12-RN-8822"
                    value={form.vehicleNo}
                    onChange={(e) => setForm(prev => ({ ...prev, vehicleNo: e.target.value }))}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Weighbridge Slip Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. WB-5012 / Gross Weight Slip"
                    value={form.weighbridgeSlip}
                    onChange={(e) => setForm(prev => ({ ...prev, weighbridgeSlip: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Inward Steel Materials */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon} style={{ background: '#dcfce7', color: '#15803d' }}>
                    📦
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>Inward Steel Materials Line Items</h2>
                    <p className={styles.sectionSubtitle}>Materials received into the yard. Stock increments automatically upon saving.</p>
                  </div>
                </div>

                <Link
                  to="/products/new"
                  target="_blank"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#6d28d9',
                    textDecoration: 'none'
                  }}
                >
                  + Add New Material Master ↗
                </Link>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th className={styles.itemTh} style={{ width: '32%' }}>Material</th>
                      <th className={styles.itemTh} style={{ width: '12%' }}>HSN</th>
                      <th className={`${styles.itemTh} ${styles.itemThRight}`} style={{ width: '14%' }}>Quantity</th>
                      <th className={styles.itemTh} style={{ width: '10%' }}>Unit</th>
                      <th className={`${styles.itemTh} ${styles.itemThRight}`} style={{ width: '14%' }}>Rate (₹)</th>
                      <th className={`${styles.itemTh} ${styles.itemThRight}`} style={{ width: '14%' }}>Total (₹)</th>
                      <th className={styles.itemTh} style={{ width: '4%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculatedItems.map((item, index) => (
                      <tr key={index} className={styles.itemTr}>
                        <td className={styles.itemTd}>
                          {products.length > 0 ? (
                            <select
                              className={styles.select}
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            >
                              <option value="">-- Choose Steel Material --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.code})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              className={styles.tableInput}
                              placeholder="Product Name"
                              value={item.productName}
                              onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                            />
                          )}
                        </td>

                        <td className={styles.itemTd}>
                          <input
                            type="text"
                            className={styles.tableInput}
                            value={item.hsn}
                            onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                          />
                        </td>

                        <td className={styles.itemTd}>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className={styles.tableInput}
                            style={{ textAlign: 'right' }}
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                          />
                        </td>

                        <td className={styles.itemTd}>
                          <select
                            className={styles.select}
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          >
                            <option value="KG">KG</option>
                            <option value="MT">MT</option>
                            <option value="PCS">PCS</option>
                            <option value="MTR">MTR</option>
                          </select>
                        </td>

                        <td className={styles.itemTd}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={styles.tableInput}
                            style={{ textAlign: 'right' }}
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          />
                        </td>

                        <td className={styles.itemTd} style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {fmtINR(item.amount)}
                        </td>

                        <td className={styles.itemTd} style={{ textAlign: 'center' }}>
                          {items.length > 1 && (
                            <button
                              type="button"
                              className={styles.btnDelItem}
                              onClick={() => handleDeleteItem(index)}
                              title="Delete Row"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                className={styles.btnAddItem}
                onClick={handleAddItem}
              >
                + Add Material Row
              </button>
            </div>

            {/* Section 4: Receiving Notes */}
            <div className={styles.sectionCard}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Consignment Inspection Remarks</label>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  placeholder="e.g. Unloaded at Yard Bay #3, bundles inspected for rust, weighbridge tare verified."
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Column: Financial Breakdown & Inward Actions */}
          <div className={styles.sidebarCol}>
            <div className={styles.summaryBox}>
              <h3 className={styles.summaryHeader}>Purchase Totals</h3>

              <div className={styles.calcLine}>
                <span>Materials Subtotal:</span>
                <span style={{ fontWeight: 600 }}>{fmtINR(subtotal)}</span>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Inward Freight / Cartage (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={styles.input}
                  placeholder="0.00"
                  value={form.freightInward}
                  onChange={(e) => setForm(prev => ({ ...prev, freightInward: e.target.value }))}
                />
              </div>

              {roundOff !== 0 && (
                <div className={styles.calcLine}>
                  <span>Round Off:</span>
                  <span>{roundOff > 0 ? `+${fmtINR(roundOff)}` : fmtINR(roundOff)}</span>
                </div>
              )}

              <div className={styles.calcTotal}>
                <span>Grand Total:</span>
                <span>{fmtINR(grandTotal)}</span>
              </div>

              {/* Payment Section */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Amount Paid Today (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={styles.input}
                    placeholder="0.00"
                    value={form.paidToday}
                    onChange={(e) => setForm(prev => ({ ...prev, paidToday: e.target.value }))}
                  />
                </div>

                <div className={styles.calcBalance}>
                  <span>Balance Payable:</span>
                  <span>{fmtINR(balancePayable)}</span>
                </div>
              </div>
            </div>

            {/* Actions Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="submit"
                className={styles.btnSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Recording Inward...' : 'Save Inward Consignment'}
              </button>

              <button
                type="button"
                className={styles.btnDiscard}
                onClick={() => navigate('/purchases')}
              >
                Discard & Exit
              </button>
            </div>
          </div>
        </form>
      </div>
    </ERPLayout>
  );
}
