/**
 * LoginPage — Forbusyness Web ERP
 *
 * Two-column full-screen layout:
 *   Left  (~55%): Industrial background with branding and ERP quotes
 *   Right (~45%): Login card
 *
 * Authenticated users are redirected away immediately (see App.jsx).
 */

import LoginForm from '../components/login/LoginForm';
import styles from './LoginPage.module.css';

// ── SVG Icons for ERP quotes ─────────────────────────────────────
const IconSimplify = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconEfficiency = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconClarity = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconSafe = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const IconGrow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="16"/>
  </svg>
);

const ERP_QUOTES = [
  { icon: <IconSimplify />, text: 'Simplify Operations' },
  { icon: <IconEfficiency />, text: 'Improve Efficiency' },
  { icon: <IconClarity />, text: 'Manage with Clarity' },
  { icon: <IconSafe />, text: 'Keep Your Data Safe' },
  { icon: <IconGrow />, text: 'Grow Without Limits' },
];

export default function LoginPage() {
  return (
    <div className={styles.page}>
      {/* ══════════════════════════════════════════════════════════
          LEFT PANEL — Industrial background + Branding
         ══════════════════════════════════════════════════════════ */}
      <aside className={styles.leftPanel} aria-hidden="true">
        {/* Dark overlay so text stays readable over the photo */}
        <div className={styles.overlay} />

        <div className={styles.leftContent}>
          {/* Decorative top rule */}
          <div className={styles.decorRule} />

          {/* Main heading */}
          <div className={styles.heroText}>
            <p className={styles.welcomeTo}>Welcome to</p>
            <p className={styles.brandHero}>forbusyness</p>
            <p className={styles.tagline}>Business Management Made Simple</p>
          </div>

          {/* ERP Benefit Quotes */}
          <ul className={styles.quoteList} aria-label="Key benefits">
            {ERP_QUOTES.map(({ icon, text }) => (
              <li key={text} className={styles.quoteItem}>
                <span className={styles.quoteIcon}>{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          {/* Footer motto */}
          <div className={styles.leftFooter}>
            <div className={styles.decorRuleShort} />
            <p className={styles.motto}>BUILD · MANAGE · GROW TOGETHER</p>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════
          RIGHT PANEL — Login form
         ══════════════════════════════════════════════════════════ */}
      <main className={styles.rightPanel}>
        <LoginForm />
      </main>
    </div>
  );
}
