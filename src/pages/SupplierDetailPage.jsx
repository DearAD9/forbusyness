/**
 * SupplierDetailPage — Forbusyness Web ERP
 *
 * Comprehensive steel mill vendor profile with live payables balance,
 * commercial terms, bank account details, and inward consignment records.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import { getSupplierById } from '../services/supplierService';
import { getPurchases } from '../services/purchaseService';
import styles from './SupplierDetailPage.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [sup, purRes] = await Promise.all([
          getSupplierById(id),
          getPurchases({ supplierId: id, pageSize: 20 }),
        ]);

        if (!mounted) return;
        if (!sup) {
          setErrorMsg(`Supplier #${id} not found.`);
        } else {
          setSupplier(sup);
          setPurchases(purRes.items || []);
        }
      } catch (err) {
        console.error('Failed to load supplier details:', err);
        setErrorMsg('Error loading supplier details.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [id]);

  if (isLoading) {
    return (
      <ERPLayout pageTitle="Suppliers" showBackButton={true} backTo="/suppliers">
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
          Loading supplier ledger & record...
        </div>
      </ERPLayout>
    );
  }

  if (errorMsg || !supplier) {
    return (
      <ERPLayout pageTitle="Supplier Not Found" showBackButton={true} backTo="/suppliers">
        <div className={styles.container}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>Supplier Not Found</h1>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>
                {errorMsg || 'The requested supplier record does not exist in the database.'}
              </p>
            </div>
            <Link to="/suppliers" className={styles.btnActionSecondary}>
              ← Go Back to Suppliers
            </Link>
          </div>
        </div>
      </ERPLayout>
    );
  }

  const totalInwardAmount = purchases.reduce((acc, p) => acc + (p.grandTotal || 0), 0);
  const totalTonnage = purchases.reduce((acc, p) => acc + (p.totalWeightMT || 0), 0);

  return (
    <ERPLayout pageTitle={supplier.name} showBackButton={true} backTo="/suppliers">
      <div className={styles.container}>
        {/* ── Breadcrumbs & Header ───────────────────────── */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.breadcrumbs}>
              <Link to="/suppliers" className={styles.breadcrumbLink}>Suppliers</Link>
              <span>/</span>
              <span className={styles.breadcrumbActive}>{supplier.name}</span>
            </div>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>{supplier.name}</h1>
              {supplier.code && <span className={styles.codeBadge}>{supplier.code}</span>}
              <span className={`${styles.statusPill} ${supplier.status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                ● {supplier.status || 'Active'}
              </span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.btnActionSecondary}
              onClick={() => navigate('/suppliers')}
            >
              ← Go Back
            </button>
            <Link to={`/suppliers/${supplier.id}/edit`} className={styles.btnActionSecondary}>
              ✏️ Edit Profile
            </Link>
            <button
              type="button"
              className={styles.btnActionPrimary}
              onClick={() => navigate('/purchases/new')}
            >
              📥 + Record Inward Bill
            </button>
          </div>
        </div>

        {/* ── 3 Summary KPI Cards ────────────────────────── */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} hover-lift`} style={{ borderTop: '3px solid #e11d48' }}>
            <span className={styles.statTitle}>Pending Payables</span>
            <span className={styles.statValue} style={{ color: (supplier.outstandingBalance || 0) > 0 ? '#e11d48' : '#059669' }}>
              {fmtINR(supplier.outstandingBalance || 0)}
            </span>
            <span className={styles.statSub}>
              Credit Limit: {fmtINR(supplier.creditLimit || 0)}
            </span>
          </div>

          <div className={`${styles.statCard} hover-lift`} style={{ borderTop: '3px solid #7c3aed' }}>
            <span className={styles.statTitle}>Consignments Received</span>
            <span className={styles.statValue}>
              {purchases.length} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>Inward Bills</span>
            </span>
            <span className={styles.statSub}>
              Total Value: {fmtINR(totalInwardAmount)}
            </span>
          </div>

          <div className={`${styles.statCard} hover-lift`} style={{ borderTop: '3px solid #059669' }}>
            <span className={styles.statTitle}>Steel Inward Tonnage</span>
            <span className={styles.statValue} style={{ color: '#059669' }}>
              {totalTonnage.toLocaleString()} <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>MT</span>
            </span>
            <span className={styles.statSub}>
              Weighbridge certified material
            </span>
          </div>
        </div>

        {/* ── Info Cards Grid ────────────────────────────── */}
        <div className={styles.infoGrid}>
          {/* Card 1: Contact & Mill Location */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>
              <span>🏭</span> Contact & Works Location
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Contact Person:</span>
              <span className={styles.infoVal}>{supplier.contactPerson || '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Phone:</span>
              <span className={styles.infoVal}>
                {supplier.phone ? <a href={`tel:${supplier.phone}`}>{supplier.phone}</a> : '—'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email:</span>
              <span className={styles.infoVal}>
                {supplier.email ? <a href={`mailto:${supplier.email}`}>{supplier.email}</a> : '—'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Plant Address:</span>
              <span className={styles.infoVal}>
                {supplier.address ? `${supplier.address}, ${supplier.city}, ${supplier.state}` : `${supplier.city || ''}, ${supplier.state || 'India'}`}
              </span>
            </div>
          </div>

          {/* Card 2: Commercial Terms & Banking */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>
              <span>💳</span> Commercial Terms & Banking
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Credit Period:</span>
              <span className={styles.infoVal}>
                {supplier.creditDays ? `${supplier.creditDays} Days` : 'Cash / Advance'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Credit Limit:</span>
              <span className={styles.infoVal}>{fmtINR(supplier.creditLimit || 0)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Bank Name:</span>
              <span className={styles.infoVal}>{supplier.bankName || '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Account Number:</span>
              <span className={`${styles.infoVal} ${styles.mono}`}>
                {supplier.accountNumber || '—'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>IFSC Code:</span>
              <span className={`${styles.infoVal} ${styles.mono}`}>
                {supplier.ifscCode || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Consignment History Table ──────────────────── */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionHeading}>Inward Consignment Slips & Invoices</h2>
            <button
              type="button"
              className={styles.btnActionSecondary}
              onClick={() => navigate('/purchases/new')}
            >
              + Record Consignment
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Bill No</th>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Vehicle / Slip</th>
                  <th className={`${styles.th} ${styles.right}`}>Tonnage (MT)</th>
                  <th className={`${styles.th} ${styles.right}`}>Gross Value</th>
                  <th className={`${styles.th} ${styles.center}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No inward consignments recorded yet for this supplier.
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id}>
                      <td className={`${styles.td} ${styles.mono}`}>
                        <span style={{ fontWeight: 600, color: '#6d28d9' }}>{p.billNo}</span>
                      </td>
                      <td className={styles.td}>{p.date || '—'}</td>
                      <td className={`${styles.td} ${styles.mono}`}>
                        {p.vehicleNo || p.challanNo || '—'}
                      </td>
                      <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                        {(p.totalWeightMT || 0).toLocaleString()} MT
                      </td>
                      <td className={`${styles.td} ${styles.right} ${styles.mono}`} style={{ fontWeight: 700 }}>
                        {fmtINR(p.grandTotal || 0)}
                      </td>
                      <td className={`${styles.td} ${styles.center}`}>
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 600 }}>
                          Received
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ERPLayout>
  );
}
