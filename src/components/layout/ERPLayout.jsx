/**
 * ERPLayout — Forbusyness Web ERP
 *
 * The main application shell for all authenticated ERP pages.
 * Renders the collapsible sidebar + top bar, with main content in the right panel.
 * Wrap every protected ERP page with this component.
 */

import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import styles from './ERPLayout.module.css';

export default function ERPLayout({ children, pageTitle, showBackButton, onBack, backTo }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`${styles.shell} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />

      {/* Main content area */}
      <div className={styles.main}>
        <TopBar
          pageTitle={pageTitle}
          onMenuToggle={() => setSidebarOpen(o => !o)}
          isSidebarOpen={sidebarOpen}
          showBackButton={showBackButton}
          onBack={onBack}
          backTo={backTo}
        />
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
