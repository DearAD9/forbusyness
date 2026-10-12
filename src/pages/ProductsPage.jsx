/**
 * ProductsPage — Forbusyness Web ERP
 *
 * Professional Steel Product Catalog & Materials Directory.
 * Features:
 * - 4 Summary KPI cards with dynamic category count
 * - Dynamic user-managed category system with add/delete modal
 * - Dual view modes: High-density Table & Cards Grid View
 * - Instant CSV export
 * - Direct navigation to + New Product, Edit, and Product Details
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import { useCategories } from '../context/CategoryContext';
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

  // Categories — from global context (persisted to localStorage)
  const { categories, addCategory, deleteCategory } = useCategories();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

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

  // ── Category Modal Handlers ──────────────────────────
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) { setCategoryError('Category name cannot be empty.'); return; }
    if (categories.includes(trimmed)) { setCategoryError('This category already exists.'); return; }
    addCategory(trimmed);
    setNewCategoryName('');
    setCategoryError('');
  };

  const handleDeleteCategory = (cat) => {
    let inUse = products.some(p => p.category === cat);
    if (!inUse) {
      try {
        const stored = JSON.parse(localStorage.getItem('fb_products_data_v2') || '[]');
        if (Array.isArray(stored)) {
          inUse = stored.some(p => p.category === cat);
        }
      } catch {}
    }

    if (inUse) {
      const errorMsg = 'Cannot remove this category because it is currently assigned to one or more products. Please reassign or delete those products first.';
      setCategoryError(errorMsg);
      alert(errorMsg);
      return;
    }

    setCategoryError('');
    deleteCategory(cat);
    if (categoryFilter === cat) setCategoryFilter('All');
  };

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <ERPLayout pageTitle="Products" showBackButton={true} backTo="/dashboard">
      <div className={styles.container}>
        {/* ── Page Header ────────────────────────────── */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.titleWrapper}>
              <h1 className={styles.title}>Products</h1>
              <span className={styles.titleBadge}>{stats.totalProducts} Products</span>
            </div>
          </div>

          <div className={styles.headerActions}>

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => {
                setCategoryError('');
                setShowCategoryModal(true);
              }}
              title="Create, edit or delete product categories"
            >
              🏷️ Manage Categories
            </button>

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
              {categories.map((cat) => (
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
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        Loading catalog materials…
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className={styles.emptyContainer}>
                          <div className={styles.emptyTitle}>No products in catalog</div>
                          <p className={styles.emptyText}>
                            Add your first product or import standard templates to start creating invoices and purchases.
                          </p>
                          <button
                              type="button"
                              className={styles.btnPrimary}
                              onClick={() => navigate('/products/new')}
                            >
                              + New Product
                            </button>
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

      {/* ── Manage Categories Modal ──────────────────── */}
      {showCategoryModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowCategoryModal(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '14px', padding: '28px 32px',
              width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Manage Categories</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>Add or remove product categories</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Add new category */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => { setNewCategoryName(e.target.value); setCategoryError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="e.g. GI Pipes, TMT Bars…"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '7px',
                  border: categoryError ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                  fontSize: '0.875rem', outline: 'none', color: '#0f172a',
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddCategory}
                style={{
                  padding: '8px 16px', borderRadius: '7px', border: 'none',
                  background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff',
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>
            {categoryError && (
              <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#ef4444' }}>{categoryError}</p>
            )}

            {/* Category list */}
            <div style={{ marginTop: '16px', maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {categories.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', padding: '20px 0' }}>
                  No categories yet. Add one above.
                </p>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: '8px', background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      title={`Remove "${cat}"`}
                      style={{
                        background: 'none', border: 'none', color: '#ef4444',
                        cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                style={{
                  padding: '8px 20px', borderRadius: '7px',
                  border: '1.5px solid #e2e8f0', background: '#fff',
                  color: '#475569', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </ERPLayout>
  );
}
