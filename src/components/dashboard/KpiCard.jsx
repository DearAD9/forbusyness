/**
 * KpiCard — Forbusyness Web ERP
 *
 * Modern analytical executive KPI card.
 * High data legibility, refined typography, subtle micro-interactions,
 * delta comparison badges, and optional direct module routing.
 */

import styles from './KpiCard.module.css';

function TrendBadge({ trend, trendLabel }) {
  if (trend === null || trend === undefined) return null;
  const isPositive = trend >= 0;
  return (
    <span
      className={`${styles.trendBadge} ${isPositive ? styles.trendUp : styles.trendDown}`}
      title={`${isPositive ? 'Increase' : 'Decrease'} of ${Math.abs(trend)}% ${trendLabel || ''}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.trendIcon}
        aria-hidden="true"
      >
        {isPositive ? (
          <>
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </>
        ) : (
          <>
            <line x1="7" y1="7" x2="17" y2="17" />
            <polyline points="17 7 17 17 7 17" />
          </>
        )}
      </svg>
      {Math.abs(trend)}%
    </span>
  );
}

export default function KpiCard({
  title,
  value,
  subLine,
  trend,
  trendLabel,
  icon,
  accentColor = 'var(--color-primary, #6d28d9)',
  badgeText,
  onClick,
}) {
  const isClickable = Boolean(onClick);

  return (
    <article
      className={`${styles.card} ${isClickable ? styles.clickable : ''}`}
      onClick={onClick}
      style={{ '--card-accent': accentColor }}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={e => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Top Accent Strip */}
      <div className={styles.accentBar} />

      <div className={styles.topRow}>
        <div className={styles.titleWrap}>
          <span className={styles.title}>{title}</span>
          {badgeText && <span className={styles.tag}>{badgeText}</span>}
        </div>
        {icon && (
          <div
            className={styles.iconBox}
            style={{
              background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
              color: accentColor,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.trendRow}>
          {trend !== undefined && trend !== null && (
            <TrendBadge trend={trend} trendLabel={trendLabel} />
          )}
          {trendLabel && (
            <span className={styles.trendLabel}>{trendLabel}</span>
          )}
        </div>
        {subLine && (
          <span className={styles.subLine} title={subLine}>
            {subLine}
          </span>
        )}
      </div>
    </article>
  );
}
