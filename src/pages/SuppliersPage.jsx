/**
 * SuppliersPage — Forbusyness Web ERP
 *
 * Professional Steel Suppliers & Mill Vendors Directory.
 * Features:
 * - 4 Summary KPI cards with payables overview & active mill counts
 * - Instant search (Vendor name, code, phone, city)
 * - Status filter tabs (All, Active, Inactive)
 * - 1-Click "Seed Mill Templates" for standard steel manufacturers
 * - Instant CSV export
 * - Direct navigation to + New Supplier, Edit, and Supplier Ledger / Details
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import {
  getSuppliers,
  getSupplierSummaryStats,
  seedSupplierTemplates,
  exportSuppliersToCSV,
} from '../services/supplierService';
import styles from './SuppliersPage.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #059669 0%, #047857 100%)',
  'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
  'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
  'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
];

function getAvatarColor(id = 0) {
  return AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];
}

export default function SuppliersPage() {
  const navigate = useNavigate();

  // Summary Stats
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    totalPayables: 0,
    citiesCount: 0,
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Supplier List & Pagination
  const [suppliers, setSuppliers] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getSupplierSummaryStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load supplier stats:', err);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getSuppliers({
        search,
        page,
        pageSize,
      });

      let items = result.items || [];
      if (statusFilter !== 'All') {
        items = items.filter(s => s.status === statusFilter);
      }

      setSuppliers(items);
      setTotalCount(result.total || items.length);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSeedTemplates = async () => {
    if (window.confirm('Import standard steel mill & vendor profiles (Tata Steel BSL, JSPL, SAIL, Shyam Metalics)?')) {
      await seedSupplierTemplates();
      fetchStats();
      fetchSuppliers();
    }
  };

  const handleExportCSV = () => {
    exportSuppliersToCSV(suppliers);
  };

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <ERPLayout pageTitle="Suppliers" showBackButton={true} backTo="/dashboard">
      <div className={styles.container}>
        {/* ── Page Header ────────────────────────────── */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.breadcrumbs}>
              <span>ERP</span> / <span className={styles.breadcrumbActive}>Suppliers Master</span>
            </div>
            <div className={styles.titleWrapper}>
              <h1 className={styles.title}>Suppliers & Steel Mills</h1>
              <span className={styles.titleBadge}>{stats.totalSuppliers} Vendors</span>
            </div>
            <p className={styles.subtitle}>
              Primary steel producers, re-rolling mills, industrial stockists, and consignment payables
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate('/dashboard')}
              title="Go back to Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Go Back
            </button>

            {suppliers.length === 0 && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleSeedTemplates}
                title="Seed standard Indian steel mills & distributors"
              >
                ⚡ Seed Mill Templates
              </button>
            )}

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleExportCSV}
              disabled={suppliers.length === 0}
              title="Download suppliers catalog as CSV"
            >
              Export CSV
            </button>

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => navigate('/suppliers/new')}
            >
              + New Supplier
            </button>
          </div>
        </div>

        {/* ── KPI Summary Cards ──────────────────────── */}
        <div className={styles.kpiGrid}>
          {/* Total Suppliers */}
          <div className={`${styles.kpiCard} ${styles.cardPurple} hover-lift`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Total Vendors</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#f5f3ff', color: '#6d28d9' }}>
                🏭
              </div>
            </div>
            <div className={styles.kpiValue}>{stats.totalSuppliers}</div>
            <div className={styles.kpiBottom}>
              <span>Registered steel mills</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#ede9fe', color: '#6d28d9' }}>
                Direct Sourcing
              </span>
            </div>
          </div>

          {/* Active Suppliers */}
          <div className={`${styles.kpiCard} ${styles.cardEmerald} hover-lift`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Active For Inward</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#ecfdf5', color: '#059669' }}>
                ✓
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#059669' }}>
              {stats.activeSuppliers}
            </div>
            <div className={styles.kpiBottom}>
              <span>Verified vendor accounts</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#dcfce7', color: '#15803d' }}>
                100% Compliant
              </span>
            </div>
          </div>

          {/* Outstanding Payables */}
          <div className={`${styles.kpiCard} ${styles.cardRose} hover-lift`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Pending Payables</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#fff1f2', color: '#e11d48' }}>
                💳
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: stats.totalPayables > 0 ? '#e11d48' : '#0f172a' }}>
              {fmtINR(stats.totalPayables)}
            </div>
            <div className={styles.kpiBottom}>
              <span>Due against inward bills</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#ffe4e6', color: '#be123c' }}>
                Credit Watch
              </span>
            </div>
          </div>

          {/* Sourcing Hubs */}
          <div className={`${styles.kpiCard} ${styles.cardBlue} hover-lift`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Sourcing Hubs</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#f0f9ff', color: '#0284c7' }}>
                📍
              </div>
            </div>
            <div className={styles.kpiValue}>
              {stats.citiesCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>Cities</span>
            </div>
            <div className={styles.kpiBottom}>
              <span>Pan-India mill logistics</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                National Network
              </span>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Controls ───────────────── */}
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search vendor name, code (SUP-001), phone, or city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className={styles.statusTabs}>
            {['All', 'Active', 'Inactive'].map((status) => (
              <button
                key={status}
                type="button"
                className={`${styles.statusTab} ${statusFilter === status ? styles.statusTabActive : ''}`}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* ── Suppliers Table ────────────────────────── */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Code</th>
                  <th className={styles.th}>Supplier / Mill</th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Contact Person</th>
                  <th className={styles.th}>Phone</th>
                  <th className={`${styles.th} ${styles.center}`}>Credit Terms</th>
                  <th className={`${styles.th} ${styles.right}`}>Outstanding Dues</th>
                  <th className={`${styles.th} ${styles.center}`}>Status</th>
                  <th className={`${styles.th} ${styles.right}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                      Loading suppliers directory…
                    </td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className={styles.emptyContainer}>
                        <div className={styles.emptyTitle}>No suppliers in directory</div>
                        <p className={styles.emptyText}>
                          Add your first steel mill supplier or import standard vendor templates to begin recording inward purchases.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={handleSeedTemplates}
                          >
                            ⚡ Seed Mill Templates
                          </button>
                          <button
                            type="button"
                            className={styles.btnPrimary}
                            onClick={() => navigate('/suppliers/new')}
                          >
                            + New Supplier
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} className={styles.tableRow}>
                      {/* Code */}
                      <td className={styles.td}>
                        <span
                          className={styles.codeBadge}
                          onClick={() => navigate(`/suppliers/${s.id}`)}
                          title="View supplier details"
                        >
                          {s.code}
                        </span>
                      </td>

                      {/* Name & Location */}
                      <td className={styles.td}>
                        <div className={styles.supplierCell}>
                          <div
                            className={styles.supplierAvatar}
                            style={{ background: getAvatarColor(s.id) }}
                          >
                            {getInitials(s.name)}
                          </div>
                          <div className={styles.supplierNameBlock}>
                            <span
                              className={styles.supplierName}
                              onClick={() => navigate(`/suppliers/${s.id}`)}
                            >
                              {s.name}
                            </span>
                            <span className={styles.supplierSubtext}>
                              {s.city ? `${s.city}, ${s.state}` : s.state || 'India'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className={styles.td}>
                        {s.email ? (
                          <span style={{ color: '#475569' }}>{s.email}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Contact Person */}
                      <td className={styles.td}>
                        <span style={{ fontWeight: 500 }}>{s.contactPerson || '—'}</span>
                      </td>

                      {/* Phone */}
                      <td className={`${styles.td} ${styles.mono}`}>
                        {s.phone ? (
                          <a href={`tel:${s.phone}`} style={{ color: '#475569' }}>
                            {s.phone}
                          </a>
                        ) : '—'}
                      </td>

                      {/* Credit Terms */}
                      <td className={`${styles.td} ${styles.center}`}>
                        <span style={{ background: '#f8fafc', padding: '3px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                          {s.creditDays ? `${s.creditDays} Days` : 'Cash/Advance'}
                        </span>
                      </td>

                      {/* Outstanding Dues */}
                      <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                        <span className={(s.outstandingBalance || 0) > 0 ? styles.balancePillDue : styles.balancePillClear}>
                          {fmtINR(s.outstandingBalance || 0)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className={`${styles.td} ${styles.center}`}>
                        <span className={`${styles.statusPill} ${s.status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                          ● {s.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className={`${styles.td} ${styles.right}`}>
                        <div className={styles.actionsCell}>
                          <button
                            type="button"
                            className={`${styles.btnAction} ${styles.btnActionPrimary}`}
                            onClick={() => navigate(`/purchases/new`)}
                            title="Record Inward Consignment from this supplier"
                          >
                            + Inward
                          </button>
                          <button
                            type="button"
                            className={styles.btnAction}
                            onClick={() => navigate(`/suppliers/${s.id}`)}
                            title="View details and ledger"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className={styles.btnAction}
                            onClick={() => navigate(`/suppliers/${s.id}/edit`)}
                            title="Edit supplier profile"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ────────────────────────────── */}
          <div className={styles.paginationBar}>
            <div>
              Showing {startRecord}–{endRecord} of {totalCount} vendors
            </div>

            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.pageBtn} ${p === page ? styles.activePage : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>

              <select
                className={styles.pageSizeSelect}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </ERPLayout>
  );
}
