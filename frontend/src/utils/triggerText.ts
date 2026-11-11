/**
 * Limpia el motivo de un cambio para mostrarlo en tablas que ya tienen columna de hora:
 * "Fin hora pico PM (14:00)" → "Fin hora pico". Aplica también a trazas ya guardadas.
 */
export function triggerText(trigger: string): string {
  return trigger
    .replace(/\s*\(\d{1,2}:\d{2}(:\d{2})?\)/g, "")
    .replace(/\s+(AM|PM)\b/g, "")
    .trim();
}
