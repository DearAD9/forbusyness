/**
 * InventoryReportsSection.jsx — Forbusyness Web ERP
 *
 * Stock & Inventory Reports module.
 * Sub-reports:
 * - Stock Summary & Valuation
 * - Low Stock / Reorder Alerts
 * - Stock Movement History (Inward & Outward)
 */

import React from 'react';
import styles from './InventoryReportsSection.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function InventoryReportsSection({ data, subType = 'stockSummary' }) {
  if (!data) return null;

  const { summary = {}, rows = [] } = data;

  return (
    <div className={styles.container}>
      {/* ── Summary Statistics Banner ─────────────────────────────────── */}
      <div className={styles.summaryBar}>
        {summary.totalStockValue !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Stock Value</span>
            <span className={styles.summaryValue}>{fmtINR(summary.totalStockValue)}</span>
          </div>
        )}
        {summary.totalStockUnits !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Stock Units</span>
            <span className={styles.summaryValue}>{summary.totalStockUnits}</span>
          </div>
        )}
        {summary.lowStockCount !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Low Stock Items</span>
            <span className={`${styles.summaryValue} ${styles.textWarning}`}>{summary.lowStockCount}</span>
          </div>
        )}
        {summary.outOfStockCount !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Out of Stock</span>
            <span className={`${styles.summaryValue} ${styles.textDanger}`}>{summary.outOfStockCount}</span>
          </div>
        )}
        {summary.productCount !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Products</span>
            <span className={styles.summaryValue}>{summary.productCount}</span>
          </div>
        )}
        {summary.totalMovements !== undefined && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Stock Movements</span>
            <span className={styles.summaryValue}>{summary.totalMovements}</span>
          </div>
        )}
      </div>

      {/* ── Sub-Report: Stock Summary ─────────────────────────────────── */}
      {subType === 'stockSummary' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th className={styles.textCenter}>Unit</th>
                  <th className={styles.textRight}>Current Stock</th>
                  <th className={styles.textRight}>Min Stock</th>
                  <th className={styles.textRight}>Purchase Rate</th>
                  <th className={styles.textRight}>Selling Rate</th>
                  <th className={styles.textRight}>Stock Value</th>
                  <th className={styles.textCenter}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className={styles.cellCode}>{row.code}</td>
                      <td className={styles.cellBold}>{row.name}</td>
                      <td>{row.category}</td>
                      <td className={styles.textCenter}>{row.unit}</td>
                      <td className={`${styles.textRight} ${styles.cellBold}`}>{row.currentStock}</td>
                      <td className={styles.textRight}>{row.minStock}</td>
                      <td className={styles.textRight}>{fmtINR(row.purchaseRate)}</td>
                      <td className={styles.textRight}>{fmtINR(row.sellingRate)}</td>
                      <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(row.stockValue)}</td>
                      <td className={styles.textCenter}>
                        <span className={`${styles.statusBadge} ${styles['status_' + row.status.replace(/\s+/g, '').toLowerCase()]}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className={styles.emptyCell}>No stock products found in inventory.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sub-Report: Low Stock Alerts ──────────────────────────────── */}
      {subType === 'lowStock' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code / SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th className={styles.textCenter}>Unit</th>
                  <th className={styles.textRight}>Current Stock</th>
                  <th className={styles.textRight}>Minimum Level</th>
                  <th className={styles.textRight}>Deficit (Needed)</th>
                  <th className={styles.textRight}>Est. Purchase Cost</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className={styles.cellCode}>{row.code}</td>
                      <td className={styles.cellBold}>{row.name}</td>
                      <td>{row.category}</td>
                      <td className={styles.textCenter}>{row.unit}</td>
                      <td className={`${styles.textRight} ${styles.textDanger} ${styles.cellBold}`}>
                        {row.currentStock}
                      </td>
                      <td className={styles.textRight}>{row.minStock}</td>
                      <td className={`${styles.textRight} ${styles.textWarning} ${styles.cellBold}`}>
                        {row.deficit}
                      </td>
                      <td className={`${styles.textRight} ${styles.cellBold}`}>
                        {fmtINR(row.deficit * row.purchaseRate)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className={styles.emptyCell}>
                      All stock levels are optimal! No items currently below reorder levels.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sub-Report: Stock Movement History ───────────────────────── */}
      {subType === 'stockMovement' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Document No</th>
                  <th>Movement Type</th>
                  <th>Product Name</th>
                  <th>Party (Customer / Supplier)</th>
                  <th className={styles.textRight}>Quantity Change</th>
                  <th className={styles.textRight}>Unit Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.date}</td>
                      <td className={styles.cellCode}>{row.documentNo}</td>
                      <td>
                        <span className={`${styles.movementBadge} ${row.quantity > 0 ? styles.movementIn : styles.movementOut}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className={styles.cellBold}>{row.productName}</td>
                      <td>{row.partyName}</td>
                      <td className={`${styles.textRight} ${row.quantity > 0 ? styles.textSuccess : styles.textDanger} ${styles.cellBold}`}>
                        {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
                      </td>
                      <td className={styles.textRight}>{fmtINR(row.rate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>No stock movements recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
