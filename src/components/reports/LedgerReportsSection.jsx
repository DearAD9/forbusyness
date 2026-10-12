/**
 * LedgerReportsSection.jsx — Forbusyness Web ERP
 *
 * Double-Entry & Party Ledger Statements module.
 * Sub-reports:
 * - Customer Ledger
 * - Supplier Ledger
 * - Cash & Bank Ledger
 * - Expense Accounts
 */

import React from 'react';
import styles from './LedgerReportsSection.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function LedgerReportsSection({
  data,
  subType = 'customerLedger',
  selectedPartyId = '',
  onSelectPartyId,
}) {
  if (!data) return null;

  const {
    party = {},
    openingBalance = 0,
    closingBalance = 0,
    totalDebits = 0,
    totalCredits = 0,
    totalExpenses = 0,
    rows = [],
    partiesList = [],
  } = data;

  const isCustomer = subType === 'customerLedger';
  const isSupplier = subType === 'supplierLedger';
  const isCashBank = subType === 'cashBankLedger';
  const isExpense = subType === 'expenseLedger';

  return (
    <div className={styles.container}>
      {/* ── Party Selector Dropdown (when applicable) ─────────────────── */}
      {!isExpense && partiesList.length > 0 && (
        <div className={styles.selectorBar}>
          <label className={styles.selectorLabel}>
            {isCustomer ? 'Select Customer:' : isSupplier ? 'Select Supplier:' : 'Select Account:'}
          </label>
          <select
            className={styles.selectorSelect}
            value={selectedPartyId || (party.id ?? '')}
            onChange={(e) => onSelectPartyId && onSelectPartyId(e.target.value)}
          >
            {partiesList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Statement Header & Balance Cards ──────────────────────────── */}
      {!isExpense ? (
        <div className={styles.statementHeader}>
          <div className={styles.partyDetails}>
            <h3 className={styles.partyName}>{party.name || 'Account Statement'}</h3>
            {party.phone && <div className={styles.partyMeta}>Contact: {party.phone}</div>}
            {party.gstin && <div className={styles.partyMeta}>GSTIN: {party.gstin}</div>}
          </div>

          <div className={styles.balanceCards}>
            <div className={styles.balanceCard}>
              <span className={styles.balanceLabel}>Opening Balance</span>
              <span className={styles.balanceVal}>{fmtINR(openingBalance)}</span>
            </div>
            <div className={styles.balanceCard}>
              <span className={styles.balanceLabel}>Total Debits (Dr)</span>
              <span className={`${styles.balanceVal} ${styles.textDr}`}>{fmtINR(totalDebits)}</span>
            </div>
            <div className={styles.balanceCard}>
              <span className={styles.balanceLabel}>Total Credits (Cr)</span>
              <span className={`${styles.balanceVal} ${styles.textCr}`}>{fmtINR(totalCredits)}</span>
            </div>
            <div className={`${styles.balanceCard} ${styles.closingCard}`}>
              <span className={styles.balanceLabel}>Closing Balance</span>
              <span className={styles.balanceValStrong}>
                {fmtINR(Math.abs(closingBalance))} {closingBalance >= 0 ? (isSupplier ? 'Cr' : 'Dr') : (isSupplier ? 'Dr' : 'Cr')}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Operating Expenses</span>
            <span className={styles.summaryValue}>{fmtINR(totalExpenses)}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Expense Heads</span>
            <span className={styles.summaryValue}>{rows.length}</span>
          </div>
        </div>
      )}

      {/* ── Ledger Transactions Table ─────────────────────────────────── */}
      {!isExpense ? (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference No</th>
                  <th>Particulars / Description</th>
                  <th className={styles.textRight}>Debit (Dr)</th>
                  <th className={styles.textRight}>Credit (Cr)</th>
                  <th className={styles.textRight}>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.date}</td>
                      <td>
                        <span className={styles.typeBadge}>{row.type}</span>
                      </td>
                      <td className={styles.cellRef}>{row.refNo}</td>
                      <td>{row.description}</td>
                      <td className={`${styles.textRight} ${row.debit > 0 ? styles.textDr : ''}`}>
                        {row.debit > 0 ? fmtINR(row.debit) : '—'}
                      </td>
                      <td className={`${styles.textRight} ${row.credit > 0 ? styles.textCr : ''}`}>
                        {row.credit > 0 ? fmtINR(row.credit) : '—'}
                      </td>
                      <td className={`${styles.textRight} ${styles.cellBold}`}>
                        {fmtINR(Math.abs(row.balance))} {row.balanceType}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      No ledger transactions recorded for this account.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Expense Accounts List */
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th className={styles.textRight}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className={styles.cellRef}>{row.code}</td>
                      <td className={styles.cellBold}>{row.name}</td>
                      <td>{row.type}</td>
                      <td>{row.description}</td>
                      <td className={`${styles.textRight} ${styles.cellBold}`}>{fmtINR(row.balance)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>No expense accounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
