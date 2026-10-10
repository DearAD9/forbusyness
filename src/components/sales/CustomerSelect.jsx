/**
 * CustomerSelect — Forbusyness Web ERP
 *
 * Searchable customer combobox for steel business clients.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers } from '../../services/customerService';
import styles from './CustomerSelect.module.css';

export default function CustomerSelect({
  selectedCustomer,
  onSelect,
  hasError = false,
  placeholder = 'Select or search customer...',
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(selectedCustomer ? selectedCustomer.name : '');
  const [customers, setCustomers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);

  useEffect(() => {
    if (selectedCustomer) {
      setQuery(selectedCustomer.name);
    } else {
      setQuery('');
    }
  }, [selectedCustomer]);

  useEffect(() => {
    let active = true;
    getCustomers(query).then((items) => {
      if (active) {
        const list = Array.isArray(items) ? items : (items?.items || []);
        setCustomers(list);
        setHighlightedIndex(0);
      }
    });
    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // If not selected, restore selected customer name
        if (selectedCustomer) {
          setQuery(selectedCustomer.name);
        } else {
          setQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCustomer]);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < customers.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : customers.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (customers[highlightedIndex]) {
        selectCustomer(customers[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const selectCustomer = (cust) => {
    setQuery(cust.name);
    setIsOpen(false);
    onSelect(cust);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery('');
    onSelect(null);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          className={`${styles.input} ${hasError ? styles.hasError : ''}`}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {selectedCustomer && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            title="Clear customer"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>Select Customer</span>
            <span>{customers.length} found</span>
          </div>

          {customers.length === 0 ? (
            <div className={styles.emptyState}>No customers found for "{query}"</div>
          ) : (
            <ul className={styles.dropdownList}>
              {customers.map((cust, idx) => (
                <li
                  key={cust.id}
                  className={`${styles.dropdownItem} ${
                    idx === highlightedIndex ? styles.highlighted : ''
                  }`}
                  onClick={() => selectCustomer(cust)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div className={styles.itemLeft}>
                    <span className={styles.customerName}>{cust.name}</span>
                    <span className={styles.customerPhone}>{cust.phone}</span>
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.customerCity}>{cust.city}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div
            className={styles.createCustomerBtn}
            onClick={() => {
              setIsOpen(false);
              navigate('/customers/new');
            }}
          >
            + Create New Customer
          </div>
        </div>
      )}
    </div>
  );
}
