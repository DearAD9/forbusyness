/**
 * ProductDetailPage — Forbusyness Web ERP
 *
 * Comprehensive steel material view with live inventory balance,
 * commercial margin health, technical specifications, and tax parameters.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import { getProductById } from '../services/productService';
import styles from './ProductDetailPage.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getProductById(id);
        if (!mounted) return;
        if (!data) {
          setErrorMsg(`Product #${id} not found.`);
        } else {
          setProduct(data);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        setErrorMsg('Error loading product details.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <ERPLayout>
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
          Loading steel material record...
        </div>
      </ERPLayout>
    );
  }

  if (errorMsg || !product) {
    return (
      <ERPLayout>
        <div className={styles.container}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>Product Not Found</h1>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>
                {errorMsg || 'The requested product record does not exist in the database.'}
              </p>
            </div>
            <Link to="/products" className={styles.btnActionSecondary}>
              ← Go Back to Products
            </Link>
          </div>
        </div>
      </ERPLayout>
    );
  }

  const pRate = product.purchaseRate || 0;
  const sRate = product.sellingRate || 0;
  const marginPct = product.marginPct || (pRate > 0 ? Math.round(((sRate - pRate) / pRate) * 100) : 0);
  const profitPerUnit = Math.max(0, sRate - pRate);
  const isLowStock = product.minStock > 0 && (product.currentStock || 0) <= product.minStock;

  return (
    <ERPLayout pageTitle={product?.name || 'Product Details'} showBackButton={true} backTo="/products">
      <div className={styles.container}>
        {/* ── Breadcrumb & Header ───────────────────────── */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.breadcrumbs}>
              <Link to="/products" className={styles.breadcrumbLink}>Products</Link>
              <span>/</span>
              <span className={styles.breadcrumbActive}>{product.name}</span>
            </div>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>{product.name}</h1>
              {product.code && <span className={styles.codeBadge}>{product.code}</span>}
              <span className={styles.catBadge}>{product.category}</span>
              <span className={`${styles.statusPill} ${product.status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                {product.status || 'Active'}
              </span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.btnActionSecondary}
              onClick={() => navigate('/products')}
              title="Go back to Products"
            >
              ← Go Back
            </button>
            <Link to={`/products/${product.id}/edit`} className={styles.btnActionSecondary}>
              ✏️ Edit Product
            </Link>
            <button
              type="button"
              className={styles.btnActionSecondary}
              onClick={() => navigate('/purchases/new')}
            >
              📥 Inward Purchase
            </button>
            <button
              type="button"
              className={styles.btnActionPrimary}
              onClick={() => navigate('/sales/invoices/new')}
            >
              📄 Create Invoice
            </button>
          </div>
        </div>

        {/* ── Reorder Warning if low stock ──────────────── */}
        {isLowStock && (
          <div className={styles.reorderAlert}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <strong>Low Inventory Alert:</strong> Current stock of {(product.currentStock || 0).toLocaleString()} {product.unit} is at or below the minimum reorder threshold of {(product.minStock || 0).toLocaleString()} {product.unit}. Recommend issuing an inward purchase bill to restock yard inventory.
            </div>
          </div>
        )}

        {/* ── 4 KPI Stats Row ───────────────────────────── */}
        <div className={styles.statsGrid}>
          <div className={`${styles.kpiCard} ${isLowStock ? styles.kpiAmber : styles.kpiEmerald}`}>
            <span className={styles.kpiTitle}>Available Stock</span>
            <span className={styles.kpiValue}>
              {(product.currentStock || 0).toLocaleString()} <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{product.unit}</span>
            </span>
            <span className={styles.kpiSubtitle}>
              Min threshold: {(product.minStock || 0).toLocaleString()} {product.unit}
            </span>
          </div>

          <div className={`${styles.kpiCard} styles.kpiBlue`}>
            <span className={styles.kpiTitle}>Purchase Rate</span>
            <span className={styles.kpiValue}>{fmtINR(pRate)}</span>
            <span className={styles.kpiSubtitle}>Cost per {product.unit} from mills</span>
          </div>

          <div className={`${styles.kpiCard} styles.kpiPurple`}>
            <span className={styles.kpiTitle}>Selling Rate</span>
            <span className={styles.kpiValue}>{fmtINR(sRate)}</span>
            <span className={styles.kpiSubtitle}>Base quotation per {product.unit}</span>
          </div>

          <div className={`${styles.kpiCard} styles.kpiEmerald`}>
            <span className={styles.kpiTitle}>Gross Markup</span>
            <span className={styles.kpiValue} style={{ color: marginPct >= 0 ? '#059669' : '#dc2626' }}>
              {marginPct >= 0 ? `+${marginPct}%` : `${marginPct}%`}
            </span>
            <span className={styles.kpiSubtitle}>
              Profit: +{fmtINR(profitPerUnit)} / {product.unit}
            </span>
          </div>
        </div>

        {/* ── 2-Column Content Grid ─────────────────────── */}
        <div className={styles.contentGrid}>
          {/* Left Column: Specifications & Compliance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Technical Specifications */}
            <div className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleRow}>
                  <div className={styles.cardIcon} style={{ background: '#ede9fe', color: '#6d28d9' }}>
                    📐
                  </div>
                  <h2 className={styles.cardTitle}>Material Dimensions & Standards</h2>
                </div>
              </div>

              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Product Category</span>
                  <span className={styles.detailValue}>{product.category}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Primary Unit</span>
                  <span className={styles.detailValue}>{product.unit}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Alternate Unit</span>
                  <span className={styles.detailValue}>
                    {product.altUnit ? `${product.altUnit} (1 ${product.altUnit} = ${product.conversionRatio || '1'} ${product.unit})` : 'None defined'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>SKU / Item Reference</span>
                  <span className={styles.detailValue}>{product.code || '—'}</span>
                </div>
              </div>

              {product.specifications && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginTop: '4px'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Engineering Specifications:
                  </span>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.5 }}>
                    {product.specifications}
                  </p>
                </div>
              )}
            </div>

            {/* Classification Card */}
            <div className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleRow}>
                  <div className={styles.cardIcon} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                    🏷️
                  </div>
                  <h2 className={styles.cardTitle}>Commodity Classification</h2>
                </div>
              </div>

              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>HSN / SAC Code</span>
                  <span className={styles.detailValue} style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700 }}>
                    {product.hsn || '7306'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Product Category</span>
                  <span className={styles.detailValue}>{product.category}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Standard Unit</span>
                  <span className={styles.detailValue}>{product.unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Inventory & Summary Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleRow}>
                  <div className={styles.cardIcon} style={{ background: '#fef3c7', color: '#b45309' }}>
                    🏭
                  </div>
                  <h2 className={styles.cardTitle}>Yard Inventory Health</h2>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#64748b' }}>Current Physical Balance:</span>
                  <strong style={{ color: '#0f172a' }}>{(product.currentStock || 0).toLocaleString()} {product.unit}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#64748b' }}>Minimum Reorder Level:</span>
                  <strong style={{ color: '#0f172a' }}>{(product.minStock || 0).toLocaleString()} {product.unit}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#64748b' }}>Estimated Inventory Value:</span>
                  <strong style={{ color: '#059669' }}>{fmtINR((product.currentStock || 0) * (product.purchaseRate || 0))}</strong>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleRow}>
                  <div className={styles.cardIcon} style={{ background: '#dcfce7', color: '#15803d' }}>
                    ⚡
                  </div>
                  <h2 className={styles.cardTitle}>Quick Shortcuts</h2>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className={styles.btnActionSecondary}
                  onClick={() => navigate('/sales/invoices/new')}
                  style={{ justifyContent: 'center' }}
                >
                  📄 Add to New Invoice
                </button>
                <button
                  type="button"
                  className={styles.btnActionSecondary}
                  onClick={() => navigate('/purchases/new')}
                  style={{ justifyContent: 'center' }}
                >
                  📥 Record Inward Material Slip
                </button>
                <button
                  type="button"
                  className={styles.btnActionSecondary}
                  onClick={() => navigate('/products')}
                  style={{ justifyContent: 'center' }}
                >
                  ← Return to Products Catalog
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ERPLayout>
  );
}
