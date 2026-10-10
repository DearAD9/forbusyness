/**
 * LoginForm — Forbusyness Web ERP
 *
 * Handles: username + password fields, remember-me, validation,
 * auth error display, loading state, duplicate-submission prevention,
 * and enter-key submission.
 */

import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRememberedUsername } from '../../services/authService';
import PasswordInput from './PasswordInput';
import styles from './LoginForm.module.css';

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg className={styles.spinner} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  // Pre-fill username from "remember me"
  const [username, setUsername] = useState(getRememberedUsername);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(Boolean(getRememberedUsername()));

  // Touched tracks whether a field has been blurred (for validation timing)
  const [touched, setTouched] = useState({ username: false, password: false });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const submittingRef = useRef(false); // hard lock to prevent double-submit

  // ── Validation ──────────────────────────────────────────────────
  const errors = {
    username: !username.trim() ? 'Please enter your username or email.' : '',
    password: !password ? 'Please enter your password.' : '',
  };
  const isValid = !errors.username && !errors.password;

  // ── Handlers ────────────────────────────────────────────────────
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    // Mark all fields touched so errors show on attempted submit
    setTouched({ username: true, password: true });

    if (!isValid) return;
    if (submittingRef.current) return; // prevent duplicate submissions

    submittingRef.current = true;
    setIsSubmitting(true);
    setAuthError('');

    try {
      await login(username, password, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      // Never reveal which credential was wrong
      setAuthError(err.message || 'Invalid username or password.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Enter key triggers submit from any field
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const showUsernameError = touched.username && errors.username;
  const showPasswordError = touched.password && errors.password;

  return (
    <div className={styles.card} role="main">
      {/* ── Brand ─────────────────────────────────── */}
      <div className={styles.brand}>
        <span className={styles.brandName}>forbusyness</span>
        <span className={styles.brandTagline}>BUSINESS MADE SIMPLE</span>
      </div>

      {/* ── Heading ───────────────────────────────── */}
      <div className={styles.heading}>
        <h1 className={styles.title}>Sign in to your account</h1>
        <p className={styles.subtitle}>Access your business, anytime.</p>
      </div>

      {/* ── Auth Error ────────────────────────────── */}
      {authError && (
        <div className={styles.authError} role="alert" aria-live="assertive">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{authError}</span>
        </div>
      )}

      {/* ── Form ──────────────────────────────────── */}
      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
        aria-label="Login form"
      >
        {/* Username / Email */}
        <div className={styles.fieldGroup}>
          <label htmlFor="username" className={styles.label}>
            Username or Email
          </label>
          <div className={`${styles.inputWrapper} ${showUsernameError ? styles.hasError : ''}`}>
            <span className={styles.inputIcon}>
              <UserIcon />
            </span>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setAuthError(''); }}
              onBlur={() => handleBlur('username')}
              onKeyDown={handleKeyDown}
              placeholder="Username or Email"
              autoComplete="username"
              autoFocus
              disabled={isSubmitting}
              className={styles.input}
              aria-required="true"
              aria-invalid={showUsernameError ? 'true' : 'false'}
              aria-describedby={showUsernameError ? 'username-error' : undefined}
            />
          </div>
          {showUsernameError && (
            <span id="username-error" className={styles.fieldError} role="alert">
              {errors.username}
            </span>
          )}
        </div>

        {/* Password */}
        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <div className={`${styles.inputWrapperPassword} ${showPasswordError ? styles.hasError : ''}`}>
            <span className={styles.inputIcon}>
              <LockIcon />
            </span>
            <PasswordInput
              id="password"
              name="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setAuthError(''); }}
              onBlur={() => handleBlur('password')}
              placeholder="Password"
              disabled={isSubmitting}
              hasError={showPasswordError}
            />
          </div>
          {showPasswordError && (
            <span id="password-error" className={styles.fieldError} role="alert">
              {errors.password}
            </span>
          )}
        </div>

        {/* Remember me + Forgot password */}
        <div className={styles.rememberRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              disabled={isSubmitting}
              className={styles.checkbox}
            />
            <span className={styles.checkmark} aria-hidden="true" />
            <span>Remember me</span>
          </label>
          {/* Forgot password — placeholder route for future implementation */}
          <a
            href="/forgot-password"
            className={styles.forgotLink}
            onClick={e => {
              e.preventDefault();
              // TODO: Implement forgot password flow
              alert('Forgot password flow not yet implemented.');
            }}
          >
            Forgot password?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <SpinnerIcon />
              <span>Signing in…</span>
            </>
          ) : (
            <span>Login →</span>
          )}
        </button>
      </form>
    </div>
  );
}
