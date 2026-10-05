export type DemandValues = {
  demandLow: number;
  demandHigh: number;
};

export type AvailabilityValues = {
  availabilityLow: number;
  availabilityHigh: number;
};

export type ScheduleValues = {
  morningStartTime: string;
  morningEndTime: string;
  afternoonStartTime: string;
  afternoonEndTime: string;
};

export type BusinessVariables = {
  demand: DemandValues;
  availability: AvailabilityValues;
  schedule: ScheduleValues;
  highSeasonMonths: string[];
};

export type DemandDraftValues = {
  demandLow: string;
  demandHigh: string;
};

export type AvailabilityDraftValues = {
  availabilityLow: string;
  availabilityHigh: string;
};

export type ScheduleDraftValues = {
  morningStartTime: string;
  morningEndTime: string;
  afternoonStartTime: string;
  afternoonEndTime: string;
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
    demandLow: 30,
    demandHigh: 71,
  },
  availability: {
    availabilityLow: 10,
    availabilityHigh: 41,
  },
  schedule: {
    morningStartTime: "08:00",
    morningEndTime: "10:00",
    afternoonStartTime: "18:00",
    afternoonEndTime: "20:00",
  },
  highSeasonMonths: ["Diciembre", "Enero", "Febrero"],
};

export const toDemandDraft = (values: DemandValues): DemandDraftValues => ({
  demandLow: String(values.demandLow),
  demandHigh: String(values.demandHigh),
});

export const toAvailabilityDraft = (values: AvailabilityValues): AvailabilityDraftValues => ({
  availabilityLow: String(values.availabilityLow),
  availabilityHigh: String(values.availabilityHigh),
});

export const toScheduleDraft = (values: ScheduleValues): ScheduleDraftValues => ({
  morningStartTime: values.morningStartTime,
  morningEndTime: values.morningEndTime,
  afternoonStartTime: values.afternoonStartTime,
  afternoonEndTime: values.afternoonEndTime,
});

export const demandDraftToValues = (values: DemandDraftValues): DemandValues => ({
  demandLow: Number(values.demandLow),
  demandHigh: Number(values.demandHigh),
});

export const availabilityDraftToValues = (values: AvailabilityDraftValues): AvailabilityValues => ({
  availabilityLow: Number(values.availabilityLow),
  availabilityHigh: Number(values.availabilityHigh),
});

export const scheduleDraftToValues = (values: ScheduleDraftValues): ScheduleValues => ({
  morningStartTime: values.morningStartTime,
  morningEndTime: values.morningEndTime,
  afternoonStartTime: values.afternoonStartTime,
  afternoonEndTime: values.afternoonEndTime,
});
