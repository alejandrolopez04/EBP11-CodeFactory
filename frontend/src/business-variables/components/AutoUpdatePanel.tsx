import { useCallback, useEffect, useState } from "react";
import {
  fetchAutoUpdateConfigs,
  fetchAutoUpdateHistory,
  runAutoUpdate,
  saveAutoUpdateConfig,
} from "../api";
import type {
  AutoUpdateConfig,
  AutoUpdateHistory,
  AutoUpdateVariableType,
} from "../types";

const VARIABLES: Array<{
  type: AutoUpdateVariableType;
  label: string;
}> = [
  { type: "DEMANDA", label: "Demanda" },
  { type: "DISPONIBILIDAD", label: "Disponibilidad" },
  { type: "TEMPORAL", label: "Temporal" },
];

const EMPTY_CONFIG: AutoUpdateConfig = {
  variableType: "DEMANDA",
  sourceName: "",
  sourceUrl: "",
  valueField: "value",
  frequencyMinutes: 30,
  active: true,
};

export default function AutoUpdatePanel() {
  const [configs, setConfigs] = useState<AutoUpdateConfig[]>([]);
  const [history, setHistory] = useState<AutoUpdateHistory[]>([]);
  const [selected, setSelected] = useState<AutoUpdateVariableType>("DEMANDA");
  const [draft, setDraft] = useState<AutoUpdateConfig>(EMPTY_CONFIG);
  const [message, setMessage] = useState<string | null>(null);

  const loadConfigs = useCallback(async () => {
    try {
      const data = await fetchAutoUpdateConfigs();
      setConfigs(data);

      const current = data.find((config) => config.variableType === selected);
      setDraft(current ?? { ...EMPTY_CONFIG, variableType: selected });
    } catch {
      setMessage("No fue posible cargar las configuraciones");
    }
  }, [selected]);

  const loadHistory = useCallback(async (variableType: AutoUpdateVariableType) => {
    try {
      setHistory(await fetchAutoUpdateHistory(variableType));
    } catch {
      setMessage("No fue posible cargar el historial");
    }
  }, []);

  useEffect(() => {
    loadConfigs();
    loadHistory(selected);
  }, [selected, loadConfigs, loadHistory]);

  async function handleSave() {
    try {
      await saveAutoUpdateConfig(draft);
      setMessage("Configuración guardada correctamente");
      await loadConfigs();
    } catch {
      setMessage("No fue posible guardar la configuración");
    }
  }

  async function handleRun() {
    try {
      const result = await runAutoUpdate(selected);

      if (result.result === "SUCCESS") {
        setMessage("Variable actualizada correctamente");
      } else if (result.result === "SOURCE_UNAVAILABLE") {
        setMessage("Fuente de datos no disponible");
      } else {
        setMessage("Valor recibido fuera de rango");
      }

      await loadConfigs();
      await loadHistory(selected);
    } catch {
      setMessage("No fue posible ejecutar la actualización");
    }
  }

  return (
    <section>
      <h2>Actualización automática de variables</h2>

      {message && <p role="alert">{message}</p>}

      <label>
        Variable
        <select
          value={selected}
          onChange={(event) =>
            setSelected(event.target.value as AutoUpdateVariableType)
          }
        >
          {VARIABLES.map((variable) => (
            <option key={variable.type} value={variable.type}>
              {variable.label}
            </option>
          ))}
        </select>
      </label>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
      >
        <label>
          Nombre de la fuente
          <input
            value={draft.sourceName}
            onChange={(event) =>
              setDraft({ ...draft, sourceName: event.target.value })
            }
            required
          />
        </label>

        <label>
          URL de la fuente
          <input
            value={draft.sourceUrl}
            onChange={(event) =>
              setDraft({ ...draft, sourceUrl: event.target.value })
            }
            required
          />
        </label>

        <label>
          Campo del valor
          <input
            value={draft.valueField}
            onChange={(event) =>
              setDraft({ ...draft, valueField: event.target.value })
            }
            required
          />
        </label>

        <label>
          Frecuencia en minutos
          <input
            type="number"
            min={1}
            value={draft.frequencyMinutes}
            onChange={(event) =>
              setDraft({
                ...draft,
                frequencyMinutes: Number(event.target.value),
              })
            }
            required
          />
        </label>

        <button type="submit">Guardar configuración</button>
        <button type="button" onClick={handleRun}>
          Actualizar ahora
        </button>
      </form>

      <h3>Historial de actualizaciones</h3>

      {history.length === 0 ? (
        <p>No hay actualizaciones registradas.</p>
      ) : (
        <ul>
          {history.map((item) => (
            <li key={item.id}>
              <strong>{item.result}</strong> — {item.message}
              <br />
              Fuente: {item.sourceName} | Fecha: {new Date(item.executedAt).toLocaleString()}
              <br />
              Valor anterior: {item.previousValue ?? "N/A"} | Valor nuevo: {item.newValue ?? "N/A"}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
