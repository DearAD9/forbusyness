/**
 * CategoryContext — Forbusyness Web ERP
 *
 * Global, persistent product category state.
 * Categories are stored in localStorage so they survive page refreshes
 * and are available to both ProductsPage (modal) and ProductFormPage (dropdown).
 */

import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'forbusyness_categories';

const CategoryContext = createContext(null);

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const persist = (updated) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage quota — fail silently
    }
  };

  const addCategory = useCallback((name) => {
    const trimmed = name.trim();
    setCategories(prev => {
      if (!trimmed || prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      persist(updated);
      return updated;
    });
  }, []);

  const deleteCategory = useCallback((name) => {
    setCategories(prev => {
      const updated = prev.filter(c => c !== name);
      persist(updated);
      return updated;
    });
  }, []);

  return (
    <CategoryContext.Provider value={{ categories, addCategory, deleteCategory }}>
      {children}
    </CategoryContext.Provider>
  );
}

/**
 * Hook to consume category context.
 * Throws a descriptive error if used outside <CategoryProvider>.
 */
export function useCategories() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error('useCategories must be used inside <CategoryProvider>');
  return ctx;
}
