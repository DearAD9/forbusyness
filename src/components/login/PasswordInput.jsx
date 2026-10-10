/**
 * PasswordInput — Forbusyness Web ERP
 *
 * Reusable password field with accessible show/hide toggle.
 */

import { useState, forwardRef } from 'react';
import styles from './PasswordInput.module.css';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const PasswordInput = forwardRef(function PasswordInput(
  { id, name, value, onChange, onBlur, placeholder, autoComplete, disabled, hasError },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`${styles.wrapper} ${hasError ? styles.error : ''}`}>
      <input
        ref={ref}
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete || 'current-password'}
        disabled={disabled}
        className={styles.input}
        aria-invalid={hasError ? 'true' : 'false'}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        className={styles.toggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
        disabled={disabled}
        tabIndex={0}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
});

export default PasswordInput;
