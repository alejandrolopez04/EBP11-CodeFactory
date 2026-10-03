export type DemandValues = {
  lowMax: number;
  mediumMax: number;
  highFrom: number;
};

export type AvailabilityValues = {
  criticalThreshold: number;
  lowThreshold: number;
  normalFrom: number;
};

export type ScheduleValues = {
  peakAmStart: string;
  peakAmEnd: string;
  peakPmStart: string;
  peakPmEnd: string;
};

export type BusinessVariables = {
  demand: DemandValues;
  availability: AvailabilityValues;
  schedule: ScheduleValues;
  highSeasonMonths: string[];
};

export type DemandDraftValues = {
  lowMax: string;
  mediumMax: string;
  highFrom: string;
};

export type AvailabilityDraftValues = {
  criticalThreshold: string;
  lowThreshold: string;
  normalFrom: string;
};

export type ScheduleDraftValues = {
  peakAmStart: string;
  peakAmEnd: string;
  peakPmStart: string;
  peakPmEnd: string;
};

export type NumericFieldErrors = Record<string, string>;

export type ScheduleFieldErrors = Record<string, string>;

export const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const DEFAULT_BUSINESS_VARIABLES: BusinessVariables = {
  demand: {
    lowMax: 30,
    mediumMax: 70,
    highFrom: 71,
  },
  availability: {
    criticalThreshold: 10,
    lowThreshold: 40,
    normalFrom: 41,
  },
  schedule: {
    peakAmStart: "08:00",
    peakAmEnd: "10:00",
    peakPmStart: "18:00",
    peakPmEnd: "20:00",
  },
  highSeasonMonths: ["Diciembre", "Enero", "Febrero"],
};

export const toDemandDraft = (values: DemandValues): DemandDraftValues => ({
  lowMax: String(values.lowMax),
  mediumMax: String(values.mediumMax),
  highFrom: String(values.highFrom),
});

export const toAvailabilityDraft = (values: AvailabilityValues): AvailabilityDraftValues => ({
  criticalThreshold: String(values.criticalThreshold),
  lowThreshold: String(values.lowThreshold),
  normalFrom: String(values.normalFrom),
});

export const toScheduleDraft = (values: ScheduleValues): ScheduleDraftValues => ({
  peakAmStart: values.peakAmStart,
  peakAmEnd: values.peakAmEnd,
  peakPmStart: values.peakPmStart,
  peakPmEnd: values.peakPmEnd,
});

export const demandDraftToValues = (values: DemandDraftValues): DemandValues => ({
  lowMax: Number(values.lowMax),
  mediumMax: Number(values.mediumMax),
  highFrom: Number(values.highFrom),
});

export const availabilityDraftToValues = (values: AvailabilityDraftValues): AvailabilityValues => ({
  criticalThreshold: Number(values.criticalThreshold),
  lowThreshold: Number(values.lowThreshold),
  normalFrom: Number(values.normalFrom),
});

export const scheduleDraftToValues = (values: ScheduleDraftValues): ScheduleValues => ({
  peakAmStart: values.peakAmStart,
  peakAmEnd: values.peakAmEnd,
  peakPmStart: values.peakPmStart,
  peakPmEnd: values.peakPmEnd,
});
