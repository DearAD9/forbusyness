/**
 * ReportsPage — Forbusyness Web ERP
 *
 * Comprehensive ERP Reporting & Business Intelligence Center.
 * Unified architecture supporting:
 * - 9 Core Business Domains: Overview, Sales, Purchases, Ledgers, Financials (P&L),
 *   Outstanding & Aging, Stock & Products, Profitability, and Tax & GST.
 * - Deep linking with URL parameters (?cat=...&sub=...)
 * - Multi-period date filtering (Today, Week, Month, Quarter, FY 2026-27, Custom)
 * - 1-Click universal export to CSV and Excel (.xls)
 * - Print-optimized layout
 * - Domain-neutral, clear, accessible terminology (Sales, Purchases, Stock, Products, Ledgers)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import ReportsNavigation, { REPORT_CATEGORIES } from '../components/reports/ReportsNavigation';
import ReportFilterBar from '../components/reports/ReportFilterBar';

import ReportsOverviewSection from '../components/reports/ReportsOverviewSection';
import SalesReportsSection from '../components/reports/SalesReportsSection';
import PurchaseReportsSection from '../components/reports/PurchaseReportsSection';
import LedgerReportsSection from '../components/reports/LedgerReportsSection';
import FinancialReportsSection from '../components/reports/FinancialReportsSection';
import OutstandingReportsSection from '../components/reports/OutstandingReportsSection';
import InventoryReportsSection from '../components/reports/InventoryReportsSection';
import ProfitabilityReportsSection from '../components/reports/ProfitabilityReportsSection';
import TaxReportsSection from '../components/reports/TaxReportsSection';

import {
  getExecutiveOverview,
  getSalesReportData,
  getPurchaseReportData,
  getLedgerReportData,
  getFinancialReportData,
  getOutstandingReportData,
  getInventoryReportData,
  getProfitabilityReportData,
  getTaxReportData,
  exportReportToCsv,
  exportReportToExcel,
} from '../services/reportService';

import styles from './ReportsPage.module.css';

const DEFAULT_SUB_MAP = {
  overview: '',
  sales: 'register',
  purchases: 'register',
  ledgers: 'customerLedger',
  financials: 'pl',
  outstanding: 'customerOutstanding',
  inventory: 'stockSummary',
  profitability: 'product',
  tax: 'gstr1',
};

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active Category & Sub-report from URL query params
  const catParam = searchParams.get('cat') || 'overview';
  const subParam = searchParams.get('sub') || DEFAULT_SUB_MAP[catParam] || '';
  const partyIdParam = searchParams.get('partyId') || '';

  const [activeCategory, setActiveCategory] = useState(catParam);
  const [activeSub, setActiveSub] = useState(subParam);
  const [selectedPartyId, setSelectedPartyId] = useState(partyIdParam);

  // Filters State
  const [preset, setPreset] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Report Data & Loading State
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize URL parameters when state changes
  const updateUrl = useCallback((newCat, newSub, partyId = '') => {
    const params = { cat: newCat };
    if (newSub) params.sub = newSub;
    if (partyId) params.partyId = partyId;
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Synchronize component state with URL params on navigation
  useEffect(() => {
    if (catParam !== activeCategory) {
      setActiveCategory(catParam);
      setActiveSub(subParam || DEFAULT_SUB_MAP[catParam] || '');
    } else if (subParam && subParam !== activeSub) {
      setActiveSub(subParam);
    }
    if (partyIdParam && partyIdParam !== selectedPartyId) {
      setSelectedPartyId(partyIdParam);
    }
  }, [catParam, subParam, partyIdParam]);

  // Handle category change
  const handleSelectCategory = (catId) => {
    const defaultSub = DEFAULT_SUB_MAP[catId] || '';
    setActiveCategory(catId);
    setActiveSub(defaultSub);
    updateUrl(catId, defaultSub);
  };

  // Handle sub-category change
  const handleSelectSub = (subId) => {
    setActiveSub(subId);
    updateUrl(activeCategory, subId, selectedPartyId);
  };

  // Cross-category navigation helper (e.g. from Overview or Outstanding cards)
  const handleNavigate = (catId, subId, partyId = '') => {
    setActiveCategory(catId);
    setActiveSub(subId);
    if (partyId) setSelectedPartyId(partyId);
    updateUrl(catId, subId, partyId);
  };

  const handleNavigateToLedger = (ledgerSub, partyId) => {
    setActiveCategory('ledgers');
    setActiveSub(ledgerSub);
    setSelectedPartyId(partyId);
    updateUrl('ledgers', ledgerSub, partyId);
  };

  // ── Fetch Report Data ──────────────────────────────────────────────────
  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const filterOpts = {
        preset,
        dateFrom,
        dateTo,
        search: searchQuery,
      };

      let result = null;
      switch (activeCategory) {
        case 'overview':
          result = await getExecutiveOverview(filterOpts);
          break;
        case 'sales':
          result = await getSalesReportData({ ...filterOpts, subType: activeSub });
          break;
        case 'purchases':
          result = await getPurchaseReportData({ ...filterOpts, subType: activeSub });
          break;
        case 'ledgers':
          result = await getLedgerReportData({
            ...filterOpts,
            subType: activeSub,
            partyId: selectedPartyId,
          });
          break;
        case 'financials':
          result = await getFinancialReportData({ ...filterOpts, subType: activeSub });
          break;
        case 'outstanding':
          result = await getOutstandingReportData({ ...filterOpts, subType: activeSub });
          break;
        case 'inventory':
          result = await getInventoryReportData({ ...filterOpts, subType: activeSub });
          break;
        case 'profitability':
          result = await getProfitabilityReportData({ ...filterOpts, subType: activeSub });
          break;
        case 'tax':
          result = await getTaxReportData({ ...filterOpts, subType: activeSub });
          break;
        default:
          result = await getExecutiveOverview(filterOpts);
          break;
      }
      setReportData(result);
    } catch (err) {
      console.error('Failed to load report data:', err);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, activeSub, selectedPartyId, preset, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // ── Universal Export Handlers ──────────────────────────────────────────
  const getExportHeadersAndRows = () => {
    if (!reportData) return { headers: [], rows: [] };

    if (reportData.rows && Array.isArray(reportData.rows)) {
      const sampleRow = reportData.rows[0];
      if (!sampleRow) return { headers: [], rows: [] };
      const headers = Object.keys(sampleRow)
        .filter(k => k !== 'id')
        .map(key => ({
          key,
          label: key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase()),
        }));
      return { headers, rows: reportData.rows };
    }

    if (activeCategory === 'overview' && reportData.kpi) {
      const kpiEntries = Object.entries(reportData.kpi).map(([key, val]) => ({
        Metric: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        Value: val,
      }));
      return {
        headers: [{ key: 'Metric', label: 'Metric' }, { key: 'Value', label: 'Value' }],
        rows: kpiEntries,
      };
    }

    return { headers: [], rows: [] };
  };

  const handleExportCsv = () => {
    const { headers, rows } = getExportHeadersAndRows();
    const filename = `${activeCategory}_${activeSub || 'report'}`;
    exportReportToCsv(filename, headers, rows);
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportHeadersAndRows();
    const filename = `${activeCategory}_${activeSub || 'report'}`;
    exportReportToExcel(filename, activeCategory.toUpperCase(), headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  // Active Category Meta
  const currentCategoryObj = REPORT_CATEGORIES.find(c => c.id === activeCategory) || REPORT_CATEGORIES[0];

  return (
    <ERPLayout>
      <div className={styles.container}>
        {/* ── Print Only Header ──────────────────────────────────────── */}
        <div className={styles.printHeader}>
          <h1 className={styles.printTitle}>Forbusyness — {currentCategoryObj.label} Report</h1>
          <p className={styles.printMeta}>
            Generated on: {new Date().toLocaleString('en-IN')} | Period: {preset.toUpperCase()}
            {dateFrom ? ` (${dateFrom} to ${dateTo || 'Present'})` : ''}
          </p>
        </div>

        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.breadcrumbs}>
              <span>ERP</span>
              <span>/</span>
              <span>Reports</span>
              <span>/</span>
              <span className={styles.breadcrumbActive}>{currentCategoryObj.label}</span>
            </div>
            <div className={styles.titleWrapper}>
              <h1 className={styles.title}>Reports & Business Intelligence</h1>
              <span className={styles.titleBadge}>Live Data</span>
            </div>
            <p className={styles.subtitle}>
              Comprehensive reports across sales, purchases, stock, customer ledgers, and business profitability
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.btnBack}
              onClick={() => navigate('/dashboard')}
              title="Return to Dashboard"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* ── 9 Category Navigation Bar ──────────────────────────────── */}
        <ReportsNavigation
          activeCategory={activeCategory}
          activeSub={activeSub}
          onSelectCategory={handleSelectCategory}
          onSelectSub={handleSelectSub}
        />

        {/* ── Universal Date & Action Filter Bar ─────────────────────── */}
        <ReportFilterBar
          preset={preset}
          onSelectPreset={setPreset}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChangeDateFrom={setDateFrom}
          onChangeDateTo={setDateTo}
          search={searchQuery}
          onChangeSearch={setSearchQuery}
          searchPlaceholder={`Search ${currentCategoryObj.label.toLowerCase()}...`}
          onExportCsv={handleExportCsv}
          onExportExcel={handleExportExcel}
          onPrint={handlePrint}
          onRefresh={fetchReportData}
          isLoading={isLoading}
        />

        {/* ── Main Report Content Area ───────────────────────────────── */}
        <div className={styles.contentArea}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <p>Loading {currentCategoryObj.label} report data...</p>
            </div>
          ) : (
            <>
              {activeCategory === 'overview' && (
                <ReportsOverviewSection
                  data={reportData}
                  onNavigateCategory={handleNavigate}
                />
              )}

              {activeCategory === 'sales' && (
                <SalesReportsSection
                  data={reportData}
                  subType={activeSub}
                />
              )}

              {activeCategory === 'purchases' && (
                <PurchaseReportsSection
                  data={reportData}
                  subType={activeSub}
                />
              )}

              {activeCategory === 'ledgers' && (
                <LedgerReportsSection
                  data={reportData}
                  subType={activeSub}
                  selectedPartyId={selectedPartyId}
                  onSelectPartyId={setSelectedPartyId}
                />
              )}

              {activeCategory === 'financials' && (
                <FinancialReportsSection
                  data={reportData}
                  subType={activeSub}
                />
              )}

              {activeCategory === 'outstanding' && (
                <OutstandingReportsSection
                  data={reportData}
                  subType={activeSub}
                  onNavigateToLedger={handleNavigateToLedger}
                />
              )}

              {activeCategory === 'inventory' && (
                <InventoryReportsSection
                  data={reportData}
                  subType={activeSub}
                />
              )}

              {activeCategory === 'profitability' && (
                <ProfitabilityReportsSection
                  data={reportData}
                  subType={activeSub}
                />
              )}

              {activeCategory === 'tax' && (
                <TaxReportsSection
                  data={reportData}
                  subType={activeSub}
                />
              )}
            </>
          )}
        </div>
      </div>
    </ERPLayout>
  );
}
