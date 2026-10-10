/**
 * salesReturnService.js — Forbusyness Web ERP
 *
 * Sales return (Credit Note) data service.
 * Manages original invoice item availability calculations,
 * sequential return numbering (AUTO: 1, 2, 3...), and return history.
 */

import { getInvoiceById } from './invoiceService';

const STORAGE_KEY = 'fb_returns_data_v2';

// Purge legacy and temporary data keys
try {
  localStorage.removeItem('fb_returns_data');
  localStorage.removeItem('fb_returns_data_clean');
  localStorage.removeItem('fb_mock_returns_v1');
} catch {}

const INITIAL_RETURNS = [];

function loadStoredReturns() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [...INITIAL_RETURNS];
}

function persistReturns(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

let returnsStore = loadStoredReturns();

/**
 * Fetch original invoice details and compute available return quantities for each item.
 */
export async function getOriginalInvoiceForReturn(invoiceNo) {
  await new Promise(r => setTimeout(r, 60));
  const invoice = await getInvoiceById(invoiceNo);
  if (!invoice) {
    throw new Error(`Invoice #${invoiceNo} not found.`);
  }

  // Calculate previously returned quantities for items in this invoice
  const priorReturns = returnsStore.filter(r => r.originalInvoiceNo === String(invoice.invoiceNo));
  const returnedMap = {};
  priorReturns.forEach(ret => {
    (ret.items || []).forEach(item => {
      returnedMap[item.productId] = (returnedMap[item.productId] || 0) + (Number(item.returnQty) || 0);
    });
  });

  const processedItems = (invoice.items || []).map(item => {
    const soldQty = Number(item.qty) || 0;
    const alreadyReturned = returnedMap[item.productId] || 0;
    const available = Math.max(0, soldQty - alreadyReturned);

    return {
      productId: item.productId,
      productName: item.productName,
      productCode: item.productCode,
      soldQty,
      unit: item.unit,
      originalRate: Number(item.rate) || 0,
      alreadyReturned,
      available,
    };
  });

  return {
    invoiceNo: invoice.invoiceNo,
    date: invoice.date,
    customer: invoice.customer,
    grandTotal: invoice.grandTotal,
    items: processedItems,
  };
}

/**
 * Create a new sales return (credit note).
 * Sequential return number (AUTO).
 */
export async function createSalesReturn(returnData) {
  await new Promise(r => setTimeout(r, 100));

  const maxId = returnsStore.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
  const nextId = maxId + 1;
  const nextReturnNo = String(nextId);

  const newReturn = {
    id: nextId,
    returnNo: nextReturnNo,
    returnDate: returnData.returnDate || new Date().toISOString().split('T')[0],
    originalInvoiceNo: String(returnData.originalInvoiceNo),
    customer: returnData.customer,
    reason: returnData.reason || 'Other',
    notes: returnData.notes || '',
    items: returnData.items || [],
    totalItems: returnData.items?.length || 0,
    totalQty: returnData.totalQty || 0,
    subtotal: returnData.subtotal || 0,
    roundOff: returnData.roundOff || 0,
    totalReturnAmount: returnData.totalReturnAmount || 0,
    createdAt: new Date().toISOString(),
  };

  returnsStore = [newReturn, ...returnsStore];
  persistReturns(returnsStore);

  return newReturn;
}

/**
 * List all sales returns.
 */
export async function getSalesReturns() {
  await new Promise(r => setTimeout(r, 40));
  return [...returnsStore];
}
