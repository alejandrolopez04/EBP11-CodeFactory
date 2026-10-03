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

  const lowMax = Number(values.lowMax);
  const mediumMax = Number(values.mediumMax);
  const highFrom = Number(values.highFrom);

  if (
    Object.keys(errors).length === 0 &&
    !(lowMax < mediumMax && mediumMax < highFrom)
  ) {
    errors.lowMax = "Los rangos deben ser ascendentes.";
    errors.mediumMax = "Los rangos deben ser ascendentes.";
    errors.highFrom = "Los rangos deben ser ascendentes.";
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

  const criticalThreshold = Number(values.criticalThreshold);
  const lowThreshold = Number(values.lowThreshold);
  const normalFrom = Number(values.normalFrom);

  if (
    Object.keys(errors).length === 0 &&
    !(criticalThreshold < lowThreshold && lowThreshold < normalFrom)
  ) {
    errors.criticalThreshold = "Los umbrales deben ser ascendentes.";
    errors.lowThreshold = "Los umbrales deben ser ascendentes.";
    errors.normalFrom = "Los umbrales deben ser ascendentes.";
  }

  return errors;
};

export const validateScheduleValues = (
  scheduleValues: ScheduleDraftValues,
  highSeasonMonths: string[],
) => {
  const errors: ScheduleFieldErrors = {};

  if (!isTimeRangeValid(scheduleValues.peakAmStart, scheduleValues.peakAmEnd)) {
    errors.peakAm = "La hora de término AM debe ser mayor que la hora de inicio.";
  }

  if (!isTimeRangeValid(scheduleValues.peakPmStart, scheduleValues.peakPmEnd)) {
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
    !isValidNumber(demand.lowMax) ||
    !isValidNumber(demand.mediumMax) ||
    !isValidNumber(demand.highFrom)
  ) {
    return false;
  }

  if (!(demand.lowMax < demand.mediumMax && demand.mediumMax < demand.highFrom)) {
    return false;
  }

  if (
    !isValidNumber(availability.criticalThreshold) ||
    !isValidNumber(availability.lowThreshold) ||
    !isValidNumber(availability.normalFrom)
  ) {
    return false;
  }

  if (
    !(
      availability.criticalThreshold < availability.lowThreshold &&
      availability.lowThreshold < availability.normalFrom
    )
  ) {
    return false;
  }

  if (
    !isValidTime(schedule.peakAmStart) ||
    !isValidTime(schedule.peakAmEnd) ||
    !isValidTime(schedule.peakPmStart) ||
    !isValidTime(schedule.peakPmEnd)
  ) {
    return false;
  }

  if (!isTimeRangeValid(schedule.peakAmStart, schedule.peakAmEnd)) {
    return false;
  }

  if (!isTimeRangeValid(schedule.peakPmStart, schedule.peakPmEnd)) {
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
