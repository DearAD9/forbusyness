/**
 * CustomersPage — Forbusyness Web ERP
 *
 * Professional Enterprise Customer Management for Steel Materials Business.
 * Features:
 * - 4 Rich KPI cards with status accents & exposure metrics
 * - Segmented interactive quick filter pills
 * - Dual view modes: High-density Table View & Visual Cards Grid
 * - Client monograms & PAN verification badges
 * - Visual Credit Exposure gauges
 * - Instant CSV Data Export
 * - Direct "+ Invoice" pre-selection integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import {
  getCustomers,
  getCustomerSummaryStats,
  getIndianStates,
  exportCustomersToCSV,
} from '../services/customerService';
import styles from './CustomersPage.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

// Generate consistent initials and gradients for corporate avatars
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
];

function getMonogram(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CU';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getAvatarBackground(id = 1) {
  return AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];
}

export default function CustomersPage() {
  const navigate = useNavigate();

  // Summary KPI Stats
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalReceivables: 0,
    overdueCount: 0,
    activeCount: 0,
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  const [balanceStatus, setBalanceStatus] = useState('All'); // 'All' | 'Outstanding' | 'HighRisk' | 'Zero' | 'Advance'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Customer List & Pagination
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const indianStates = getIndianStates();

  const fetchStats = useCallback(async () => {
    try {
      const data = await getCustomerSummaryStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load customer stats:', err);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getCustomers({
        search,
        state: stateFilter,
        balanceStatus: balanceStatus === 'HighRisk' ? 'Outstanding' : balanceStatus,
        page,
        pageSize,
      });

      let items = result.items || [];
      if (balanceStatus === 'HighRisk') {
        items = items.filter((c) => c.creditLimit && c.balance > c.creditLimit * 0.5);
      }

      setCustomers(items);
      setTotalPages(result.totalPages || 1);
      setTotalCount(result.total || items.length);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, stateFilter, balanceStatus, page, pageSize]);

  useEffect(() => {
    fetchStats();
    fetchCustomers();
  }, [fetchStats, fetchCustomers]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStateFilter('All');
    setBalanceStatus('All');
    setPage(1);
  };

  const handleExportCSV = () => {
    exportCustomersToCSV(customers);
  };

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <ERPLayout pageTitle="Customers">
      <div className={styles.container}>
        {/* ── Page Header ────────────────────────────── */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.breadcrumbs}>
              <span>ERP</span> / <span className={styles.breadcrumbActive}>Customer Accounts</span>
            </div>
            <div className={styles.titleWrapper}>
              <h1 className={styles.title}>Customers & Receivables</h1>
              <span className={styles.titleBadge}>{stats.totalCustomers} Accounts</span>
            </div>
            <p className={styles.subtitle}>
              Monitor client credit terms, PAN records, and outstanding ledger balances
            </p>
          </div>

          <div className={styles.headerActions}>
            {/* View Mode Switcher */}
            <div className={styles.viewSwitcher} title="Toggle view mode">
              <button
                type="button"
                className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
                onClick={() => setViewMode('table')}
                aria-label="Table View"
                title="Table view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
              <button
                type="button"
                className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Card Grid View"
                title="Cards view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </button>
            </div>

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleExportCSV}
              title="Download customer list as CSV"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => navigate('/customers/new')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Customer
            </button>
          </div>
        </div>

        {/* ── KPI Summary Cards ──────────────────────── */}
        <div className={styles.kpiGrid}>
          {/* Total Accounts */}
          <div className={`${styles.kpiCard} ${styles.cardPurple}`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Total Accounts</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#f5f3ff', color: '#6d28d9' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
            </div>
            <div className={styles.kpiValue}>{stats.totalCustomers}</div>
            <div className={styles.kpiBottom}>
              <span>Registered buyers</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#ede9fe', color: '#6d28d9' }}>
                100% Onboarded
              </span>
            </div>
          </div>

          {/* Total Outstanding */}
          <div className={`${styles.kpiCard} ${styles.cardRed}`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Total Receivables</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#fef2f2', color: '#dc2626' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#b91c1c' }}>
              {fmtINR(stats.totalReceivables)}
            </div>
            <div className={styles.kpiBottom}>
              <span>Net ledger dues</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#fee2e2', color: '#b91c1c' }}>
                Overdue Attention
              </span>
            </div>
          </div>

          {/* High Exposure Accounts */}
          <div className={`${styles.kpiCard} ${styles.cardAmber}`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>High Credit Exposure</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#fffbeb', color: '#d97706' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#b45309' }}>
              {stats.overdueCount}
            </div>
            <div className={styles.kpiBottom}>
              <span>&gt;50% credit limit used</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#fef3c7', color: '#b45309' }}>
                Watchlist
              </span>
            </div>
          </div>

          {/* Active Accounts */}
          <div className={`${styles.kpiCard} ${styles.cardEmerald}`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Active Accounts</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#ecfdf5', color: '#059669' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#15803d' }}>
              {stats.activeCount}
            </div>
            <div className={styles.kpiBottom}>
              <span>Operational clients</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#dcfce7', color: '#15803d' }}>
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* ── Segmented Quick Filter Pills ────────────── */}
        <div className={styles.quickFiltersRow}>
          <button
            type="button"
            className={`${styles.filterPill} ${balanceStatus === 'All' ? styles.filterPillActive : ''}`}
            onClick={() => { setBalanceStatus('All'); setPage(1); }}
          >
            All Accounts <span className={styles.filterPillCount}>{stats.totalCustomers}</span>
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${balanceStatus === 'Outstanding' ? styles.filterPillActive : ''}`}
            onClick={() => { setBalanceStatus('Outstanding'); setPage(1); }}
          >
            Has Outstanding
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${balanceStatus === 'HighRisk' ? styles.filterPillActive : ''}`}
            onClick={() => { setBalanceStatus('HighRisk'); setPage(1); }}
          >
            High Exposure (&gt;50% Limit) {stats.overdueCount > 0 && <span className={styles.filterPillCount}>{stats.overdueCount}</span>}
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${balanceStatus === 'Zero' ? styles.filterPillActive : ''}`}
            onClick={() => { setBalanceStatus('Zero'); setPage(1); }}
          >
            Zero Balance
          </button>
        </div>

        {/* ── Search & Filter Controls ────────────────── */}
        <div className={styles.filterCard}>
          <form className={styles.filterGrid} onSubmit={handleSearchSubmit}>
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
                placeholder="Search company, phone, code, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearch('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              className={styles.filterSelect}
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
            >
              <option value="All">All States</option>
              {indianStates.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <button type="submit" className={styles.btnSecondary} style={{ height: '38px' }}>
              Search
            </button>

            {(search || stateFilter !== 'All' || balanceStatus !== 'All') && (
              <button
                type="button"
                className={styles.btnReset}
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
            )}
          </form>
        </div>

        {/* ── Customers Display Mode: Table or Grid ──── */}
        {viewMode === 'table' ? (
          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th} style={{ width: '90px' }}>Code</th>
                    <th className={styles.th}>Customer Name & Contact</th>
                    <th className={styles.th}>PAN</th>
                    <th className={styles.th}>Location</th>
                    <th className={`${styles.th} ${styles.right}`} style={{ width: '130px' }}>Credit Exposure</th>
                    <th className={`${styles.th} ${styles.right}`} style={{ width: '120px' }}>Ledger Balance</th>
                    <th className={`${styles.th} ${styles.center}`} style={{ width: '90px' }}>Status</th>
                    <th className={`${styles.th} ${styles.right}`} style={{ width: '190px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        Loading customer accounts…
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className={styles.emptyContainer}>
                          <div className={styles.emptyTitle}>No matching customers</div>
                          <p className={styles.emptyText}>
                            No customer records match your filter criteria. Try adjusting the search term or resetting filters.
                          </p>
                          <button
                            type="button"
                            className={styles.btnPrimary}
                            onClick={() => navigate('/customers/new')}
                          >
                            + New Customer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => {
                      const limit = c.creditLimit || 0;
                      const bal = c.balance || 0;
                      const exposurePct = limit > 0 ? Math.min(100, Math.round((bal / limit) * 100)) : 0;
                      const isHighExposure = exposurePct > 50;

                      return (
                        <tr key={c.id} className={styles.tableRow}>
                          {/* Code */}
                          <td className={styles.td}>
                            <span
                              className={styles.codeBadge}
                              onClick={() => navigate(`/customers/${c.id}`)}
                              title="Click to view statement ledger"
                            >
                              {c.code}
                            </span>
                          </td>

                          {/* Identity & Contact */}
                          <td className={styles.td}>
                            <div className={styles.customerIdentityCell}>
                              <div
                                className={styles.avatarMonogram}
                                style={{ background: getAvatarBackground(c.id) }}
                              >
                                {getMonogram(c.name)}
                              </div>

                              <div className={styles.custInfoBlock}>
                                <span
                                  className={styles.custName}
                                  onClick={() => navigate(`/customers/${c.id}`)}
                                >
                                  {c.name}
                                </span>
                                <div className={styles.custSubDetails}>
                                  {c.contactPerson && <span>Attn: {c.contactPerson}</span>}
                                  <span>•</span>
                                  <span>{c.phone}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* PAN */}
                          <td className={`${styles.td} ${styles.mono}`}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{c.pan || '—'}</span>
                          </td>

                          {/* Location */}
                          <td className={styles.td}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600 }}>{c.city}</span>
                              <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>{c.state}</span>
                            </div>
                          </td>

                          {/* Credit Exposure Gauge */}
                          <td className={`${styles.td} ${styles.right}`}>
                            <div className={styles.exposureGauge}>
                              <div className={styles.exposureText}>
                                <span>{limit ? fmtINR(limit) : 'No limit'}</span>
                                <span style={{ fontWeight: 700, color: isHighExposure ? '#b45309' : '#15803d' }}>
                                  {limit ? `${exposurePct}%` : '—'}
                                </span>
                              </div>
                              {limit > 0 && (
                                <div className={styles.exposureBarTrack}>
                                  <div
                                    className={styles.exposureBarFill}
                                    style={{
                                      width: `${exposurePct}%`,
                                      background: exposurePct > 80 ? '#ef4444' : exposurePct > 50 ? '#f59e0b' : '#10b981',
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Ledger Balance */}
                          <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                            <span
                              style={{
                                fontSize: '0.9375rem',
                                fontWeight: 800,
                                color: bal > 0 ? '#b91c1c' : bal < 0 ? '#0284c7' : '#15803d',
                              }}
                            >
                              {fmtINR(bal)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className={`${styles.td} ${styles.center}`}>
                            <span
                              className={`${styles.statusBadge} ${
                                c.status === 'Active' ? styles.badgeActive : styles.badgeInactive
                              }`}
                            >
                              <span className={styles.statusDot} />
                              {c.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className={`${styles.td} ${styles.right}`}>
                            <div className={styles.actionsCell}>
                              <button
                                type="button"
                                className={`${styles.btnAction} ${styles.btnActionView}`}
                                onClick={() => navigate(`/customers/${c.id}`)}
                                title="View Customer Ledger & Statement"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className={`${styles.btnAction} ${styles.btnActionEdit}`}
                                onClick={() => navigate(`/customers/${c.id}/edit`)}
                                title="Edit Customer Details"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={`${styles.btnAction} ${styles.btnActionInvoice}`}
                                onClick={() => navigate(`/sales/invoices/new?customerId=${c.id}`)}
                                title="Create Sales Invoice for this Customer"
                              >
                                + Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ────────────────────────────── */}
            <div className={styles.paginationBar}>
              <div>
                Showing {startRecord}–{endRecord} of {totalCount} accounts
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
        ) : (
          /* ── Grid Cards View Mode ──────────────────── */
          <div className={styles.cardsGrid}>
            {customers.map((c) => {
              const limit = c.creditLimit || 0;
              const bal = c.balance || 0;
              const exposurePct = limit > 0 ? Math.min(100, Math.round((bal / limit) * 100)) : 0;

              return (
                <div key={c.id} className={styles.clientCard}>
                  <div className={styles.cardTopRow}>
                    <div className={styles.cardClientInfo}>
                      <div
                        className={styles.avatarMonogram}
                        style={{ background: getAvatarBackground(c.id) }}
                      >
                        {getMonogram(c.name)}
                      </div>
                      <div>
                        <div
                          className={styles.custName}
                          onClick={() => navigate(`/customers/${c.id}`)}
                        >
                          {c.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span className={styles.codeBadge}>{c.code}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {c.city}, {c.state}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`${styles.statusBadge} ${
                        c.status === 'Active' ? styles.badgeActive : styles.badgeInactive
                      }`}
                    >
                      <span className={styles.statusDot} />
                      {c.status}
                    </span>
                  </div>

                  {/* Financial Metrics Box */}
                  <div className={styles.cardMetricsRow}>
                    <div className={styles.cardMetricCol}>
                      <span className={styles.cardMetricLabel}>Ledger Balance</span>
                      <span
                        className={styles.cardMetricVal}
                        style={{ color: bal > 0 ? '#b91c1c' : '#15803d' }}
                      >
                        {fmtINR(bal)}
                      </span>
                    </div>

                    <div className={styles.cardMetricCol}>
                      <span className={styles.cardMetricLabel}>Credit Limit</span>
                      <span className={styles.cardMetricVal}>
                        {limit ? fmtINR(limit) : 'No Limit'}
                      </span>
                    </div>
                  </div>

                  {/* Credit Gauge */}
                  {limit > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748b' }}>
                        <span>Credit Exposure</span>
                        <span style={{ fontWeight: 700 }}>{exposurePct}%</span>
                      </div>
                      <div className={styles.exposureBarTrack}>
                        <div
                          className={styles.exposureBarFill}
                          style={{
                            width: `${exposurePct}%`,
                            background: exposurePct > 80 ? '#ef4444' : exposurePct > 50 ? '#f59e0b' : '#10b981',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className={styles.cardContactRow}>
                    {c.contactPerson && (
                      <div><strong>Contact:</strong> {c.contactPerson}</div>
                    )}
                    <div><strong>Phone:</strong> {c.phone}</div>
                    {c.pan && <div><strong>PAN:</strong> {c.pan}</div>}
                  </div>

                  {/* Bottom Actions */}
                  <div className={styles.cardBottomActions}>
                    <button
                      type="button"
                      className={`${styles.btnAction} ${styles.btnActionView}`}
                      style={{ flex: 1 }}
                      onClick={() => navigate(`/customers/${c.id}`)}
                    >
                      View Statement
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnAction} ${styles.btnActionEdit}`}
                      onClick={() => navigate(`/customers/${c.id}/edit`)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnAction} ${styles.btnActionInvoice}`}
                      onClick={() => navigate(`/sales/invoices/new?customerId=${c.id}`)}
                    >
                      + Invoice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
