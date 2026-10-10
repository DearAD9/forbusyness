/**
 * StockValuationWidget — Forbusyness Web ERP
 *
 * Physical Steel Inventory & Yard Valuation Snapshot.
 * Displays category capital allocation (MS Pipes, Angles, TMT, Flats, Beams),
 * estimated stock tonnage, and safety stock threshold status.
 */

import { useNavigate } from 'react-router-dom';
import styles from './StockValuationWidget.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

const CATEGORY_COLORS = {
  'MS Pipes':          '#7c3aed',
  'MS Angles':         '#0284c7',
  'TMT Bars':          '#059669',
  'MS Flats':          '#d97706',
  'Beams & Channels':  '#b87333',
  'Other Steel':       '#64748b',
};

export default function StockValuationWidget({
  categories = [],
  totalValuation = 0,
  lowStockCount = 0,
}) {
  const navigate = useNavigate();

  const items = categories || [];

  const totalValue = totalValuation > 0
    ? totalValuation
    : items.reduce((s, it) => s + (Number(it.value) || 0), 0);

  const totalTonnage = items.reduce((s, it) => s + (Number(it.tonnage) || 0), 0) || 0;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.iconTag}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d97706"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div>
            <h2 className={styles.title}>Stock Valuation &amp; Inventory</h2>
          </div>
        </div>

        <button
          type="button"
          className={styles.catalogBtn}
          onClick={() => navigate('/products')}
          title="Open Products &amp; Steel Catalog"
        >
          Catalog →
        </button>
      </div>

      <div className={styles.body}>
        {/* Total Stock Value Callout */}
        <div className={styles.statGrid}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Yard Asset Valuation</span>
            <span className={styles.statVal} style={{ color: '#d97706' }}>
              {fmtINR(totalValue)}
            </span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Estimated Tonnage</span>
            <span className={styles.statVal} style={{ color: '#0f172a' }}>
              {totalTonnage.toFixed(1)} MT
            </span>
          </div>
        </div>

        {/* Multi-color allocation bar */}
        <div className={styles.progressBar} title="Category Valuation Distribution">
          {items.map((cat, i) => {
            const pct = totalValue > 0 ? Math.max(3, Math.round(((Number(cat.value) || 0) / totalValue) * 100)) : 0;
            const color = CATEGORY_COLORS[cat.name] || '#64748b';
            return (
              <div
                key={cat.name || i}
                className={styles.progressSeg}
                style={{ width: `${pct}%`, background: color }}
                title={`${cat.name}: ${pct}% (${fmtINR(cat.value)})`}
              />
            );
          })}
        </div>

        {/* Category List */}
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: '0.8125rem' }}>
            No products or inventory items registered yet.
          </div>
        ) : (
          <div className={styles.catList}>
            {items.map((cat) => {
              const color = CATEGORY_COLORS[cat.name] || '#64748b';
              const pct = totalValue > 0 ? Math.round(((Number(cat.value) || 0) / totalValue) * 100) : 0;

              return (
                <div
                  key={cat.name}
                  className={styles.catItem}
                  onClick={() => navigate('/products')}
                  title={`Filter products by ${cat.name}`}
                >
                  <div className={styles.catLeft}>
                    <span className={styles.catDot} style={{ background: color }} />
                    <span className={styles.catName}>{cat.name}</span>
                  </div>

                  <div className={styles.catRight}>
                    <span className={styles.catPct}>{pct}%</span>
                    <span className={styles.catValue}>{fmtINR(cat.value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Low Stock Warning Banner if any */}
        {lowStockCount > 0 && (
          <div
            className={styles.warningBanner}
            onClick={() => navigate('/products')}
            title="Inspect low stock products"
          >
            <span className={styles.warningIcon}>⚠️</span>
            <span className={styles.warningText}>
              <strong>{lowStockCount} products</strong> below reorder threshold
            </span>
            <span className={styles.warningAction}>Reorder →</span>
          </div>
        )}
      </div>
    </section>
  );
}
