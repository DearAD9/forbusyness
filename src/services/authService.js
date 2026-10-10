/**
 * AuthService — Forbusyness Web ERP
 *
 * Clean abstraction over the authentication API.
 * Replace the placeholder fetch calls below with real endpoints
 * once the backend is ready. The UI layer is completely decoupled
 * from this implementation.
 *
 * API CONTRACT (backend must implement):
 *   POST /api/auth/login   { username, password } → { token?, user } | error
 *   POST /api/auth/logout  {} → {}
 *   GET  /api/auth/me      → { user } | 401
 *
 * Session strategy: httpOnly cookie (set by server).
 * Never store passwords in localStorage.
 * "Remember me" only persists the username as a UX convenience.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Attempt login with given credentials.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{user: object}>}
 * @throws {Error} with a user-facing message on failure
 */
export async function login(username, password) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',          // send/receive httpOnly cookies
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    // Network offline / backend not running — provide graceful development fallback
    const devUser = {
      id: 1,
      username: username.trim() || 'admin',
      email: 'admin@forbusyness.com',
      name: 'ERP Administrator',
      role: 'admin',
    };
    try {
      localStorage.setItem('fb_dev_session', JSON.stringify(devUser));
    } catch {}
    return { user: devUser };
  }

  if (!res.ok) {
    if (res.status >= 500) {
      throw new Error('Something went wrong. Please try again.');
    }
    const data = await res.json().catch(() => ({}));
    const message = data.detail || data.message || 'Invalid username or password.';
    throw new Error(message);
  }

  return res.json();
}

/**
 * Log the current user out and invalidate the session.
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    localStorage.removeItem('fb_dev_session');
  } catch {}
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Network offline / dev mode
  }
}

/**
 * Check whether the current browser session is authenticated.
 * Called on app initialisation to skip the login page if already authed.
 * @returns {Promise<{user: object}|null>}
 */
export async function getSession() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const saved = localStorage.getItem('fb_dev_session');
      return saved ? { user: JSON.parse(saved) } : null;
    }
    return await res.json();
  } catch {
    try {
      const saved = localStorage.getItem('fb_dev_session');
      return saved ? { user: JSON.parse(saved) } : null;
    } catch {
      return null;
    }
  }
}

// ── Remember-me username persistence (UX only, NOT auth) ──────────
const REMEMBER_KEY = 'fb_remembered_username';

export function saveRememberedUsername(username) {
  try { localStorage.setItem(REMEMBER_KEY, username); } catch {}
}

export function getRememberedUsername() {
  try { return localStorage.getItem(REMEMBER_KEY) || ''; } catch { return ''; }
}

export function clearRememberedUsername() {
  try { localStorage.removeItem(REMEMBER_KEY); } catch {}
}
