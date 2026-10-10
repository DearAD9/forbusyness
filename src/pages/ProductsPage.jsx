/**
 * ProductsPage — Forbusyness Web ERP
 *
 * Professional Steel Product Catalog & Materials Directory.
 * Features:
 * - 4 Summary KPI cards with category counts & margin overview
 * - Segmented category filter pills (MS Pipes, Angles, Flats, Bars, Beams, Hardware)
 * - Dual view modes: High-density Table & Cards Grid View
 * - Instant CSV export
 * - Optional 1-click "Import Standard Steel Templates" action for rapid catalog setup
 * - Direct navigation to + New Product, Edit, and Product Details
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import {
  getProducts,
  getProductSummaryStats,
  STEEL_CATEGORIES,
  exportProductsToCSV,
  importStandardSteelTemplates,
} from '../services/productService';
import styles from './ProductsPage.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
}

// Category avatar colors
const CATEGORY_COLORS = {
  'MS Pipes': 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
  'MS Angles': 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
  'MS Flats': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
  'MS Round Bars': 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
  'MS Square Bars': 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
  'Beams & Channels': 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
  'Plates & Sheets': 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
  'Industrial Hardware': 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
};

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
}

function getCategoryCode(cat = '') {
  if (cat.includes('Pipe')) return 'PIP';
  if (cat.includes('Angle')) return 'ANG';
  if (cat.includes('Flat')) return 'FLT';
  if (cat.includes('Round')) return 'ROD';
  if (cat.includes('Square')) return 'SQR';
  if (cat.includes('Beam')) return 'SEC';
  if (cat.includes('Plate')) return 'PLT';
  return 'HDW';
}

export default function ProductsPage() {
  const navigate = useNavigate();

  // Summary Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    categoriesCount: 0,
    lowStockCount: 0,
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const viewMode = 'table';

  // Products List & Pagination
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getProductSummaryStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load product stats:', err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getProducts({
        search,
        category: categoryFilter,
        page,
        pageSize,
      });
      setProducts(result.items || []);
      setTotalPages(result.totalPages || 1);
      setTotalCount(result.total || 0);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryFilter, page, pageSize]);

  useEffect(() => {
    fetchStats();
    fetchProducts();
  }, [fetchStats, fetchProducts]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('All');
    setPage(1);
  };

  const handleImportTemplates = async () => {
    if (window.confirm('Import standard steel product catalog templates (MS Pipes, Angles, Flats, Beams)?')) {
      await importStandardSteelTemplates();
      fetchStats();
      fetchProducts();
    }
  };

  const handleExportCSV = () => {
    exportProductsToCSV(products);
  };

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <ERPLayout pageTitle="Products" showBackButton={true} backTo="/dashboard">
      <div className={styles.container}>
        {/* ── Page Header ────────────────────────────── */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.breadcrumbs}>
              <span>ERP</span> / <span className={styles.breadcrumbActive}>Products</span>
            </div>
            <div className={styles.titleWrapper}>
              <h1 className={styles.title}>Products</h1>
              <span className={styles.titleBadge}>{stats.totalProducts} Products</span>
            </div>
            <p className={styles.subtitle}>
              Manage product codes, HSN codes, stock units, and commercial purchase/sale margins
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
                fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Go Back
            </button>

            {products.length === 0 && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleImportTemplates}
                title="Seed standard product templates"
              >
                ⚡ Import Templates
              </button>
            )}

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleExportCSV}
              disabled={products.length === 0}
              title="Download products catalog as CSV"
            >
              Export CSV
            </button>

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => navigate('/products/new')}
            >
              + New Product
            </button>
          </div>
        </div>

        {/* ── KPI Summary Cards ──────────────────────── */}
        <div className={styles.kpiGrid}>
          {/* Total Catalog Items */}
          <div className={`${styles.kpiCard} ${styles.cardPurple}`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Total Products</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#f5f3ff', color: '#6d28d9' }}>
                📦
              </div>
            </div>
            <div className={styles.kpiValue}>{stats.totalProducts}</div>
            <div className={styles.kpiBottom}>
              <span>Catalog items</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#ede9fe', color: '#6d28d9' }}>
                Inventory Ready
              </span>
            </div>
          </div>

          {/* Active Products */}
          <div className={`${styles.kpiCard} ${styles.cardEmerald}`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Active For Billing</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#ecfdf5', color: '#059669' }}>
                ✓
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#059669' }}>
              {stats.activeProducts}
            </div>
            <div className={styles.kpiBottom}>
              <span>Ready in sales dropdown</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#dcfce7', color: '#15803d' }}>
                100% Available
              </span>
            </div>
          </div>

          {/* Categories Count */}
          <div className={`${styles.kpiCard} ${styles.cardBlue}`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Categories</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#eff6ff', color: '#2563eb' }}>
                🏷️
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#2563eb' }}>
              {stats.categoriesCount}
            </div>
            <div className={styles.kpiBottom}>
              <span>Steel product classifications</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                Structured
              </span>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className={`${styles.kpiCard} ${styles.cardAmber}`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Reorder Attention</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#fffbeb', color: '#d97706' }}>
                ⚠️
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#b45309' }}>
              {stats.lowStockCount}
            </div>
            <div className={styles.kpiBottom}>
              <span>Below reorder quantity</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#fef3c7', color: '#b45309' }}>
                Stock Watch
              </span>
            </div>
          </div>
        </div>

        {/* ── Segmented Category Filter Pills ────────── */}
        <div className={styles.quickFiltersRow}>
          <button
            type="button"
            className={`${styles.filterPill} ${categoryFilter === 'All' ? styles.filterPillActive : ''}`}
            onClick={() => { setCategoryFilter('All'); setPage(1); }}
          >
            All Categories
          </button>
          {STEEL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.filterPill} ${categoryFilter === cat ? styles.filterPillActive : ''}`}
              onClick={() => { setCategoryFilter(cat); setPage(1); }}
            >
              {cat}
            </button>
          ))}
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
                placeholder="Search steel item name, code (MSP-150), HSN (7306), or specs..."
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
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            >
              <option value="All">All Categories</option>
              {STEEL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button type="submit" className={styles.btnSecondary} style={{ height: '38px' }}>
              Search
            </button>

            {(search || categoryFilter !== 'All') && (
              <button
                type="button"
                className={styles.btnSecondary}
                style={{ height: '38px' }}
                onClick={handleResetFilters}
              >
                Reset
              </button>
            )}
          </form>
        </div>

        {/* ── Products Display: Table or Grid ────────── */}
        {viewMode === 'table' ? (
          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th} style={{ width: '90px' }}>Code</th>
                    <th className={styles.th}>Material Item & Category</th>
                    <th className={styles.th}>HSN Code</th>
                    <th className={`${styles.th} ${styles.center}`}>Unit</th>
                    <th className={`${styles.th} ${styles.right}`}>Purchase Rate</th>
                    <th className={`${styles.th} ${styles.right}`}>Selling Rate</th>
                    <th className={`${styles.th} ${styles.center}`}>Margin %</th>
                    <th className={`${styles.th} ${styles.right}`}>Stock Level</th>
                    <th className={`${styles.th} ${styles.right}`} style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        Loading catalog materials…
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <div className={styles.emptyContainer}>
                          <div className={styles.emptyTitle}>No products in catalog</div>
                          <p className={styles.emptyText}>
                            Add your first product or import standard templates to start creating invoices and purchases.
                          </p>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              type="button"
                              className={styles.btnSecondary}
                              onClick={handleImportTemplates}
                            >
                              ⚡ Seed Standard Templates
                            </button>
                            <button
                              type="button"
                              className={styles.btnPrimary}
                              onClick={() => navigate('/products/new')}
                            >
                              + New Product
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className={styles.tableRow}>
                        {/* Code */}
                        <td className={styles.td}>
                          <span
                            className={styles.codeBadge}
                            onClick={() => navigate(`/products/${p.id}`)}
                            title="Click to view material details"
                          >
                            {p.code}
                          </span>
                        </td>

                        {/* Name & Category */}
                        <td className={styles.td}>
                          <div className={styles.productIdentityCell}>
                            <div
                              className={styles.categoryAvatar}
                              style={{ background: getCategoryColor(p.category) }}
                            >
                              {getCategoryCode(p.category)}
                            </div>
                            <div className={styles.prodNameBlock}>
                              <span
                                className={styles.prodName}
                                onClick={() => navigate(`/products/${p.id}`)}
                              >
                                {p.name}
                              </span>
                              <span className={styles.prodCategoryTag}>
                                {p.category} {p.specifications && `• ${p.specifications}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* HSN */}
                        <td className={`${styles.td} ${styles.mono}`}>
                          <span style={{ fontWeight: 600 }}>HSN {p.hsn || '—'}</span>
                        </td>

                        {/* Unit */}
                        <td className={`${styles.td} ${styles.center}`}>
                          <span style={{ fontWeight: 600, background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>
                            {p.unit}
                          </span>
                        </td>

                        {/* Purchase Rate */}
                        <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                          {p.purchaseRate ? fmtINR(p.purchaseRate) : '—'}
                        </td>

                        {/* Selling Rate */}
                        <td className={`${styles.td} ${styles.right} ${styles.mono}`} style={{ fontWeight: 700, color: '#0f172a' }}>
                          {fmtINR(p.sellingRate)}
                        </td>

                        {/* Margin % */}
                        <td className={`${styles.td} ${styles.center}`}>
                          <span className={styles.marginPill}>
                            {p.marginPct > 0 ? `+${p.marginPct}%` : '—'}
                          </span>
                        </td>

                        {/* Stock Level */}
                        <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                          <span style={{ fontWeight: 600, color: (p.currentStock || 0) <= (p.minStock || 0) ? '#b45309' : '#059669' }}>
                            {p.currentStock || 0} {p.unit}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className={`${styles.td} ${styles.right}`}>
                          <div className={styles.actionsCell}>
                            <button
                              type="button"
                              className={`${styles.btnAction} ${styles.btnActionView}`}
                              onClick={() => navigate(`/products/${p.id}`)}
                              title="View Product Details"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className={`${styles.btnAction} ${styles.btnActionEdit}`}
                              onClick={() => navigate(`/products/${p.id}/edit`)}
                              title="Edit Product"
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
                Showing {startRecord}–{endRecord} of {totalCount} products
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
            {products.map((p) => (
              <div key={p.id} className={styles.productCard}>
                <div className={styles.cardTop}>
                  <div className={styles.productIdentityCell}>
                    <div
                      className={styles.categoryAvatar}
                      style={{ background: getCategoryColor(p.category) }}
                    >
                      {getCategoryCode(p.category)}
                    </div>
                    <div>
                      <div
                        className={styles.prodName}
                        onClick={() => navigate(`/products/${p.id}`)}
                      >
                        {p.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span className={styles.codeBadge}>{p.code}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {p.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={styles.marginPill}>
                    {p.marginPct > 0 ? `+${p.marginPct}%` : '—'}
                  </span>
                </div>

                {/* Pricing Box */}
                <div className={styles.cardPricingRow}>
                  <div className={styles.cardPricingCol}>
                    <span className={styles.cardPriceLabel}>Purchase Rate</span>
                    <span className={styles.cardPriceVal}>
                      {p.purchaseRate ? fmtINR(p.purchaseRate) : '—'}
                    </span>
                  </div>

                  <div className={styles.cardPricingCol}>
                    <span className={styles.cardPriceLabel}>Selling Rate</span>
                    <span className={styles.cardPriceVal} style={{ color: '#059669' }}>
                      {fmtINR(p.sellingRate)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>HSN: <strong>{p.hsn || '—'}</strong></span>
                  <span>Unit: <strong>{p.unit}</strong></span>
                </div>

                {/* Bottom Actions */}
                <div className={styles.cardBottomActions}>
                  <button
                    type="button"
                    className={`${styles.btnAction} ${styles.btnActionView}`}
                    style={{ flex: 1 }}
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    className={`${styles.btnAction} ${styles.btnActionEdit}`}
                    onClick={() => navigate(`/products/${p.id}/edit`)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
