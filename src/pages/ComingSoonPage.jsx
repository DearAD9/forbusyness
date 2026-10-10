/**
 * ComingSoonPage — Forbusyness Web ERP
 *
 * Shown when a user navigates to a module that hasn't been built yet.
 * Clean, professional placeholder — not a 404.
 */

import { useLocation, useNavigate } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import styles from './ComingSoonPage.module.css';

// Map route prefixes to human-readable module names
const MODULE_NAMES = {
  '/sales':      'Sales',
  '/purchases':  'Purchases',
  '/customers':  'Customers',
  '/suppliers':  'Suppliers',
  '/products':   'Products',
  '/reports':    'Reports',
};

function getModuleName(pathname) {
  for (const [prefix, name] of Object.entries(MODULE_NAMES)) {
    if (pathname.startsWith(prefix)) return name;
  }
  return 'This Module';
}

export default function ComingSoonPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const moduleName = getModuleName(location.pathname);

  return (
    <ERPLayout pageTitle={moduleName}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
              fill="none" stroke="#b87333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 className={styles.title}>{moduleName}</h1>
          <p className={styles.subtitle}>This module is under development.</p>
          <p className={styles.desc}>
            The <strong>{moduleName}</strong> module will be available in an upcoming release.
            Check back soon.
          </p>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </ERPLayout>
  );
}
