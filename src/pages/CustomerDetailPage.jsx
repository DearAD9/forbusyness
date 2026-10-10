/**
 * CustomerDetailPage — Forbusyness Web ERP
 *
 * Comprehensive Customer Account Statement & Financial Ledger.
 * Features:
 * - Executive Customer Hero Banner with Monogram & Direct Contact Links
 * - 4 Key Financial Health Indicators (Outstanding, Credit Barometer, Invoiced, Collected)
 * - 4 Interactive Tabs:
 *   1. Statement / Transaction Ledger (with running balance & chronological history)
 *   2. Sales Invoices (with status chips & InvoiceViewModal)
 *   3. Steel Material Purchases (product-wise volume & tonnage breakdown)
 *   4. Profile, Compliance & Bank Details
 * - Export & Print Statement features
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ERPLayout from '../components/layout/ERPLayout';
import InvoiceViewModal from '../components/sales/InvoiceViewModal';
import {
  getCustomerById,
  getCustomerLedger,
  getCustomerProductHistory,
} from '../services/customerService';
import { getInvoices } from '../services/invoiceService';
import styles from './CustomerDetailPage.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CU';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [ledgerData, setLedgerData] = useState({ transactions: [], currentBalance: 0 });
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [productHistory, setProductHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'invoices' | 'products' | 'profile'
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getCustomerById(id),
      getCustomerLedger(id),
      getInvoices({ customerId: id, pageSize: 100 }),
      getCustomerProductHistory(id),
    ])
      .then(([cust, ledger, invs, prods]) => {
        setCustomer(cust);
        setLedgerData(ledger);
        setCustomerInvoices(invs.items || []);
        setProductHistory(prods || []);
      })
      .catch((err) => {
        console.error('Failed to load customer details:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (isLoading) {
    return (
      <ERPLayout pageTitle="Customer Ledger">
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Loading customer account and ledger…
        </div>
      </ERPLayout>
    );
  }

  if (!customer) {
    return (
      <ERPLayout pageTitle="Customer Not Found">
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <h2>Customer Account Not Found</h2>
          <p style={{ color: '#64748b', marginTop: '8px' }}>
            The requested customer with ID #{id} does not exist.
          </p>
          <button
            type="button"
            className={styles.btnPrimary}
            style={{ margin: '16px auto' }}
            onClick={() => navigate('/customers')}
          >
            ← Back to Customers
          </button>
        </div>
      </ERPLayout>
    );
  }

  // Calculate totals
  const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalReceived = customerInvoices.reduce((sum, inv) => sum + (inv.received || 0), 0);
  const creditLimit = customer.creditLimit || 0;
  const currentBalance = ledgerData.currentBalance ?? customer.balance;
  const creditUtilPct = creditLimit > 0 ? Math.min(100, Math.round((currentBalance / creditLimit) * 100)) : 0;
  const isHighExposure = creditUtilPct > 50;

  return (
    <ERPLayout pageTitle={`Customer: ${customer.name}`}>
      <div className={styles.container}>
        {/* ── Executive Hero Banner ──────────────────── */}
        <div className={styles.heroBanner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroAvatar}>
              {getInitials(customer.name)}
            </div>

            <div className={styles.heroInfo}>
              <div className={styles.breadcrumbs}>
                <Link to="/customers" className={styles.breadcrumbLink}>
                  Customers
                </Link>{' '}
                / <span>Statement Ledger</span>
              </div>

              <div className={styles.heroTitleRow}>
                <h1 className={styles.heroTitle}>{customer.name}</h1>
                <span className={styles.codeBadge}>{customer.code}</span>
                <span
                  className={`${styles.statusBadge} ${
                    customer.status === 'Active' ? styles.badgeActive : styles.badgeInactive
                  }`}
                >
                  ● {customer.status}
                </span>
              </div>

              <div className={styles.heroMetaRow}>
                <span className={styles.heroMetaItem}>
                  📞 {customer.phone}
                </span>
                {customer.contactPerson && (
                  <span className={styles.heroMetaItem}>
                    👤 Attn: {customer.contactPerson}
                  </span>
                )}
                <span className={styles.heroMetaItem}>
                  📍 {customer.city}, {customer.state}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate(`/customers/${customer.id}/edit`)}
            >
              Edit Profile
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => window.print()}
            >
              Print Statement
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => navigate(`/sales/invoices/new?customerId=${customer.id}`)}
            >
              + Issue Invoice
            </button>
          </div>
        </div>

        {/* ── Financial Health Overview Cards ────────── */}
        <div className={styles.kpiGrid}>
          {/* Outstanding Balance */}
          <div className={`${styles.kpiCard} ${styles.cardRed}`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Outstanding Balance</span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: currentBalance > 0 ? '#b91c1c' : '#15803d',
                }}
              >
                {currentBalance > 0 ? 'Due Receivable' : 'Settled / Clear'}
              </span>
            </div>
            <div
              className={styles.kpiValue}
              style={{ color: currentBalance > 0 ? '#b91c1c' : '#15803d' }}
            >
              {fmtINR(currentBalance)}
            </div>
            <div className={styles.kpiSub}>Current net account ledger balance</div>
          </div>

          {/* Credit Limit & Barometer */}
          <div className={`${styles.kpiCard} ${styles.cardPurple}`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Credit Exposure</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isHighExposure ? '#b45309' : '#15803d' }}>
                {creditLimit ? `${creditUtilPct}% Used` : 'No Limit'}
              </span>
            </div>
            <div className={styles.kpiValue}>{creditLimit ? fmtINR(creditLimit) : 'Unrestricted'}</div>
            {creditLimit > 0 && (
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBar}
                  style={{
                    width: `${creditUtilPct}%`,
                    background: creditUtilPct > 80 ? '#ef4444' : creditUtilPct > 50 ? '#f59e0b' : '#10b981',
                  }}
                />
              </div>
            )}
            <div className={styles.kpiSub} style={{ marginTop: '4px' }}>
              Available: {fmtINR(Math.max(0, creditLimit - currentBalance))}
            </div>
          </div>

          {/* Total Invoiced */}
          <div className={`${styles.kpiCard} ${styles.cardBlue}`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Total Invoiced</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {customerInvoices.length} Bills
              </span>
            </div>
            <div className={styles.kpiValue} style={{ color: '#2563eb' }}>
              {fmtINR(totalInvoiced)}
            </div>
            <div className={styles.kpiSub}>Lifetime steel material purchases</div>
          </div>

          {/* Total Collections */}
          <div className={`${styles.kpiCard} ${styles.cardEmerald}`}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiTitle}>Total Collections</span>
              <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
                Realized
              </span>
            </div>
            <div className={styles.kpiValue} style={{ color: '#059669' }}>
              {fmtINR(totalReceived)}
            </div>
            <div className={styles.kpiSub}>Settled against delivered materials</div>
          </div>
        </div>

        {/* ── Modern Navigation Tabs ─────────────────── */}
        <div className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'ledger' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            <span>Statement / Ledger</span>
            <span className={styles.tabBadge}>{ledgerData.transactions?.length || 0}</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'invoices' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            <span>Invoices</span>
            <span className={styles.tabBadge}>{customerInvoices.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'products' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <span>Steel Materials Bought</span>
            <span className={styles.tabBadge}>{productHistory.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span>Profile & Compliance</span>
          </button>
        </div>

        {/* ── Tab 1: Statement / Transaction Ledger ───── */}
        {activeTab === 'ledger' && (
          <div className={styles.tableCard}>
            <div className={styles.tableToolbar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Transaction Statement</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  (Chronological Running Balance)
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ height: '32px', padding: '0 12px', fontSize: '0.75rem' }}
                  onClick={() => window.print()}
                >
                  Print Ledger
                </button>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '110px' }} className={styles.th}>Date</th>
                    <th style={{ width: '150px' }} className={styles.th}>Transaction Type</th>
                    <th style={{ width: '120px' }} className={styles.th}>Reference #</th>
                    <th className={styles.th}>Description</th>
                    <th style={{ width: '130px' }} className={`${styles.th} ${styles.right}`}>Debit (Sale)</th>
                    <th style={{ width: '130px' }} className={`${styles.th} ${styles.right}`}>Credit (Receipt)</th>
                    <th style={{ width: '140px' }} className={`${styles.th} ${styles.right}`}>Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                        No transactions recorded for this customer account yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className={styles.td}>{tx.date}</td>
                        <td className={styles.td}>
                          <span
                            className={
                              tx.type === 'Sales Invoice'
                                ? styles.typeBadgeSale
                                : tx.type === 'Payment Received'
                                ? styles.typeBadgePayment
                                : styles.typeBadgeOB
                            }
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className={`${styles.td} ${styles.mono}`}>
                          {tx.invoiceId ? (
                            <span
                              style={{
                                color: '#6d28d9',
                                cursor: 'pointer',
                                fontWeight: 700,
                              }}
                              onClick={() => {
                                const matched = customerInvoices.find((i) => i.id === tx.invoiceId);
                                if (matched) setSelectedInvoice(matched);
                              }}
                              title="Click to view invoice details"
                            >
                              {tx.reference}
                            </span>
                          ) : (
                            tx.reference
                          )}
                        </td>
                        <td className={styles.td}>{tx.description}</td>
                        <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                          {tx.debit > 0 ? fmtINR(tx.debit) : '—'}
                        </td>
                        <td className={`${styles.td} ${styles.right} ${styles.mono}`} style={{ color: '#047857' }}>
                          {tx.credit > 0 ? fmtINR(tx.credit) : '—'}
                        </td>
                        <td
                          className={`${styles.td} ${styles.right} ${styles.mono}`}
                          style={{
                            fontWeight: 800,
                            color: tx.balance > 0 ? '#b91c1c' : '#15803d',
                          }}
                        >
                          {fmtINR(tx.balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab 2: Invoices ─────────────────────────── */}
        {activeTab === 'invoices' && (
          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Invoice No.</th>
                    <th className={styles.th}>Date</th>
                    <th className={styles.th}>Reference</th>
                    <th className={styles.th}>Items Count</th>
                    <th className={`${styles.th} ${styles.right}`}>Grand Total</th>
                    <th className={`${styles.th} ${styles.right}`}>Received</th>
                    <th className={`${styles.th} ${styles.right}`}>Pending</th>
                    <th className={`${styles.th} ${styles.center}`}>Status</th>
                    <th className={`${styles.th} ${styles.right}`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customerInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                        No invoices created for this customer yet.
                      </td>
                    </tr>
                  ) : (
                    customerInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className={`${styles.td} ${styles.mono}`}>
                          <span
                            style={{
                              color: '#6d28d9',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            onClick={() => setSelectedInvoice(inv)}
                          >
                            #{inv.invoiceNo}
                          </span>
                        </td>
                        <td className={styles.td}>{inv.date}</td>
                        <td className={styles.td}>{inv.reference || '—'}</td>
                        <td className={styles.td}>{inv.items?.length || 0} items</td>
                        <td className={`${styles.td} ${styles.right} ${styles.mono}`} style={{ fontWeight: 700 }}>
                          {fmtINR(inv.grandTotal)}
                        </td>
                        <td className={`${styles.td} ${styles.right} ${styles.mono}`} style={{ color: '#047857' }}>
                          {fmtINR(inv.received)}
                        </td>
                        <td className={`${styles.td} ${styles.right} ${styles.mono}`} style={{ color: '#b91c1c' }}>
                          {fmtINR(inv.pending)}
                        </td>
                        <td className={`${styles.td} ${styles.center}`}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background:
                                inv.status === 'Paid'
                                  ? '#dcfce7'
                                  : inv.status === 'Partially Paid'
                                  ? '#fef3c7'
                                  : '#fee2e2',
                              color:
                                inv.status === 'Paid'
                                  ? '#15803d'
                                  : inv.status === 'Partially Paid'
                                  ? '#b45309'
                                  : '#b91c1c',
                            }}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className={`${styles.td} ${styles.right}`}>
                          <button
                            type="button"
                            className={styles.btnSecondary}
                            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                            onClick={() => setSelectedInvoice(inv)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab 3: Steel Materials Purchased ─────────── */}
        {activeTab === 'products' && (
          <div className={styles.tableCard}>
            <div className={styles.tableToolbar}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                Steel Materials Consumption History
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Sorted by highest purchase volume
              </span>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Material Item Name</th>
                    <th className={styles.th}>Category Code</th>
                    <th className={`${styles.th} ${styles.right}`}>Total Quantity</th>
                    <th className={`${styles.th} ${styles.right}`}>Orders</th>
                    <th className={`${styles.th} ${styles.right}`}>Total Spend</th>
                    <th className={styles.th}>Last Purchased</th>
                  </tr>
                </thead>
                <tbody>
                  {productHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                        No material order history found for this account.
                      </td>
                    </tr>
                  ) : (
                    productHistory.map((p, idx) => (
                      <tr key={idx}>
                        <td className={styles.td}>
                          <strong style={{ color: '#0f172a' }}>{p.name}</strong>
                        </td>
                        <td className={`${styles.td} ${styles.mono}`}>
                          <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {p.code}
                          </span>
                        </td>
                        <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                          {p.totalQty} {p.unit}
                        </td>
                        <td className={`${styles.td} ${styles.right}`}>{p.ordersCount} bills</td>
                        <td className={`${styles.td} ${styles.right} ${styles.mono}`} style={{ fontWeight: 700, color: '#0f172a' }}>
                          {fmtINR(p.totalAmount)}
                        </td>
                        <td className={styles.td}>{p.lastBoughtDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab 4: Profile & Compliance ─────────────── */}
        {activeTab === 'profile' && (
          <div className={styles.profileDetailGrid}>
            <div className={styles.detailBox}>
              <span className={styles.boxTitle}>Billing & Delivery Locations</span>
              <div className={styles.detailRow}>
                <span>Billing Address:</span>
                <strong>{customer.address}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>City:</span>
                <strong>{customer.city}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>State:</span>
                <strong>{customer.state}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>PIN Code:</span>
                <strong>{customer.pincode || '—'}</strong>
              </div>
              <div className={styles.detailRow} style={{ marginTop: '8px' }}>
                <span>Site Shipping Address:</span>
                <strong>{customer.shippingAddress || customer.address}</strong>
              </div>
            </div>

            <div className={styles.detailBox}>
              <span className={styles.boxTitle}>Banking & Commercial Compliance</span>
              <div className={styles.detailRow}>
                <span>PAN Number:</span>
                <strong style={{ fontFamily: 'monospace' }}>{customer.pan || '—'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Bank Name:</span>
                <strong>{customer.bankDetails?.bankName || '—'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Account Number:</span>
                <strong style={{ fontFamily: 'monospace' }}>{customer.bankDetails?.accountNo || '—'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>IFSC Code:</span>
                <strong style={{ fontFamily: 'monospace' }}>{customer.bankDetails?.ifsc || '—'}</strong>
              </div>
              {customer.notes && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                  <strong>Account Remarks:</strong> {customer.notes}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoice View Modal */}
        {selectedInvoice && (
          <InvoiceViewModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
          />
        )}
      </div>
    </ERPLayout>
  );
}
