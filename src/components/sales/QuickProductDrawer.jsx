/**
 * QuickProductDrawer — Forbusyness Web ERP
 *
 * Floating slide-out tab and rapid creation modal for steel products directly
 * from the invoice workbench.
 * Eliminates context switching: allows adding new inventory items on the fly
 * and auto-inserting them straight into the current invoice row.
 */

import { useState, useEffect, useRef } from 'react';
import {
  createProduct,
  STEEL_CATEGORIES,
} from '../../services/productService';
import styles from './QuickProductDrawer.module.css';

const UNITS = ['KG', 'MT', 'PCS', 'MTR'];

export default function QuickProductDrawer({
  isOpen,
  onClose,
  onProductCreated,
  initialName = '',
}) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'MS Pipes',
    unit: 'KG',
    sellingRate: '',
    purchaseRate: '',
    hsn: '7306',
    currentStock: '0',
    minStock: '100',
    specifications: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef(null);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        name: initialName || prev.name,
      }));
      setErrors({});
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, initialName]);

  // Update default HSN when category changes
  const handleCategoryChange = (cat) => {
    let defaultHsn = '7306';
    if (cat.includes('Angle') || cat.includes('Beam') || cat.includes('Channel')) {
      defaultHsn = '7216';
    } else if (cat.includes('Flat') || cat.includes('Plate') || cat.includes('Sheet')) {
      defaultHsn = '7208';
    } else if (cat.includes('Round') || cat.includes('Bar') || cat.includes('TMT')) {
      defaultHsn = '7214';
    } else if (cat.includes('Hardware')) {
      defaultHsn = '8311';
    }

    setFormData(prev => ({
      ...prev,
      category: cat,
      hsn: defaultHsn,
    }));
  };

  // Calculate live margin preview
  const sRate = parseFloat(formData.sellingRate) || 0;
  const pRate = parseFloat(formData.purchaseRate) || 0;
  const marginPct = pRate > 0 && sRate > 0
    ? Math.round(((sRate - pRate) / pRate) * 100)
    : (sRate > 0 ? 100 : 0);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required.';
    }
    if (!formData.sellingRate || parseFloat(formData.sellingRate) <= 0) {
      newErrors.sellingRate = 'Enter a valid selling rate.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createProduct({
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit,
        sellingRate: parseFloat(formData.sellingRate),
        purchaseRate: parseFloat(formData.purchaseRate) || 0,
        hsn: formData.hsn.trim() || '7306',
        currentStock: parseFloat(formData.currentStock) || 0,
        minStock: parseFloat(formData.minStock) || 0,
        specifications: formData.specifications.trim(),
      });

      if (onProductCreated) {
        onProductCreated(created);
      }
      setFormData({
        name: '',
        category: 'MS Pipes',
        unit: 'KG',
        sellingRate: '',
        purchaseRate: '',
        hsn: '7306',
        currentStock: '0',
        minStock: '100',
        specifications: '',
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to create product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <h2 className={styles.title}>Quick Create Steel Product</h2>
              <p className={styles.subtitle}>Saves to catalog and auto-inserts into current invoice line</p>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close product drawer"
          >
            ✕
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.form && (
            <div className={styles.errorAlert}>{errors.form}</div>
          )}

          {/* Product Name */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Product Name <span className={styles.req}>*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="e.g. MS Pipe 1.5&quot; Round (Heavy)"
              value={formData.name}
              onChange={e => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors(prev => ({ ...prev, name: null }));
              }}
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>

          {/* Category & Unit Row */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Steel Category</label>
              <select
                className={styles.select}
                value={formData.category}
                onChange={e => handleCategoryChange(e.target.value)}
              >
                {STEEL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Primary Unit</label>
              <div className={styles.unitPills}>
                {UNITS.map(u => (
                  <button
                    key={u}
                    type="button"
                    className={`${styles.unitPill} ${formData.unit === u ? styles.unitPillActive : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, unit: u }))}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selling Rate & Purchase Rate Row */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Selling Rate (₹ per {formData.unit}) <span className={styles.req}>*</span>
              </label>
              <div className={styles.inputPrefixWrap}>
                <span className={styles.prefix}>₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${styles.input} ${styles.inputWithPrefix} ${errors.sellingRate ? styles.inputError : ''}`}
                  placeholder="0.00"
                  value={formData.sellingRate}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, sellingRate: e.target.value }));
                    if (errors.sellingRate) setErrors(prev => ({ ...prev, sellingRate: null }));
                  }}
                />
              </div>
              {errors.sellingRate && <span className={styles.errorText}>{errors.sellingRate}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Purchase Rate (₹ per {formData.unit})</label>
              <div className={styles.inputPrefixWrap}>
                <span className={styles.prefix}>₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${styles.input} ${styles.inputWithPrefix}`}
                  placeholder="0.00"
                  value={formData.purchaseRate}
                  onChange={e => setFormData(prev => ({ ...prev, purchaseRate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Margin Indicator Pill */}
          {sRate > 0 && (
            <div className={styles.marginPreview}>
              <span className={styles.marginLabel}>Estimated Gross Trading Margin:</span>
              <span className={styles.marginBadge} style={{ color: marginPct >= 15 ? '#059669' : '#d97706' }}>
                {marginPct}% {pRate > 0 ? `(₹${(sRate - pRate).toFixed(2)} / ${formData.unit})` : '(Zero cost base)'}
              </span>
            </div>
          )}

          {/* HSN Code */}
          <div className={styles.formGroup}>
            <label className={styles.label}>HSN / Tariff Code</label>
            <input
              type="text"
              className={styles.input}
              placeholder="7306"
              value={formData.hsn}
              onChange={e => setFormData(prev => ({ ...prev, hsn: e.target.value }))}
            />
          </div>

          {/* Stock Quantities */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Opening Stock ({formData.unit})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={styles.input}
                placeholder="0"
                value={formData.currentStock}
                onChange={e => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Min Safety Stock ({formData.unit})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={styles.input}
                placeholder="100"
                value={formData.minStock}
                onChange={e => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
              />
            </div>
          </div>

          {/* Specifications */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Specifications / Steel Grade</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. 25x25mm, 1.6mm Wall, IS 2062 Grade"
              value={formData.specifications}
              onChange={e => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
            />
          </div>

          {/* Footer Action Buttons */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Creating…</span>
              ) : (
                <>
                  <span>Create &amp; Insert into Invoice</span>
                  <span className={styles.kbd}>↵</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
