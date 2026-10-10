/**
 * ProductFormPage — Forbusyness Web ERP
 *
 * Professional Steel Product Onboarding & Editing Workbench.
 * Features:
 * - Dual-pane layout: Comprehensive steel spec inputs on left, interactive live preview on right
 * - Categorization tailored for steel (MS Pipes, Angles, Flats, Round/Square Bars, Beams, Hardware)
 * - Automatic Code generator and HSN auto-presets
 * - Real-time Gross Margin % calculation and profitability health badge
 * - Supports Create (/products/new) and Edit (/products/:id/edit) modes
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import {
  getProductById,
  createProduct,
  updateProduct,
  STEEL_CATEGORIES,
  STANDARD_HSN_CODES,
} from '../services/productService';
import styles from './ProductFormPage.module.css';

const UNITS = ['KG', 'MT', 'PCS', 'MTR', 'BUNDLE', 'FEET'];

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '',
    code: '',
    category: 'MS Pipes',
    unit: 'KG',
    altUnit: '',
    conversionRatio: '',
    hsn: '7306',
    purchaseRate: '',
    sellingRate: '',
    minStock: '',
    currentStock: '',
    specifications: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});

  // Load existing product if editing
  useEffect(() => {
    if (!isEdit) return;

    let mounted = true;
    (async () => {
      try {
        const prod = await getProductById(id);
        if (!mounted) return;
        if (!prod) {
          setErrorMsg(`Product with ID ${id} not found.`);
          setIsLoading(false);
          return;
        }
        setForm({
          name: prod.name || '',
          code: prod.code || '',
          category: prod.category || 'MS Pipes',
          unit: prod.unit || 'KG',
          altUnit: prod.altUnit || '',
          conversionRatio: prod.conversionRatio ? String(prod.conversionRatio) : '',
          hsn: prod.hsn || '7306',
          purchaseRate: prod.purchaseRate ? String(prod.purchaseRate) : '',
          sellingRate: prod.sellingRate ? String(prod.sellingRate) : '',
          minStock: prod.minStock ? String(prod.minStock) : '',
          currentStock: prod.currentStock ? String(prod.currentStock) : '',
          specifications: prod.specifications || '',
          status: prod.status || 'Active',
        });
      } catch (err) {
        console.error('Failed to load product:', err);
        setErrorMsg('Failed to load product details.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, isEdit]);

  // Handle Input Changes
  const handleChange = (field, val) => {
    setForm(prev => {
      const next = { ...prev, [field]: val };

      // Auto-update HSN when category changes (if HSN matches standard)
      if (field === 'category') {
        if (val === 'MS Pipes') next.hsn = '7306';
        else if (val === 'MS Angles') next.hsn = '7216';
        else if (val === 'MS Flats') next.hsn = '7208';
        else if (val === 'MS Round Bars' || val === 'MS Square Bars') next.hsn = '7214';
        else if (val === 'Beams & Channels') next.hsn = '7216';
        else if (val === 'Plates & Sheets') next.hsn = '7208';
        else if (val === 'Industrial Hardware') next.hsn = '8311';
      }

      return next;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Real-time calculations
  const pRate = parseFloat(form.purchaseRate) || 0;
  const sRate = parseFloat(form.sellingRate) || 0;
  const marginPct = useMemo(() => {
    if (pRate <= 0) return 0;
    return Math.round(((sRate - pRate) / pRate) * 100);
  }, [pRate, sRate]);

  const profitPerUnit = useMemo(() => {
    return Math.max(0, sRate - pRate);
  }, [pRate, sRate]);

  // Validation
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.category) errs.category = 'Category is required';
    if (!form.unit) errs.unit = 'Unit is required';
    if (!form.hsn.trim()) errs.hsn = 'HSN Code is required';

    if (form.purchaseRate && Number(form.purchaseRate) < 0) {
      errs.purchaseRate = 'Purchase rate cannot be negative';
    }
    if (form.sellingRate && Number(form.sellingRate) < 0) {
      errs.sellingRate = 'Selling rate cannot be negative';
    }
    return errs;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setErrorMsg('Please correct the highlighted fields before saving.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isEdit) {
        await updateProduct(id, form);
        setSuccessMsg('Product details successfully updated.');
      } else {
        const created = await createProduct(form);
        setSuccessMsg(`Product "${created.name}" created successfully.`);
        setForm({
          name: '',
          code: '',
          category: 'MS Pipes',
          unit: 'KG',
          altUnit: '',
          conversionRatio: '',
          hsn: '7306',
          purchaseRate: '',
          sellingRate: '',
          minStock: '',
          currentStock: '',
          specifications: '',
          status: 'Active',
        });
      }

      setTimeout(() => {
        navigate('/products');
      }, 700);
    } catch (err) {
      console.error('Error saving product:', err);
      setErrorMsg(err.message || 'An error occurred while saving the product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ERPLayout>
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
          Loading steel product details...
        </div>
      </ERPLayout>
    );
  }

  return (
    <ERPLayout pageTitle={isEdit ? 'Edit Product' : 'New Product'} showBackButton={true} backTo="/products">
      <div className={styles.container}>
        {/* ── Page Header & Breadcrumbs ───────────────────────── */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.breadcrumbs}>
              <Link to="/products" className={styles.breadcrumbLink}>Products</Link>
              <span>/</span>
              <span className={styles.breadcrumbActive}>{isEdit ? 'Edit Product' : 'New Product'}</span>
            </div>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{isEdit ? 'Edit Product' : 'New Product'}</h1>
              {form.code && <span className={styles.codeBadge}>{form.code}</span>}
            </div>
          </div>
          <div>
            <button
              type="button"
              className={styles.btnSecondaryLarge}
              onClick={() => navigate('/products')}
              style={{ width: 'auto', padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Go Back
            </button>
          </div>
        </div>

        {/* ── Notification Banners ──────────────────────────── */}
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

        {/* ── Dual-Pane Workbench Grid ──────────────────────── */}
        <form onSubmit={handleSubmit} className={styles.workbenchGrid}>
          {/* Left Column: Form Sections */}
          <div className={styles.formCol}>
            {/* Section 1: General Steel Specification */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon} style={{ background: '#ede9fe', color: '#6d28d9' }}>
                    📦
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>General Product Information</h2>
                    <p className={styles.sectionSubtitle}>Core steel product taxonomy, naming, and identification</p>
                  </div>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Product Name <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.hasError : ''}`}
                    placeholder="e.g. MS Pipe 2.0&quot; Round (Medium 2.6mm)"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Item / SKU Code
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Auto-generated if blank (e.g. MSP-102)"
                    value={form.code}
                    onChange={(e) => handleChange('code', e.target.value)}
                  />
                  <span className={styles.helperText}>Unique internal catalog reference code</span>
                </div>
              </div>

              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Category <span className={styles.requiredStar}>*</span>
                  </label>
                  <select
                    className={styles.select}
                    value={form.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                  >
                    {STEEL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Status
                  </label>
                  <select
                    className={styles.select}
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Primary Unit of Measurement <span className={styles.requiredStar}>*</span>
                  </label>
                  <select
                    className={styles.select}
                    value={form.unit}
                    onChange={(e) => handleChange('unit', e.target.value)}
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Technical Specifications & Dimensions</label>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  placeholder="e.g. Outer Diameter 50.8mm, Wall Thickness 2.6mm, Length 6.0m, IS 2062 Grade E250"
                  value={form.specifications}
                  onChange={(e) => handleChange('specifications', e.target.value)}
                />
              </div>
            </div>

            {/* Section 2: Classification & HSN */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                    🏷️
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>HSN Classification</h2>
                    <p className={styles.sectionSubtitle}>Standard commodity code classification for steel products</p>
                  </div>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  HSN Code <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.hsn ? styles.hasError : ''}`}
                  placeholder="e.g. 7306, 7216, 7208"
                  value={form.hsn}
                  onChange={(e) => handleChange('hsn', e.target.value)}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {STANDARD_HSN_CODES.slice(0, 5).map(item => (
                    <button
                      key={item.hsn}
                      type="button"
                      onClick={() => handleChange('hsn', item.hsn)}
                      style={{
                        fontSize: '0.6875rem',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: form.hsn === item.hsn ? '#ede9fe' : '#f8fafc',
                        color: form.hsn === item.hsn ? '#6d28d9' : '#475569',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {item.hsn} ({item.desc.split(' ')[0]} {item.desc.split(' ')[1] || ''})
                    </button>
                  ))}
                </div>
                {errors.hsn && <span className={styles.errorText}>{errors.hsn}</span>}
              </div>
            </div>

            {/* Section 3: Commercial Rates & Profit Margin */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon} style={{ background: '#dcfce7', color: '#15803d' }}>
                    💰
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>Commercial Rates & Gross Margin</h2>
                    <p className={styles.sectionSubtitle}>Real-time markup and unit economics</p>
                  </div>
                </div>
                {pRate > 0 && sRate > 0 && (
                  <div className={styles.marginBadge}>
                    <span>{marginPct >= 0 ? `+${marginPct}% Margin` : `${marginPct}% Margin`}</span>
                  </div>
                )}
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Default Purchase Rate (₹ per {form.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`${styles.input} ${errors.purchaseRate ? styles.hasError : ''}`}
                    placeholder="0.00"
                    value={form.purchaseRate}
                    onChange={(e) => handleChange('purchaseRate', e.target.value)}
                  />
                  <span className={styles.helperText}>Cost per {form.unit} inward from steel mills</span>
                  {errors.purchaseRate && <span className={styles.errorText}>{errors.purchaseRate}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Default Selling Rate (₹ per {form.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`${styles.input} ${errors.sellingRate ? styles.hasError : ''}`}
                    placeholder="0.00"
                    value={form.sellingRate}
                    onChange={(e) => handleChange('sellingRate', e.target.value)}
                  />
                  <span className={styles.helperText}>Base price per {form.unit} on customer invoices</span>
                  {errors.sellingRate && <span className={styles.errorText}>{errors.sellingRate}</span>}
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Alternate Unit (Optional)</label>
                  <select
                    className={styles.select}
                    value={form.altUnit}
                    onChange={(e) => handleChange('altUnit', e.target.value)}
                  >
                    <option value="">None</option>
                    {UNITS.filter(u => u !== form.unit).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {form.altUnit && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Conversion Ratio (1 {form.altUnit} = X {form.unit})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      className={styles.input}
                      placeholder="e.g. 18.5"
                      value={form.conversionRatio}
                      onChange={(e) => handleChange('conversionRatio', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Inventory Balances & Thresholds */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon} style={{ background: '#fef3c7', color: '#b45309' }}>
                    📊
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>Stock Thresholds & Levels</h2>
                    <p className={styles.sectionSubtitle}>Yard inventory control & low stock reorder alerts</p>
                  </div>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    {isEdit ? 'Current Stock Level' : 'Initial Opening Stock'} ({form.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.input}
                    placeholder="0.00"
                    value={form.currentStock}
                    onChange={(e) => handleChange('currentStock', e.target.value)}
                  />
                  <span className={styles.helperText}>Physical balance currently in the warehouse</span>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Minimum Reorder Threshold ({form.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.input}
                    placeholder="e.g. 500"
                    value={form.minStock}
                    onChange={(e) => handleChange('minStock', e.target.value)}
                  />
                  <span className={styles.helperText}>Triggers low-stock warning when balance drops below this</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Card Preview & Action Box */}
          <div className={styles.sidebarCol}>
            {/* Live Preview Card */}
            <div className={styles.previewBox}>
              <div className={styles.previewHeader}>
                <span className={styles.previewLabel}>Steel Product Preview</span>
                <span className={styles.previewLiveDot}>
                  <span className={styles.liveDotPulse}></span>
                  LIVE
                </span>
              </div>

              <div>
                <span style={{
                  display: 'inline-block',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#6d28d9',
                  background: '#ede9fe',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  marginBottom: '6px'
                }}>
                  {form.category}
                </span>
                <h3 className={styles.previewTitle}>
                  {form.name || 'Unnamed Steel Material'}
                </h3>
                {form.code && (
                  <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {form.code} • HSN: {form.hsn || '—'}
                  </p>
                )}
              </div>

              <div className={styles.previewStats}>
                <div className={styles.previewStatItem}>
                  <span className={styles.previewStatTitle}>Selling Rate</span>
                  <span className={styles.previewStatVal}>
                    ₹{sRate.toFixed(2)}
                    <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#64748b' }}>/{form.unit}</span>
                  </span>
                </div>

                <div className={styles.previewStatItem}>
                  <span className={styles.previewStatTitle}>Purchase Cost</span>
                  <span className={styles.previewStatVal}>
                    ₹{pRate.toFixed(2)}
                    <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#64748b' }}>/{form.unit}</span>
                  </span>
                </div>

                <div className={styles.previewStatItem}>
                  <span className={styles.previewStatTitle}>Est. Margin</span>
                  <span className={styles.previewStatVal} style={{ color: marginPct >= 0 ? '#059669' : '#dc2626' }}>
                    {marginPct >= 0 ? `+${marginPct}%` : `${marginPct}%`}
                  </span>
                </div>

                <div className={styles.previewStatItem}>
                  <span className={styles.previewStatTitle}>Profit / {form.unit}</span>
                  <span className={styles.previewStatVal} style={{ color: '#059669' }}>
                    +₹{profitPerUnit.toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.75rem',
                color: '#475569',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Stock Available:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {(parseFloat(form.currentStock) || 0).toLocaleString()} {form.unit}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Min Reorder:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {(parseFloat(form.minStock) || 0).toLocaleString()} {form.unit}
                  </strong>
                </div>
              </div>

              {form.specifications && (
                <div style={{
                  fontSize: '0.6875rem',
                  color: '#64748b',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  lineHeight: '1.4'
                }}>
                  <strong>Specs:</strong> {form.specifications}
                </div>
              )}
            </div>

            {/* Actions Box */}
            <div className={styles.sidebarActionsBox}>
              <button
                type="submit"
                className={styles.btnPrimaryLarge}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : (isEdit ? 'Update Product' : 'Save Steel Product')}
              </button>

              <button
                type="button"
                className={styles.btnSecondaryLarge}
                onClick={() => navigate('/products')}
              >
                Discard & Return
              </button>
            </div>
          </div>
        </form>
      </div>
    </ERPLayout>
  );
}
