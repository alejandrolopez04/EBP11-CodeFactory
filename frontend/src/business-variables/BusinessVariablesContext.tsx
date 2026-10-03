import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BusinessVariables } from "./types";
import { isValidBusinessVariables } from "./validators";

const STORAGE_KEY = "business-variables:v1";

type BusinessVariablesContextValue = {
  variables: BusinessVariables | null;
  isLoaded: boolean;
  save: (values: BusinessVariables) => void;
};

const BusinessVariablesContext = createContext<BusinessVariablesContextValue | null>(null);

export function BusinessVariablesProvider({ children }: { children: ReactNode }) {
  const [variables, setVariables] = useState<BusinessVariables | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY);

      if (!rawValue) {
        setVariables(null);
        return;
      }

      const parsedValue: unknown = JSON.parse(rawValue);
      setVariables(isValidBusinessVariables(parsedValue) ? parsedValue : null);
    } catch {
      setVariables(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const save = (values: BusinessVariables) => {
    setVariables(values);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      // Si localStorage falla, al menos mantenemos el estado en memoria.
    }
  };

  const contextValue = useMemo(
    () => ({
      variables,
      isLoaded,
      save,
    }),
    [variables, isLoaded],
  );

  return (
    <BusinessVariablesContext.Provider value={contextValue}>
      {children}
    </BusinessVariablesContext.Provider>
  );
}

export function useBusinessVariables() {
  const context = useContext(BusinessVariablesContext);

  if (!context) {
    throw new Error("useBusinessVariables debe usarse dentro de BusinessVariablesProvider.");
  }

  return context;
}
