import type { BusinessVariables } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

export type Section = "demand" | "availability" | "schedule";
export const ALL_SECTIONS: Section[] = ["demand", "availability", "schedule"];

// ---------------------------------------------------------------------------
// DTOs: espejo del JSON que produce/consume BusinessVariableController.
// `variableType` es obligatorio al enviar: el backend lo usa para elegir la
// subclase (JsonTypeInfo.As.EXISTING_PROPERTY).
// ---------------------------------------------------------------------------
type BaseDto = { id?: number; updatedAt?: string };

export type DemandDto = BaseDto & {
  variableType: "DEMANDA";
  demandLow: number;
  demandHigh: number;
};

export type AvailabilityDto = BaseDto & {
  variableType: "DISPONIBILIDAD";
  availabilityLow: number;
  availabilityHigh: number;
};

export type TemporalDto = BaseDto & {
  variableType: "TEMPORAL";
  morningStartTime: string; // LocalTime: llega como "08:00:00" (o "08:00")
  morningEndTime: string;
  afternoonStartTime: string;
  afternoonEndTime: string;
  highSeasonMonths: string[];
};

export type BackendVariable = DemandDto | AvailabilityDto | TemporalDto;

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------
export async function fetchRaw(signal?: AbortSignal): Promise<BackendVariable[]> {
  const res = await fetch(`${API_URL}/variables`, { signal });
  if (!res.ok) throw new Error(`Error ${res.status} al cargar variables`);
  return res.json();
}

export async function postRaw(items: BackendVariable[]): Promise<BackendVariable[]> {
  const res = await fetch(`${API_URL}/variables`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(items),
  });
  if (!res.ok) throw new Error(`Error ${res.status} al guardar variables`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Backend -> UI. Devuelve null si falta alguna de las 3 variables
// (todavía no configurado: la pantalla debe mostrar el wizard).
// ---------------------------------------------------------------------------
const hhmm = (time: string) => time.slice(0, 5); // "08:00:00" -> "08:00"

export function toBusinessVariables(list: BackendVariable[]): BusinessVariables | null {
  const d = list.find((v): v is DemandDto => v.variableType === "DEMANDA");
  const a = list.find((v): v is AvailabilityDto => v.variableType === "DISPONIBILIDAD");
  const s = list.find((v): v is TemporalDto => v.variableType === "TEMPORAL");

  if (!d || !a || !s) return null;

  return {
    demand: {
      demandLow: d.demandLow,
      demandHigh: d.demandHigh,
    },
    availability: {
      availabilityLow: a.availabilityLow,
      availabilityHigh: a.availabilityHigh,
    },
    schedule: {
      morningStartTime: hhmm(s.morningStartTime),
      morningEndTime: hhmm(s.morningEndTime),
      afternoonStartTime: hhmm(s.afternoonStartTime),
      afternoonEndTime: hhmm(s.afternoonEndTime),
    },
    highSeasonMonths: s.highSeasonMonths ?? [],
  };
}

// ---------------------------------------------------------------------------
// UI -> Backend, una sección. Reutiliza el `id` existente (si lo hay) para que
// el backend haga UPDATE y no INSERT de una fila nueva.
// ---------------------------------------------------------------------------
export function toBackendItem(
  section: Section,
  values: BusinessVariables,
  current: BackendVariable[],
): BackendVariable {
  switch (section) {
    case "demand": {
      const prev = current.find((v): v is DemandDto => v.variableType === "DEMANDA");
      return { ...prev, variableType: "DEMANDA", ...values.demand };
    }
    case "availability": {
      const prev = current.find((v): v is AvailabilityDto => v.variableType === "DISPONIBILIDAD");
      return { ...prev, variableType: "DISPONIBILIDAD", ...values.availability };
    }
    case "schedule": {
      const prev = current.find((v): v is TemporalDto => v.variableType === "TEMPORAL");
      return {
        ...prev,
        variableType: "TEMPORAL",
        ...values.schedule,
        highSeasonMonths: values.highSeasonMonths,
      };
    }
  }
}
