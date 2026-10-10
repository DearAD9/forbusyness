/**
 * PurchasesPage — Forbusyness Web ERP
 *
 * Professional Steel Inward Goods & Purchases Directory.
 * Features:
 * - 4 Executive KPI cards: Total Purchases, Payables Dues, Inward Tonnage (MT), Total Bills
 * - High-speed filter toolbar: Search (Bill, Supplier, Vehicle), Status pills, Date range
 * - Complete steel inward log: Weighbridge slip ref, vehicle number, payables tracking
 * - Inward voucher inspection modal with print support
 * - Instant CSV export
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import {
  getPurchases,
  getPurchaseSummaryStats,
  exportPurchasesToCSV,
} from '../services/purchaseService';
import PurchaseViewModal from '../components/purchases/PurchaseViewModal';
import styles from './PurchasesPage.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
}

export default function PurchasesPage() {
  const navigate = useNavigate();

  // Summary Stats
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalPayables: 0,
    totalTonnage: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Table Data
  const [purchases, setPurchases] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modal inspection
  const [viewingPurchase, setViewingPurchase] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getPurchaseSummaryStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load purchase stats:', err);
    }
  }, []);

  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPurchases({
        search,
        status: statusFilter,
        dateFrom,
        dateTo,
        page,
        pageSize,
      });
      setPurchases(result.items);
      setTotalPages(result.totalPages);
      setTotalCount(result.total);
    } catch (err) {
      console.error('Failed to load purchases list:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, dateFrom, dateTo, page, pageSize]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleExport = () => {
    exportPurchasesToCSV(purchases);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter !== 'All' || dateFrom || dateTo;

  return (
    <ERPLayout>
      <div className={styles.container}>
        {/* ── Executive Header ─────────────────────────── */}
        <div className={styles.headerRow}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Purchases & Inward Goods</h1>
            <p className={styles.subtitle}>
              Steel mill purchases, inward weighbridge slips, and supplier payables management
            </p>
          </div>

          <div className={styles.actionsArea}>
            {purchases.length > 0 && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleExport}
              >
                📥 Export CSV
              </button>
            )}
            <Link to="/purchases/new" className={styles.btnPrimary}>
              + Record Inward Purchase
            </Link>
          </div>
        </div>

        {/* ── 4 KPI Summary Cards ───────────────────────── */}
        <div className={styles.statsGrid}>
          <div className={`${styles.kpiCard} ${styles.kpiPurple}`}>
            <span className={styles.kpiTitle}>Total Purchases</span>
            <span className={styles.kpiValue}>{fmtINR(stats.totalAmount)}</span>
            <span className={styles.kpiSubtext}>Cumulative inward gross material value</span>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiAmber}`}>
            <span className={styles.kpiTitle}>Outstanding Payables</span>
            <span className={styles.kpiValue} style={{ color: stats.totalPayables > 0 ? '#e11d48' : '#0f172a' }}>
              {fmtINR(stats.totalPayables)}
            </span>
            <span className={styles.kpiSubtext}>Pending mill & supplier dues</span>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiEmerald}`}>
            <span className={styles.kpiTitle}>Inward Steel Tonnage</span>
            <span className={styles.kpiValue}>
              {stats.totalTonnage.toLocaleString()} <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>MT</span>
            </span>
            <span className={styles.kpiSubtext}>Total volume received across all consignments</span>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiBlue}`}>
            <span className={styles.kpiTitle}>Inward Bills</span>
            <span className={styles.kpiValue}>{stats.totalPurchases}</span>
            <span className={styles.kpiSubtext}>Logged purchase vouchers</span>
          </div>
        </div>

        {/* ── Filter Toolbar ────────────────────────────── */}
        <div className={styles.toolbarCard}>
          <div className={styles.toolbarLeft}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search Bill #, Supplier, Vehicle, Ref..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending (Unpaid)</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>From:</span>
              <input
                type="date"
                className={styles.dateInput}
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>To:</span>
              <input
                type="date"
                className={styles.dateInput}
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleResetFilters}
                style={{ height: '38px', padding: '0 12px' }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ── Table or Empty State ──────────────────────── */}
        {isLoading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
            Loading inward purchase consignments...
          </div>
        ) : purchases.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>📥</div>
            <h3 className={styles.emptyTitle}>No Purchase Bills Found</h3>
            <p className={styles.emptyDesc}>
              {hasActiveFilters
                ? 'No inward purchase consignments match your current filters. Try adjusting your search query or date range.'
                : 'Zero inward purchase bills recorded yet. Record your steel inward consignments to automatically track inventory, weighbridge slips, and payables.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleResetFilters}
              >
                Clear All Filters
              </button>
            ) : (
              <Link to="/purchases/new" className={styles.btnPrimary}>
                + Record First Purchase Consignment
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Bill #</th>
                  <th className={styles.th}>Inward Date</th>
                  <th className={styles.th}>Supplier</th>
                  <th className={styles.th}>Vehicle / Slip Ref</th>
                  <th className={styles.th}>Materials</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Grand Total</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Paid</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Balance Due</th>
                  <th className={styles.th}>Status</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => {
                  let statusClass = styles.statusPending;
                  if (p.status === 'Paid') statusClass = styles.statusPaid;
                  else if (p.status === 'Partially Paid') statusClass = styles.statusPartial;

                  return (
                    <tr key={p.id} className={styles.tr}>
                      <td className={styles.td}>
                        <span className={styles.billBadge}>{p.billNo}</span>
                      </td>
                      <td className={styles.td}>
                        {p.date}
                      </td>
                      <td className={styles.td}>
                        <div className={styles.supplierName}>
                          {p.supplier?.name || 'Direct Cash / Mill'}
                        </div>
                        {p.supplier?.city && (
                          <div className={styles.supplierCity}>{p.supplier.city}</div>
                        )}
                      </td>
                      <td className={styles.td}>
                        {p.vehicleNo ? (
                          <span className={styles.vehiclePill}>{p.vehicleNo}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                        {p.weighbridgeSlip && (
                          <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px' }}>
                            Slip: {p.weighbridgeSlip}
                          </div>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span style={{ fontWeight: 600 }}>{p.items?.length || 0} item{(p.items?.length || 0) === 1 ? '' : 's'}</span>
                        <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                          {p.items?.[0]?.productName || p.items?.[0]?.name || ''}
                          {(p.items?.length || 0) > 1 && ` +${p.items.length - 1} more`}
                        </div>
                      </td>
                      <td className={`${styles.td} ${styles.tdRight}`}>
                        <strong>{fmtINR(p.grandTotal)}</strong>
                      </td>
                      <td className={`${styles.td} ${styles.tdRight}`} style={{ color: '#059669', fontWeight: 600 }}>
                        {fmtINR(p.paid)}
                      </td>
                      <td className={`${styles.td} ${styles.tdRight}`} style={{ color: p.pending > 0 ? '#dc2626' : '#64748b', fontWeight: p.pending > 0 ? 700 : 500 }}>
                        {fmtINR(p.pending)}
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.statusBadge} ${statusClass}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className={`${styles.td} ${styles.tdRight}`}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => setViewingPurchase(p)}
                        >
                          👁️ View Slip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className={styles.paginationRow}>
              <span>
                Showing <strong>{((page - 1) * pageSize) + 1}</strong> to <strong>{Math.min(page * pageSize, totalCount)}</strong> of <strong>{totalCount}</strong> purchase bills
              </span>

              <div className={styles.pageButtons}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={page <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                  <button
                    key={pNum}
                    type="button"
                    className={`${styles.pageBtn} ${page === pNum ? styles.pageBtnActive : ''}`}
                    onClick={() => setPage(pNum)}
                  >
                    {pNum}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={page >= totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Inspection Modal ─────────────────────────── */}
        {viewingPurchase && (
          <PurchaseViewModal
            purchase={viewingPurchase}
            onClose={() => setViewingPurchase(null)}
          />
        )}
      </div>
    </ERPLayout>
  );
}
