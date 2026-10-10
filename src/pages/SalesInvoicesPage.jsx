/**
 * SalesInvoicesPage — Forbusyness Web ERP
 *
 * Central sales invoice management screen.
 * Header: Sales → Sales Invoices
 *
 * Requirements:
 * - Title: "Sales Invoices"
 * - Subtitle: "View, search and manage all your sales invoices"
 * - Primary button: "+ New Invoice"
 * - Summary cards: Total Invoices, Total Sales, Received Amount (dominant total + breakdown), Pending Amount
 * - Filters: Search (Invoice No, Customer, Phone), Date Range, Customer, Payment Status, Search & Reset
 * - Table: Invoice No, Date, Customer, Items, Total, Received, Pending, Status, Action
 * - Order: Strictly DESCENDING numeric invoice-number order!
 * - Pagination: Showing 1–10 of N invoices, Prev, Pages, Next, Page Size selector
 * - View modal & Print preview
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import InvoiceSummaryCards from '../components/sales/InvoiceSummaryCards';
import InvoiceViewModal from '../components/sales/InvoiceViewModal';
import PrintInvoiceModal from '../components/sales/PrintInvoiceModal';
import { getInvoices, getInvoiceSummaryStats } from '../services/invoiceService';
import { getCustomers } from '../services/customerService';
import styles from './SalesInvoicesPage.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function SalesInvoicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Summary Stats
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalSales: 0,
    receivedAmount: 0,
    pendingAmount: 0,
    breakdown: { cash: 0, bank: 0, upi: 0, other: 0 },
  });

  // Filter States (initialized from URL if present)
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [customerId, setCustomerId] = useState('');
  const [status, setStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Dropdown options
  const [customerOptions, setCustomerOptions] = useState([]);

  // Invoices list & pagination
  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(null);

  // Load Customers for filter dropdown
  useEffect(() => {
    getCustomers().then((res) => setCustomerOptions(Array.isArray(res) ? res : (res?.items || [])));
  }, []);

  // Fetch Summary Stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await getInvoiceSummaryStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load invoice summary stats:', err);
    }
  }, []);

  // Fetch Invoices
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getInvoices({
        search,
        customerId,
        status,
        dateFrom,
        dateTo,
        page,
        pageSize,
      });
      setInvoices(result.items);
      setTotalPages(result.totalPages);
      setTotalCount(result.total);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, customerId, status, dateFrom, dateTo, page, pageSize]);

  useEffect(() => {
    fetchStats();
    fetchInvoices();
  }, [fetchStats, fetchInvoices]);

  // Sync search input if URL search param changes
  useEffect(() => {
    const urlQuery = searchParams.get('search') || '';
    if (urlQuery !== search) {
      setSearch(urlQuery);
      setPage(1);
    }
  }, [searchParams, search]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setPage(1);
    if (search.trim()) {
      setSearchParams({ search: search.trim() });
    } else {
      setSearchParams({});
    }
    fetchInvoices();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCustomerId('');
    setStatus('All');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setSearchParams({});
  };

  // Status badge styling
  const getStatusBadge = (invStatus) => {
    switch (invStatus?.toLowerCase()) {
      case 'paid':
        return <span className={`${styles.badge} ${styles.statusPaid}`}>Paid</span>;
      case 'partially paid':
        return <span className={`${styles.badge} ${styles.statusPartially}`}>Partially Paid</span>;
      default:
        return <span className={`${styles.badge} ${styles.statusPending}`}>Pending</span>;
    }
  };

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <ERPLayout pageTitle="Sales → Sales Invoices">
      <div className={styles.container}>
        {/* ── Page Header ────────────────────────────── */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.breadcrumbs}>
              Sales / <span className={styles.breadcrumbActive}>Sales Invoices</span>
            </div>
            <h1 className={styles.title}>Sales Invoices</h1>
            <p className={styles.subtitle}>View, search and manage all your sales invoices</p>
          </div>

          <button
            className={styles.btnNewInvoice}
            onClick={() => navigate('/sales/invoices/new')}
          >
            + New Invoice
          </button>
        </div>

        {/* ── Summary Cards ──────────────────────────── */}
        <InvoiceSummaryCards
          totalInvoices={stats.totalInvoices}
          totalSales={stats.totalSales}
          receivedAmount={stats.receivedAmount}
          pendingAmount={stats.pendingAmount}
          breakdown={stats.breakdown}
        />

        {/* ── Filter Bar ─────────────────────────────── */}
        <div className={styles.filterCard}>
          <form className={styles.filterGrid} onSubmit={handleSearchSubmit}>
            {/* Search (Invoice No, Customer, Phone) */}
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Search</label>
              <input
                type="text"
                className={styles.filterInput}
                placeholder="Invoice No., Customer, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Customer Filter */}
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Customer</label>
              <select
                className={styles.filterSelect}
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Customers</option>
                {customerOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Date From</label>
              <input
                type="date"
                className={styles.filterInput}
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Date To</label>
              <input
                type="date"
                className={styles.filterInput}
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Payment Status */}
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Status</label>
              <select
                className={styles.filterSelect}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className={styles.btnSearch}>
                Search
              </button>
              <button
                type="button"
                className={styles.btnReset}
                onClick={handleResetFilters}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* ── Invoices Table ─────────────────────────── */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Invoice No.</th>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Customer</th>
                  <th className={styles.th}>Items</th>
                  <th className={`${styles.th} ${styles.right}`}>Total</th>
                  <th className={`${styles.th} ${styles.right}`}>Received</th>
                  <th className={`${styles.th} ${styles.right}`}>Pending</th>
                  <th className={`${styles.th} ${styles.center}`}>Status</th>
                  <th className={`${styles.th} ${styles.right}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Loading invoices…
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className={styles.emptyContainer}>
                        <div className={styles.emptyTitle}>No sales invoices found</div>
                        <p className={styles.emptyText}>
                          {search || customerId || status !== 'All'
                            ? 'No invoices match the selected filter criteria. Try resetting filters.'
                            : 'Create your first invoice to see it here.'}
                        </p>
                        <button
                          className={styles.btnNewInvoice}
                          onClick={() => navigate('/sales/invoices/new')}
                        >
                          + New Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className={styles.tableRow}>
                      {/* Invoice No: Descending numeric */}
                      <td className={`${styles.td} ${styles.mono}`}>
                        <span
                          className={styles.invNumber}
                          onClick={() => setViewingInvoice(inv)}
                          title="Click to view invoice details"
                        >
                          #{inv.invoiceNo}
                        </span>
                      </td>

                      <td className={styles.td}>{inv.date}</td>

                      <td className={styles.td}>
                        <div className={styles.customerCell}>
                          <span className={styles.custName}>{inv.customer?.name}</span>
                          <span className={styles.custPhone}>{inv.customer?.phone}</span>
                        </div>
                      </td>

                      <td className={styles.td}>
                        {inv.items?.length || 0} item{(inv.items?.length || 0) !== 1 ? 's' : ''}
                      </td>

                      <td className={`${styles.td} ${styles.right} ${styles.mono}`} style={{ fontWeight: 600 }}>
                        {fmtINR(inv.grandTotal)}
                      </td>

                      <td className={`${styles.td} ${styles.right} ${styles.mono}`} style={{ color: '#047857' }}>
                        {fmtINR(inv.received)}
                      </td>

                      <td className={`${styles.td} ${styles.right} ${styles.mono}`} style={{ color: '#b91c1c' }}>
                        {fmtINR(inv.pending)}
                      </td>

                      <td className={`${styles.td} ${styles.center}`}>
                        {getStatusBadge(inv.status)}
                      </td>

                      <td className={`${styles.td} ${styles.right}`}>
                        <div className={styles.actionsCell}>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                            onClick={() => setViewingInvoice(inv)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => setPrintingInvoice(inv)}
                          >
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination Bar ────────────────────────── */}
          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>
              Showing {startRecord}–{endRecord} of {totalCount} invoices
            </div>

            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
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

              <div className={styles.pageSizeSelector}>
                <span>Per page:</span>
                <select
                  className={styles.pageSizeSelect}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── View Invoice Modal ──────────────────────── */}
        {viewingInvoice && (
          <InvoiceViewModal
            invoice={viewingInvoice}
            onClose={() => setViewingInvoice(null)}
            onPrint={(inv) => {
              setViewingInvoice(null);
              setPrintingInvoice(inv);
            }}
          />
        )}

        {/* ── Print Invoice Modal ─────────────────────── */}
        {printingInvoice && (
          <PrintInvoiceModal
            invoice={printingInvoice}
            onClose={() => setPrintingInvoice(null)}
          />
        )}
      </div>
    </ERPLayout>
  );
}
