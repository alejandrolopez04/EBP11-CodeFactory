import type {
  AvailabilityDraftValues,
  BusinessVariables,
  DemandDraftValues,
  NumericFieldErrors,
  ScheduleDraftValues,
  ScheduleFieldErrors,
} from "./types";
import { MONTHS } from "./types";

export const isPercentageValueValid = (value: string) => {
  if (value.trim() === "") return false;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= 100;
};

export const isTimeRangeValid = (start: string, end: string) => {
  if (!start || !end) return false;
  return start < end;
};

export const validateDemandValues = (values: DemandDraftValues) => {
  const errors: NumericFieldErrors = {};

  Object.entries(values).forEach(([key, value]) => {
    if (!isPercentageValueValid(value)) {
      errors[key] = "Debe ser un número entre 0 y 100.";
    }
  });

  const demandLow = Number(values.demandLow);
  const demandHigh = Number(values.demandHigh);

  if (
    Object.keys(errors).length === 0 &&
    !(demandLow < demandHigh)
  ) {
    errors.demandLow = "Los rangos deben ser ascendentes.";
    errors.demandHigh = "Los rangos deben ser ascendentes.";
  }

  return errors;
};

export const validateAvailabilityValues = (values: AvailabilityDraftValues) => {
  const errors: NumericFieldErrors = {};

  Object.entries(values).forEach(([key, value]) => {
    if (!isPercentageValueValid(value)) {
      errors[key] = "Debe ser un número entre 0 y 100.";
    }
  });

  const availabilityLow = Number(values.availabilityLow);
  const availabilityHigh = Number(values.availabilityHigh);

  if (
    Object.keys(errors).length === 0 &&
    !(availabilityLow < availabilityHigh)
  ) {
    errors.availabilityLow = "Los umbrales deben ser ascendentes.";
    errors.availabilityHigh = "Los umbrales deben ser ascendentes.";
  }

  return errors;
};

export const validateScheduleValues = (
  scheduleValues: ScheduleDraftValues,
  highSeasonMonths: string[],
) => {
  const errors: ScheduleFieldErrors = {};

  if (!isTimeRangeValid(scheduleValues.morningStartTime, scheduleValues.morningEndTime)) {
    errors.peakAm = "La hora de término AM debe ser mayor que la hora de inicio.";
  }

  if (!isTimeRangeValid(scheduleValues.afternoonStartTime, scheduleValues.afternoonEndTime)) {
    errors.peakPm = "La hora de término PM debe ser mayor que la hora de inicio.";
  }

  if (highSeasonMonths.length === 0) {
    errors.highSeasonMonths = "Selecciona al menos un mes para temporada alta.";
  }

  return errors;
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isValidNumber = (value: unknown) => {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
};

const isValidTime = (value: unknown) => {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
};

export const isValidBusinessVariables = (value: unknown): value is BusinessVariables => {
  if (!isObject(value)) return false;
  if (!isObject(value.demand)) return false;
  if (!isObject(value.availability)) return false;
  if (!isObject(value.schedule)) return false;
  if (!Array.isArray(value.highSeasonMonths)) return false;

  const demand = value.demand;
  const availability = value.availability;
  const schedule = value.schedule;
  const highSeasonMonths = value.highSeasonMonths;

  if (
    !isValidNumber(demand.demandLow) ||
    !isValidNumber(demand.mediumMax) ||
    !isValidNumber(demand.demandHigh)
  ) {
    return false;
  }

  if (!(demand.demandLow < demand.mediumMax && demand.mediumMax < demand.demandHigh)) {
    return false;
  }

  if (
    !isValidNumber(availability.availabilityLow) ||
    !isValidNumber(availability.lowThreshold) ||
    !isValidNumber(availability.availabilityHigh)
  ) {
    return false;
  }

  if (
    !(
      availability.availabilityLow < availability.lowThreshold &&
      availability.lowThreshold < availability.availabilityHigh
    )
  ) {
    return false;
  }

  if (
    !isValidTime(schedule.morningStartTime) ||
    !isValidTime(schedule.morningEndTime) ||
    !isValidTime(schedule.afternoonStartTime) ||
    !isValidTime(schedule.afternoonEndTime)
  ) {
    return false;
  }

  if (!isTimeRangeValid(schedule.morningStartTime, schedule.morningEndTime)) {
    return false;
  }

  if (!isTimeRangeValid(schedule.afternoonStartTime, schedule.afternoonEndTime)) {
    return false;
  }

  if (
    highSeasonMonths.length === 0 ||
    !highSeasonMonths.every((month): month is string => typeof month === "string" && MONTHS.includes(month))
  ) {
    return false;
  }

  return true;
};
