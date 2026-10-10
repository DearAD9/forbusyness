/**
 * TopBar — Forbusyness Web ERP
 *
 * Sticky header:
 * - Sidebar collapse toggle
 * - Page location / title
 * - Global search (invoices, customers, steel items)
 * - Current date
 * - Notifications
 * - User profile menu & logout
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clearAllEnteredData } from '../../services/dataResetService';
import styles from './TopBar.module.css';

function IconMenu() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function IconBell() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}

function IconUser() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function getTodayStr() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function TopBar({ pageTitle, onMenuToggle, showBackButton, onBack, backTo }) {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to remove all entered temporary data? This will reset all records back to empty.')) {
      clearAllEnteredData();
      setUserMenuOpen(false);
      window.location.reload();
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/sales/invoices?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className={styles.topbar}>
      {/* Left: back button or menu toggle + page title */}
      <div className={styles.left}>
        {showBackButton ? (
          <button
            type="button"
            className={styles.backBtn}
            onClick={handleBack}
            aria-label="Go back"
            title="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            <span>Go Back</span>
          </button>
        ) : (
          <button
            className={styles.menuBtn}
            onClick={onMenuToggle}
            aria-label="Toggle sidebar"
          >
            <IconMenu />
          </button>
        )}
        {pageTitle && (
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
        )}
      </div>

      {/* Center: Global Search */}
      <div className={styles.searchWrapper}>
        <span className={styles.searchIcon}>
          <IconSearch />
        </span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Global search (invoices, customers)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchSubmit}
          aria-label="Global search"
        />
        {searchQuery && (
          <button
            className={styles.searchClear}
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Right: date, notifications, user */}
      <div className={styles.right}>
        <span className={styles.dateStr}>{getTodayStr()}</span>

        <button className={styles.iconBtn} aria-label="Notifications" title="Notifications">
          <IconBell />
          <span className={styles.notifBadge} />
        </button>

        {/* User avatar + dropdown */}
        <div className={styles.userMenuWrapper}>
          <button
            className={styles.userBtn}
            onClick={() => setUserMenuOpen(o => !o)}
            aria-label="User menu"
            aria-haspopup="true"
            aria-expanded={userMenuOpen}
          >
            <span className={styles.userAvatar}>
              <IconUser />
            </span>
            <span className={styles.userName}>
              {user?.name || 'Admin'}
            </span>
          </button>

          {userMenuOpen && (
            <>
              <div
                className={styles.menuBackdrop}
                onClick={() => setUserMenuOpen(false)}
              />
              <div className={styles.userDropdown} role="menu">
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownName}>{user?.name || 'ERP Administrator'}</span>
                  <span className={styles.dropdownEmail}>{user?.email || 'admin@forbusyness.com'}</span>
                </div>
                <div className={styles.dropdownDivider} />
                <button
                  className={styles.dropdownItem}
                  onClick={handleClearData}
                  role="menuitem"
                  title="Remove all entered temporary data and reset records"
                  style={{ color: '#dc2626' }}
                >
                  Clear All Temporary Data
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={handleLogout}
                  role="menuitem"
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
