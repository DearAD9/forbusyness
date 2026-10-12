/**
 * SalesReportsPage — Forbusyness Web ERP
 *
 * Sales Reports dashboard providing quick access to sales registers,
 * product-wise sales, customer statements, and HSN tax dispatches.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import styles from './SalesReportsPage.module.css';

const REPORTS = [
  {
    id: 'register',
    category: 'sales',
    sub: 'register',
    title: 'Sales Register',
    description: 'Detailed list of invoices generated, taxable value, GST, received payments, and pending dues.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'product',
    category: 'sales',
    sub: 'product',
    title: 'Product-wise Sales Report',
    description: 'Quantity and sales revenue broken down by product, SKU, and unit rate.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: 'customer',
    category: 'sales',
    sub: 'customer',
    title: 'Customer Sales & Outstanding',
    description: 'Total billing, collections, and outstanding receivable balance by customer account.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'hsn',
    category: 'tax',
    sub: 'hsn',
    title: 'HSN / SAC Tax Sales Summary',
    description: 'HSN-wise product sales, taxable value, and GST rate summary.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id: 'returns',
    category: 'sales',
    sub: 'returns',
    title: 'Sales Returns & Credit Notes',
    description: 'Summary of return transactions, returned quantities, and credit notes issued.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    ),
  },
];

export default function SalesReportsPage() {
  const navigate = useNavigate();

  const handleOpenReport = (rep) => {
    navigate(`/reports?cat=${rep.category}&sub=${rep.sub}`);
  };

  return (
    <ERPLayout pageTitle="Sales → Sales Reports">
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div>
            <div className={styles.breadcrumbs}>
              Sales / <span className={styles.breadcrumbActive}>Sales Reports</span>
            </div>
            <h1 className={styles.title}>Sales Reports</h1>
            <p className={styles.subtitle}>Standard business and tax reports for sales transactions</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={styles.btnGenerate}
              style={{ background: '#2563eb', color: '#fff', borderColor: 'transparent' }}
              onClick={() => navigate('/reports?cat=sales&sub=register')}
            >
              Open Full Reports Center →
            </button>
            <button
              className={styles.btnGenerate}
              style={{ background: '#ffffff', color: '#334155', borderColor: '#cbd5e1' }}
              onClick={() => navigate('/sales/invoices')}
            >
              ← View Sales Invoices
            </button>
          </div>
        </div>

        <div className={styles.reportGrid}>
          {REPORTS.map((rep) => (
            <div key={rep.id} className={styles.reportCard}>
              <div>
                <div className={styles.reportIcon}>{rep.icon}</div>
                <h3 className={styles.reportTitle} style={{ marginTop: '12px' }}>
                  {rep.title}
                </h3>
                <p className={styles.reportDesc} style={{ marginTop: '4px' }}>
                  {rep.description}
                </p>
              </div>
              <button
                type="button"
                className={styles.btnGenerate}
                onClick={() => handleOpenReport(rep)}
              >
                Open Report →
              </button>
            </div>
          ))}
        </div>
      </div>
    </ERPLayout>
  );
}
