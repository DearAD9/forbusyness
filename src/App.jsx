/**
 * App.jsx — Forbusyness Web ERP
 *
 * Root component. Sets up routing and wraps the entire app in AuthProvider.
 *
 * Routes:
 *   /login                        → LoginPage  (public; authed users → /dashboard)
 *   /dashboard                    → DashboardPage (protected)
 *   /sales/invoices/new           → NewInvoicePage (protected)
 *   /sales/invoices               → SalesInvoicesPage (protected)
 *   /sales/returns                → SalesReturnPage (protected)
 *   /sales/reports                → SalesReportsPage (protected)
 *   /sales                        → redirect to /sales/invoices
 *   /customers                    → CustomersPage (protected)
 *   /customers/new                → CustomerFormPage (protected)
 *   /customers/:id                → CustomerDetailPage (protected)
 *   /customers/:id/edit           → CustomerFormPage (protected)
 *   /purchases, /suppliers, etc.  → ComingSoonPage (protected placeholders)
 *   *                             → redirect to /dashboard
 */

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './router/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewInvoicePage from './pages/NewInvoicePage';
import SalesInvoicesPage from './pages/SalesInvoicesPage';
import SalesReturnPage from './pages/SalesReturnPage';
import SalesReportsPage from './pages/SalesReportsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerFormPage from './pages/CustomerFormPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ProductsPage from './pages/ProductsPage';
import ProductFormPage from './pages/ProductFormPage';
import ProductDetailPage from './pages/ProductDetailPage';
import PurchasesPage from './pages/PurchasesPage';
import NewPurchasePage from './pages/NewPurchasePage';
import SuppliersPage from './pages/SuppliersPage';
import SupplierFormPage from './pages/SupplierFormPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import ReportsPage from './pages/ReportsPage';

/**
 * AuthAwareLoginRoute
 * Guards /login — authenticated users are immediately redirected to /dashboard.
 */
function AuthAwareLoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#18191b',
        color: '#9ca3af',
        fontFamily: "'Inter', sans-serif",
        fontSize: '0.875rem',
        letterSpacing: '0.05em',
      }}>
        Loading…
      </div>
    );
  }

  if (isAuthenticated) return null;
  return <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<AuthAwareLoginRoute />} />

          {/* ── Protected ERP routes ───────────────────────── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* ── Sales Module Routes ───────────────────────── */}
          <Route
            path="/sales/invoices/new"
            element={
              <ProtectedRoute>
                <NewInvoicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/invoices"
            element={
              <ProtectedRoute>
                <SalesInvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/returns"
            element={
              <ProtectedRoute>
                <SalesReturnPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/reports"
            element={
              <ProtectedRoute>
                <SalesReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={<Navigate to="/sales/invoices" replace />}
          />

          {/* ── Customer Module Routes ────────────────────── */}
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/new"
            element={
              <ProtectedRoute>
                <CustomerFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id/edit"
            element={
              <ProtectedRoute>
                <CustomerFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute>
                <CustomerDetailPage />
              </ProtectedRoute>
            }
          />

          {/* ── Products & Inventory Module Routes ────────── */}
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/new"
            element={
              <ProtectedRoute>
                <ProductFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id/edit"
            element={
              <ProtectedRoute>
                <ProductFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProtectedRoute>
                <ProductDetailPage />
              </ProtectedRoute>
            }
          />

          {/* ── Purchases & Inward Goods Module Routes ────── */}
          <Route
            path="/purchases"
            element={
              <ProtectedRoute>
                <PurchasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/new"
            element={
              <ProtectedRoute>
                <NewPurchasePage />
              </ProtectedRoute>
            }
          />

          {/* ── Suppliers & Mill Vendors Module Routes ────── */}
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <SuppliersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers/new"
            element={
              <ProtectedRoute>
                <SupplierFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers/:id/edit"
            element={
              <ProtectedRoute>
                <SupplierFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers/:id"
            element={
              <ProtectedRoute>
                <SupplierDetailPage />
              </ProtectedRoute>
            }
          />

          {/* ── Accounts Route (Redirect to Dashboard) ────── */}
          <Route path="/accounts" element={<Navigate to="/dashboard" replace />} />

          {/* ── Business Intelligence & Reports Routes ────── */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all → dashboard (ProtectedRoute will gate it) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
