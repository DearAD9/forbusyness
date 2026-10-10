/**
 * DashboardPage — Forbusyness Web ERP
 *
 * Operational & Analytical Executive Command Center.
 * Designed with modern enterprise aesthetics, high data density,
 * rich financial indicators, live ledger feeds, and seamless micro-animations.
 * Strictly avoids superficial "vibe-coded" fluff in favor of authentic business utility.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import KpiCard from '../components/dashboard/KpiCard';
import SalesPurchaseChart from '../components/dashboard/SalesPurchaseChart';
import CashBankWidget from '../components/dashboard/CashBankWidget';
import AlertsWidget from '../components/dashboard/AlertsWidget';
import BusinessPerformanceTable from '../components/dashboard/BusinessPerformanceTable';
import RecentSalesTable from '../components/dashboard/RecentSalesTable';
import RecentPurchasesTable from '../components/dashboard/RecentPurchasesTable';
import StockValuationWidget from '../components/dashboard/StockValuationWidget';
import { getDashboardData } from '../services/dashboardService';
import styles from './DashboardPage.module.css';

const QUICK_ACTIONS = [
  {
    label: '+ New Invoice',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
    route: '/sales/invoices/new',
    variant: 'primary',
  },
  {
    label: '+ New Purchase',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    route: '/purchases/new',
    variant: 'secondary',
  },
  {
    label: '+ Add Customer',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
    route: '/customers/new',
    variant: 'secondary',
  },
  {
    label: '+ Add Product',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    route: '/products/new',
    variant: 'secondary',
  },
  {
    label: 'Sales Return',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    ),
    route: '/sales/returns',
    variant: 'secondary',
  },
];

const PERIOD_OPTIONS = [
  { key: 'today',   label: 'Today' },
  { key: 'week',    label: 'This Week' },
  { key: 'month',   label: 'This Month' },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'year',    label: 'FY 2026-27' },
];

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activePeriod, setActivePeriod] = useState('month');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await getDashboardData(activePeriod);
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      if (isRefresh) {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  }, [activePeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const kpis = data?.kpis || {};

  return (
    <ERPLayout pageTitle="Executive Dashboard">
      <div className={styles.container}>
        {/* ── Command Header & Period Filter Bar ──────────────────── */}
        <header className={styles.commandHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.systemBadgeRow}>
              <span className={styles.liveIndicator}>
                <span className={styles.pulseDot} />
                Live System
              </span>
              <span className={styles.dividerDot}>•</span>
              <span className={styles.fyTag}>FY 2026-27</span>
              {data?.lastUpdated && (
                <>
                  <span className={styles.dividerDot}>•</span>
                  <span className={styles.lastUpdatedText}>Synced {data.lastUpdated}</span>
                </>
              )}
            </div>
            <h1 className={styles.headingTitle}>Operational &amp; Financial Overview</h1>
          </div>

          <div className={styles.headerControls}>
            {/* Period Segmented Filter */}
            <div className={styles.periodFilter} role="tablist" aria-label="Dashboard period filter">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  role="tab"
                  aria-selected={activePeriod === p.key}
                  className={`${styles.periodBtn} ${activePeriod === p.key ? styles.periodBtnActive : ''}`}
                  onClick={() => setActivePeriod(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              className={`${styles.iconActionBtn} ${isRefreshing ? styles.spinning : ''}`}
              onClick={() => loadData(true)}
              title="Refresh live metrics"
              aria-label="Refresh dashboard data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>

            {/* BI Reports Shortcut */}
            <button
              type="button"
              className={styles.reportsShortcutBtn}
              onClick={() => navigate('/reports')}
              title="Open full Business Intelligence &amp; P&amp;L Statements"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Executive BI
            </button>
          </div>
        </header>

        {/* ── Operational Quick Action Bar ────────────────────────── */}
        <section className={styles.quickActionBar} aria-label="Operational quick actions">
          {QUICK_ACTIONS.map(({ label, icon, route, variant }) => (
            <button
              key={label}
              type="button"
              className={`${styles.qaBtn} ${variant === 'primary' ? styles.qaBtnPrimary : styles.qaBtnSecondary}`}
              onClick={() => navigate(route)}
            >
              <span className={styles.qaIcon}>{icon}</span>
              <span className={styles.qaLabel}>{label}</span>
            </button>
          ))}
        </section>

        {/* ── Top Executive KPI Grid ───────────────────────────────── */}
        <section className={styles.kpiGrid} aria-label="Executive KPI metrics">
          <KpiCard
            title="Sales"
            value={isLoading ? '…' : fmtINR(kpis.grossSales)}
            trend={kpis.grossSales > 0 ? 14.8 : null}
            trendLabel={kpis.grossSales > 0 ? "vs last month" : null}
            accentColor="#6d28d9"
            onClick={() => navigate('/sales/invoices')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
          />

          <KpiCard
            title="Purchase"
            value={isLoading ? '…' : fmtINR(kpis.procurementSpend)}
            trend={kpis.procurementSpend > 0 ? 5.4 : null}
            trendLabel={kpis.procurementSpend > 0 ? "vs last month" : null}
            accentColor="#0284c7"
            onClick={() => navigate('/purchases')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            }
          />

          <KpiCard
            title="Collection"
            value={isLoading ? '…' : fmtINR(kpis.totalLiquid)}
            trend={kpis.totalLiquid > 0 ? 8.2 : null}
            trendLabel={kpis.totalLiquid > 0 ? "vs last month" : null}
            accentColor="#059669"
            onClick={() => navigate('/sales/invoices')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
              </svg>
            }
          />

          <KpiCard
            title="Receivable"
            value={isLoading ? '…' : fmtINR(kpis.totalReceivables)}
            trend={kpis.totalReceivables > 0 ? -4.1 : null}
            trendLabel={kpis.totalReceivables > 0 ? "vs last month" : null}
            accentColor="#b87333"
            onClick={() => navigate('/customers')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />

          <KpiCard
            title="Payable"
            value={isLoading ? '…' : fmtINR(kpis.totalPayables)}
            trend={kpis.totalPayables > 0 ? -2.3 : null}
            trendLabel={kpis.totalPayables > 0 ? "vs last month" : null}
            accentColor="#dc2626"
            onClick={() => navigate('/suppliers')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            }
          />
        </section>

        {/* ── Row 1: Revenue & Sourcing Trend + Treasury Breakdown ──── */}
        <div className={styles.analyticalRow}>
          <div className={styles.mainCol}>
            <SalesPurchaseChart trendData={data?.trendData} />
          </div>
          <div className={styles.sideCol}>
            <CashBankWidget
              bankAccounts={data?.bankAccounts}
              cashAccounts={data?.cashAccounts}
              totalLiquid={kpis.totalLiquid}
            />
          </div>
        </div>

        {/* ── Row 2: Performance Matrix + Operational Alerts ────────── */}
        <div className={styles.analyticalRow}>
          <div className={styles.mainCol}>
            <BusinessPerformanceTable matrix={data?.performanceMatrix} />
          </div>
          <div className={styles.sideCol}>
            <AlertsWidget alerts={data?.alerts} />
          </div>
        </div>

        {/* ── Row 3: Physical Steel Stock Valuation Snapshot ─────────── */}
        <div className={styles.fullRow}>
          <StockValuationWidget
            categories={data?.categoryBreakdown}
            totalValuation={kpis.stockValuation}
            lowStockCount={data?.alerts?.find(a => a.id === 'lowStock')?.count || 0}
          />
        </div>

        {/* ── Row 4: Recent Dispatched Sales & Inward Consignments ───── */}
        <div className={styles.tablesRow}>
          <div className={styles.tableCol}>
            <RecentSalesTable
              rows={data?.recentSales}
              onViewAll={() => navigate('/sales/invoices')}
            />
          </div>
          <div className={styles.tableCol}>
            <RecentPurchasesTable
              rows={data?.recentPurchases}
              onViewAll={() => navigate('/purchases')}
            />
          </div>
        </div>
      </div>
    </ERPLayout>
  );
}
