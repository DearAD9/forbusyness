/**
 * ReportFilterBar.jsx — Forbusyness Web ERP
 *
 * Universal reporting filter bar with date presets, custom dates,
 * real-time search, and 1-click export actions (CSV, Excel, Print).
 */

import React from 'react';
import styles from './ReportFilterBar.module.css';

const PRESETS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'fy', label: 'FY 2026-27' },
  { id: 'custom', label: 'Custom' },
];

export default function ReportFilterBar({
  preset = 'all',
  onSelectPreset,
  dateFrom = '',
  dateTo = '',
  onChangeDateFrom,
  onChangeDateTo,
  search = '',
  onChangeSearch,
  searchPlaceholder = 'Search report data...',
  onExportCsv,
  onExportExcel,
  onPrint,
  onRefresh,
  isLoading = false,
  extraFilter = null,
}) {
  return (
    <div className={styles.filterBar}>
      {/* Top Row: Presets & Search */}
      <div className={styles.topRow}>
        <div className={styles.presetGroup}>
          {PRESETS.map(p => {
            const isActive = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`${styles.presetBtn} ${isActive ? styles.presetBtnActive : ''}`}
                onClick={() => onSelectPreset(p.id)}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => onChangeSearch('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Custom Date Inputs & Action Buttons */}
      <div className={styles.bottomRow}>
        <div className={styles.dateInputs}>
          <div className={styles.dateField}>
            <label className={styles.dateLabel}>From:</label>
            <input
              type="date"
              className={styles.dateInput}
              value={dateFrom}
              onChange={(e) => {
                onChangeDateFrom(e.target.value);
                if (preset !== 'custom') onSelectPreset('custom');
              }}
            />
          </div>
          <div className={styles.dateField}>
            <label className={styles.dateLabel}>To:</label>
            <input
              type="date"
              className={styles.dateInput}
              value={dateTo}
              onChange={(e) => {
                onChangeDateTo(e.target.value);
                if (preset !== 'custom') onSelectPreset('custom');
              }}
            />
          </div>
          {extraFilter}
        </div>

        <div className={styles.actions}>
          {onRefresh && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh report data"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Refresh</span>
            </button>
          )}

          {onExportCsv && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onExportCsv}
              title="Download CSV report"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>CSV</span>
            </button>
          )}

          {onExportExcel && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onExportExcel}
              title="Download Excel spreadsheet"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" />
              </svg>
              <span>Excel</span>
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={onPrint}
              title="Print report layout"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
