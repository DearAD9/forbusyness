/**
 * accountService.js — Forbusyness Web ERP
 *
 * Professional Financial Accounting, Double-Entry Daybook & Ledger Service.
 * Manages:
 * - Chart of Accounts (Assets, Liabilities, Income, Expenses)
 * - Bank Accounts & Cash in Hand live balances
 * - Daybook Vouchers: Payment, Receipt, Contra, Journal
 * - Instant balance updates & persistent localStorage storage
 */

const STORAGE_ACCOUNTS_KEY = 'fb_accounts_coa_v2';
const STORAGE_VOUCHERS_KEY = 'fb_accounts_vouchers_v2';

// Purge legacy, temporary, and test accounts and vouchers
try {
  localStorage.removeItem('fb_accounts_coa');
  localStorage.removeItem('fb_accounts_coa_clean');
  localStorage.removeItem('fb_accounts_vouchers');
  localStorage.removeItem('fb_accounts_vouchers_clean');
} catch {}

export const ACCOUNT_CATEGORIES = ['Assets', 'Liabilities', 'Income', 'Expenses'];
export const VOUCHER_TYPES = ['Payment', 'Receipt', 'Contra', 'Journal'];

export const INITIAL_CHART_OF_ACCOUNTS = [
  // ── Assets
  { id: '1010', code: '1010', name: 'Primary Bank Current Account', category: 'Assets', type: 'Bank', balance: 0, desc: 'Primary clearing & RTGS disbursement account' },
  { id: '1020', code: '1020', name: 'Secondary Bank Account', category: 'Assets', type: 'Bank', balance: 0, desc: 'Operational billing & collections account' },
  { id: '1030', code: '1030', name: 'Main Cash Vault & Petty Cash', category: 'Assets', type: 'Cash', balance: 0, desc: 'Cash counter & daily petty expenses' },
  { id: '1040', code: '1040', name: 'Accounts Receivable (Trade Debtors)', category: 'Assets', type: 'Receivable', balance: 0, desc: 'Outstanding customer dues & billed invoices' },
  { id: '1050', code: '1050', name: 'Inventory Valuation', category: 'Assets', type: 'Inventory', balance: 0, desc: 'Asset value of physical stock in yard' },

  // ── Liabilities
  { id: '2010', code: '2010', name: 'Accounts Payable (Trade Creditors)', category: 'Liabilities', type: 'Payable', balance: 0, desc: 'Outstanding dues owed to suppliers' },
  { id: '2030', code: '2030', name: 'Working Capital OD / Credit Facility', category: 'Liabilities', type: 'Bank Loan', balance: 0, desc: 'Revolving credit facility' },

  // ── Income
  { id: '3010', code: '3010', name: 'Sales Revenue', category: 'Income', type: 'Revenue', balance: 0, desc: 'Revenue from sales of goods & materials' },
  { id: '3020', code: '3020', name: 'Secondary & Scrap Sales', category: 'Income', type: 'Revenue', balance: 0, desc: 'Secondary realization & scrap' },
  { id: '3030', code: '3030', name: 'Transport & Freight Recoveries', category: 'Income', type: 'Revenue', balance: 0, desc: 'Logistics delivery surcharges' },

  // ── Expenses
  { id: '4010', code: '4010', name: 'Cost of Materials (Purchases)', category: 'Expenses', type: 'COGS', balance: 0, desc: 'Direct inward procurement of materials' },
  { id: '4020', code: '4020', name: 'Power & Utility Expenses', category: 'Expenses', type: 'Operating', balance: 0, desc: 'Electricity and yard utilities' },
  { id: '4030', code: '4030', name: 'Logistics & Handling Fees', category: 'Expenses', type: 'Operating', balance: 0, desc: 'Transportation, freight, and crane rentals' },
  { id: '4040', code: '4040', name: 'Wages & Operating Overheads', category: 'Expenses', type: 'Operating', balance: 0, desc: 'Staff wages and office overheads' },
];

export const INITIAL_VOUCHERS = [];

function loadStoredAccounts() {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...INITIAL_CHART_OF_ACCOUNTS];
}

function persistAccounts(list) {
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(list));
  } catch {}
}

function loadStoredVouchers() {
  try {
    const raw = localStorage.getItem(STORAGE_VOUCHERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...INITIAL_VOUCHERS];
}

function persistVouchers(list) {
  try {
    localStorage.setItem(STORAGE_VOUCHERS_KEY, JSON.stringify(list));
  } catch {}
}

let accountsStore = loadStoredAccounts();
let vouchersStore = loadStoredVouchers();

export async function getAccounts(options = {}) {
  await new Promise(r => setTimeout(r, 40));
  const { category, search } = options;
  let list = [...accountsStore];

  if (category && category !== 'All') {
    list = list.filter(a => a.category === category);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q) ||
      (a.desc && a.desc.toLowerCase().includes(q))
    );
  }

  return list;
}

export async function getAccountById(id) {
  await new Promise(r => setTimeout(r, 20));
  return accountsStore.find(a => a.id === id) || null;
}

export async function getVouchers(options = {}) {
  await new Promise(r => setTimeout(r, 40));
  const { type, search, page = 1, pageSize = 15 } = options;
  let list = [...vouchersStore];

  if (type && type !== 'All') {
    list = list.filter(v => v.type === type);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(v =>
      v.voucherNo.toLowerCase().includes(q) ||
      v.debitAccountName.toLowerCase().includes(q) ||
      v.creditAccountName.toLowerCase().includes(q) ||
      (v.referenceNo && v.referenceNo.toLowerCase().includes(q)) ||
      (v.narration && v.narration.toLowerCase().includes(q))
    );
  }

  // Sort descending by date
  list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const total = list.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const items = list.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

export async function createVoucher(data) {
  await new Promise(r => setTimeout(r, 60));

  const nextSeq = vouchersStore.length + 1;
  const voucherNo = `VCH-${String(nextSeq).padStart(3, '0')}`;
  const amount = Number(data.amount) || 0;

  const debitAcc = accountsStore.find(a => a.id === data.debitAccountId);
  const creditAcc = accountsStore.find(a => a.id === data.creditAccountId);

  if (!debitAcc || !creditAcc) {
    throw new Error('Please select both Debit and Credit ledger accounts.');
  }

  const newVoucher = {
    id: voucherNo,
    voucherNo,
    date: data.date || new Date().toISOString().slice(0, 10),
    type: data.type || 'Payment',
    debitAccountId: data.debitAccountId,
    debitAccountName: debitAcc.name,
    creditAccountId: data.creditAccountId,
    creditAccountName: creditAcc.name,
    amount,
    referenceNo: (data.referenceNo || '').trim(),
    narration: (data.narration || '').trim(),
    createdAt: new Date().toISOString(),
  };

  // Double entry balance adjustment
  // Debit increases Assets & Expenses, decreases Liabilities & Income
  if (debitAcc.category === 'Assets' || debitAcc.category === 'Expenses') {
    debitAcc.balance += amount;
  } else {
    debitAcc.balance -= amount;
  }

  // Credit decreases Assets & Expenses, increases Liabilities & Income
  if (creditAcc.category === 'Assets' || creditAcc.category === 'Expenses') {
    creditAcc.balance -= amount;
  } else {
    creditAcc.balance += amount;
  }

  accountsStore = [...accountsStore];
  persistAccounts(accountsStore);

  vouchersStore = [newVoucher, ...vouchersStore];
  persistVouchers(vouchersStore);

  return newVoucher;
}

export async function getAccountsSummary() {
  await new Promise(r => setTimeout(r, 30));

  // Liquid funds = Cash + Bank
  const liquidFunds = accountsStore
    .filter(a => a.type === 'Bank' || a.type === 'Cash')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  // Total Receivables
  const totalReceivables = accountsStore
    .filter(a => a.type === 'Receivable')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  // Total Payables
  const totalPayables = accountsStore
    .filter(a => a.type === 'Payable')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  // Current Assets vs Liabilities -> Net Working Capital
  const currentAssets = accountsStore
    .filter(a => a.category === 'Assets')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const currentLiabilities = accountsStore
    .filter(a => a.category === 'Liabilities')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const netWorkingCapital = currentAssets - currentLiabilities;

  return {
    liquidFunds,
    totalReceivables,
    totalPayables,
    netWorkingCapital,
    accountsCount: accountsStore.length,
    vouchersCount: vouchersStore.length,
  };
}
