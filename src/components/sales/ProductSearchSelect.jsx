/**
 * ProductSearchSelect — Forbusyness Web ERP
 *
 * Fast ERP product selector for steel materials.
 * Behavior:
 * - Focus when empty: displays recently used products
 * - Typing: searches by product name or code
 * - Shows: Product Name, Product Code, Unit, Selling Rate (No stock)
 * - Keyboard navigation: Up/Down arrow to highlight, Enter to select, Esc to close
 * - Notifies parent on selection to advance focus to Qty
 */

import { useState, useEffect, useRef, useId } from 'react';
import { searchProducts } from '../../services/productService';
import styles from './ProductSearchSelect.module.css';

function fmtINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(val || 0);
}

export default function ProductSearchSelect({
  value,
  onSelect,
  onCreateProduct,
  placeholder = 'Search product by name or code...',
  hasError = false,
  autoFocus = false,
  inputRef,
}) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isRecent, setIsRecent] = useState(true);

  const containerRef = useRef(null);
  const internalInputRef = useRef(null);
  const actualInputRef = inputRef || internalInputRef;
  const listboxId = useId();

  // Sync external value changes
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  // Load products based on query
  useEffect(() => {
    let active = true;
    searchProducts(query).then((items) => {
      if (active) {
        setResults(items);
        setIsRecent(!query.trim());
        setHighlightedIndex(0);
      }
    });
    return () => {
      active = false;
    };
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsOpen(true);
  };

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
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[highlightedIndex]) {
        selectProduct(results[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const selectProduct = (product) => {
    setQuery(product.name);
    setIsOpen(false);
    onSelect(product);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <input
          ref={actualInputRef}
          type="text"
          className={`${styles.input} ${hasError ? styles.hasError : ''}`}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
        />
      </div>

      {isOpen && (
        <div className={styles.dropdown} id={listboxId} role="listbox">
          <div className={styles.dropdownHeader}>
            <span>{isRecent ? 'Recently Used Products' : 'Search Results'}</span>
            <span>{results.length} items</span>
          </div>

          {results.length === 0 ? (
            <div className={styles.emptyState}>
              No steel materials found matching "{query}"
            </div>
          ) : (
            <ul className={styles.dropdownList}>
              {results.map((product, idx) => (
                <li
                  key={product.id}
                  className={`${styles.dropdownItem} ${
                    idx === highlightedIndex ? styles.highlighted : ''
                  }`}
                  onClick={() => selectProduct(product)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  role="option"
                  aria-selected={idx === highlightedIndex}
                >
                  <div className={styles.itemLeft}>
                    <span className={styles.itemName}>{product.name}</span>
                    <span className={styles.itemCode}>{product.code}</span>
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.itemRate}>{fmtINR(product.sellingRate)}</span>
                    <span className={styles.itemUnit}>per {product.unit}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className={styles.createProductBtn}
            onClick={() => {
              setIsOpen(false);
              if (onCreateProduct) {
                onCreateProduct(query);
              }
            }}
          >
            + Create New Product {query?.trim() ? `"${query.trim()}"` : ''}
          </button>
        </div>
      )}
    </div>
  );
}
