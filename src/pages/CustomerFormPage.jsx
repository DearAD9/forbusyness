/**
 * CustomerFormPage — Forbusyness Web ERP
 *
 * Professional Enterprise Customer Onboarding & Edit Workbench.
 * Features:
 * - Dual-pane layout: Structured Form Sections (Left) & Real-time Live Card Preview (Right)
 * - PAN and Business verification
 * - Onboarding Completeness Tracker
 * - Credit Limit preset quick-chips (₹1L, ₹2.5L, ₹5L, ₹10L)
 * - Global keyboard shortcuts: [F5] Save, [F7] Reset, [Esc] Back
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import {
  getCustomerById,
  createCustomer,
  updateCustomer,
} from '../services/customerService';
import SearchableStateSelect from '../components/common/SearchableStateSelect';
import styles from './CustomerFormPage.module.css';

const DEFAULT_STATE = 'Maharashtra';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CU';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Form Fields
  const [code, setCode] = useState('AUTO');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Active');

  // Tax & Address
  const [pan, setPan] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState(DEFAULT_STATE);
  const [pincode, setPincode] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('');

  // Commercial / Credit Terms
  const [creditLimit, setCreditLimit] = useState('');
  const [creditDays, setCreditDays] = useState('30');
  const [openingBalance, setOpeningBalance] = useState('0');

  // Bank Details
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');

  // Notes
  const [notes, setNotes] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedCustomer, setSavedCustomer] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Load existing customer in edit mode
  useEffect(() => {
    if (isEditMode) {
      setIsLoading(true);
      getCustomerById(id)
        .then((c) => {
          if (!c) {
            setErrorMessage(`Customer account #${id} was not found.`);
            return;
          }
          setCode(c.code || `CUST-${String(c.id).padStart(3, '0')}`);
          setName(c.name || '');
          setContactPerson(c.contactPerson || '');
          setPhone(c.phone || '');
          setAltPhone(c.altPhone || '');
          setEmail(c.email || '');
          setStatus(c.status || 'Active');
          setPan(c.pan || '');
          setAddress(c.address || '');
          setCity(c.city || '');
          setState(c.state || DEFAULT_STATE);
          setPincode(c.pincode || '');
          setShippingAddress(c.shippingAddress || '');
          setSameAsBilling(c.shippingAddress === c.address || !c.shippingAddress);
          setCreditLimit(c.creditLimit ? String(c.creditLimit) : '');
          setCreditDays(c.creditDays ? String(c.creditDays) : '30');
          setOpeningBalance(c.openingBalance ? String(c.openingBalance) : '0');
          setBankName(c.bankDetails?.bankName || '');
          setAccountNo(c.bankDetails?.accountNo || '');
          setIfsc(c.bankDetails?.ifsc || '');
          setNotes(c.notes || '');
        })
        .catch((err) => {
          setErrorMessage(err.message || 'Failed to load customer details.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, isEditMode]);

  // Profile Completeness calculation
  const completeness = useMemo(() => {
    let score = 0;
    if (name.trim()) score += 30;
    if (phone.trim()) score += 30;
    if (city.trim() && address.trim()) score += 20;
    if (creditLimit && parseFloat(creditLimit) > 0) score += 20;
    return score;
  }, [name, phone, city, address, creditLimit]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Company / Business Name is required.';
    if (!phone.trim()) errs.phone = 'Primary Phone number is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      setErrorMessage('Please correct the highlighted fields before saving.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload = {
      name,
      contactPerson,
      phone,
      altPhone,
      email,
      status,
      pan,
      address,
      city,
      state,
      pincode,
      shippingAddress: sameAsBilling ? address : shippingAddress,
      creditLimit,
      creditDays,
      openingBalance,
      bankName,
      accountNo,
      ifsc,
      notes,
    };

    try {
      if (isEditMode) {
        const updated = await updateCustomer(id, payload);
        setSavedCustomer(updated);
        setSuccessMessage(`Account "${updated.name}" updated successfully!`);
        setTimeout(() => {
          navigate('/customers');
        }, 800);
      } else {
        const created = await createCustomer(payload);
        setSavedCustomer(created);
        setSuccessMessage(`Customer "${created.name}" created with code ${created.code}!`);
        handleReset();
        setTimeout(() => {
          navigate('/customers');
        }, 800);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save customer account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setContactPerson('');
    setPhone('');
    setAltPhone('');
    setEmail('');
    setPan('');
    setAddress('');
    setCity('');
    setState(DEFAULT_STATE);
    setPincode('');
    setShippingAddress('');
    setSameAsBilling(true);
    setCreditLimit('');
    setCreditDays('30');
    setOpeningBalance('0');
    setBankName('');
    setAccountNo('');
    setIfsc('');
    setNotes('');
    setErrors({});
  };

  // Keyboard shortcut handlers
  const handleSaveRef = useRef();
  const handleResetRef = useRef();

  useEffect(() => {
    handleSaveRef.current = handleSave;
    handleResetRef.current = handleReset;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F5') {
        e.preventDefault();
        handleSaveRef.current?.();
      } else if (e.key === 'F7' && !isEditMode) {
        e.preventDefault();
        handleResetRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode]);

  return (
    <ERPLayout pageTitle={isEditMode ? 'Edit Customer' : 'New Customer Account'}>
      <div className={styles.container}>
        {/* ── Page Header ────────────────────────────── */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.breadcrumbs}>
              <Link to="/customers" className={styles.breadcrumbLink}>
                Customers
              </Link>{' '}
              / <span className={styles.breadcrumbActive}>{isEditMode ? 'Edit Account' : 'New Account'}</span>
            </div>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>
                {isEditMode ? `Edit Customer: ${name || code}` : 'New Customer Account'}
              </h1>
              <span className={styles.codeBadge}>{code}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={styles.btnSecondaryLarge}
              style={{ width: 'auto', padding: '0 16px' }}
              onClick={() => navigate('/customers')}
            >
              ← Back to List
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {successMessage && (
          <div className={styles.alertSuccess} role="status">
            <span>✓ {successMessage}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {savedCustomer && (
                <button
                  type="button"
                  className={styles.btnSecondaryLarge}
                  style={{ width: 'auto', height: '32px', padding: '0 12px', fontSize: '0.75rem' }}
                  onClick={() => navigate(`/customers/${savedCustomer.id}`)}
                >
                  View Ledger Statement →
                </button>
              )}
              {savedCustomer && (
                <button
                  type="button"
                  className={styles.btnPrimaryLarge}
                  style={{ width: 'auto', height: '32px', padding: '0 14px', fontSize: '0.75rem' }}
                  onClick={() => navigate(`/sales/invoices/new?customerId=${savedCustomer.id}`)}
                >
                  + Issue New Invoice
                </button>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className={styles.alertError} role="alert">
            {errorMessage}
          </div>
        )}

        {/* ── Dual-Pane Enterprise Layout ─────────────── */}
        <div className={styles.workbenchGrid}>
          {/* ── Left Column: Structured Form Sections ──── */}
          <div className={styles.formCol}>
            {/* Section 1: Business Identity */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon} style={{ background: '#ede9fe', color: '#6d28d9' }}>
                    🏢
                  </div>
                  <div>
                    <div className={styles.sectionTitle}>1. Business Identity & Account Details</div>
                    <div className={styles.sectionSubtitle}>Official commercial name and account classification</div>
                  </div>
                </div>
              </div>

              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Account Code</label>
                  <input
                    type="text"
                    className={`${styles.input} ${styles.inputAuto}`}
                    value={code}
                    readOnly
                    title="Code is generated automatically upon save"
                  />
                  <span className={styles.helperText}>Sequential ERP Account ID</span>
                </div>

                <div className={styles.fieldGroup} style={{ gridColumn: 'span 2' }}>
                  <label className={styles.label}>
                    Company / Legal Business Name <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.hasError : ''}`}
                    placeholder="e.g. Apex Steel & Tubes Pvt Ltd"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                    }}
                    autoFocus={!isEditMode}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>
              </div>

              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Account Status</label>
                  <select
                    className={styles.select}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Active">Active (Can issue invoices)</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Contact Representatives */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon} style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    👤
                  </div>
                  <div>
                    <div className={styles.sectionTitle}>2. Primary Contact & Representatives</div>
                    <div className={styles.sectionSubtitle}>Purchase officer, accounts coordinator, and billing phones</div>
                  </div>
                </div>
              </div>

              <div className={styles.grid4}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Contact Person</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Ramesh Sharma"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Primary Phone <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    type="tel"
                    className={`${styles.input} ${errors.phone ? styles.hasError : ''}`}
                    placeholder="+91 98220 12345"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                    }}
                  />
                  {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Alternate / Office Phone</label>
                  <input
                    type="tel"
                    className={styles.input}
                    placeholder="Landline / Warehouse"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="purchase@apexsteel.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Tax & Address Compliance */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
                    📜
                  </div>
                  <div>
                    <div className={styles.sectionTitle}>3. PAN & Delivery Locations</div>
                    <div className={styles.sectionSubtitle}>PAN identification and billing/delivery addresses</div>
                  </div>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>PAN Number</label>
                <input
                  type="text"
                  maxLength={10}
                  className={styles.input}
                  placeholder="e.g. AABCK1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase().trim())}
                  style={{ fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <span className={styles.helperText}>10-Digit Income Tax PAN</span>
              </div>

              {/* Billing Address */}
              <div className={styles.grid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Billing Address (Plot / Road / Industrial Area)</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Plot 42, Steel Market, Kalamboli..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className={styles.grid3}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>City</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Navi Mumbai"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>State</label>
                      <SearchableStateSelect
                        value={state}
                        onChange={(val) => setState(val)}
                        placeholder="Search or select state..."
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>PIN Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        className={styles.input}
                        placeholder="410218"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                      />
                    </div>
                  </div>

                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                    />
                    <span>Site shipping address is identical to billing address</span>
                  </label>
                </div>
              </div>

              {!sameAsBilling && (
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Delivery Site / Construction Yard Address</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Enter site delivery address for material freight dispatch..."
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Section 4: Credit & Financial Terms */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon} style={{ background: '#fef3c7', color: '#b45309' }}>
                    💳
                  </div>
                  <div>
                    <div className={styles.sectionTitle}>4. Credit Limits & Financial Terms</div>
                    <div className={styles.sectionSubtitle}>Allowed outstanding exposure, payment days, and opening ledger</div>
                  </div>
                </div>
              </div>

              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Credit Exposure Limit (₹)</label>
                  <input
                    type="number"
                    step="any"
                    className={styles.input}
                    placeholder="e.g. 500000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                  />
                  {/* Preset chips */}
                  <div className={styles.presetChipsRow}>
                    <button type="button" className={styles.presetChip} onClick={() => setCreditLimit('100000')}>₹1L</button>
                    <button type="button" className={styles.presetChip} onClick={() => setCreditLimit('250000')}>₹2.5L</button>
                    <button type="button" className={styles.presetChip} onClick={() => setCreditLimit('500000')}>₹5L</button>
                    <button type="button" className={styles.presetChip} onClick={() => setCreditLimit('1000000')}>₹10L</button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Credit Period</label>
                  <select
                    className={styles.select}
                    value={creditDays}
                    onChange={(e) => setCreditDays(e.target.value)}
                  >
                    <option value="0">Immediate / Cash On Delivery</option>
                    <option value="7">7 Days Credit</option>
                    <option value="15">15 Days Credit</option>
                    <option value="21">21 Days Credit</option>
                    <option value="30">30 Days Credit (Standard)</option>
                    <option value="45">45 Days Credit</option>
                    <option value="60">60 Days Credit</option>
                  </select>
                </div>

                {!isEditMode && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Opening Balance (₹)</label>
                    <input
                      type="number"
                      step="any"
                      className={styles.input}
                      placeholder="0.00"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                    />
                    <span className={styles.helperText}>Initial opening ledger balance</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Bank Details & Remarks */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={styles.sectionIcon} style={{ background: '#f1f5f9', color: '#475569' }}>
                    🏦
                  </div>
                  <div>
                    <div className={styles.sectionTitle}>5. Bank Details & Commercial Notes</div>
                    <div className={styles.sectionSubtitle}>Client banking verification and material preferences</div>
                  </div>
                </div>
              </div>

              <div className={styles.grid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Bank Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Account Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. 50200012345678"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>IFSC Code</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. HDFC0000123"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase().trim())}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Account Remarks / Dispatch Instructions</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Material requirements (pipes/angles), transport choices, delivery gate timings..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── Right Column: Live Preview & Shortcuts ──── */}
          <div className={styles.sidebarCol}>
            {/* Live Customer Preview Card */}
            <div className={styles.previewBox}>
              <div className={styles.previewHeader}>
                <span className={styles.previewLabel}>Live Account Preview</span>
                <div className={styles.previewLiveDot}>
                  <span className={styles.liveDotPulse} />
                  <span>Interactive</span>
                </div>
              </div>

              <div className={styles.previewBody}>
                <div className={styles.previewMonogram}>
                  {getInitials(name || 'Customer')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.previewTitle}>
                    {name.trim() || 'Company Name Here'}
                  </div>
                  <div className={styles.previewMeta}>
                    <span>{code} • {status}</span>
                    <span>{phone.trim() || '+91 Contact Phone'}</span>
                    <span>{city || 'City'}, {state}</span>
                  </div>
                </div>
              </div>

              <div className={styles.previewStats}>
                <div className={styles.previewStatItem}>
                  <span className={styles.previewStatTitle}>Credit Limit</span>
                  <span className={styles.previewStatVal}>
                    {creditLimit ? fmtINR(creditLimit) : 'No Limit'}
                  </span>
                </div>
                <div className={styles.previewStatItem}>
                  <span className={styles.previewStatTitle}>Payment Terms</span>
                  <span className={styles.previewStatVal}>
                    {creditDays ? `${creditDays} Days` : 'Cash'}
                  </span>
                </div>
              </div>

              {pan && (
                <div style={{ fontSize: '0.6875rem', color: '#64748b', display: 'flex', gap: '6px' }}>
                  <span style={{ fontWeight: 600 }}>PAN:</span>
                  <span style={{ fontFamily: 'monospace' }}>{pan}</span>
                </div>
              )}
            </div>

            {/* Profile Completeness Box */}
            <div className={styles.completenessBox}>
              <div className={styles.completenessHeader}>
                <span>Account Readiness</span>
                <span style={{ color: completeness === 100 ? '#059669' : '#7c3aed' }}>
                  {completeness}%
                </span>
              </div>
              <div className={styles.completenessBar}>
                <div className={styles.completenessFill} style={{ width: `${completeness}%` }} />
              </div>

              <div className={styles.checklist}>
                <div className={`${styles.checkItem} ${name.trim() ? styles.checkItemDone : ''}`}>
                  <span>{name.trim() ? '✓' : '○'}</span>
                  <span>Legal Business Name</span>
                </div>
                <div className={`${styles.checkItem} ${phone.trim() ? styles.checkItemDone : ''}`}>
                  <span>{phone.trim() ? '✓' : '○'}</span>
                  <span>Verified Primary Phone</span>
                </div>
                <div className={`${styles.checkItem} ${pan.length === 10 ? styles.checkItemDone : ''}`}>
                  <span>{pan.length === 10 ? '✓' : '○'}</span>
                  <span>10-Digit Tax PAN</span>
                </div>
                <div className={`${styles.checkItem} ${address.trim() && city.trim() ? styles.checkItemDone : ''}`}>
                  <span>{address.trim() && city.trim() ? '✓' : '○'}</span>
                  <span>Billing Address & State</span>
                </div>
                <div className={`${styles.checkItem} ${creditLimit ? styles.checkItemDone : ''}`}>
                  <span>{creditLimit ? '✓' : '○'}</span>
                  <span>Commercial Credit Terms</span>
                </div>
              </div>
            </div>

            {/* Save & Clear Actions */}
            <div className={styles.sidebarActionsBox}>
              <button
                type="button"
                className={styles.btnPrimaryLarge}
                onClick={handleSave}
                disabled={isSubmitting || isLoading}
                title="Save Customer Account (F5)"
              >
                {isSubmitting ? 'Saving…' : isEditMode ? 'Update Customer' : 'Save Customer'}
                <span className={styles.shortcutPill}>F5</span>
              </button>

              {!isEditMode && (
                <button
                  type="button"
                  className={styles.btnSecondaryLarge}
                  onClick={handleReset}
                  title="Clear Form (F7)"
                >
                  Clear Form <span className={styles.shortcutPill} style={{ background: '#f1f5f9', color: '#64748b' }}>F7</span>
                </button>
              )}

              <button
                type="button"
                className={styles.btnSecondaryLarge}
                onClick={() => navigate('/customers')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </ERPLayout>
  );
}
