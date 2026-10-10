/**
 * ProtectedRoute — Forbusyness Web ERP
 *
 * Wraps authenticated routes. Redirects unauthenticated visitors
 * to /login. While the session check is in progress, renders a
 * minimal loading screen to avoid flash-of-wrong-page.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#18191b',
        color: '#9ca3af',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.875rem',
        letterSpacing: '0.05em',
      }}>
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the page they tried to visit so we can redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
