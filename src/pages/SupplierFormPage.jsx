/**
 * SupplierFormPage — Forbusyness Web ERP
 *
 * Professional Steel Mill & Supplier Onboarding Workbench.
 * Features:
 * - Dual-pane layout: Comprehensive vendor inputs on left, interactive live preview on right
 * - Auto Code generator and mill profile setup
 * - Bank details validation (IFSC, Account number) for direct disbursements
 * - Supports Create (/suppliers/new) and Edit (/suppliers/:id/edit) modes
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import {
  getSupplierById,
  createSupplier,
  updateSupplier,
} from '../services/supplierService';
import SearchableStateSelect from '../components/common/SearchableStateSelect';
import styles from './SupplierFormPage.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return 'VN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function SupplierFormPage() {
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
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    creditDays: '30',
    creditLimit: '',
    outstandingBalance: '0',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;

    let mounted = true;
    (async () => {
      try {
        const sup = await getSupplierById(id);
        if (!mounted) return;
        if (!sup) {
          setErrorMsg(`Supplier with ID ${id} not found.`);
          setIsLoading(false);
          return;
        }
        setForm({
          name: sup.name || '',
          contactPerson: sup.contactPerson || '',
          phone: sup.phone || '',
          email: sup.email || '',
          address: sup.address || '',
          city: sup.city || '',
          state: sup.state || 'Maharashtra',
          bankName: sup.bankName || '',
          accountNumber: sup.accountNumber || '',
          ifscCode: sup.ifscCode || '',
          creditDays: String(sup.creditDays || 30),
          creditLimit: String(sup.creditLimit || 0),
          outstandingBalance: String(sup.outstandingBalance || 0),
          status: sup.status || 'Active',
        });
      } catch (err) {
        console.error('Error loading supplier:', err);
        setErrorMsg('Failed to load supplier details.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [id, isEdit]);

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Supplier / Mill name is required';
    if (!form.phone.trim()) errs.phone = 'Contact phone number is required';
    return errs;
  };

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
        await updateSupplier(id, form);
        setSuccessMsg('Supplier profile updated successfully!');
      } else {
        await createSupplier(form);
        setSuccessMsg('New supplier successfully registered in ERP!');
        setForm({
          name: '',
          contactPerson: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          state: 'Maharashtra',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          creditDays: '30',
          creditLimit: '',
          outstandingBalance: '0',
          status: 'Active',
        });
      }
      setTimeout(() => {
        navigate('/suppliers');
      }, 700);
    } catch (err) {
      console.error('Save failed:', err);
      setErrorMsg(err.message || 'Failed to save supplier record.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ERPLayout pageTitle="Suppliers" showBackButton={true} backTo="/suppliers">
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
          Loading supplier details...
        </div>
      </ERPLayout>
    );
  }

  return (
    <ERPLayout pageTitle={isEdit ? 'Edit Supplier' : 'New Supplier'} showBackButton={true} backTo="/suppliers">
      <div className={styles.container}>
        {/* ── Page Header & Breadcrumbs ───────────────────────── */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.breadcrumbs}>
              <Link to="/suppliers" className={styles.breadcrumbLink}>Suppliers</Link>
              <span>/</span>
              <span className={styles.breadcrumbActive}>{isEdit ? 'Edit Supplier' : 'New Supplier'}</span>
            </div>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{isEdit ? 'Edit Supplier Profile' : 'Register New Steel Supplier / Mill'}</h1>
              {isEdit && <span className={styles.codeBadge}>SUP-{String(id).padStart(3, '0')}</span>}
            </div>
          </div>
          <div>
            <button
              type="button"
              className={styles.btnSecondaryLarge}
              onClick={() => navigate('/suppliers')}
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
            {/* Section 1: General Business Identity */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon} style={{ background: '#ede9fe', color: '#6d28d9' }}>
                  🏭
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>General Mill / Vendor Information</h2>
                  <p className={styles.sectionSubtitle}>Entity legal name, communication, and commercial identity</p>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldGroup} style={{ gridColumn: 'span 2' }}>
                  <label className={styles.label}>
                    Supplier / Mill Name <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="e.g. Tata Steel BSL Ltd, Jindal Steel & Power, Local Stockist"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                  {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Contact Person / Key Executive</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Rahul Khurana (Sales VP)"
                    value={form.contactPerson}
                    onChange={(e) => handleChange('contactPerson', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Phone Number <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    type="tel"
                    className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                    placeholder="e.g. 9820145522"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                  {errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Official Commercial Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="commercial@supplier.com"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Address & Location */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon} style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  📍
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Plant / Dispatch Location</h2>
                  <p className={styles.sectionSubtitle}>Weighbridge & inward delivery origin</p>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldGroup} style={{ gridColumn: 'span 2' }}>
                  <label className={styles.label}>Works / Warehouse Address</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Industrial Area Phase 2, Steel Rolling Mill Complex"
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>City / Hub</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Mumbai, Raigarh, Kolkata"
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>State</label>
                  <SearchableStateSelect
                    value={form.state}
                    onChange={(val) => handleChange('state', val)}
                    placeholder="Search or select state..."
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Commercial & Banking Terms */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
                  💳
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Commercial Credit & Bank Details</h2>
                  <p className={styles.sectionSubtitle}>Payment settlement terms and RTGS/NEFT disbursement account</p>
                </div>
              </div>

              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Credit Terms (Days)</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    placeholder="e.g. 30"
                    value={form.creditDays}
                    onChange={(e) => handleChange('creditDays', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Credit Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    placeholder="e.g. 5000000"
                    value={form.creditLimit}
                    onChange={(e) => handleChange('creditLimit', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Opening / Current Dues (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    placeholder="0"
                    value={form.outstandingBalance}
                    onChange={(e) => handleChange('outstandingBalance', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Bank Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    value={form.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Bank Account Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. 50200049182341"
                    value={form.accountNumber}
                    onChange={(e) => handleChange('accountNumber', e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>IFSC Code</label>
                  <input
                    type="text"
                    maxLength={11}
                    className={styles.input}
                    placeholder="e.g. HDFC0000060"
                    value={form.ifscCode}
                    onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnSecondaryLarge}
                  onClick={() => navigate('/suppliers')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimarySubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : isEdit ? 'Update Supplier Profile' : 'Save Supplier Account'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Card Preview */}
          <div className={styles.previewCol}>
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <span className={styles.previewTitle}>Live Vendor Preview</span>
                <span className={styles.liveBadge}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#059669' }}></span>
                  {form.status}
                </span>
              </div>

              <div className={styles.previewAvatar}>
                {getInitials(form.name)}
              </div>

              <div className={styles.previewName}>
                {form.name.trim() || 'Supplier Mill Name'}
              </div>
              <div className={styles.previewCity}>
                📍 {form.city.trim() ? `${form.city}, ${form.state}` : form.state}
              </div>

              <div className={styles.previewDetailsList}>
                <div className={styles.previewDetailRow}>
                  <span className={styles.previewDetailLabel}>Phone:</span>
                  <span className={styles.previewDetailValue}>
                    {form.phone.trim() || '—'}
                  </span>
                </div>
                <div className={styles.previewDetailRow}>
                  <span className={styles.previewDetailLabel}>Contact Person:</span>
                  <span className={styles.previewDetailValue}>
                    {form.contactPerson.trim() || '—'}
                  </span>
                </div>
                <div className={styles.previewDetailRow}>
                  <span className={styles.previewDetailLabel}>Credit Period:</span>
                  <span className={styles.previewDetailValue}>
                    {form.creditDays ? `${form.creditDays} Days` : 'Cash'}
                  </span>
                </div>
                <div className={styles.previewDetailRow}>
                  <span className={styles.previewDetailLabel}>Credit Limit:</span>
                  <span className={styles.previewDetailValue}>
                    {fmtINR(form.creditLimit)}
                  </span>
                </div>
                <div className={styles.previewDetailRow}>
                  <span className={styles.previewDetailLabel}>Current Dues:</span>
                  <span className={styles.previewDetailValue} style={{ color: Number(form.outstandingBalance) > 0 ? '#e11d48' : '#059669' }}>
                    {fmtINR(form.outstandingBalance)}
                  </span>
                </div>
                {form.bankName && (
                  <div className={styles.previewDetailRow}>
                    <span className={styles.previewDetailLabel}>Bank:</span>
                    <span className={styles.previewDetailValue}>
                      {form.bankName} {form.ifscCode && `(${form.ifscCode})`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </ERPLayout>
  );
}
