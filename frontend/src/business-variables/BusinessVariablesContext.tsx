import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BusinessVariables } from "./types";
import {
  ALL_SECTIONS,
  fetchRaw,
  postRaw,
  toBackendItem,
  toBusinessVariables,
  type BackendVariable,
  type Section,
} from "./api";

type Status = "loading" | "ready" | "error";

type BusinessVariablesContextValue = {
  variables: BusinessVariables | null;
  status: Status;
  isLoaded: boolean; // compatibilidad con el código que ya usa isLoaded
  /**
   * Guarda en el backend. Con `section` guarda solo esa sección (pantalla de edición);
   * sin `section` guarda las tres (wizard inicial). Lanza error si falla.
   */
  save: (values: BusinessVariables, section?: Section) => Promise<void>;
};

const BusinessVariablesContext = createContext<BusinessVariablesContextValue | null>(null);

export function BusinessVariablesProvider({ children }: { children: ReactNode }) {
  // Lista tal cual la entrega el backend: de ahí salen los `id` para hacer update.
  const [raw, setRaw] = useState<BackendVariable[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetchRaw(controller.signal)
        .then((list) => {
          setRaw(list);
          setStatus("ready");
        })
        .catch((error) => {
          if (error?.name !== "AbortError") setStatus("error");
        });

    return () => controller.abort();
  }, []);

  const variables = useMemo(() => toBusinessVariables(raw), [raw]);

  const save = useCallback(
      async (values: BusinessVariables, section?: Section) => {
        const sections = section ? [section] : ALL_SECTIONS;
        const items = sections.map((s) => toBackendItem(s, values, raw));

        const saved = await postRaw(items); // si falla, lanza y el estado no cambia

        // El estado refleja lo que respondió el servidor, no lo que escribió el usuario.
        setRaw((prev) => [
          ...prev.filter((v) => !saved.some((s) => s.variableType === v.variableType)),
          ...saved,
        ]);
      },
      [raw],
  );

  const contextValue = useMemo(
      () => ({ variables, status, isLoaded: status !== "loading", save }),
      [variables, status, save],
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