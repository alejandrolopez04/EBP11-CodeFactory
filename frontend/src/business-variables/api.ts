import type { BusinessVariables } from "./types";
import type {
  AutoUpdateConfig,
  AutoUpdateHistory,
  AutoUpdateVariableType,
} from "./types";
import { API_URL } from "../api/client";
import { apiFetch } from "../api/http";

const VARIABLES_URL = `${API_URL}/api/variables`;
const AUTO_UPDATE_URL = `${API_URL}/api/variables/auto-update`;

export type Section = "demand" | "availability" | "schedule";
export const ALL_SECTIONS: Section[] = ["demand", "availability", "schedule"];

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
  morningStartTime: string;
  morningEndTime: string;
  afternoonStartTime: string;
  afternoonEndTime: string;
  highSeasonMonths: string[];
};

export type BackendVariable = DemandDto | AvailabilityDto | TemporalDto;

export async function fetchRaw(signal?: AbortSignal): Promise<BackendVariable[]> {
  const res = await apiFetch(VARIABLES_URL, { signal });
  if (!res.ok) throw new Error(`Error ${res.status} al cargar variables`);
  return res.json();
}

export async function postRaw(items: BackendVariable[]): Promise<BackendVariable[]> {
  const res = await apiFetch(VARIABLES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(items),
  });
  if (!res.ok) throw new Error(`Error ${res.status} al guardar variables`);
  return res.json();
}

const hhmm = (time: string) => time.slice(0, 5);

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

export async function fetchAutoUpdateConfigs(): Promise<AutoUpdateConfig[]> {
  const res = await apiFetch(AUTO_UPDATE_URL);

  if (!res.ok) {
    throw new Error(`Error ${res.status} al cargar configuraciones`);
  }

  return res.json();
}

export async function saveAutoUpdateConfig(
  config: AutoUpdateConfig,
): Promise<AutoUpdateConfig> {
  const res = await apiFetch(AUTO_UPDATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status} al guardar la configuración`);
  }

  return res.json();
}

export async function runAutoUpdate(
  variableType: AutoUpdateVariableType,
): Promise<AutoUpdateHistory> {
  const res = await apiFetch(`${AUTO_UPDATE_URL}/${variableType}/run`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status} al actualizar la variable`);
  }

  return res.json();
}

export async function fetchAutoUpdateHistory(
  variableType: AutoUpdateVariableType,
): Promise<AutoUpdateHistory[]> {
  const res = await apiFetch(`${AUTO_UPDATE_URL}/${variableType}/history`);

  if (!res.ok) {
    throw new Error(`Error ${res.status} al cargar el historial`);
  }

  return res.json();
}
