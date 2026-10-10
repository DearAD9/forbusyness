/**
 * dataResetService.js — Forbusyness Web ERP
 *
 * Provides safe, comprehensive removal of all temporary, seed, and entered test data
 * across all client-side modules and persistent localStorage stores.
 */

export const ALL_STORAGE_KEYS = [
  // Version 2 keys
  'fb_invoices_data_v2',
  'fb_purchases_data_v2',
  'fb_customers_data_v2',
  'fb_suppliers_data_v2',
  'fb_products_data_v2',
  'fb_returns_data_v2',
  'fb_accounts_coa_v2',
  'fb_accounts_vouchers_v2',

  // Version clean keys
  'fb_invoices_data_clean',
  'fb_purchases_data_clean',
  'fb_customers_data_clean',
  'fb_suppliers_data_clean',
  'fb_products_data_clean',
  'fb_returns_data_clean',
  'fb_accounts_coa_clean',
  'fb_accounts_vouchers_clean',

  // Legacy keys
  'fb_invoices_data',
  'fb_purchases_data',
  'fb_customers_data',
  'fb_suppliers_data',
  'fb_products_data',
  'fb_returns_data',
  'fb_accounts_coa',
  'fb_accounts_vouchers',
  'fb_mock_invoices_v1',
  'fb_mock_invoices_v2',
  'fb_mock_customers_v1',
  'fb_mock_returns_v1',
];

/**
 * Remove all entered temporary and test data from localStorage.
 */
export function clearAllEnteredData() {
  try {
    ALL_STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (err) {
    console.error('Failed to clear stored data:', err);
    return false;
  }
}
