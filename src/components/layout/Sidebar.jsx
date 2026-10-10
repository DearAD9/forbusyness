/**
 * Sidebar — Forbusyness Web ERP
 *
 * Collapsible navigation sidebar.
 * Shows icon+label when open, icon-only when collapsed.
 * Sales section contains:
 *   ├── New Invoice (/sales/invoices/new)
 *   ├── Sales Invoices (/sales/invoices)
 *   ├── Sales Return (/sales/returns)
 *   └── Sales Reports (/sales/reports)
 *
 * Strictly NO Payment Receipt in Sales.
 * Strictly NO Fabrication Work.
 */

import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

// ── Standard Nav Items ───────────────────────────────────────────
const TOP_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: <IconDashboard /> },
];

const SALES_SUBITEMS = [
  { to: '/sales/invoices/new', label: 'New Invoice' },
  { to: '/sales/invoices',     label: 'Sales Invoices' },
  { to: '/sales/returns',      label: 'Sales Return' },
  { to: '/sales/reports',      label: 'Sales Reports' },
];

const OTHER_ITEMS = [
  { to: '/purchases',  label: 'Purchases',  icon: <IconPurchases /> },
  { to: '/customers',  label: 'Customers',  icon: <IconCustomers /> },
  { to: '/suppliers',  label: 'Suppliers',  icon: <IconSuppliers /> },
  { to: '/products',   label: 'Products',   icon: <IconProducts /> },
  { to: '/reports',    label: 'Reports',    icon: <IconReports /> },
];

export default function Sidebar({ isOpen, onToggle }) {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isSalesActive = location.pathname.startsWith('/sales');
  const [salesExpanded, setSalesExpanded] = useState(true);

  // Keep sales expanded if user navigates to any sales page
  useEffect(() => {
    if (isSalesActive) {
      setSalesExpanded(true);
    }
  }, [isSalesActive]);

  const handleLogout = async () => {
    await logout();
  };

  const handleSalesClick = (e) => {
    e.preventDefault();
    if (!isOpen) {
      onToggle(); // expand sidebar if closed
      setSalesExpanded(true);
      navigate('/sales/invoices');
      return;
    }
    setSalesExpanded(prev => !prev);
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      {/* ── Logo ─────────────────────────────────── */}
      <div className={styles.logoRow}>
        {isOpen && (
          <span className={styles.logoText}>forbusyness</span>
        )}
        <button
          className={styles.toggleBtn}
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? <IconChevronLeft /> : <IconChevronRight />}
        </button>
      </div>

      {/* ── Navigation ───────────────────────────── */}
      <nav className={styles.nav} aria-label="Main navigation">
        <ul className={styles.navList}>
          {/* Dashboard */}
          {TOP_ITEMS.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                title={!isOpen ? label : undefined}
              >
                <span className={styles.navIcon}>{icon}</span>
                {isOpen && <span className={styles.navLabel}>{label}</span>}
              </NavLink>
            </li>
          ))}

          {/* ── Sales (with expandable Sub-menu) ──────── */}
          <li className={styles.navItemWithSub}>
            <button
              type="button"
              className={`${styles.navItem} ${isSalesActive ? styles.active : ''}`}
              onClick={handleSalesClick}
              title={!isOpen ? 'Sales' : undefined}
              aria-expanded={salesExpanded}
            >
              <div className={styles.navItemLeft}>
                <span className={styles.navIcon}><IconSales /></span>
                {isOpen && <span className={styles.navLabel}>Sales</span>}
              </div>
              {isOpen && (
                <span className={`${styles.subnavChevron} ${salesExpanded ? styles.open : ''}`}>
                  <IconChevronSmall />
                </span>
              )}
            </button>

            {/* Sub-menu when open and expanded */}
            {isOpen && salesExpanded && (
              <ul className={styles.subnavList} aria-label="Sales sub-menu">
                {SALES_SUBITEMS.map(({ to, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        `${styles.subnavItem} ${isActive ? styles.subActive : ''}`
                      }
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Other Modules */}
          {OTHER_ITEMS.map(({ to, label, icon }) => {
            const isItemActive = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  className={`${styles.navItem} ${isItemActive ? styles.active : ''}`}
                  title={!isOpen ? label : undefined}
                >
                  <span className={styles.navIcon}>{icon}</span>
                  {isOpen && <span className={styles.navLabel}>{label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Bottom: Logout ───────────────────────── */}
      <div className={styles.bottomSection}>
        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
          title={!isOpen ? 'Log out' : undefined}
          aria-label="Log out"
        >
          <span className={styles.navIcon}><IconLogout /></span>
          {isOpen && <span className={styles.navLabel}>Log out</span>}
        </button>
      </div>
    </aside>
  );
}

/* ── Inline SVG Icons ─────────────────────────────────────────── */
function IconDashboard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

function IconSales() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}

function IconPurchases() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconCustomers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}

function IconSuppliers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
    </svg>
  );
}

function IconProducts() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

function IconReports() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}

function IconLogout() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function IconChevronSmall() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
