import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SearchProvider } from './context/SearchContext.jsx';
import { FilterProvider } from './context/FilterContext.jsx';
import { FraudDataProvider } from './context/FraudDataContext.jsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <SearchProvider>
          <FilterProvider>
            <FraudDataProvider>
              <App />
            </FraudDataProvider>
          </FilterProvider>
        </SearchProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
