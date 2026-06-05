import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import {
  fetchKpis,
  fetchFraudesCategorias,
  fetchFraudesHorarios,
  fetchAlerts,
  fetchModels,
  checkHealth,
} from '../services/api';

const FraudDataContext = createContext(null);

export function FraudDataProvider({ children }) {
  const [kpis, setKpis] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [hourData, setHourData] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [models, setModels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await checkHealth();
      setApiOnline(true);

      const [kpiRes, catRes, hourRes, alertsRes, modelsRes] = await Promise.all([
        fetchKpis(),
        fetchFraudesCategorias(),
        fetchFraudesHorarios(),
        fetchAlerts(),
        fetchModels(),
      ]);

      setKpis(kpiRes);
      setCategoryData(catRes);
      setHourData(hourRes);
      setAlerts(alertsRes);
      setModels(modelsRes);
    } catch (err) {
      setApiOnline(false);
      setError(err?.message ?? 'Failed to connect to FraudShield API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <FraudDataContext.Provider
      value={{
        kpis,
        categoryData,
        hourData,
        alerts,
        models,
        loading,
        error,
        apiOnline,
        refetch,
      }}
    >
      {children}
    </FraudDataContext.Provider>
  );
}

export function useFraudData() {
  const ctx = useContext(FraudDataContext);
  if (!ctx) throw new Error('useFraudData must be used within FraudDataProvider');
  return ctx;
}
