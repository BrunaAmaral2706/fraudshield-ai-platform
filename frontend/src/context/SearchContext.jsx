import { createContext, useContext, useCallback, useEffect, useState } from 'react';

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') closeSearch();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSearch]);

  return (
    <SearchContext.Provider
      value={{ isOpen, query, setQuery, openSearch, closeSearch, setIsOpen }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useGlobalSearch must be used within SearchProvider');
  return ctx;
}
