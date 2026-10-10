/**
 * SearchableStateSelect.jsx — Forbusyness Web ERP
 *
 * Professional typeable, searchable autocomplete selector for all Indian States & UTs.
 * Supports:
 * - Real-time typing & filtering across all 36 Indian states & union territories
 * - Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
 * - Click-to-toggle dropdown with scroll-to-selected
 * - Outside click handling & clean visual states
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { ALL_INDIAN_STATES } from '../../services/customerService';
import styles from './SearchableStateSelect.module.css';

export default function SearchableStateSelect({
  value = '',
  onChange,
  placeholder = 'Type to search state...',
  id = 'state-select',
  disabled = false,
  error = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync internal search input with external value prop
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Filter states based on search term
  const filteredStates = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return ALL_INDIAN_STATES;
    return ALL_INDIAN_STATES.filter((st) => st.toLowerCase().includes(term));
  }, [searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // If current searchTerm is an exact match or valid, keep it; else reset to selected value
        const match = ALL_INDIAN_STATES.find(
          (st) => st.toLowerCase() === searchTerm.trim().toLowerCase()
        );
        if (match) {
          onChange?.(match);
          setSearchTerm(match);
        } else {
          setSearchTerm(value || '');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchTerm, value, onChange]);

  const handleSelect = (stateName) => {
    onChange?.(stateName);
    setSearchTerm(stateName);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setSearchTerm(text);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    const currIdx = filteredStates.findIndex((st) => st === value);
    setHighlightedIndex(currIdx >= 0 ? currIdx : 0);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredStates.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredStates.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredStates.length) {
        handleSelect(filteredStates[highlightedIndex]);
      } else if (filteredStates.length > 0) {
        handleSelect(filteredStates[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm(value || '');
    } else if (e.key === 'Tab') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredStates.length) {
        handleSelect(filteredStates[highlightedIndex]);
      }
      setIsOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('');
    setSearchTerm('');
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <div
        className={`${styles.inputContainer} ${isOpen ? styles.focused : ''} ${
          error ? styles.hasError : ''
        } ${disabled ? styles.disabled : ''}`}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus();
            setIsOpen(true);
          }
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={styles.input}
          value={searchTerm}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />

        <div className={styles.actions}>
          {searchTerm && !disabled && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              title="Clear selection"
              tabIndex={-1}
            >
              ✕
            </button>
          )}

          <button
            type="button"
            className={`${styles.chevronBtn} ${isOpen ? styles.chevronOpen : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                if (isOpen) {
                  setIsOpen(false);
                } else {
                  inputRef.current?.focus();
                  setIsOpen(true);
                }
              }
            }}
            tabIndex={-1}
            aria-label="Toggle state dropdown"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <ul className={styles.dropdown} ref={listRef} role="listbox">
          {filteredStates.length === 0 ? (
            <li className={styles.noResults}>
              No state matching &quot;{searchTerm}&quot;
            </li>
          ) : (
            filteredStates.map((st, idx) => {
              const isSelected = st === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <li
                  key={st}
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.option} ${
                    isSelected ? styles.selectedOption : ''
                  } ${isHighlighted ? styles.highlightedOption : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur
                    handleSelect(st);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <span className={styles.stateName}>{st}</span>
                  {isSelected && <span className={styles.checkIcon}>✓</span>}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
