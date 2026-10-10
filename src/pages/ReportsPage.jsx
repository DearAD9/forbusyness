/**
 * ReportsPage — Forbusyness Web ERP
 *
 * Executive Business Intelligence & Financial Analytics Command Center.
 * Features:
 * - 4 Summary KPI cards: Turnover, Gross Profit, Net Operating Profit, Stock Valuation
 * - 4 Report Modules:
 *   1. Profit & Loss (P&L) Statement
 *   2. Sales vs Sourcing Commercial Trend (Recharts AreaChart)
 *   3. Stock Valuation & Inventory Audit
 *   4. Receivables & Payables Ageing Analysis
 * - 1-Click CSV Export & Instant Print Layout
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import ERPLayout from '../components/layout/ERPLayout';
import { getExecutiveReportData } from '../services/reportService';
import styles from './ReportsPage.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function ReportsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pl'); // 'pl' | 'trend' | 'stock' | 'ageing'
  const [period, setPeriod] = useState('Quarter'); // 'Month' | 'Quarter' | 'Year'
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getExecutiveReportData();
        if (mounted) {
          setReportData(data);
        }
      } catch (err) {
        console.error('Failed to load report data:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [period]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const rows = [
      ['Metric', 'Amount (INR)'],
      ['Gross Sales Revenue', reportData.grossSales],
      ['Cost of Materials Inward (Purchases)', reportData.cogsPurchases],
      ['Gross Profit', reportData.grossProfit],
      ['Gross Margin %', `${reportData.grossMarginPct}%`],
      ['Operating Expenses', reportData.operatingExpenses],
      ['Net Operating Profit', reportData.netProfit],
      ['Net Margin %', `${reportData.netMarginPct}%`],
      ['Yard Stock Valuation', reportData.totalStockValuation],
    ];

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `erp_financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || !reportData) {
    return (
      <ERPLayout pageTitle="Reports" showBackButton={true} backTo="/dashboard">
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
          Generating executive business intelligence reports…
        </div>
      </ERPLayout>
    );
  }

  return (
    <ERPLayout pageTitle="Reports" showBackButton={true} backTo="/dashboard">
      <div className={styles.container}>
        {/* ── Page Header ────────────────────────────── */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.breadcrumbs}>
              <span>ERP</span> / <span className={styles.breadcrumbActive}>Executive Analytics & Reports</span>
            </div>
            <div className={styles.titleWrapper}>
              <h1 className={styles.title}>Reports & Business Intelligence</h1>
              <span className={styles.titleBadge}>Live Analytics</span>
            </div>
            <p className={styles.subtitle}>
              Profit & loss statements, operational trend curves, steel inventory audits, and liquidity analysis
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
                fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Go Back
            </button>

            <select
              className={styles.periodSelect}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="Month">Current Month (Oct 2026)</option>
              <option value="Quarter">Current Quarter (Q3 2026)</option>
              <option value="Year">Financial Year (FY 2026-27)</option>
            </select>

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleExportCSV}
              title="Download consolidated executive report CSV"
            >
              📥 Export CSV
            </button>

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handlePrint}
              title="Print report"
            >
              🖨️ Print Report
            </button>
          </div>
        </div>

        {/* ── 4 Top KPI Cards ────────────────────────── */}
        <div className={styles.kpiGrid}>
          {/* Gross Turnover */}
          <div className={`${styles.kpiCard} ${styles.cardPurple} hover-lift`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Gross Turnover</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#f5f3ff', color: '#6d28d9' }}>
                📊
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#6d28d9' }}>
              {fmtINR(reportData.grossSales)}
            </div>
            <div className={styles.kpiBottom}>
              <span>Total invoices cleared</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#ede9fe', color: '#6d28d9' }}>
                Revenue Topline
              </span>
            </div>
          </div>

          {/* Gross Margin */}
          <div className={`${styles.kpiCard} ${styles.cardEmerald} hover-lift`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Gross Margin</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#ecfdf5', color: '#059669' }}>
                📈
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#059669' }}>
              {fmtINR(reportData.grossProfit)}
            </div>
            <div className={styles.kpiBottom}>
              <span>{reportData.grossMarginPct}% gross margin</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#dcfce7', color: '#15803d' }}>
                Healthy Health
              </span>
            </div>
          </div>

          {/* Net Operating Profit */}
          <div className={`${styles.kpiCard} ${styles.cardBlue} hover-lift`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Net Operating Profit</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#f5f3ff', color: '#6d28d9' }}>
                📈
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#6d28d9' }}>
              {fmtINR(reportData.netProfit)}
            </div>
            <div className={styles.kpiBottom}>
              <span>{reportData.netMarginPct}% net margin</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#ede9fe', color: '#6d28d9' }}>
                After Overheads
              </span>
            </div>
          </div>

          {/* Stock Valuation */}
          <div className={`${styles.kpiCard} ${styles.cardAmber} hover-lift`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Stock Valuation</span>
              <div className={styles.kpiIconWrapper} style={{ background: '#fffbeb', color: '#d97706' }}>
                📦
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#d97706' }}>
              {fmtINR(reportData.totalStockValuation)}
            </div>
            <div className={styles.kpiBottom}>
              <span>Yard physical inventory</span>
              <span className={styles.kpiTrendBadge} style={{ background: '#fef3c7', color: '#b45309' }}>
                Audited Asset
              </span>
            </div>
          </div>
        </div>

        {/* ── Report Selector Tabs ───────────────────── */}
        <div className={styles.tabsBar}>
          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'pl' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('pl')}
          >
            📊 Profit & Loss (P&L)
          </button>
          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'trend' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('trend')}
          >
            📈 Sales vs Purchase Trend
          </button>
          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'stock' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            📦 Inventory Valuation
          </button>
          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'ageing' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('ageing')}
          >
            ⏳ Ageing Analysis
          </button>
        </div>

        {/* ── Tab 1: Profit & Loss Statement ─────────── */}
        {activeTab === 'pl' && (
          <div className={`${styles.reportCard} animate-fade-in`}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Statement of Profit & Loss</h2>
                <p className={styles.cardSubtitle}>Operating income, cost of goods sold, and net business profitability</p>
              </div>
            </div>

            <div className={styles.plTable}>
              <div className={`${styles.plRow} ${styles.plRowHeader}`}>
                <span>Particulars</span>
                <span>Amount (₹)</span>
              </div>
              <div className={styles.plRow}>
                <span>Revenue from Sales of Finished Steel</span>
                <span className={styles.mono} style={{ fontWeight: 600 }}>{fmtINR(reportData.grossSales)}</span>
              </div>
              <div className={styles.plRow}>
                <span style={{ color: '#e11d48' }}>Less: Cost of Raw Steel Inward (Purchases)</span>
                <span className={styles.mono} style={{ color: '#e11d48', fontWeight: 600 }}>- {fmtINR(reportData.cogsPurchases)}</span>
              </div>
              <div className={`${styles.plRow} ${styles.plRowHighlight}`}>
                <span>Gross Profit (Trading Margin: {reportData.grossMarginPct}%)</span>
                <span className={styles.mono}>{fmtINR(reportData.grossProfit)}</span>
              </div>
              <div className={styles.plRow}>
                <span style={{ color: '#64748b' }}>Less: Operational Overhead & Yard Expenses</span>
                <span className={styles.mono} style={{ color: '#64748b' }}>- {fmtINR(reportData.operatingExpenses)}</span>
              </div>
              <div className={`${styles.plRow} ${styles.plRowSuccess}`}>
                <span>Net Operating Profit ({reportData.netMarginPct}% Net Margin)</span>
                <span className={styles.mono}>{fmtINR(reportData.netProfit)}</span>
              </div>
            </div>
          </div>
        )}



        {/* ── Tab 3: Sales vs Purchase Trend ─────────── */}
        {activeTab === 'trend' && (
          <div className={`${styles.reportCard} animate-fade-in`}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Sales Revenue vs Procurement Trend</h2>
                <p className={styles.cardSubtitle}>Monthly commercial cashflow curve and profitability divergence</p>
              </div>
            </div>

            {reportData.monthlyTrend && reportData.monthlyTrend.length > 0 ? (
              <div style={{ width: '100%', height: 360, marginTop: '16px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData.monthlyTrend} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `₹${val / 100000}L`} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <Tooltip formatter={(value) => [fmtINR(value)]} />
                    <Legend />
                    <Area type="monotone" dataKey="sales" name="Sales Revenue" stroke="#7c3aed" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                    <Area type="monotone" dataKey="purchases" name="Procurement Spend" stroke="#0284c7" fillOpacity={1} fill="url(#colorPurchases)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                No sales or purchase transactions recorded yet.
              </div>
            )}
          </div>
        )}

        {/* ── Tab 4: Stock Valuation ─────────────────── */}
        {activeTab === 'stock' && (
          <div className={`${styles.reportCard} animate-fade-in`}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Steel Material Stock Valuation by Category</h2>
                <p className={styles.cardSubtitle}>Category capital allocation and yard weight breakdown</p>
              </div>
            </div>

            {reportData.categoryBreakdown && reportData.categoryBreakdown.length > 0 ? (
              <div style={{ width: '100%', height: 320, marginTop: '16px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.categoryBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `₹${val / 100000}L`} />
                    <Tooltip formatter={(value) => [fmtINR(value), 'Asset Valuation']} />
                    <Bar dataKey="value" name="Valuation (₹)" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                No inventory stock recorded yet.
              </div>
            )}
          </div>
        )}

        {/* ── Tab 5: Ageing Analysis ─────────────────── */}
        {activeTab === 'ageing' && (
          <div className={`${styles.reportCard} animate-fade-in`}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Trade Ageing Analysis (Receivables & Payables Buckets)</h2>
                <p className={styles.cardSubtitle}>Credit exposure risk categorized by overdue windows</p>
              </div>
            </div>

            {/* Receivables Buckets */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                Customer Receivables (Debtors Ageing)
              </h3>
              {reportData.ageingData?.receivables?.length > 0 ? (
                <div className={styles.ageingGrid}>
                  {reportData.ageingData.receivables.map(b => (
                    <div key={b.bucket} className={styles.ageingCard} style={{ borderTop: `3px solid ${b.color}` }}>
                      <div className={styles.ageingBucket}>{b.bucket}</div>
                      <div className={styles.ageingAmount} style={{ color: b.color }}>{fmtINR(b.amount)}</div>
                      <div className={styles.ageingCount}>{b.count} invoices pending</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No customer invoices overdue.</p>
              )}
            </div>

            {/* Payables Buckets */}
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                Mill Payables (Creditors Ageing)
              </h3>
              {reportData.ageingData?.payables?.length > 0 ? (
                <div className={styles.ageingGrid}>
                  {reportData.ageingData.payables.map(b => (
                    <div key={b.bucket} className={styles.ageingCard} style={{ borderTop: `3px solid ${b.color}` }}>
                      <div className={styles.ageingBucket}>{b.bucket}</div>
                      <div className={styles.ageingAmount} style={{ color: b.color }}>{fmtINR(b.amount)}</div>
                      <div className={styles.ageingCount}>{b.count} supplier bills due</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No supplier payables overdue.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  );
}
