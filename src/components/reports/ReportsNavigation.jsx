/**
 * ReportsNavigation.jsx — Forbusyness Web ERP
 *
 * Primary multi-category navigation bar for the ERP Reporting Center.
 * Synchronizes category and sub-category with URL query parameters.
 */

import React from 'react';
import styles from './ReportsNavigation.module.css';

export const REPORT_CATEGORIES = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    subReports: [],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    subReports: [
      { id: 'register', label: 'Sales Register' },
      { id: 'customer', label: 'Customer-wise Sales' },
      { id: 'product', label: 'Product-wise Sales' },
      { id: 'returns', label: 'Sales Returns' },
    ],
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    subReports: [
      { id: 'register', label: 'Purchase Register' },
      { id: 'supplier', label: 'Supplier-wise Purchases' },
      { id: 'product', label: 'Product-wise Purchases' },
    ],
  },
  {
    id: 'ledgers',
    label: 'Ledgers',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    subReports: [
      { id: 'customerLedger', label: 'Customer Ledger' },
      { id: 'supplierLedger', label: 'Supplier Ledger' },
      { id: 'cashBankLedger', label: 'Cash & Bank' },
      { id: 'expenseLedger', label: 'Expenses' },
    ],
  },
  {
    id: 'financials',
    label: 'Financials (P&L)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    subReports: [
      { id: 'pl', label: 'Profit & Loss (P&L)' },
      { id: 'trialBalance', label: 'Trial Balance' },
      { id: 'balanceSheet', label: 'Balance Sheet' },
    ],
  },
  {
    id: 'outstanding',
    label: 'Outstanding & Aging',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    subReports: [
      { id: 'customerOutstanding', label: 'Customer Outstanding' },
      { id: 'supplierOutstanding', label: 'Supplier Outstanding' },
    ],
  },
  {
    id: 'inventory',
    label: 'Stock & Products',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    subReports: [
      { id: 'stockSummary', label: 'Stock Summary' },
      { id: 'lowStock', label: 'Low Stock Alerts' },
      { id: 'stockMovement', label: 'Stock Movement' },
    ],
  },
  {
    id: 'profitability',
    label: 'Profitability',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    subReports: [
      { id: 'product', label: 'Product-wise Profit' },
      { id: 'customer', label: 'Customer-wise Profit' },
      { id: 'invoice', label: 'Invoice-wise Profit' },
    ],
  },
  {
    id: 'tax',
    label: 'Tax & GST',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    subReports: [
      { id: 'gstr1', label: 'Sales GST (GSTR-1)' },
      { id: 'gstr2', label: 'Purchase GST (GSTR-2)' },
      { id: 'hsn', label: 'HSN / SAC Summary' },
    ],
  },
];

export default function ReportsNavigation({ activeCategory, activeSub, onSelectCategory, onSelectSub }) {
  const currentCategoryObj = REPORT_CATEGORIES.find(c => c.id === activeCategory) || REPORT_CATEGORIES[0];
  const subReports = currentCategoryObj.subReports || [];

  return (
    <nav className={styles.navContainer} aria-label="Report Categories">
      <div className={styles.categoryScroll}>
        <div className={styles.categoryTabs}>
          {REPORT_CATEGORIES.map(cat => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                type="button"
                className={`${styles.catButton} ${isActive ? styles.catButtonActive : ''}`}
                onClick={() => onSelectCategory(cat.id)}
              >
                <span className={styles.catIcon}>{cat.icon}</span>
                <span className={styles.catLabel}>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {subReports.length > 0 && (
        <div className={styles.subScroll}>
          <div className={styles.subTabs}>
            {subReports.map(sub => {
              const isActive = sub.id === activeSub;
              return (
                <button
                  key={sub.id}
                  type="button"
                  className={`${styles.subButton} ${isActive ? styles.subButtonActive : ''}`}
                  onClick={() => onSelectSub(sub.id)}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
